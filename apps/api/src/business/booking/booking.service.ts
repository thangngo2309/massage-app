import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { randomBytes } from 'node:crypto';
import { Booking } from '../entities/booking.entity.js';
import { BookingStatusHistory } from '../entities/booking-status-history.entity.js';
import { ClientProfile } from '../entities/client-profile.entity.js';
import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { TherapistService } from '../entities/therapist-service.entity.js';
import { TherapistServiceArea } from '../entities/therapist-service-area.entity.js';
import { ServiceOption } from '../entities/service-option.entity.js';
import { User } from '../entities/user.entity.js';
import {
  BookingStatus,
  TherapistServiceAreaType,
  TherapistVerificationStatus,
  UserRole,
  UserStatus,
} from '../enums/business.enums.js';
import {
  BOOKING_BLOCKING_STATUSES,
  BOOKING_STATUS_TRANSITIONS,
} from './booking.constants.js';
import type { CreateBookingDto } from './dto/create-booking.dto.js';
import type {
  AdminBookingQueryDto,
  BookingQueryDto,
} from './dto/booking-query.dto.js';
import { TherapistAvailabilityService } from '../therapist-availability/therapist-availability.service.js';
import { BookingRealtimeGateway } from './booking-realtime.gateway.js';
import { WalletService } from '../wallet/wallet.service.js';
import { PromotionRewardService } from '../promotion/promotion-reward.service.js';
import { VoucherService } from '../voucher/voucher.service.js';
@Injectable()
export class BookingService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly therapistAvailabilityService: TherapistAvailabilityService,
    private readonly bookingRealtimeGateway: BookingRealtimeGateway,
    private readonly walletService: WalletService,
    private readonly promotionRewardService: PromotionRewardService,
    private readonly voucherService: VoucherService,
  ) {}
  /**
   * ================================================================
   * CREATE CLIENT BOOKING
   * ================================================================
   */
  async createClientBooking(clientUserId: number, dto: CreateBookingDto) {
    return this.dataSource.transaction(async (manager) => {
      /**
       * ==========================================================
       * CLIENT PROFILE
       * ==========================================================
       */
      const client = await manager.getRepository(ClientProfile).findOne({
        where: {
          userId: clientUserId,
        },
      });
      if (!client) {
        throw new NotFoundException('Client profile not found');
      }
      /**
       * ==========================================================
       * LOCK THERAPIST
       * ==========================================================
       *
       * Quan trọng:
       * mọi create booking phải lock cùng một therapist.
       *
       * Nếu 2 khách booking cùng lúc:
       * request sau phải chờ request trước commit.
       */
      const therapist = await manager.getRepository(TherapistProfile).findOne({
        where: {
          id: dto.therapistId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      if (!therapist) {
        throw new NotFoundException('Therapist not found');
      }
      const therapistUser = await manager.getRepository(User).findOne({
        where: {
          id: therapist.userId,
        },
      });
      if (!therapistUser) {
        throw new NotFoundException('Therapist user not found');
      }
      if (therapistUser.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('Therapist is inactive');
      }
      if (
        therapist.verificationStatus !== TherapistVerificationStatus.VERIFIED
      ) {
        throw new BadRequestException('Therapist is not verified');
      }
      if (!therapist.isAcceptingBookings) {
        throw new BadRequestException('Therapist is not accepting bookings');
      }
      /**
       * ==========================================================
       * SERVICE OPTION
       * ==========================================================
       */
      const serviceOption = await manager.getRepository(ServiceOption).findOne({
        where: {
          id: dto.serviceOptionId,
          isActive: true,
        },
        relations: {
          service: true,
        },
      });
      if (!serviceOption) {
        throw new NotFoundException('Service option not found');
      }
      if (!serviceOption.service || !serviceOption.service.isActive) {
        throw new BadRequestException('Service is inactive');
      }
      /**
       * ==========================================================
       * THERAPIST SERVICE
       * ==========================================================
       */
      const therapistService = await manager
        .getRepository(TherapistService)
        .findOne({
          where: {
            therapistId: therapist.id,
            serviceOptionId: serviceOption.id,
            isActive: true,
          },
        });
      if (!therapistService) {
        throw new BadRequestException(
          'Therapist does not provide this service',
        );
      }
      /**
       * ==========================================================
       * CHECK SERVICE AREA
       * ==========================================================
       */
      const serviceAreaMatched = await this.isServiceAreaMatched(
        manager,
        therapist.id,
        dto,
      );
      if (!serviceAreaMatched) {
        throw new BadRequestException('Therapist does not serve this location');
      }
      /**
       * ==========================================================
       * CHECK AVAILABILITY AGAIN INSIDE TRANSACTION
       * ==========================================================
       *
       * Không được tin kết quả Search Giai đoạn 9.
       */
      const availability =
        await this.therapistAvailabilityService.checkAvailability(
          therapist.id,
          {
            serviceId: serviceOption.serviceId,
            serviceOptionId: serviceOption.id,
            date: dto.date,
            startTime: dto.startTime,
          },
          {
            manager,
          },
        );
      if (!availability.available) {
        throw new ConflictException({
          message: 'Therapist is not available',
          reason: availability.reason,
        });
      }
      const scheduledAt = this.buildVietnamDateTime(dto.date, dto.startTime);
      const expectedEndAt = new Date(
        scheduledAt.getTime() + serviceOption.durationMinutes * 60_000,
      );
      /**
       * ==========================================================
       * SECOND CONFLICT CHECK
       * ==========================================================
       *
       * Availability đã check rồi.
       * Đây là lớp bảo vệ thứ hai trước INSERT.
       */
      const hasConflict = await this.hasBookingConflict(
        manager,
        therapist.id,
        scheduledAt,
        expectedEndAt,
      );
      if (hasConflict) {
        throw new ConflictException({
          message: 'Booking time is no longer available',
          reason: 'booking_conflict',
        });
      }
      /**
       * ==========================================================
       * PRICE SNAPSHOT
       * ==========================================================
       */
      const servicePrice = Number(therapistService.price);
      const platformFeeRate = Number(therapistService.platformFeeRate);
      const platformFee = Math.round(servicePrice * (platformFeeRate / 100));
      /**
       * Tax thuộc Giai đoạn 14.
       */
      const taxAmount = 0;
      /**
       * Tổng tiền trước voucher.
       * Platform fee vẫn được snapshot độc lập từ servicePrice
       * và không bị thay đổi bởi voucher.
       */
      const amountBeforeDiscount = servicePrice + taxAmount;
      const voucherResult = await this.voucherService.prepareBookingVoucher(
        manager,
        {
          userId: clientUserId,
          userVoucherId: dto.userVoucherId ?? null,
          orderAmount: amountBeforeDiscount,
        },
      );
      const discountAmount = voucherResult.discountAmount;
      const totalAmount = Math.max(0, amountBeforeDiscount - discountAmount);
      const bookingRepository = manager.getRepository(Booking);
      /**
       * Booking hiện tại là direct matching:
       *
       * Client đã chọn therapist từ Giai đoạn 9.
       *
       * Vì vậy bắt đầu ở:
       * WAITING_THERAPIST_ACCEPT
       */
      const booking = bookingRepository.create({
        bookingCode: this.generateBookingCode(),
        clientId: client.id,
        therapistId: therapist.id,
        serviceOptionId: serviceOption.id,
        therapistServiceId: therapistService.id,
        status: BookingStatus.WAITING_THERAPIST_ACCEPT,
        scheduledAt,
        expectedEndAt,
        serviceName: serviceOption.service.name,
        durationMinutes: serviceOption.durationMinutes,
        servicePrice,
        platformFee,
        taxAmount,
        userVoucherId: voucherResult.userVoucherId,
        voucherCode: voucherResult.voucherCode,
        discountAmount,
        totalAmount,
        address: dto.address.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
        clientNote: dto.clientNote?.trim() || null,
        acceptedAt: null,
        arrivedAt: null,
        startedAt: null,
        completedAt: null,
        cancelledAt: null,
        cancellationReason: null,
      });
      const saved = await bookingRepository.save(booking);
      if (voucherResult.userVoucherId) {
        await this.voucherService.reserveBookingVoucher(
          manager,
          voucherResult.userVoucherId,
          clientUserId,
          saved.id,
        );
      }
      /**
       * ==========================================================
       * INITIAL STATUS HISTORY
       * ==========================================================
       */
      await manager.getRepository(BookingStatusHistory).save({
        bookingId: saved.id,
        fromStatus: null,
        toStatus: BookingStatus.WAITING_THERAPIST_ACCEPT,
        changedByUserId: clientUserId,
        reason: null,
      });
      this.bookingRealtimeGateway.emitBookingCreated({
        id: booking.id,
        clientId: booking.clientId,
        therapistId: booking.therapistId,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        updatedAt: booking.updatedAt,
        sourceRole: UserRole.CLIENT,
      });
      return this.findBookingDetail(manager, saved.id);
    });
  }
  /**
   * ================================================================
   * CLIENT BOOKINGS
   * ================================================================
   */
  async getClientBookings(userId: number, query: BookingQueryDto) {
    const client = await this.dataSource.getRepository(ClientProfile).findOne({
      where: {
        userId,
      },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    return this.getBookings({
      query,
      clientId: client.id,
    });
  }
  async getClientBooking(userId: number, bookingId: number) {
    const client = await this.dataSource.getRepository(ClientProfile).findOne({
      where: {
        userId,
      },
    });
    if (!client) {
      throw new NotFoundException('Client profile not found');
    }
    const booking = await this.findBookingDetail(
      this.dataSource.manager,
      bookingId,
    );
    if (booking.clientId !== client.id) {
      throw new ForbiddenException();
    }
    return booking;
  }
  async cancelClientBooking(
    userId: number,
    bookingId: number,
    reason?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const client = await manager.getRepository(ClientProfile).findOne({
        where: {
          userId,
        },
      });
      if (!client) {
        throw new NotFoundException('Client profile not found');
      }
      const booking = await this.lockBooking(manager, bookingId);
      if (booking.clientId !== client.id) {
        throw new ForbiddenException();
      }
      const cancellable: BookingStatus[] = [
        BookingStatus.PENDING,
        BookingStatus.SEARCHING_THERAPIST,
        BookingStatus.WAITING_THERAPIST_ACCEPT,
        BookingStatus.CONFIRMED,
        BookingStatus.THERAPIST_ON_THE_WAY,
      ];
      if (!cancellable.includes(booking.status)) {
        throw new BadRequestException(
          'Booking can no longer be cancelled by client',
        );
      }
      await this.changeStatus(
        manager,
        booking,
        BookingStatus.CANCELLED_BY_CLIENT,
        userId,
        reason,
      );
      this.bookingRealtimeGateway.emitBookingUpdated({
        id: booking.id,
        clientId: booking.clientId,
        therapistId: booking.therapistId,
        status: booking.status,
        scheduledAt: booking.scheduledAt,
        updatedAt: booking.updatedAt,
        sourceRole: UserRole.CLIENT,
      });
      return this.findBookingDetail(manager, booking.id);
    });
  }
  /**
   * ================================================================
   * THERAPIST BOOKINGS
   * ================================================================
   */
  async getTherapistBookings(userId: number, query: BookingQueryDto) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,
      userId,
    );
    return this.getBookings({
      query,
      therapistId: therapist.id,
    });
  }
  async getTherapistBooking(userId: number, bookingId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,
      userId,
    );
    const booking = await this.findBookingDetail(
      this.dataSource.manager,
      bookingId,
    );
    if (booking.therapistId !== therapist.id) {
      throw new ForbiddenException();
    }
    return booking;
  }
  async updateTherapistBookingStatus(
    userId: number,
    bookingId: number,
    status: BookingStatus,
    reason?: string,
  ) {
    const therapistAllowedStatuses: BookingStatus[] = [
      BookingStatus.CONFIRMED,
      BookingStatus.REJECTED,
      BookingStatus.THERAPIST_ON_THE_WAY,
      BookingStatus.ARRIVED,
      BookingStatus.IN_PROGRESS,
      BookingStatus.COMPLETED,
      BookingStatus.CANCELLED_BY_THERAPIST,
    ];
    if (!therapistAllowedStatuses.includes(status)) {
      throw new BadRequestException('Therapist cannot set this booking status');
    }
    /**
     * ================================================================
     * DATABASE TRANSACTION
     * ================================================================
     *
     * Toàn bộ:
     *
     * - lock booking
     * - kiểm tra wallet
     * - trừ wallet
     * - tạo wallet transaction
     * - đổi booking status
     * - tạo booking status history
     *
     * đều nằm trong cùng một transaction.
     */
    const result = await this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(manager, userId);
      /**
       * Lock booking trước.
       *
       * Hai request accept cùng booking
       * không thể xử lý đồng thời.
       */
      const booking = await this.lockBooking(manager, bookingId);
      if (booking.therapistId !== therapist.id) {
        throw new ForbiddenException();
      }
      /**
       * ============================================================
       * THERAPIST ACCEPT BOOKING
       * ============================================================
       *
       * Chỉ charge wallet khi:
       *
       * WAITING_THERAPIST_ACCEPT -> CONFIRMED
       *
       * Các status transition khác tuyệt đối
       * không charge wallet.
       */
      if (
        booking.status === BookingStatus.WAITING_THERAPIST_ACCEPT &&
        status === BookingStatus.CONFIRMED
      ) {
        await this.walletService.chargeTherapistBookingAcceptFee(
          manager,
          userId,
          booking.id,
          Number(booking.platformFee),
        );
      }
      /**
       * changeStatus() sẽ tiếp tục validate
       * BOOKING_STATUS_TRANSITIONS.
       *
       * Nếu transition không hợp lệ:
       * transaction rollback => wallet cũng rollback.
       */
      await this.changeStatus(manager, booking, status, userId, reason);
      /**
       * Lấy detail trước khi transaction kết thúc.
       */
      const detail = await this.findBookingDetail(manager, booking.id);
      return {
        detail,
        realtime: {
          id: booking.id,
          clientId: booking.clientId,
          therapistId: booking.therapistId,
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          updatedAt: booking.updatedAt,
          sourceRole: UserRole.THERAPIST,
        },
      };
    });
    /**
     * Chỉ emit realtime SAU KHI transaction commit.
     */
    await this.bookingRealtimeGateway.emitBookingUpdated(result.realtime);
    return result.detail;
  }
  /**
   * ================================================================
   * ADMIN
   * ================================================================
   */
  async getAdminBookings(query: AdminBookingQueryDto) {
    return this.getBookings({
      query,
      therapistId: query.therapistId,
      clientId: query.clientId,
      q: query.q,
    });
  }
  async getAdminBooking(bookingId: number) {
    return this.findBookingDetail(this.dataSource.manager, bookingId);
  }
  async updateAdminBookingStatus(
    adminUserId: number,
    bookingId: number,
    status: BookingStatus,
    reason?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, bookingId);
      await this.changeStatus(manager, booking, status, adminUserId, reason);
      return this.findBookingDetail(manager, booking.id);
    });
  }
  /**
   * ================================================================
   * CHANGE STATUS
   * ================================================================
   */
  private async changeStatus(
    manager: EntityManager,
    booking: Booking,
    nextStatus: BookingStatus,
    changedByUserId: number,
    reason?: string,
  ) {
    const currentStatus = booking.status;
    if (currentStatus === nextStatus) {
      return;
    }
    const allowed = BOOKING_STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Invalid booking status transition: ${currentStatus} -> ${nextStatus}`,
      );
    }
    const now = new Date();
    booking.status = nextStatus;
    switch (nextStatus) {
      case BookingStatus.CONFIRMED:
        booking.acceptedAt = now;
        break;
      case BookingStatus.ARRIVED:
        booking.arrivedAt = now;
        break;
      case BookingStatus.IN_PROGRESS:
        booking.startedAt = now;
        break;
      case BookingStatus.COMPLETED:
        booking.completedAt = now;
        break;
      case BookingStatus.CANCELLED_BY_CLIENT:
      case BookingStatus.CANCELLED_BY_THERAPIST:
      case BookingStatus.CANCELLED_BY_ADMIN:
        booking.cancelledAt = now;
        booking.cancellationReason = reason?.trim() || null;
        break;
      default:
        break;
    }
    /**
     * ================================================================
     * SAVE BOOKING
     * ================================================================
     */
    await manager.getRepository(Booking).save(booking);
    if (nextStatus === BookingStatus.COMPLETED) {
      await this.voucherService.markBookingVoucherUsed(manager, booking);
    } else if (
      [
        BookingStatus.CANCELLED_BY_CLIENT,
        BookingStatus.CANCELLED_BY_THERAPIST,
        BookingStatus.CANCELLED_BY_ADMIN,
        BookingStatus.REJECTED,
        BookingStatus.EXPIRED,
      ].includes(nextStatus)
    ) {
      await this.voucherService.releaseBookingVoucher(manager, booking);
    }
    /**
     * ================================================================
     * STATUS HISTORY
     * ================================================================
     */
    await manager.getRepository(BookingStatusHistory).save({
      bookingId: booking.id,
      fromStatus: currentStatus,
      toStatus: nextStatus,
      changedByUserId,
      reason: reason?.trim() || null,
    });
    /**
     * ================================================================
     * BOOKING COMPLETED
     * ================================================================
     */
    if (nextStatus === BookingStatus.COMPLETED && booking.therapistId) {
      /**
       * Promotion Engine chạy trước khi increment cached counter.
       *
       * Engine kiểm tra trực tiếp bảng bookings để xác định
       * đây có phải booking COMPLETED đầu tiên hay không.
       *
       * Booking hiện tại đã được save COMPLETED nên:
       *
       * count === 1
       *
       * nghĩa là booking đầu tiên.
       */
      await this.promotionRewardService.handleBookingCompleted(
        manager,
        booking,
      );

      /**
       * Nếu Client đã dùng voucher, nền tảng bù đúng phần discount
       * vào MAIN wallet của kỹ thuật viên.
       *
       * Promotion Engine chạy trước để nếu có reward cho KTV thì lock
       * PROMOTION wallet trước, sau đó compensation mới lock MAIN wallet.
       * Cách này giữ cùng thứ tự PROMOTION -> MAIN với luồng accept booking.
       */
      const discountAmount = Number(booking.discountAmount);

      if (discountAmount > 0) {
        const therapist = await manager
          .getRepository(TherapistProfile)
          .findOne({
            where: {
              id: booking.therapistId,
            },
          });

        if (!therapist) {
          throw new NotFoundException('Therapist profile not found');
        }

        await this.walletService.creditBookingDiscountCompensation(manager, {
          userId: therapist.userId,
          bookingId: booking.id,
          amount: discountAmount,
        });
      }
      /**
       * completedBookings chỉ là cached/statistical field.
       *
       * Không dùng field này làm nguồn sự thật cho promotion.
       */
      await manager.getRepository(TherapistProfile).increment(
        {
          id: booking.therapistId,
        },
        'completedBookings',
        1,
      );
    }
  }
  /**
   * ================================================================
   * BOOKING CONFLICT
   * ================================================================
   */
  private async hasBookingConflict(
    manager: EntityManager,
    therapistId: number,
    scheduledAt: Date,
    expectedEndAt: Date,
  ) {
    return manager
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .where('booking.therapistId = :therapistId', {
        therapistId,
      })
      .andWhere('booking.status IN (:...statuses)', {
        statuses: BOOKING_BLOCKING_STATUSES,
      })
      .andWhere('booking.scheduledAt < :expectedEndAt', {
        expectedEndAt,
      })
      .andWhere('booking.expectedEndAt > :scheduledAt', {
        scheduledAt,
      })
      .getExists();
  }
  /**
   * ================================================================
   * SERVICE AREA
   * ================================================================
   */
  private async isServiceAreaMatched(
    manager: EntityManager,
    therapistId: number,
    dto: CreateBookingDto,
  ) {
    const areas = await manager.getRepository(TherapistServiceArea).find({
      where: {
        therapistId,
        isActive: true,
      },
    });
    if (!areas.length) {
      return false;
    }
    return areas.some((area) => {
      if (area.type === TherapistServiceAreaType.DISTRICT) {
        if (!dto.districtCode) {
          return false;
        }
        if (area.districtCode !== dto.districtCode) {
          return false;
        }
        if (
          area.provinceCode &&
          dto.provinceCode &&
          area.provinceCode !== dto.provinceCode
        ) {
          return false;
        }
        return true;
      }
      if (area.type === TherapistServiceAreaType.RADIUS) {
        if (
          area.centerLatitude === null ||
          area.centerLongitude === null ||
          area.radiusKm === null
        ) {
          return false;
        }
        const distance = this.calculateDistanceKm(
          dto.latitude,
          dto.longitude,
          area.centerLatitude,
          area.centerLongitude,
        );
        return distance <= area.radiusKm;
      }
      return false;
    });
  }
  /**
   * ================================================================
   * GET LIST
   * ================================================================
   */
  private async getBookings({
    query,
    clientId,
    therapistId,
    q,
  }: {
    query: BookingQueryDto;
    clientId?: number;
    therapistId?: number;
    q?: string;
  }) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('booking.therapist', 'therapist')
      .leftJoinAndSelect('therapist.user', 'therapistUser')
      .leftJoinAndSelect('booking.serviceOption', 'serviceOption')
      .leftJoinAndSelect('serviceOption.service', 'service')
      .leftJoinAndSelect('booking.therapistService', 'therapistService');
    if (clientId) {
      qb.andWhere('booking.clientId = :clientId', {
        clientId,
      });
    }
    if (therapistId) {
      qb.andWhere('booking.therapistId = :therapistId', {
        therapistId,
      });
    }
    if (query.status) {
      qb.andWhere('booking.status = :status', {
        status: query.status,
      });
    }
    if (query.from) {
      qb.andWhere('booking.scheduledAt >= :from', {
        from: new Date(`${query.from}T00:00:00+07:00`),
      });
    }
    if (query.to) {
      const to = new Date(`${query.to}T00:00:00+07:00`);
      to.setUTCDate(to.getUTCDate() + 1);
      qb.andWhere('booking.scheduledAt < :to', {
        to,
      });
    }
    if (q?.trim()) {
      qb.andWhere(
        `(
            booking.bookingCode ILIKE :q
            OR booking.serviceName ILIKE :q
            OR booking.address ILIKE :q
            OR clientUser.fullName ILIKE :q
            OR clientUser.phone ILIKE :q
            OR therapistUser.fullName ILIKE :q
            OR therapistUser.phone ILIKE :q
          )`,
        {
          q: `%${q.trim()}%`,
        },
      );
    }
    const [items, total] = await qb
      .orderBy('booking.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  /**
   * ================================================================
   * DETAIL
   * ================================================================
   */
  private async findBookingDetail(manager: EntityManager, bookingId: number) {
    const booking = await manager.getRepository(Booking).findOne({
      where: {
        id: bookingId,
      },
      relations: {
        client: {
          user: true,
        },
        therapist: {
          user: true,
        },
        serviceOption: {
          service: true,
        },
        therapistService: true,
        statusHistories: {
          changedByUser: true,
        },
        rating: true,
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
  private async lockBooking(manager: EntityManager, bookingId: number) {
    const booking = await manager.getRepository(Booking).findOne({
      where: {
        id: bookingId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    return booking;
  }
  private async getTherapistByUserId(manager: EntityManager, userId: number) {
    const therapist = await manager.getRepository(TherapistProfile).findOne({
      where: {
        userId,
      },
    });
    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }
    return therapist;
  }
  /**
   * ================================================================
   * DATETIME
   * ================================================================
   */
  private buildVietnamDateTime(date: string, time: string) {
    const result = new Date(`${date}T${time}:00+07:00`);
    if (Number.isNaN(result.getTime())) {
      throw new BadRequestException('Invalid booking date/time');
    }
    return result;
  }
  /**
   * ================================================================
   * CODE
   * ================================================================
   */
  private generateBookingCode() {
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
    const date = parts.replaceAll('-', '');
    const random = randomBytes(5).toString('hex').toUpperCase();
    return `BK${date}${random}`;
  }
  /**
   * ================================================================
   * HAVERSINE
   * ================================================================
   */
  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const radius = 6371;
    const toRadians = (value: number) => value * (Math.PI / 180);
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radius * c;
  }
}
