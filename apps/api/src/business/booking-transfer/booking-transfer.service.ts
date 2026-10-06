import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, EntityManager, In } from 'typeorm';

import { Booking } from '../entities/booking.entity.js';

import { BookingGroupTransferConsent } from '../entities/booking-group-transfer-consent.entity.js';

import { BookingTherapistTransfer } from '../entities/booking-therapist-transfer.entity.js';

import { ClientProfile } from '../entities/client-profile.entity.js';

import { TherapistGroupMember } from '../entities/therapist-group-member.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import {
  BookingStatus,
  TherapistVerificationStatus,
  UserStatus,
} from '../enums/business.enums.js';

import { BookingService } from '../booking/booking.service.js';

import { TherapistAvailabilityService } from '../therapist-availability/therapist-availability.service.js';

import { BookingTherapistTransferStatus } from '../therapist-groups/therapist-group.enums.js';

import type {
  CreateBookingTherapistTransferDto,
  RespondBookingTherapistTransferDto,
} from './dto/booking-transfer.dto.js';

type BookingItemServiceRow = {
  id: number;

  service_option_id: number;

  therapist_service_id: number | null;

  /**
   * Snapshot giá khách đã xác nhận tại thời điểm tạo booking.
   *
   * Khi chuyển KTV, giá này KHÔNG đổi.
   */
  price: number;

  /**
   * Snapshot fee của KTV đang được gán trước khi chuyển.
   *
   * PostgreSQL numeric có thể được pg trả về dưới dạng string.
   */
  platform_fee_rate: number | string | null;

  platform_fee: number | null;
};

type CandidateContext = {
  therapist: TherapistProfile;

  therapistServiceIds: number[];

  serviceByOptionId: Map<number, TherapistService>;
};

@Injectable()
export class BookingTransferService {
  private readonly businessUtcOffsetHours = 7;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly therapistAvailabilityService: TherapistAvailabilityService,

    private readonly bookingService: BookingService,
  ) {}

  /**

   * ================================================================

   * CLIENT CONSENT

   * ================================================================

   */

  async setClientConsent(
    clientUserId: number,

    bookingId: number,

    allowed: boolean,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const client = await this.getClientByUserId(manager, clientUserId);

      const booking = await this.lockBooking(manager, bookingId);

      if (booking.clientId !== client.id) {
        throw new ForbiddenException();
      }

      if (
        ![
          BookingStatus.PENDING,

          BookingStatus.SEARCHING_THERAPIST,

          BookingStatus.WAITING_THERAPIST_ACCEPT,
        ].includes(booking.status)
      ) {
        throw new ConflictException(
          'Không thể thay đổi quyền chuyển KTV ở trạng thái hiện tại',
        );
      }

      const activeTransfer = await this.findActiveTransfer(manager, booking.id);

      if (activeTransfer) {
        throw new ConflictException('Booking đang có yêu cầu chuyển KTV');
      }

      const repository = manager.getRepository(BookingGroupTransferConsent);

      let consent = await repository.findOne({
        where: {
          bookingId: booking.id,
        },
      });

      if (!consent) {
        consent = repository.create({
          bookingId: booking.id,

          allowed,

          acceptedAt: allowed ? new Date() : null,
        });
      } else {
        consent.allowed = allowed;

        consent.acceptedAt = allowed ? new Date() : null;
      }

      return repository.save(consent);
    });
  }

  /**

   * Khách xem transfer hiện tại của booking.

   */

  async getClientTransfer(clientUserId: number, bookingId: number) {
    const client = await this.getClientByUserId(
      this.dataSource.manager,

      clientUserId,
    );

    const booking = await this.dataSource.manager

      .getRepository(Booking)

      .findOne({
        where: {
          id: bookingId,
        },
      });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.clientId !== client.id) {
      throw new ForbiddenException();
    }

    const consent = await this.dataSource.manager

      .getRepository(BookingGroupTransferConsent)

      .findOne({
        where: {
          bookingId,
        },
      });

    const transfer = await this.dataSource.manager

      .getRepository(BookingTherapistTransfer)

      .findOne({
        where: {
          bookingId,
        },

        relations: {
          group: true,

          fromTherapist: {
            user: true,
          },

          toTherapist: {
            user: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

    return {
      consent: {
        allowed: consent?.allowed ?? false,

        acceptedAt: consent?.acceptedAt ?? null,
      },

      transfer: transfer ? this.serializeTransfer(transfer) : null,
    };
  }

  /**

   * ================================================================

   * A - LIST CANDIDATES

   * ================================================================

   */

  async getTransferCandidates(therapistUserId: number, bookingId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      therapistUserId,
    );

    const booking = await this.getBooking(this.dataSource.manager, bookingId);

    this.ensureSourceTherapistBooking(booking, therapist.id);

    await this.ensureClientAllowedTransfer(this.dataSource.manager, booking.id);

    const membership = await this.getActiveMembership(
      this.dataSource.manager,

      therapist.id,
    );

    const members = await this.dataSource.manager

      .getRepository(TherapistGroupMember)

      .find({
        where: {
          groupId: membership.groupId,
        },

        relations: {
          therapist: {
            user: true,
          },
        },

        order: {
          createdAt: 'ASC',
        },
      });

    const items: Array<{
      therapistId: number;

      stageName: string | null;

      fullName: string | null;

      ratingAverage: number;

      ratingCount: number;

      completedBookings: number;

      available: boolean;

      reason: string | null;
    }> = [];

    for (const member of members) {
      if (member.therapistId === therapist.id) {
        continue;
      }

      let available = true;

      let reason: string | null = null;

      try {
        await this.resolveCandidateContext(
          this.dataSource.manager,

          booking,

          member.therapistId,

          membership.groupId,
        );
      } catch (error) {
        available = false;

        reason = this.getErrorMessage(error);
      }

      items.push({
        therapistId: member.therapistId,

        stageName: member.therapist.stageName ?? null,

        fullName: member.therapist.user?.fullName ?? null,

        ratingAverage: Number(member.therapist.ratingAverage ?? 0),

        ratingCount: Number(member.therapist.ratingCount ?? 0),

        completedBookings: Number(member.therapist.completedBookings ?? 0),

        available,

        reason,
      });
    }

    return {
      groupId: membership.groupId,

      items,
    };
  }

  /**

   * ================================================================

   * A -> B

   * ================================================================

   */

  async createTransfer(
    therapistUserId: number,

    bookingId: number,

    dto: CreateBookingTherapistTransferDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(
        manager,

        therapistUserId,
      );

      const booking = await this.lockBooking(manager, bookingId);

      this.ensureSourceTherapistBooking(booking, therapist.id);

      await this.ensureClientAllowedTransfer(manager, booking.id);

      if (dto.toTherapistId === therapist.id) {
        throw new BadRequestException(
          'Không thể chuyển booking cho chính mình',
        );
      }

      const activeTransfer = await this.findActiveTransfer(manager, booking.id);

      if (activeTransfer) {
        throw new ConflictException('Booking đã có yêu cầu chuyển đang xử lý');
      }

      const membership = await this.getActiveMembership(manager, therapist.id);

      await this.resolveCandidateContext(
        manager,

        booking,

        dto.toTherapistId,

        membership.groupId,
      );

      const transfer = await manager

        .getRepository(BookingTherapistTransfer)

        .save({
          bookingId: booking.id,

          groupId: membership.groupId,

          fromTherapistId: therapist.id,

          toTherapistId: dto.toTherapistId,

          status: BookingTherapistTransferStatus.PENDING_THERAPIST,

          reason: dto.reason?.trim() || null,

          therapistRespondedAt: null,

          clientRespondedAt: null,

          completedAt: null,

          cancelledAt: null,
        });

      return this.getTransferDetail(manager, transfer.id);
    });
  }

  /**

   * ================================================================

   * B - INCOMING TRANSFERS

   * ================================================================

   */

  async getIncomingTransfers(therapistUserId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      therapistUserId,
    );

    const items = await this.dataSource.manager

      .getRepository(BookingTherapistTransfer)

      .find({
        where: {
          toTherapistId: therapist.id,

          status: In([
            BookingTherapistTransferStatus.PENDING_THERAPIST,

            BookingTherapistTransferStatus.PENDING_CLIENT,

            BookingTherapistTransferStatus.READY_TO_ACCEPT,
          ]),
        },

        relations: {
          booking: true,

          group: true,

          fromTherapist: {
            user: true,
          },

          toTherapist: {
            user: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

    return {
      items: items.map((item) => this.serializeTransfer(item)),
    };
  }

  /**

   * ================================================================

   * B CONFIRM TRANSFER

   * ================================================================

   *

   * Đây CHƯA PHẢI nhận booking.

   *

   * B chỉ xác nhận:

   * "Tôi đồng ý để khách xem xét chuyển booking này sang tôi".

   */

  async respondByTherapist(
    therapistUserId: number,

    transferId: number,

    dto: RespondBookingTherapistTransferDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(
        manager,

        therapistUserId,
      );

      const transfer = await this.lockTransfer(manager, transferId);

      if (transfer.toTherapistId !== therapist.id) {
        throw new ForbiddenException();
      }

      if (
        transfer.status !== BookingTherapistTransferStatus.PENDING_THERAPIST
      ) {
        throw new ConflictException(
          'Yêu cầu chuyển không còn chờ KTV xác nhận',
        );
      }

      if (!dto.accepted) {
        transfer.status = BookingTherapistTransferStatus.REJECTED_BY_THERAPIST;

        transfer.therapistRespondedAt = new Date();

        transfer.reason = dto.reason?.trim() || transfer.reason;

        await manager.getRepository(BookingTherapistTransfer).save(transfer);

        return this.getTransferDetail(manager, transfer.id);
      }

      const booking = await this.lockBooking(manager, transfer.bookingId);

      if (booking.therapistId !== transfer.fromTherapistId) {
        throw new ConflictException(
          'Booking không còn thuộc KTV chuyển ban đầu',
        );
      }

      await this.ensureClientAllowedTransfer(manager, booking.id);

      await this.resolveCandidateContext(
        manager,

        booking,

        therapist.id,

        transfer.groupId,
      );

      transfer.status = BookingTherapistTransferStatus.PENDING_CLIENT;

      transfer.therapistRespondedAt = new Date();

      await manager.getRepository(BookingTherapistTransfer).save(transfer);

      return this.getTransferDetail(manager, transfer.id);
    });
  }

  /**

   * ================================================================

   * CLIENT CONFIRM B

   * ================================================================

   */

  async respondByClient(
    clientUserId: number,

    transferId: number,

    dto: RespondBookingTherapistTransferDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const client = await this.getClientByUserId(manager, clientUserId);

      const transfer = await this.lockTransfer(manager, transferId);

      if (transfer.status !== BookingTherapistTransferStatus.PENDING_CLIENT) {
        throw new ConflictException(
          'Yêu cầu chuyển không còn chờ khách xác nhận',
        );
      }

      const booking = await this.lockBooking(manager, transfer.bookingId);

      if (booking.clientId !== client.id) {
        throw new ForbiddenException();
      }

      if (!dto.accepted) {
        transfer.status = BookingTherapistTransferStatus.REJECTED_BY_CLIENT;

        transfer.clientRespondedAt = new Date();

        transfer.reason = dto.reason?.trim() || transfer.reason;

        await manager.getRepository(BookingTherapistTransfer).save(transfer);

        return this.getTransferDetail(manager, transfer.id);
      }

      /**

       * Re-check B ngay trước khi khách đồng ý.

       */

      await this.resolveCandidateContext(
        manager,

        booking,

        transfer.toTherapistId,

        transfer.groupId,
      );

      transfer.status = BookingTherapistTransferStatus.READY_TO_ACCEPT;

      transfer.clientRespondedAt = new Date();

      await manager.getRepository(BookingTherapistTransfer).save(transfer);

      return this.getTransferDetail(manager, transfer.id);
    });
  }

  /**

   * ================================================================

   * B FINAL ACCEPT

   * ================================================================

   *

   * Đây mới là thời điểm:

   *

   * booking.therapistId:

   *

   * A -> B

   *

   * Sau đó gọi BookingService hiện tại:

   *

   * WAITING_THERAPIST_ACCEPT -> CONFIRMED

   *

   * để giữ nguyên:

   *

   * - wallet charge

   * - booking history

   * - acceptedAt

   * - realtime booking.updated

   */

  async acceptTransferredBooking(therapistUserId: number, transferId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      therapistUserId,
    );

    /**

     * Nếu bước assign đã thành công trước đó

     * nhưng bước mark transfer COMPLETED bị lỗi,

     * request retry vẫn có thể hoàn tất.

     */

    const currentTransfer = await this.dataSource.manager

      .getRepository(BookingTherapistTransfer)

      .findOne({
        where: {
          id: transferId,
        },
      });

    if (!currentTransfer) {
      throw new NotFoundException('Không tìm thấy yêu cầu chuyển');
    }

    if (currentTransfer.toTherapistId !== therapist.id) {
      throw new ForbiddenException();
    }

    const currentBooking = await this.getBooking(
      this.dataSource.manager,

      currentTransfer.bookingId,
    );

    if (
      currentTransfer.status ===
        BookingTherapistTransferStatus.READY_TO_ACCEPT &&
      currentBooking.therapistId === therapist.id &&
      currentBooking.status === BookingStatus.CONFIRMED
    ) {
      return this.markTransferCompleted(transferId);
    }

    /**

     * Giữ snapshot trước khi remap

     * để có thể rollback nếu BookingService

     * không confirm được.

     */

    const assignment = await this.dataSource.transaction(async (manager) => {
      const transfer = await this.lockTransfer(manager, transferId);

      if (transfer.toTherapistId !== therapist.id) {
        throw new ForbiddenException();
      }

      if (transfer.status !== BookingTherapistTransferStatus.READY_TO_ACCEPT) {
        throw new ConflictException('Khách chưa xác nhận KTV này');
      }

      const booking = await this.lockBooking(manager, transfer.bookingId);

      if (booking.status !== BookingStatus.WAITING_THERAPIST_ACCEPT) {
        throw new ConflictException(
          'Booking không còn ở trạng thái chờ KTV nhận',
        );
      }

      if (booking.therapistId !== transfer.fromTherapistId) {
        throw new ConflictException('Booking đã được giao cho KTV khác');
      }

      await this.ensureClientAllowedTransfer(manager, booking.id);

      const candidate = await this.resolveCandidateContext(
        manager,

        booking,

        therapist.id,

        transfer.groupId,
      );

      const bookingItems = await this.getBookingItemServiceRows(
        manager,

        booking,
      );

      const originalItems = bookingItems.map((item) => ({
        id: item.id,

        therapistServiceId: item.therapist_service_id,

        platformFeeRate: Number(item.platform_fee_rate ?? 0),

        platformFee: Number(item.platform_fee ?? 0),
      }));

      const originalTherapistId = booking.therapistId;

      const originalLegacyTherapistServiceId = booking.therapistServiceId;

      /**
       * Booking.platformFee hiện tại là snapshot fee của KTV A.
       *
       * Khi B nhận booking, fee phải được tính lại theo
       * platformFeeRate của TherapistService thuộc KTV B.
       */
      const originalBookingPlatformFee = Number(booking.platformFee ?? 0);

      let targetBookingPlatformFee = 0;

      /**
       * Remap BookingItem sang TherapistService tương ứng của B.
       *
       * QUAN TRỌNG:
       *
       * - KHÔNG đổi giá khách đã xác nhận.
       * - KHÔNG đổi discount / totalAmount.
       * - CHỈ đổi therapistServiceId + platformFeeRate + platformFee
       *   sang cấu hình của KTV B.
       */
      for (const item of bookingItems) {
        const candidateService = candidate.serviceByOptionId.get(
          Number(item.service_option_id),
        );

        if (!candidateService) {
          throw new ConflictException(
            'KTV nhận chuyển không còn đủ dịch vụ của booking',
          );
        }

        const itemPrice = Number(item.price ?? 0);

        if (!Number.isFinite(itemPrice) || itemPrice < 0) {
          throw new ConflictException(
            'Giá snapshot của dịch vụ trong booking không hợp lệ',
          );
        }

        const candidatePlatformFeeRate = Number(
          candidateService.platformFeeRate ?? 0,
        );

        if (
          !Number.isFinite(candidatePlatformFeeRate) ||
          candidatePlatformFeeRate < 0 ||
          candidatePlatformFeeRate > 100
        ) {
          throw new ConflictException(
            'Cấu hình phí nền tảng của KTV nhận chuyển không hợp lệ',
          );
        }

        const candidatePlatformFee = Math.round(
          (itemPrice * candidatePlatformFeeRate) / 100,
        );

        targetBookingPlatformFee += candidatePlatformFee;

        /**
         * id = 0 là booking legacy không có booking_items.
         *
         * Với booking legacy, chỉ cần cập nhật snapshot trên bảng bookings.
         */
        if (item.id <= 0) {
          continue;
        }

        await manager.query(
          `
            UPDATE booking_items
            SET
              therapist_service_id = $1,
              platform_fee_rate = $2,
              platform_fee = $3,
              updated_at = NOW()
            WHERE
              id = $4
              AND deleted_at IS NULL
          `,
          [
            candidateService.id,
            candidatePlatformFeeRate,
            candidatePlatformFee,
            item.id,
          ],
        );
      }

      booking.therapistId = therapist.id;

      /**
       * Legacy compatibility:
       * lấy service đầu tiên làm therapistServiceId của booking.
       */
      const firstServiceId = candidate.therapistServiceIds[0] ?? null;

      booking.therapistServiceId = firstServiceId;

      /**
       * Cập nhật tổng platform fee theo chính KTV B.
       *
       * BookingService.updateTherapistBookingStatus() phía dưới
       * sẽ dùng booking.platformFee mới này để charge ví của B.
       */
      booking.platformFee = targetBookingPlatformFee;

      await manager.getRepository(Booking).save(booking);

      return {
        bookingId: booking.id,

        originalTherapistId,

        originalLegacyTherapistServiceId,

        originalBookingPlatformFee,

        originalItems,
      };
    });

    try {
      /**

       * Dùng chính flow accept booking

       * hiện tại.

       *

       * Wallet/platform fee/history/realtime

       * tiếp tục chạy đúng logic cũ.

       */

      const booking = await this.bookingService.updateTherapistBookingStatus(
        therapistUserId,

        assignment.bookingId,

        BookingStatus.CONFIRMED,

        'KTV nhận booking được chuyển trong nhóm',
      );

      await this.markTransferCompleted(transferId);

      return booking;
    } catch (error) {
      /**

       * Nếu CONFIRMED thất bại

       * thì trả ownership về A.

       */

      await this.rollbackAssignment(
        assignment.bookingId,
        assignment.originalTherapistId,
        assignment.originalLegacyTherapistServiceId,
        assignment.originalBookingPlatformFee,
        assignment.originalItems,
      );

      throw error;
    }
  }

  /**

   * ================================================================

   * CANDIDATE VALIDATION

   * ================================================================

   */

  private async resolveCandidateContext(
    manager: EntityManager,

    booking: Booking,

    candidateTherapistId: number,

    groupId: number,
  ): Promise<CandidateContext> {
    const membership = await manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          groupId,

          therapistId: candidateTherapistId,
        },

        relations: {
          group: true,
        },
      });

    if (!membership || !membership.group.isActive) {
      throw new ConflictException('KTV nhận chuyển không còn thuộc cùng nhóm');
    }

    const therapist = await manager.getRepository(TherapistProfile).findOne({
      where: {
        id: candidateTherapistId,
      },

      relations: {
        user: true,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Không tìm thấy KTV nhận chuyển');
    }

    if (therapist.user.status !== UserStatus.ACTIVE) {
      throw new ConflictException('KTV nhận chuyển không hoạt động');
    }

    if (therapist.verificationStatus !== TherapistVerificationStatus.VERIFIED) {
      throw new ConflictException('KTV nhận chuyển chưa được xác minh');
    }

    if (!therapist.isAcceptingBookings) {
      throw new ConflictException('KTV nhận chuyển đang không nhận booking');
    }

    const bookingItems = await this.getBookingItemServiceRows(manager, booking);

    const serviceOptionIds = [
      ...new Set(bookingItems.map((item) => Number(item.service_option_id))),
    ];

    const therapistServices = await manager

      .getRepository(TherapistService)

      .find({
        where: {
          therapistId: candidateTherapistId,

          serviceOptionId: In(serviceOptionIds),

          isActive: true,
        },
      });

    const serviceByOptionId = new Map<number, TherapistService>();

    for (const service of therapistServices) {
      serviceByOptionId.set(service.serviceOptionId, service);
    }

    for (const serviceOptionId of serviceOptionIds) {
      if (!serviceByOptionId.has(serviceOptionId)) {
        throw new ConflictException(
          'KTV nhận chuyển không cung cấp đầy đủ dịch vụ của booking',
        );
      }
    }

    /**

     * Giữ đúng thứ tự BookingItem.

     */

    const therapistServiceIds = bookingItems.map((item) => {
      const service = serviceByOptionId.get(Number(item.service_option_id));

      if (!service) {
        throw new ConflictException(
          'Không thể ánh xạ dịch vụ cho KTV nhận chuyển',
        );
      }

      return service.id;
    });

    const { date, startTime } = this.toBusinessDateTime(booking.scheduledAt);

    const availability =
      await this.therapistAvailabilityService.checkAvailability(
        candidateTherapistId,

        {
          therapistServiceIds,

          date,

          startTime,
        },

        {
          manager,

          /**

           * Booking hiện tại vẫn thuộc A.

           * Loại nó khỏi conflict check

           * để B được kiểm tra độc lập.

           */

          excludeBookingId: booking.id,
        },
      );

    if (!availability.available) {
      throw new ConflictException(
        availability.reason
          ? String(availability.reason)
          : 'KTV nhận chuyển không khả dụng tại thời gian booking',
      );
    }

    return {
      therapist,

      therapistServiceIds,

      serviceByOptionId,
    };
  }

  /**

   * Multi-service:

   * lấy service_option_id từ booking_items.

   *

   * Có fallback cho booking legacy.

   */

  private async getBookingItemServiceRows(
    manager: EntityManager,
    booking: Booking,
  ): Promise<BookingItemServiceRow[]> {
    const rows = (await manager.query(
      `
        SELECT
          id,
          service_option_id,
          therapist_service_id,
          price,
          platform_fee_rate,
          platform_fee
        FROM booking_items
        WHERE
          booking_id = $1
          AND deleted_at IS NULL
        ORDER BY sort_order ASC, id ASC
      `,
      [booking.id],
    )) as BookingItemServiceRow[];

    if (rows.length > 0) {
      return rows;
    }

    /**
     * Legacy booking compatibility.
     *
     * Booking legacy không có booking_items nên dùng snapshot
     * trên bảng bookings làm một item giả.
     */
    if (!booking.serviceOptionId) {
      throw new ConflictException('Booking không có thông tin dịch vụ');
    }

    return [
      {
        id: 0,

        service_option_id: booking.serviceOptionId,

        therapist_service_id: booking.therapistServiceId,

        price: Number(booking.servicePrice ?? 0),

        /**
         * Không cần biết chính xác rate cũ ở booking legacy
         * để tính fee mới cho B.
         *
         * Khi rollback, booking.platformFee được restore riêng.
         */
        platform_fee_rate: 0,

        platform_fee: Number(booking.platformFee ?? 0),
      },
    ];
  }

  private async ensureClientAllowedTransfer(
    manager: EntityManager,

    bookingId: number,
  ) {
    const consent = await manager

      .getRepository(BookingGroupTransferConsent)

      .findOne({
        where: {
          bookingId,

          allowed: true,
        },
      });

    if (!consent) {
      throw new ForbiddenException(
        'Khách hàng chưa đồng ý cho phép chuyển KTV trong nhóm',
      );
    }

    return consent;
  }

  private ensureSourceTherapistBooking(booking: Booking, therapistId: number) {
    if (booking.therapistId !== therapistId) {
      throw new ForbiddenException('Booking không thuộc KTV hiện tại');
    }

    /**

     * Bản đầu chỉ cho chuyển

     * trước khi A nhận booking.

     */

    if (booking.status !== BookingStatus.WAITING_THERAPIST_ACCEPT) {
      throw new ConflictException(
        'Chỉ có thể chuyển booking khi đang chờ KTV xác nhận',
      );
    }
  }

  private async getActiveMembership(
    manager: EntityManager,

    therapistId: number,
  ) {
    const membership = await manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          therapistId,
        },

        relations: {
          group: true,
        },
      });

    if (!membership || !membership.group.isActive) {
      throw new ConflictException('KTV chưa thuộc nhóm hoạt động nào');
    }

    return membership;
  }

  private async findActiveTransfer(manager: EntityManager, bookingId: number) {
    return manager.getRepository(BookingTherapistTransfer).findOne({
      where: {
        bookingId,

        status: In([
          BookingTherapistTransferStatus.PENDING_THERAPIST,

          BookingTherapistTransferStatus.PENDING_CLIENT,

          BookingTherapistTransferStatus.READY_TO_ACCEPT,
        ]),
      },

      order: {
        createdAt: 'DESC',
      },
    });
  }

  private async lockTransfer(manager: EntityManager, transferId: number) {
    const transfer = await manager

      .getRepository(BookingTherapistTransfer)

      .findOne({
        where: {
          id: transferId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

    if (!transfer) {
      throw new NotFoundException('Không tìm thấy yêu cầu chuyển booking');
    }

    return transfer;
  }

  private async getTransferDetail(manager: EntityManager, transferId: number) {
    const transfer = await manager

      .getRepository(BookingTherapistTransfer)

      .findOne({
        where: {
          id: transferId,
        },

        relations: {
          booking: true,

          group: true,

          fromTherapist: {
            user: true,
          },

          toTherapist: {
            user: true,
          },
        },
      });

    if (!transfer) {
      throw new NotFoundException('Không tìm thấy yêu cầu chuyển booking');
    }

    return this.serializeTransfer(transfer);
  }

  private serializeTransfer(transfer: BookingTherapistTransfer) {
    return {
      id: transfer.id,

      bookingId: transfer.bookingId,

      groupId: transfer.groupId,

      group: transfer.group
        ? {
            id: transfer.group.id,

            name: transfer.group.name,
          }
        : null,

      fromTherapist: {
        therapistId: transfer.fromTherapistId,

        stageName: transfer.fromTherapist?.stageName ?? null,

        fullName: transfer.fromTherapist?.user?.fullName ?? null,
      },

      toTherapist: {
        therapistId: transfer.toTherapistId,

        stageName: transfer.toTherapist?.stageName ?? null,

        fullName: transfer.toTherapist?.user?.fullName ?? null,
      },

      status: transfer.status,

      reason: transfer.reason,

      therapistRespondedAt: transfer.therapistRespondedAt,

      clientRespondedAt: transfer.clientRespondedAt,

      completedAt: transfer.completedAt,

      createdAt: transfer.createdAt,

      updatedAt: transfer.updatedAt,
    };
  }

  private async markTransferCompleted(transferId: number) {
    return this.dataSource.transaction(async (manager) => {
      const transfer = await this.lockTransfer(manager, transferId);

      transfer.status = BookingTherapistTransferStatus.COMPLETED;

      transfer.completedAt = transfer.completedAt ?? new Date();

      await manager.getRepository(BookingTherapistTransfer).save(transfer);

      return this.getTransferDetail(manager, transfer.id);
    });
  }

  private async rollbackAssignment(
    bookingId: number,
    therapistId: number | null,
    legacyTherapistServiceId: number | null,
    bookingPlatformFee: number,
    items: Array<{
      id: number;
      therapistServiceId: number | null;
      platformFeeRate: number;
      platformFee: number;
    }>,
  ) {
    await this.dataSource.transaction(async (manager) => {
      const booking = await this.lockBooking(manager, bookingId);

      /**
       * Chỉ rollback nếu BookingService chưa CONFIRMED thành công.
       *
       * Nếu booking đã CONFIRMED thì wallet/history đã được xử lý,
       * không được đưa ownership về A.
       */
      if (booking.status !== BookingStatus.WAITING_THERAPIST_ACCEPT) {
        return;
      }

      booking.therapistId = therapistId;

      booking.therapistServiceId = legacyTherapistServiceId;

      /**
       * Trả lại tổng platform fee snapshot của KTV A.
       */
      booking.platformFee = bookingPlatformFee;

      await manager.getRepository(Booking).save(booking);

      for (const item of items) {
        /**
         * id = 0 nghĩa là booking legacy không có booking_items.
         */
        if (item.id <= 0) {
          continue;
        }

        await manager.query(
          `
            UPDATE booking_items
            SET
              therapist_service_id = $1,
              platform_fee_rate = $2,
              platform_fee = $3,
              updated_at = NOW()
            WHERE
              id = $4
              AND deleted_at IS NULL
          `,
          [
            item.therapistServiceId,
            item.platformFeeRate,
            item.platformFee,
            item.id,
          ],
        );
      }
    });
  }

  private async getBooking(manager: EntityManager, bookingId: number) {
    const booking = await manager.getRepository(Booking).findOne({
      where: {
        id: bookingId,
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

      relations: {
        user: true,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    return therapist;
  }

  private async getClientByUserId(manager: EntityManager, userId: number) {
    const client = await manager.getRepository(ClientProfile).findOne({
      where: {
        userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client profile not found');
    }

    return client;
  }

  private toBusinessDateTime(value: Date) {
    const date = value instanceof Date ? value : new Date(value);

    const shifted = new Date(
      date.getTime() + this.businessUtcOffsetHours * 60 * 60 * 1000,
    );

    const iso = shifted.toISOString();

    return {
      date: iso.slice(0, 10),

      startTime: iso.slice(11, 16),
    };
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return 'KTV không thể nhận booking này';
  }
}
