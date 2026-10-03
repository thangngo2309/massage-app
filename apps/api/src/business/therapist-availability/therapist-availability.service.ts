import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { EntityManager, In, Repository } from 'typeorm';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import { TherapistWorkingHour } from '../entities/therapist-working-hour.entity.js';

import { TherapistScheduleException } from '../entities/therapist-schedule-exception.entity.js';

import { Booking } from '../entities/booking.entity.js';

import {
  TherapistUnavailableReason,
  type TherapistAvailabilityCheckResult,
  type TherapistAvailabilitySelectedService,
  type TherapistAvailabilitySlot,
  type TherapistAvailabilitySlotsResult,
} from './types/therapist-availability.types.js';

import type {
  CheckTherapistAvailabilityQueryDto,
  GetTherapistAvailabilitySlotsQueryDto,
} from './dto/therapist-availability.dto.js';

import {
  TherapistVerificationStatus,
  UserStatus,
} from '../enums/business.enums.js';

import { BOOKING_BLOCKING_STATUSES } from '../booking/booking.constants.js';

/**
 * Input cũ.
 *
 * Chỉ giữ tạm để BookingService hiện tại vẫn compile
 * trong lúc chưa chuyển Booking sang multi-service.
 *
 * Public Availability API KHÔNG sử dụng format này nữa.
 */
interface LegacyAvailabilityCheckInput {
  serviceId: number;

  serviceOptionId: number;

  date: string;

  startTime: string;
}

interface AvailabilityContext {
  therapist: TherapistProfile;

  therapistServices: TherapistService[];

  selectedServices: TherapistAvailabilitySelectedService[];

  durationMinutes: number;

  workingHours: TherapistWorkingHour[];

  exceptions: TherapistScheduleException[];

  bookings: Booking[];

  baseReason: TherapistUnavailableReason | null;
}

@Injectable()
export class TherapistAvailabilityService {
  private readonly businessUtcOffset = '+07:00';

  constructor(
    @InjectRepository(TherapistProfile)
    private readonly therapistProfileRepository: Repository<TherapistProfile>,

    @InjectRepository(TherapistService)
    private readonly therapistServiceRepository: Repository<TherapistService>,

    @InjectRepository(TherapistWorkingHour)
    private readonly therapistWorkingHourRepository: Repository<TherapistWorkingHour>,

    @InjectRepository(TherapistScheduleException)
    private readonly therapistScheduleExceptionRepository: Repository<TherapistScheduleException>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * ================================================================
   * CHECK ONE SPECIFIC TIME
   * ================================================================
   *
   * Hỗ trợ:
   *
   * NEW:
   * therapistServiceIds[]
   *
   * LEGACY:
   * serviceId + serviceOptionId
   *
   * Legacy chỉ phục vụ BookingService cũ trong giai đoạn chuyển đổi.
   */
  async checkAvailability(
    therapistId: number,
    dto: CheckTherapistAvailabilityQueryDto | LegacyAvailabilityCheckInput,
    options?: {
      manager?: EntityManager;

      excludeBookingId?: number;
    },
  ): Promise<TherapistAvailabilityCheckResult> {
    this.validateDate(dto.date);

    const therapistServiceIds = await this.resolveTherapistServiceIds(
      therapistId,
      dto,
      options,
    );

    const context = await this.loadContext(
      therapistId,
      therapistServiceIds,
      dto.date,
      options,
    );

    const startMinutes = this.timeToMinutes(dto.startTime);

    const endMinutes = startMinutes + context.durationMinutes;

    const endTime = this.minutesToTime(endMinutes);

    if (context.baseReason) {
      return {
        therapistId,

        therapistServiceIds,

        selectedServices: context.selectedServices,

        date: dto.date,

        startTime: dto.startTime,

        endTime,

        durationMinutes: context.durationMinutes,

        available: false,

        reason: context.baseReason,
      };
    }

    const reason = this.evaluateInterval(
      dto.date,
      startMinutes,
      endMinutes,
      context,
    );

    return {
      therapistId,

      therapistServiceIds,

      selectedServices: context.selectedServices,

      date: dto.date,

      startTime: dto.startTime,

      endTime,

      durationMinutes: context.durationMinutes,

      available: reason === null,

      reason,
    };
  }

  /**
   * ================================================================
   * GET SLOTS OF ONE DAY
   * ================================================================
   */
  async getAvailableSlots(
    therapistId: number,
    dto: GetTherapistAvailabilitySlotsQueryDto,
  ): Promise<TherapistAvailabilitySlotsResult> {
    this.validateDate(dto.date);

    const slotInterval = dto.slotInterval ?? 30;

    const therapistServiceIds = this.normalizeTherapistServiceIds(
      dto.therapistServiceIds,
    );

    const context = await this.loadContext(
      therapistId,
      therapistServiceIds,
      dto.date,
    );

    if (context.baseReason) {
      return {
        therapistId,

        therapistServiceIds,

        selectedServices: context.selectedServices,

        date: dto.date,

        durationMinutes: context.durationMinutes,

        slotInterval,

        available: false,

        reason: context.baseReason,

        slots: [],
      };
    }

    const slots: TherapistAvailabilitySlot[] = [];

    /**
     * Một KTV có thể có nhiều ca trong cùng ngày.
     *
     * Ví dụ:
     *
     * 08:00 - 12:00
     * 13:00 - 18:00
     */
    for (const workingHour of context.workingHours) {
      const workingStart = this.timeToMinutes(workingHour.startTime);

      const workingEnd = this.timeToMinutes(workingHour.endTime);

      for (
        let slotStart = workingStart;
        slotStart + context.durationMinutes <= workingEnd;
        slotStart += slotInterval
      ) {
        const slotEnd = slotStart + context.durationMinutes;

        const reason = this.evaluateInterval(
          dto.date,
          slotStart,
          slotEnd,
          context,
        );

        slots.push({
          startTime: this.minutesToTime(slotStart),

          endTime: this.minutesToTime(slotEnd),

          available: reason === null,

          reason,
        });
      }
    }

    /**
     * Trường hợp working hour bị cấu hình
     * nhiều khoảng có thể sinh ra slot trùng.
     *
     * Dedupe theo startTime + endTime.
     */
    const uniqueSlots = Array.from(
      new Map(
        slots.map((slot) => [`${slot.startTime}-${slot.endTime}`, slot]),
      ).values(),
    );

    uniqueSlots.sort(
      (a, b) =>
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
    );

    return {
      therapistId,

      therapistServiceIds,

      selectedServices: context.selectedServices,

      date: dto.date,

      durationMinutes: context.durationMinutes,

      slotInterval,

      available: true,

      reason: null,

      slots: uniqueSlots,
    };
  }

  /**
   * ================================================================
   * RESOLVE INPUT
   * ================================================================
   *
   * Chuyển request cũ:
   *
   * serviceId + serviceOptionId
   *
   * thành:
   *
   * therapistServiceIds[]
   *
   * để core Availability chỉ còn một cơ chế tính toán.
   */
  private async resolveTherapistServiceIds(
    therapistId: number,
    dto: CheckTherapistAvailabilityQueryDto | LegacyAvailabilityCheckInput,
    options?: {
      manager?: EntityManager;

      excludeBookingId?: number;
    },
  ): Promise<number[]> {
    if ('therapistServiceIds' in dto) {
      return this.normalizeTherapistServiceIds(dto.therapistServiceIds);
    }

    const repository = options?.manager
      ? options.manager.getRepository(TherapistService)
      : this.therapistServiceRepository;

    const therapistService = await repository
      .createQueryBuilder('therapistService')

      .innerJoin('therapistService.serviceOption', 'serviceOption')

      .where('therapistService.therapistId = :therapistId', {
        therapistId,
      })

      .andWhere('therapistService.serviceOptionId = :serviceOptionId', {
        serviceOptionId: dto.serviceOptionId,
      })

      .andWhere('therapistService.isActive = true')

      .andWhere('serviceOption.serviceId = :serviceId', {
        serviceId: dto.serviceId,
      })

      .getOne();

    if (!therapistService) {
      /**
       * Trả một ID chắc chắn không tồn tại.
       *
       * loadContext sẽ chuyển nó thành
       * THERAPIST_SERVICE_UNAVAILABLE.
       *
       * Không throw để giữ behavior Availability:
       * unavailable là business result,
       * không phải lỗi HTTP.
       */
      return [-1];
    }

    return [therapistService.id];
  }

  /**
   * ================================================================
   * LOAD ALL DATA REQUIRED TO CALCULATE AVAILABILITY
   * ================================================================
   */
  private async loadContext(
    therapistId: number,
    therapistServiceIds: number[],
    date: string,
    options?: {
      manager?: EntityManager;

      excludeBookingId?: number;
    },
  ): Promise<AvailabilityContext> {
    const therapistRepository = options?.manager
      ? options.manager.getRepository(TherapistProfile)
      : this.therapistProfileRepository;

    const therapistServiceRepository = options?.manager
      ? options.manager.getRepository(TherapistService)
      : this.therapistServiceRepository;

    const workingHourRepository = options?.manager
      ? options.manager.getRepository(TherapistWorkingHour)
      : this.therapistWorkingHourRepository;

    const exceptionRepository = options?.manager
      ? options.manager.getRepository(TherapistScheduleException)
      : this.therapistScheduleExceptionRepository;

    const bookingRepository = options?.manager
      ? options.manager.getRepository(Booking)
      : this.bookingRepository;

    /**
     * ============================================================
     * THERAPIST
     * ============================================================
     */
    const therapist = await therapistRepository.findOne({
      where: {
        id: therapistId,
      },

      relations: {
        user: true,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Therapist not found');
    }

    const emptyContext = (
      reason: TherapistUnavailableReason,
      selectedServices: TherapistAvailabilitySelectedService[] = [],
      durationMinutes = 0,
    ): AvailabilityContext => ({
      therapist,

      therapistServices: [],

      selectedServices,

      durationMinutes,

      workingHours: [],

      exceptions: [],

      bookings: [],

      baseReason: reason,
    });

    /**
     * ============================================================
     * THERAPIST STATE
     * ============================================================
     */
    if (!therapist.user || therapist.user.status !== UserStatus.ACTIVE) {
      return emptyContext(TherapistUnavailableReason.THERAPIST_INACTIVE);
    }

    if (therapist.verificationStatus !== TherapistVerificationStatus.VERIFIED) {
      return emptyContext(TherapistUnavailableReason.NOT_VERIFIED);
    }

    if (!therapist.isAcceptingBookings) {
      return emptyContext(TherapistUnavailableReason.NOT_ACCEPTING_BOOKINGS);
    }

    /**
     * ============================================================
     * THERAPIST SERVICES
     * ============================================================
     */
    const normalizedIds =
      this.normalizeTherapistServiceIds(therapistServiceIds);

    const therapistServices = await therapistServiceRepository
      .createQueryBuilder('therapistService')

      .innerJoinAndSelect('therapistService.serviceOption', 'serviceOption')

      .innerJoinAndSelect('serviceOption.service', 'service')

      .where('therapistService.id IN (:...therapistServiceIds)', {
        therapistServiceIds: normalizedIds,
      })

      .andWhere('therapistService.therapistId = :therapistId', {
        therapistId,
      })

      .andWhere('therapistService.isActive = true')

      .andWhere('serviceOption.isActive = true')

      .andWhere('service.isActive = true')

      .getMany();

    /**
     * Phải lấy được đầy đủ toàn bộ ID mà client gửi.
     *
     * Nếu client gửi:
     *
     * [10, 20, 30]
     *
     * nhưng chỉ 10 và 20 hợp lệ thì toàn bộ selection
     * được coi là unavailable.
     */
    if (therapistServices.length !== normalizedIds.length) {
      return emptyContext(
        TherapistUnavailableReason.THERAPIST_SERVICE_UNAVAILABLE,
      );
    }

    /**
     * Sắp lại đúng thứ tự client gửi.
     *
     * Điều này giúp response ổn định.
     */
    const orderMap = new Map<number, number>();

    normalizedIds.forEach((id, index) => {
      orderMap.set(id, index);
    });

    therapistServices.sort(
      (a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0),
    );

    const selectedServices: TherapistAvailabilitySelectedService[] =
      therapistServices.map((item) => ({
        therapistServiceId: item.id,

        serviceOptionId: item.serviceOption.id,

        serviceId: item.serviceOption.serviceId,

        durationMinutes: item.serviceOption.durationMinutes,
      }));

    /**
     * Tổng duration của toàn bộ booking.
     */
    const durationMinutes = selectedServices.reduce(
      (total, item) => total + item.durationMinutes,
      0,
    );

    if (durationMinutes <= 0) {
      return emptyContext(
        TherapistUnavailableReason.THERAPIST_SERVICE_UNAVAILABLE,
      );
    }

    /**
     * ============================================================
     * WORKING HOURS + EXCEPTIONS
     * ============================================================
     */
    const dayOfWeek = this.getDayOfWeek(date);

    const [workingHours, exceptions] = await Promise.all([
      workingHourRepository.find({
        where: {
          therapistId,

          dayOfWeek,

          isActive: true,
        },

        order: {
          startTime: 'ASC',
        },
      }),

      exceptionRepository.find({
        where: {
          therapistId,

          date,
        },

        order: {
          startTime: 'ASC',
        },
      }),
    ]);

    /**
     * ============================================================
     * BOOKING CONFLICTS OF THE DAY
     * ============================================================
     */
    const dayStart = new Date(`${date}T00:00:00${this.businessUtcOffset}`);

    const dayEnd = new Date(`${date}T00:00:00${this.businessUtcOffset}`);

    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const bookingQb = bookingRepository
      .createQueryBuilder('booking')

      .where('booking.therapistId = :therapistId', {
        therapistId,
      })

      .andWhere('booking.status IN (:...statuses)', {
        statuses: BOOKING_BLOCKING_STATUSES,
      })

      .andWhere('booking.scheduledAt < :dayEnd', {
        dayEnd,
      })

      .andWhere('booking.expectedEndAt > :dayStart', {
        dayStart,
      });

    if (options?.excludeBookingId) {
      bookingQb.andWhere('booking.id != :excludeBookingId', {
        excludeBookingId: options.excludeBookingId,
      });
    }

    const bookings = await bookingQb.getMany();

    return {
      therapist,

      therapistServices,

      selectedServices,

      durationMinutes,

      workingHours,

      exceptions,

      bookings,

      baseReason: null,
    };
  }

  /**
   * ================================================================
   * CORE AVAILABILITY RULES
   * ================================================================
   */
  private evaluateInterval(
    date: string,
    startMinutes: number,
    endMinutes: number,
    context: AvailabilityContext,
  ): TherapistUnavailableReason | null {
    /**
     * Không hỗ trợ booking chạy qua ngày hôm sau.
     */
    if (endMinutes <= startMinutes || endMinutes > 24 * 60) {
      return TherapistUnavailableReason.OUTSIDE_WORKING_HOURS;
    }

    /**
     * Không cho đặt thời gian đã qua.
     */
    if (this.isPastInterval(date, startMinutes)) {
      return TherapistUnavailableReason.PAST_TIME;
    }

    /**
     * ============================================================
     * WORKING HOURS
     * ============================================================
     *
     * Toàn bộ booking phải nằm trong cùng một ca.
     *
     * Ví dụ:
     *
     * ca 08:00 - 12:00
     * ca 13:00 - 18:00
     *
     * Booking 11:30 - 13:30 KHÔNG hợp lệ.
     */
    const insideWorkingHours = context.workingHours.some((workingHour) => {
      const workingStart = this.timeToMinutes(workingHour.startTime);

      const workingEnd = this.timeToMinutes(workingHour.endTime);

      return startMinutes >= workingStart && endMinutes <= workingEnd;
    });

    if (!insideWorkingHours) {
      return TherapistUnavailableReason.OUTSIDE_WORKING_HOURS;
    }

    /**
     * ============================================================
     * SCHEDULE EXCEPTION
     * ============================================================
     */
    const blockedByException = context.exceptions.some((exception) => {
      if (exception.isDayOff) {
        return true;
      }

      /**
       * Defensive:
       *
       * exception không phải day off
       * nhưng thiếu time range => block.
       */
      if (!exception.startTime || !exception.endTime) {
        return true;
      }

      const exceptionStart = this.timeToMinutes(exception.startTime);

      const exceptionEnd = this.timeToMinutes(exception.endTime);

      return this.isOverlapping(
        startMinutes,
        endMinutes,
        exceptionStart,
        exceptionEnd,
      );
    });

    if (blockedByException) {
      return TherapistUnavailableReason.SCHEDULE_EXCEPTION;
    }

    /**
     * ============================================================
     * BOOKING CONFLICT
     * ============================================================
     */
    const requestedStart = this.buildDateTime(date, startMinutes);

    const requestedEnd = this.buildDateTime(date, endMinutes);

    const bookingConflict = context.bookings.some(
      (booking) =>
        booking.scheduledAt < requestedEnd &&
        booking.expectedEndAt > requestedStart,
    );

    if (bookingConflict) {
      return TherapistUnavailableReason.BOOKING_CONFLICT;
    }

    return null;
  }

  /**
   * ================================================================
   * HELPERS
   * ================================================================
   */
  private normalizeTherapistServiceIds(values: number[]): number[] {
    if (!Array.isArray(values) || !values.length) {
      throw new BadRequestException('therapistServiceIds is required');
    }

    const normalized = Array.from(new Set(values.map(Number)));

    if (normalized.some((value) => !Number.isInteger(value) || value < 1)) {
      throw new BadRequestException(
        'therapistServiceIds contains invalid value',
      );
    }

    return normalized;
  }

  private timeToMinutes(value: string): number {
    const normalized = value.substring(0, 5);

    const [hour, minute] = normalized.split(':').map(Number);

    if (Number.isNaN(hour) || Number.isNaN(minute)) {
      throw new BadRequestException(`Invalid time: ${value}`);
    }

    return hour * 60 + minute;
  }

  private minutesToTime(totalMinutes: number): string {
    const hour = Math.floor(totalMinutes / 60);

    const minute = totalMinutes % 60;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(
      2,
      '0',
    )}`;
  }

  private isOverlapping(
    startA: number,
    endA: number,
    startB: number,
    endB: number,
  ): boolean {
    return startA < endB && endA > startB;
  }

  /**
   * date chỉ dùng để lấy thứ trong tuần.
   *
   * Sử dụng 12:00 UTC để tránh lệch ngày
   * do timezone tại midnight.
   */
  private getDayOfWeek(date: string): number {
    const parsed = new Date(`${date}T12:00:00Z`);

    return parsed.getUTCDay();
  }

  /**
   * Business timezone:
   *
   * Asia/Ho_Chi_Minh = UTC+07:00.
   *
   * Việt Nam hiện không có DST nên offset cố định
   * phù hợp với business rule hiện tại.
   */
  private buildDateTime(date: string, totalMinutes: number): Date {
    const time = this.minutesToTime(totalMinutes);

    return new Date(`${date}T${time}:00${this.businessUtcOffset}`);
  }

  private isPastInterval(date: string, startMinutes: number): boolean {
    const requestedStart = this.buildDateTime(date, startMinutes);

    return requestedStart.getTime() < Date.now();
  }

  private validateDate(date: string): void {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

    if (!match) {
      throw new BadRequestException('Invalid date');
    }

    const year = Number(match[1]);

    const month = Number(match[2]);

    const day = Number(match[3]);

    const parsed = new Date(Date.UTC(year, month - 1, day));

    if (
      parsed.getUTCFullYear() !== year ||
      parsed.getUTCMonth() !== month - 1 ||
      parsed.getUTCDate() !== day
    ) {
      throw new BadRequestException('Invalid date');
    }
  }
}
