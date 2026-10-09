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

import { TherapistUnavailableReason } from '../therapist-availability/types/therapist-availability.types.js';

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

type TransferLifecycleState = 'active' | 'completed' | 'cancelled' | 'expired';

const ACTIVE_TRANSFER_STATUSES: BookingTherapistTransferStatus[] = [
  BookingTherapistTransferStatus.PENDING_THERAPIST,

  BookingTherapistTransferStatus.PENDING_CLIENT,

  BookingTherapistTransferStatus.READY_TO_ACCEPT,
];

const TRANSFER_EXPIRED_MESSAGE =
  'Yêu cầu chuyển booking đã hết hiệu lực vì thời gian booking đã bắt đầu';

const TRANSFER_CANCELLED_MESSAGE =
  'Yêu cầu chuyển booking không còn hiệu lực vì booking hoặc nhóm đã thay đổi';

const TRANSFER_COMPLETED_MESSAGE = 'Yêu cầu chuyển booking đã hoàn tất';

const CANDIDATE_UNAVAILABLE_REASON = {
  NOT_IN_GROUP: 'candidate_not_in_group',

  NOT_FOUND: 'candidate_not_found',

  MISSING_REQUIRED_SERVICES: 'missing_required_services',

  BOOKING_SERVICE_MISSING: 'booking_service_missing',

  UNAVAILABLE: 'candidate_unavailable',
} as const;

const CANDIDATE_UNAVAILABLE_REASON_KEYS = new Set<string>([
  ...Object.values(TherapistUnavailableReason),

  ...Object.values(CANDIDATE_UNAVAILABLE_REASON),
]);

const CANDIDATE_REASON_BY_ERROR_MESSAGE: Readonly<Record<string, string>> = {
  [TRANSFER_EXPIRED_MESSAGE]: TherapistUnavailableReason.PAST_TIME,

  'KTV nhận chuyển không còn thuộc cùng nhóm':
    CANDIDATE_UNAVAILABLE_REASON.NOT_IN_GROUP,

  'Không tìm thấy KTV nhận chuyển': CANDIDATE_UNAVAILABLE_REASON.NOT_FOUND,

  'KTV nhận chuyển không hoạt động':
    TherapistUnavailableReason.THERAPIST_INACTIVE,

  'KTV nhận chuyển chưa được xác minh': TherapistUnavailableReason.NOT_VERIFIED,

  'KTV nhận chuyển đang không nhận booking':
    TherapistUnavailableReason.NOT_ACCEPTING_BOOKINGS,

  'KTV nhận chuyển không cung cấp đầy đủ dịch vụ của booking':
    CANDIDATE_UNAVAILABLE_REASON.MISSING_REQUIRED_SERVICES,

  'Không thể ánh xạ dịch vụ cho KTV nhận chuyển':
    CANDIDATE_UNAVAILABLE_REASON.UNAVAILABLE,

  'Booking không có thông tin dịch vụ':
    CANDIDATE_UNAVAILABLE_REASON.BOOKING_SERVICE_MISSING,

  'KTV nhận chuyển không khả dụng tại thời gian booking':
    CANDIDATE_UNAVAILABLE_REASON.UNAVAILABLE,
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

    const transferRepository = this.dataSource.manager.getRepository(
      BookingTherapistTransfer,
    );

    const transfer = await transferRepository.findOne({
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

    /**

     * Lazy reconciliation cho dữ liệu cũ/stale:

     *

     * - booking đã được B nhận thành công -> COMPLETED;

     * - booking không còn transferable -> CANCELLED;

     * - A/B không còn cùng group -> CANCELLED;

     * - quá scheduledAt -> EXPIRED.

     */

    if (transfer && this.isActiveTransferStatus(transfer.status)) {
      await this.reconcileActiveTransfer(
        this.dataSource.manager,

        transfer,

        booking,
      );
    }

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

    /**

     * Không cho mở flow chuyển KTV nếu booking đã tới giờ bắt đầu.

     *

     * Guard này cũng tránh để availability trả raw reason = past_time.

     */

    this.ensureBookingTransferWindow(booking);

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

        reason = this.getCandidateUnavailableReason(error);
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
    const result = await this.dataSource.transaction(async (manager) => {
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

      /**

       * findActiveTransfer() sẽ lazy-expire request cũ nếu request

       * đó đã quá scheduledAt.

       */

      const activeTransfer = await this.findActiveTransfer(manager, booking.id);

      if (activeTransfer) {
        throw new ConflictException('Booking đã có yêu cầu chuyển đang xử lý');
      }

      /**

       * Không throw trong transaction sau khi findActiveTransfer()

       * vừa persist một request cũ thành EXPIRED.

       *

       * Trả cờ ra ngoài để transaction commit trước.

       */

      if (this.isBookingTransferExpired(booking)) {
        return {
          expired: true as const,

          data: null,
        };
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

      return {
        expired: false as const,

        data: await this.getTransferDetail(manager, transfer.id),
      };
    });

    if (result.expired) {
      throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
    }

    return result.data;
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

    const repository = this.dataSource.manager.getRepository(
      BookingTherapistTransfer,
    );

    const items = await repository.find({
      where: {
        toTherapistId: therapist.id,

        status: In(ACTIVE_TRANSFER_STATUSES),
      },

      relations: {
        booking: {
          items: true,
        },

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

    const now = new Date();

    const activeItems: BookingTherapistTransfer[] = [];

    for (const item of items) {
      const lifecycle = await this.reconcileActiveTransfer(
        this.dataSource.manager,

        item,

        item.booking,

        now,
      );

      if (lifecycle !== 'active') {
        continue;
      }

      activeItems.push(item);
    }

    return {
      items: activeItems.map((item) => this.serializeTransfer(item)),
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
    const result = await this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(
        manager,

        therapistUserId,
      );

      const transfer = await this.lockTransfer(manager, transferId);

      if (transfer.toTherapistId !== therapist.id) {
        throw new ForbiddenException();
      }

      if (transfer.status === BookingTherapistTransferStatus.EXPIRED) {
        throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
      }

      if (
        transfer.status !== BookingTherapistTransferStatus.PENDING_THERAPIST
      ) {
        throw new ConflictException(
          'Yêu cầu chuyển không còn chờ KTV xác nhận',
        );
      }

      const booking = await this.lockBooking(manager, transfer.bookingId);

      /**

       * Reconcile trước khi xử lý action.

       *

       * Không throw trong transaction nếu vừa persist CANCELLED/EXPIRED,

       * để trạng thái mới được COMMIT trước.

       */

      const lifecycle = await this.reconcileActiveTransfer(
        manager,

        transfer,

        booking,
      );

      if (lifecycle !== 'active') {
        return {
          lifecycle,

          data: null,
        };
      }

      if (!dto.accepted) {
        transfer.status = BookingTherapistTransferStatus.REJECTED_BY_THERAPIST;

        transfer.therapistRespondedAt = new Date();

        transfer.reason = dto.reason?.trim() || transfer.reason;

        await manager.getRepository(BookingTherapistTransfer).save(transfer);

        return {
          lifecycle: 'active' as const,

          data: await this.getTransferDetail(manager, transfer.id),
        };
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

      return {
        lifecycle: 'active' as const,

        data: await this.getTransferDetail(manager, transfer.id),
      };
    });

    if (result.lifecycle !== 'active') {
      this.throwTransferLifecycleConflict(result.lifecycle);
    }

    return result.data;
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
    const result = await this.dataSource.transaction(async (manager) => {
      const client = await this.getClientByUserId(manager, clientUserId);

      const transfer = await this.lockTransfer(manager, transferId);

      if (transfer.status === BookingTherapistTransferStatus.EXPIRED) {
        throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
      }

      if (transfer.status !== BookingTherapistTransferStatus.PENDING_CLIENT) {
        throw new ConflictException(
          'Yêu cầu chuyển không còn chờ khách xác nhận',
        );
      }

      const booking = await this.lockBooking(manager, transfer.bookingId);

      if (booking.clientId !== client.id) {
        throw new ForbiddenException();
      }

      const lifecycle = await this.reconcileActiveTransfer(
        manager,

        transfer,

        booking,
      );

      if (lifecycle !== 'active') {
        return {
          lifecycle,

          data: null,
        };
      }

      if (!dto.accepted) {
        transfer.status = BookingTherapistTransferStatus.REJECTED_BY_CLIENT;

        transfer.clientRespondedAt = new Date();

        transfer.reason = dto.reason?.trim() || transfer.reason;

        await manager.getRepository(BookingTherapistTransfer).save(transfer);

        return {
          lifecycle: 'active' as const,

          data: await this.getTransferDetail(manager, transfer.id),
        };
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

      return {
        lifecycle: 'active' as const,

        data: await this.getTransferDetail(manager, transfer.id),
      };
    });

    if (result.lifecycle !== 'active') {
      this.throwTransferLifecycleConflict(result.lifecycle);
    }

    return result.data;
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

    if (currentTransfer.status === BookingTherapistTransferStatus.EXPIRED) {
      throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
    }

    const currentBooking = await this.getBooking(
      this.dataSource.manager,

      currentTransfer.bookingId,
    );

    /**

     * Idempotency:

     *

     * Nếu ownership đã được chuyển cho B và booking đã CONFIRMED

     * ở request trước, vẫn cho phép mark COMPLETED kể cả hiện tại

     * scheduledAt đã trôi qua.

     */

    if (this.isTransferEffectivelyCompleted(currentTransfer, currentBooking)) {
      return this.markTransferCompleted(transferId);
    }

    /**

     * Giữ snapshot trước khi remap

     * để có thể rollback nếu BookingService

     * không confirm được.

     */

    const assignmentResult = await this.dataSource.transaction(
      async (manager) => {
        const transfer = await this.lockTransfer(manager, transferId);

        if (transfer.toTherapistId !== therapist.id) {
          throw new ForbiddenException();
        }

        if (transfer.status === BookingTherapistTransferStatus.EXPIRED) {
          throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
        }

        if (
          transfer.status !== BookingTherapistTransferStatus.READY_TO_ACCEPT
        ) {
          throw new ConflictException('Khách chưa xác nhận KTV này');
        }

        const booking = await this.lockBooking(manager, transfer.bookingId);

        const lifecycle = await this.reconcileActiveTransfer(
          manager,

          transfer,

          booking,
        );

        if (lifecycle !== 'active') {
          return {
            lifecycle,

            assignment: null,
          };
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
          lifecycle: 'active' as const,

          assignment: {
            bookingId: booking.id,

            originalTherapistId,

            originalLegacyTherapistServiceId,

            originalBookingPlatformFee,

            originalItems,
          },
        };
      },
    );

    if (assignmentResult.lifecycle !== 'active') {
      this.throwTransferLifecycleConflict(assignmentResult.lifecycle);
    }

    const assignment = assignmentResult.assignment;

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
    /**

     * Defense-in-depth:

     *

     * mọi caller mới trong tương lai cũng không thể làm raw

     * availability reason = past_time lọt ra ngoài transfer flow.

     */

    this.ensureBookingTransferWindow(booking);

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

  private isTransferEffectivelyCompleted(
    transfer: BookingTherapistTransfer,

    booking: Booking,
  ): boolean {
    return (
      transfer.status === BookingTherapistTransferStatus.READY_TO_ACCEPT &&
      booking.therapistId === transfer.toTherapistId &&
      booking.acceptedAt !== null
    );
  }

  private isActiveTransferStatus(
    status: BookingTherapistTransferStatus,
  ): boolean {
    return ACTIVE_TRANSFER_STATUSES.includes(status);
  }

  private isBookingStillTransferableFor(
    transfer: BookingTherapistTransfer,

    booking: Booking,
  ): boolean {
    if (booking.status !== BookingStatus.WAITING_THERAPIST_ACCEPT) {
      return false;
    }

    if (booking.therapistId === transfer.fromTherapistId) {
      return true;
    }

    /**

     * Khoảng thời gian ngắn trong final accept:

     * ownership đã remap A -> B nhưng BookingService chưa CONFIRMED xong.

     */

    return (
      transfer.status === BookingTherapistTransferStatus.READY_TO_ACCEPT &&
      booking.therapistId === transfer.toTherapistId &&
      booking.acceptedAt === null
    );
  }

  private isBookingTransferExpired(
    booking: Booking,

    now = new Date(),
  ): boolean {
    const scheduledAt =
      booking.scheduledAt instanceof Date
        ? booking.scheduledAt
        : new Date(booking.scheduledAt);

    return scheduledAt.getTime() <= now.getTime();
  }

  private ensureBookingTransferWindow(booking: Booking) {
    if (this.isBookingTransferExpired(booking)) {
      throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
    }
  }

  private async isTransferGroupContextValid(
    manager: EntityManager,

    transfer: BookingTherapistTransfer,
  ): Promise<boolean> {
    const memberships = await manager

      .getRepository(TherapistGroupMember)

      .find({
        where: [
          {
            groupId: transfer.groupId,

            therapistId: transfer.fromTherapistId,
          },

          {
            groupId: transfer.groupId,

            therapistId: transfer.toTherapistId,
          },
        ],

        relations: {
          group: true,
        },
      });

    const activeTherapistIds = new Set(
      memberships

        .filter((membership) => membership.group.isActive)

        .map((membership) => membership.therapistId),
    );

    return (
      activeTherapistIds.has(transfer.fromTherapistId) &&
      activeTherapistIds.has(transfer.toTherapistId)
    );
  }

  private async reconcileActiveTransfer(
    manager: EntityManager,

    transfer: BookingTherapistTransfer,

    booking: Booking,

    now = new Date(),
  ): Promise<TransferLifecycleState> {
    if (!this.isActiveTransferStatus(transfer.status)) {
      if (transfer.status === BookingTherapistTransferStatus.COMPLETED) {
        return 'completed';
      }

      if (transfer.status === BookingTherapistTransferStatus.EXPIRED) {
        return 'expired';
      }

      return 'cancelled';
    }

    /**

     * Ưu tiên idempotency của final accept trước mọi rule invalidation.

     */

    if (this.isTransferEffectivelyCompleted(transfer, booking)) {
      transfer.status = BookingTherapistTransferStatus.COMPLETED;

      transfer.completedAt = transfer.completedAt ?? now;

      await manager.getRepository(BookingTherapistTransfer).save(transfer);

      return 'completed';
    }

    /**

     * Booking đã được A tự nhận / từ chối / hủy / hoàn thành hoặc ownership

     * đã thay đổi ngoài flow hợp lệ => transfer không còn actionable.

     */

    if (!this.isBookingStillTransferableFor(transfer, booking)) {
      await this.markTransferCancelled(manager, transfer, now);

      return 'cancelled';
    }

    /**

     * Defense-in-depth cho dữ liệu cũ: nếu A/B không còn cùng group hoặc

     * group đã inactive thì request phải biến mất thay vì chờ user bấm mới lỗi.

     */

    if (!(await this.isTransferGroupContextValid(manager, transfer))) {
      await this.markTransferCancelled(manager, transfer, now);

      return 'cancelled';
    }

    if (this.isBookingTransferExpired(booking, now)) {
      await this.markTransferExpired(manager, transfer);

      return 'expired';
    }

    return 'active';
  }

  private async markTransferExpired(
    manager: EntityManager,

    transfer: BookingTherapistTransfer,
  ) {
    if (!this.isActiveTransferStatus(transfer.status)) {
      return transfer;
    }

    transfer.status = BookingTherapistTransferStatus.EXPIRED;

    return manager.getRepository(BookingTherapistTransfer).save(transfer);
  }

  private async markTransferCancelled(
    manager: EntityManager,

    transfer: BookingTherapistTransfer,

    now = new Date(),
  ) {
    if (!this.isActiveTransferStatus(transfer.status)) {
      return transfer;
    }

    transfer.status = BookingTherapistTransferStatus.CANCELLED;

    transfer.cancelledAt = transfer.cancelledAt ?? now;

    return manager.getRepository(BookingTherapistTransfer).save(transfer);
  }

  private throwTransferLifecycleConflict(
    lifecycle: TransferLifecycleState,
  ): never {
    if (lifecycle === 'expired') {
      throw new ConflictException(TRANSFER_EXPIRED_MESSAGE);
    }

    if (lifecycle === 'completed') {
      throw new ConflictException(TRANSFER_COMPLETED_MESSAGE);
    }

    throw new ConflictException(TRANSFER_CANCELLED_MESSAGE);
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
    const repository = manager.getRepository(BookingTherapistTransfer);

    const transfer = await repository.findOne({
      where: {
        bookingId,

        status: In(ACTIVE_TRANSFER_STATUSES),
      },

      relations: {
        booking: true,
      },

      order: {
        createdAt: 'DESC',
      },
    });

    if (!transfer) {
      return null;
    }

    const lifecycle = await this.reconcileActiveTransfer(
      manager,

      transfer,

      transfer.booking,
    );

    return lifecycle === 'active' ? transfer : null;
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
          booking: {
            items: true,
          },

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
    const booking = transfer.booking ?? null;

    const bookingItems = booking
      ? booking.items?.length
        ? [...booking.items]

            .sort((left, right) => left.sortOrder - right.sortOrder)

            .map((item) => ({
              id: item.id,

              serviceName: item.serviceName,

              optionLabel: item.optionLabel ?? null,

              durationMinutes: Number(item.durationMinutes ?? 0),

              price: Number(item.price ?? 0),

              sortOrder: Number(item.sortOrder ?? 0),
            }))
        : [
            {
              id: 0,

              serviceName: booking.serviceName,

              optionLabel: null,

              durationMinutes: Number(booking.durationMinutes ?? 0),

              price: Number(booking.servicePrice ?? 0),

              sortOrder: 0,
            },
          ]
      : [];

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

      booking: booking
        ? {
            id: booking.id,

            bookingCode: booking.bookingCode,

            scheduledAt: booking.scheduledAt,

            expectedEndAt: booking.expectedEndAt,

            address: booking.address,

            durationMinutes: Number(booking.durationMinutes ?? 0),

            serviceName: booking.serviceName,

            items: bookingItems,
          }
        : null,

      status: transfer.status,

      reason: transfer.reason,

      therapistRespondedAt: transfer.therapistRespondedAt,

      clientRespondedAt: transfer.clientRespondedAt,

      completedAt: transfer.completedAt,

      cancelledAt: transfer.cancelledAt,

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

  /**

   * Candidate API chỉ public machine key trong field `reason`.

   *

   * - Nếu TherapistAvailabilityService đã trả enum reason thì giữ nguyên key.

   * - Các lỗi nghiệp vụ nội bộ/hard-code cũ được map về key ổn định.

   * - Lỗi không xác định tuyệt đối không được leak raw error.message ra client.

   */

  private getCandidateUnavailableReason(error: unknown): string {
    if (!(error instanceof Error)) {
      return CANDIDATE_UNAVAILABLE_REASON.UNAVAILABLE;
    }

    const message = error.message?.trim();

    if (!message) {
      return CANDIDATE_UNAVAILABLE_REASON.UNAVAILABLE;
    }

    if (CANDIDATE_UNAVAILABLE_REASON_KEYS.has(message)) {
      return message;
    }

    return (
      CANDIDATE_REASON_BY_ERROR_MESSAGE[message] ??
      CANDIDATE_UNAVAILABLE_REASON.UNAVAILABLE
    );
  }
}
