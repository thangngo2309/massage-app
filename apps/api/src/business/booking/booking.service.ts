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

import { BookingItem } from '../entities/booking-item.entity.js';

import { BookingStatusHistory } from '../entities/booking-status-history.entity.js';

import { ClientProfile } from '../entities/client-profile.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import { TherapistServiceArea } from '../entities/therapist-service-area.entity.js';

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
       * ============================================================
       * CLIENT
       * ============================================================
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
       * ============================================================
       * LOCK THERAPIST
       * ============================================================
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
       * ============================================================
       * SERVICE AREA
       * ============================================================
       */
      const areaMatched = await this.isServiceAreaMatched(
        manager,
        therapist.id,
        dto,
      );

      if (!areaMatched) {
        throw new BadRequestException('Therapist does not serve this location');
      }

      /**
       * ============================================================
       * THERAPIST SERVICES
       * ============================================================
       */
      const therapistServiceIds = this.normalizeTherapistServiceIds(
        dto.therapistServiceIds,
      );

      const therapistServices = await manager
        .getRepository(TherapistService)
        .createQueryBuilder('therapistService')

        .innerJoinAndSelect('therapistService.serviceOption', 'serviceOption')

        .innerJoinAndSelect('serviceOption.service', 'service')

        .where('therapistService.id IN (:...therapistServiceIds)', {
          therapistServiceIds,
        })

        .andWhere('therapistService.therapistId = :therapistId', {
          therapistId: therapist.id,
        })

        .andWhere('therapistService.isActive = true')

        .andWhere('serviceOption.isActive = true')

        .andWhere('service.isActive = true')

        .getMany();

      /**
       * Phải resolve đầy đủ tất cả ID client gửi lên.
       */
      if (therapistServices.length !== therapistServiceIds.length) {
        throw new BadRequestException(
          'One or more selected therapist services are unavailable',
        );
      }

      /**
       * Giữ đúng thứ tự khách chọn.
       */
      const serviceOrder = new Map<number, number>();

      therapistServiceIds.forEach((id, index) => {
        serviceOrder.set(id, index);
      });

      therapistServices.sort(
        (a, b) => (serviceOrder.get(a.id) ?? 0) - (serviceOrder.get(b.id) ?? 0),
      );

      /**
       * ============================================================
       * BUILD BOOKING ITEMS
       * ============================================================
       */
      const selectedItems = therapistServices.map((therapistService, index) => {
        const option = therapistService.serviceOption;

        const service = option.service;

        const price = Number(therapistService.price);

        const platformFeeRate = Number(therapistService.platformFeeRate);

        const platformFee = Math.round(price * (platformFeeRate / 100));

        return {
          sortOrder: index,

          therapistServiceId: therapistService.id,

          serviceOptionId: option.id,

          serviceId: service.id,

          serviceName: service.name,

          optionLabel: option.label ?? null,

          durationMinutes: option.durationMinutes,

          price,

          platformFeeRate,

          platformFee,
        };
      });

      if (!selectedItems.length) {
        throw new BadRequestException('At least one service is required');
      }

      /**
       * ============================================================
       * TOTALS
       * ============================================================
       */
      const durationMinutes = selectedItems.reduce(
        (total, item) => total + item.durationMinutes,
        0,
      );

      const servicePrice = selectedItems.reduce(
        (total, item) => total + item.price,
        0,
      );

      const platformFee = selectedItems.reduce(
        (total, item) => total + item.platformFee,
        0,
      );

      /**
       * Tax vẫn giữ logic hiện tại.
       */
      const taxAmount = 0;

      /**
       * ============================================================
       * AVAILABILITY
       * ============================================================
       */
      const availability =
        await this.therapistAvailabilityService.checkAvailability(
          therapist.id,
          {
            therapistServiceIds,

            date: dto.date,

            startTime: dto.startTime,
          },
          {
            manager,
          },
        );

      if (!availability.available) {
        throw new ConflictException({
          code: 'THERAPIST_NOT_AVAILABLE',

          reason: availability.reason,

          message: 'Therapist is not available for the selected time',
        });
      }

      /**
       * ============================================================
       * TIME
       * ============================================================
       */
      const scheduledAt = this.buildVietnamDateTime(dto.date, dto.startTime);

      const expectedEndAt = new Date(
        scheduledAt.getTime() + durationMinutes * 60 * 1000,
      );

      /**
       * Defensive conflict check sau khi lock therapist.
       */
      const conflict = await this.hasBookingConflict(
        manager,
        therapist.id,
        scheduledAt,
        expectedEndAt,
      );

      if (conflict) {
        throw new ConflictException(
          'Therapist already has another booking at this time',
        );
      }

      /**
       * ============================================================
       * VOUCHER
       * ============================================================
       *
       * Voucher tính trên tổng servicePrice.
       */
      const amountBeforeDiscount = servicePrice + taxAmount;

      const preparedVoucher = await this.voucherService.prepareBookingVoucher(
        manager,
        {
          userId: clientUserId,

          userVoucherId: dto.userVoucherId ?? null,

          orderAmount: amountBeforeDiscount,
        },
      );

      const discountAmount = Number(preparedVoucher.discountAmount ?? 0);

      const totalAmount = Math.max(0, amountBeforeDiscount - discountAmount);

      /**
       * ============================================================
       * CREATE BOOKING
       * ============================================================
       *
       * Legacy fields dùng item đầu tiên.
       */
      const firstItem = selectedItems[0];

      const bookingRepository = manager.getRepository(Booking);

      const booking = bookingRepository.create({
        bookingCode: this.generateBookingCode(),

        clientId: client.id,

        therapistId: therapist.id,

        /**
         * Legacy compatibility.
         */
        serviceOptionId: firstItem.serviceOptionId,

        therapistServiceId: firstItem.therapistServiceId,

        status: BookingStatus.WAITING_THERAPIST_ACCEPT,

        scheduledAt,

        expectedEndAt,

        serviceName: firstItem.serviceName,

        /**
         * Các field tổng.
         */
        durationMinutes,

        servicePrice,

        platformFee,

        taxAmount,

        userVoucherId: preparedVoucher.userVoucherId,

        voucherCode: preparedVoucher.voucherCode,

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

      /**
       * ============================================================
       * CREATE BOOKING ITEMS
       * ============================================================
       */
      const bookingItemRepository = manager.getRepository(BookingItem);

      const bookingItems = selectedItems.map((item) =>
        bookingItemRepository.create({
          bookingId: saved.id,

          serviceId: item.serviceId,

          serviceOptionId: item.serviceOptionId,

          therapistServiceId: item.therapistServiceId,

          serviceName: item.serviceName,

          optionLabel: item.optionLabel,

          durationMinutes: item.durationMinutes,

          price: item.price,

          platformFeeRate: item.platformFeeRate,

          platformFee: item.platformFee,

          sortOrder: item.sortOrder,
        }),
      );

      await bookingItemRepository.save(bookingItems);

      /**
       * ============================================================
       * RESERVE VOUCHER
       * ============================================================
       */
      if (preparedVoucher.userVoucherId) {
        await this.voucherService.reserveBookingVoucher(
          manager,
          preparedVoucher.userVoucherId,
          clientUserId,
          saved.id,
        );
      }

      /**
       * ============================================================
       * INITIAL HISTORY
       * ============================================================
       */
      await manager.getRepository(BookingStatusHistory).save({
        bookingId: saved.id,

        fromStatus: null,

        toStatus: saved.status,

        changedByUserId: clientUserId,

        reason: null,
      });

      const result = await this.findBookingDetail(saved.id, manager);

      this.bookingRealtimeGateway.emitBookingCreated(result);

      return result;
    });
  }

  /**
   * ================================================================
   * CLIENT
   * ================================================================
   */
  async getClientBookings(clientUserId: number, query: BookingQueryDto) {
    const client = await this.dataSource.getRepository(ClientProfile).findOne({
      where: {
        userId: clientUserId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client profile not found');
    }

    return this.getBookings(query, {
      clientId: client.id,
    });
  }

  async getClientBooking(clientUserId: number, bookingId: number) {
    const client = await this.dataSource.getRepository(ClientProfile).findOne({
      where: {
        userId: clientUserId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client profile not found');
    }

    const booking = await this.findBookingDetail(bookingId);

    if (booking.clientId !== client.id) {
      throw new ForbiddenException('You cannot access this booking');
    }

    return booking;
  }

  async cancelClientBooking(
    clientUserId: number,
    bookingId: number,
    reason?: string,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      const client = await manager.getRepository(ClientProfile).findOne({
        where: {
          userId: clientUserId,
        },
      });

      if (!client) {
        throw new NotFoundException('Client profile not found');
      }

      const booking = await this.lockBooking(manager, bookingId);

      if (booking.clientId !== client.id) {
        throw new ForbiddenException('You cannot cancel this booking');
      }

      await this.changeStatus(
        manager,
        booking,
        BookingStatus.CANCELLED_BY_CLIENT,
        clientUserId,
        reason,
      );

      return this.findBookingDetail(booking.id, manager);
    });

    this.bookingRealtimeGateway.emitBookingUpdated(result);

    return result;
  }

  /**
   * ================================================================
   * THERAPIST
   * ================================================================
   */
  async getTherapistBookings(therapistUserId: number, query: BookingQueryDto) {
    const therapist = await this.dataSource
      .getRepository(TherapistProfile)
      .findOne({
        where: {
          userId: therapistUserId,
        },
      });

    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    return this.getBookings(query, {
      therapistId: therapist.id,
    });
  }

  async getTherapistBooking(therapistUserId: number, bookingId: number) {
    const therapist = await this.dataSource
      .getRepository(TherapistProfile)
      .findOne({
        where: {
          userId: therapistUserId,
        },
      });

    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    const booking = await this.findBookingDetail(bookingId);

    if (booking.therapistId !== therapist.id) {
      throw new ForbiddenException('You cannot access this booking');
    }

    return booking;
  }

  async updateTherapistBookingStatus(
    therapistUserId: number,
    bookingId: number,
    status: BookingStatus,
    reason?: string,
  ) {
    const allowedStatuses = [
      BookingStatus.CONFIRMED,

      BookingStatus.REJECTED,

      BookingStatus.THERAPIST_ON_THE_WAY,

      BookingStatus.ARRIVED,

      BookingStatus.IN_PROGRESS,

      BookingStatus.COMPLETED,

      BookingStatus.CANCELLED_BY_THERAPIST,
    ];

    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('Therapist cannot set this booking status');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(
        manager,
        therapistUserId,
      );

      const booking = await this.lockBooking(manager, bookingId);

      if (booking.therapistId !== therapist.id) {
        throw new ForbiddenException(
          'Booking does not belong to this therapist',
        );
      }

      /**
       * KTV chấp nhận booking:
       * trừ platform fee từ ví.
       *
       * booking.platformFee hiện là tổng fee
       * của tất cả BookingItem.
       */
      if (
        booking.status === BookingStatus.WAITING_THERAPIST_ACCEPT &&
        status === BookingStatus.CONFIRMED
      ) {
        await this.walletService.chargeTherapistBookingAcceptFee(
          manager,
          therapistUserId,
          booking.id,
          Number(booking.platformFee),
        );
      }

      await this.changeStatus(
        manager,
        booking,
        status,
        therapistUserId,
        reason,
      );

      return this.findBookingDetail(booking.id, manager);
    });

    this.bookingRealtimeGateway.emitBookingUpdated(result);

    return result;
  }

  /**
   * ================================================================
   * ADMIN
   * ================================================================
   */
  async getAdminBookings(query: AdminBookingQueryDto) {
    return this.getBookings(query, {
      therapistId: query.therapistId,

      clientId: query.clientId,
    });
  }

  async getAdminBooking(bookingId: number) {
    return this.findBookingDetail(bookingId);
  }

  async updateAdminBookingStatus(
    adminUserId: number,
    bookingId: number,
    status: BookingStatus,
    reason?: string,
  ) {
    const result = await this.dataSource.transaction(async (manager) => {
      await this.ensureAdmin(manager, adminUserId);

      const booking = await this.lockBooking(manager, bookingId);

      await this.changeStatus(manager, booking, status, adminUserId, reason);

      return this.findBookingDetail(booking.id, manager);
    });

    this.bookingRealtimeGateway.emitBookingUpdated(result);

    return result;
  }

  /**
   * ================================================================
   * STATUS
   * ================================================================
   */
  private async changeStatus(
    manager: EntityManager,
    booking: Booking,
    nextStatus: BookingStatus,
    changedByUserId: number | null,
    reason?: string,
  ) {
    const currentStatus = booking.status;

    if (currentStatus === nextStatus) {
      return booking;
    }

    const allowedTransitions = BOOKING_STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(nextStatus)) {
      throw new ConflictException(
        `Cannot change booking status from ${currentStatus} to ${nextStatus}`,
      );
    }

    const now = new Date();

    booking.status = nextStatus;

    if (nextStatus === BookingStatus.CONFIRMED) {
      booking.acceptedAt = booking.acceptedAt ?? now;
    }

    if (nextStatus === BookingStatus.ARRIVED) {
      booking.arrivedAt = booking.arrivedAt ?? now;
    }

    if (nextStatus === BookingStatus.IN_PROGRESS) {
      booking.startedAt = booking.startedAt ?? now;
    }

    if (nextStatus === BookingStatus.COMPLETED) {
      booking.completedAt = booking.completedAt ?? now;
    }

    const cancelledStatuses = [
      BookingStatus.CANCELLED_BY_CLIENT,

      BookingStatus.CANCELLED_BY_THERAPIST,

      BookingStatus.CANCELLED_BY_ADMIN,

      BookingStatus.REJECTED,

      BookingStatus.EXPIRED,
    ];

    if (cancelledStatuses.includes(nextStatus)) {
      booking.cancelledAt = booking.cancelledAt ?? now;

      booking.cancellationReason = reason?.trim() || null;
    }

    const saved = await manager.getRepository(Booking).save(booking);

    /**
     * ============================================================
     * VOUCHER
     * ============================================================
     */
    if (nextStatus === BookingStatus.COMPLETED) {
      await this.voucherService.markBookingVoucherUsed(manager, saved);
    } else if (cancelledStatuses.includes(nextStatus)) {
      await this.voucherService.releaseBookingVoucher(manager, saved);
    }

    /**
     * ============================================================
     * HISTORY
     * ============================================================
     */
    await manager.getRepository(BookingStatusHistory).save({
      bookingId: saved.id,

      fromStatus: currentStatus,

      toStatus: nextStatus,

      changedByUserId,

      reason: reason?.trim() || null,
    });

    /**
     * ============================================================
     * COMPLETED
     * ============================================================
     */
    if (nextStatus === BookingStatus.COMPLETED) {
      await this.promotionRewardService.handleBookingCompleted(manager, saved);

      /**
       * Voucher là phần platform tài trợ cho khách.
       *
       * KTV vẫn cần nhận compensation tương ứng.
       */
      if (Number(saved.discountAmount) > 0 && saved.therapistId) {
        const therapist = await manager
          .getRepository(TherapistProfile)
          .findOne({
            where: {
              id: saved.therapistId,
            },
          });

        if (therapist) {
          await this.walletService.creditBookingDiscountCompensation(manager, {
            userId: therapist.userId,

            bookingId: saved.id,

            amount: Number(saved.discountAmount),
          });
        }
      }

      /**
       * Cached completed booking count.
       */
      if (saved.therapistId) {
        await manager.getRepository(TherapistProfile).increment(
          {
            id: saved.therapistId,
          },
          'completedBookings',
          1,
        );
      }
    }

    return saved;
  }

  /**
   * ================================================================
   * LIST
   * ================================================================
   */
  private async getBookings(
    query: BookingQueryDto | AdminBookingQueryDto,
    scope?: {
      clientId?: number;

      therapistId?: number;
    },
  ) {
    const page = query.page ?? 1;

    const limit = query.limit ?? 20;

    const qb = this.dataSource
      .getRepository(Booking)
      .createQueryBuilder('booking')

      .leftJoinAndSelect('booking.client', 'client')

      .leftJoinAndSelect('client.user', 'clientUser')

      .leftJoinAndSelect('booking.therapist', 'therapist')

      .leftJoinAndSelect('therapist.user', 'therapistUser')

      /**
       * Legacy relations.
       */
      .leftJoinAndSelect('booking.serviceOption', 'serviceOption')

      .leftJoinAndSelect('serviceOption.service', 'service')

      .leftJoinAndSelect('booking.therapistService', 'therapistService')

      /**
       * New multi-service items.
       */
      .leftJoinAndSelect('booking.items', 'bookingItem')

      .leftJoinAndSelect('bookingItem.service', 'bookingItemService')

      .leftJoinAndSelect('bookingItem.serviceOption', 'bookingItemOption')

      .leftJoinAndSelect(
        'bookingItem.therapistService',
        'bookingItemTherapistService',
      );

    if (scope?.clientId) {
      qb.andWhere('booking.clientId = :clientId', {
        clientId: scope.clientId,
      });
    }

    if (scope?.therapistId) {
      qb.andWhere('booking.therapistId = :therapistId', {
        therapistId: scope.therapistId,
      });
    }

    if (query.status) {
      qb.andWhere('booking.status = :status', {
        status: query.status,
      });
    }

    if (query.from) {
      const from = new Date(`${query.from}T00:00:00+07:00`);

      qb.andWhere('booking.scheduledAt >= :from', {
        from,
      });
    }

    if (query.to) {
      const to = new Date(`${query.to}T00:00:00+07:00`);

      to.setUTCDate(to.getUTCDate() + 1);

      qb.andWhere('booking.scheduledAt < :to', {
        to,
      });
    }

    const adminQuery = query as AdminBookingQueryDto;

    if (adminQuery.q?.trim()) {
      const q = `%${adminQuery.q.trim()}%`;

      qb.andWhere(
        `(
          booking.bookingCode ILIKE :q
          OR booking.serviceName ILIKE :q
          OR clientUser.fullName ILIKE :q
          OR therapistUser.fullName ILIKE :q
          OR EXISTS (
            SELECT 1
            FROM booking_items bi_search
            WHERE
              bi_search.booking_id = booking.id
              AND bi_search.deleted_at IS NULL
              AND (
                bi_search.service_name ILIKE :q
                OR COALESCE(bi_search.option_label, '') ILIKE :q
              )
          )
        )`,
        {
          q,
        },
      );
    }

    qb.orderBy('booking.createdAt', 'DESC')

      .addOrderBy('bookingItem.sortOrder', 'ASC')

      .skip((page - 1) * limit)

      .take(limit);

    const [items, total] = await qb.getManyAndCount();

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
  private async findBookingDetail(bookingId: number, manager?: EntityManager) {
    const repository = manager
      ? manager.getRepository(Booking)
      : this.dataSource.getRepository(Booking);

    const booking = await repository.findOne({
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

        items: {
          service: true,

          serviceOption: true,

          therapistService: true,
        },

        statusHistories: {
          changedByUser: true,
        },

        rating: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    /**
     * Relation array không đảm bảo sort nếu dùng findOne.
     */
    booking.items = [...(booking.items ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    return booking;
  }

  /**
   * ================================================================
   * LOCK
   * ================================================================
   */
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
   * ADMIN CHECK
   * ================================================================
   */
  private async ensureAdmin(manager: EntityManager, userId: number) {
    const user = await manager.getRepository(User).findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      user.role !== UserRole.SUPER_ADMIN &&
      user.role !== UserRole.SYSTEM_ADMIN
    ) {
      throw new ForbiddenException('Admin role required');
    }

    return user;
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
      if (area.type === TherapistServiceAreaType.WARD) {
        if (!dto.provinceCode || !dto.wardCode) {
          return false;
        }

        return (
          area.provinceCode === dto.provinceCode &&
          area.wardCode === dto.wardCode
        );
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
          Number(area.centerLatitude),
          Number(area.centerLongitude),
        );

        return distance <= Number(area.radiusKm);
      }

      return false;
    });
  }

  /**
   * ================================================================
   * CONFLICT
   * ================================================================
   */
  private async hasBookingConflict(
    manager: EntityManager,
    therapistId: number,
    scheduledAt: Date,
    expectedEndAt: Date,
    excludeBookingId?: number,
  ) {
    const qb = manager
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
      });

    if (excludeBookingId) {
      qb.andWhere('booking.id != :excludeBookingId', {
        excludeBookingId,
      });
    }

    return qb.getExists();
  }

  /**
   * ================================================================
   * THERAPIST SERVICE IDS
   * ================================================================
   */
  private normalizeTherapistServiceIds(values: number[]) {
    if (!Array.isArray(values) || !values.length) {
      throw new BadRequestException('therapistServiceIds is required');
    }

    const normalized = values.map(Number);

    if (normalized.some((value) => !Number.isInteger(value) || value < 1)) {
      throw new BadRequestException(
        'therapistServiceIds contains invalid value',
      );
    }

    const unique = Array.from(new Set(normalized));

    /**
     * Không cho cùng một option bị cộng 2 lần.
     */
    if (unique.length !== normalized.length) {
      throw new BadRequestException(
        'Duplicate therapistServiceIds are not allowed',
      );
    }

    return unique;
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
   * BOOKING CODE
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
