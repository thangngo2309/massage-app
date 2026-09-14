import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { TherapistService } from '../entities/therapist-service.entity.js';
import { TherapistWorkingHour } from '../entities/therapist-working-hour.entity.js';
import { TherapistScheduleException } from '../entities/therapist-schedule-exception.entity.js';
import { ServiceOption } from '../entities/service-option.entity.js';

import {
  TherapistUnavailableReason,
  type TherapistAvailabilityCheckResult,
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
import { Booking } from '../entities/booking.entity.js';
import { BOOKING_BLOCKING_STATUSES } from '../booking/booking.constants.js';

interface AvailabilityContext {
  therapist: TherapistProfile;
  therapistService: TherapistService | null;
  serviceOption: ServiceOption | null;
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

    @InjectRepository(ServiceOption)
    private readonly serviceOptionRepository: Repository<ServiceOption>,

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
  ) {}

  /**
   * ================================================================
   * CHECK ONE SPECIFIC TIME
   * ================================================================
   */
  async checkAvailability(
    therapistId: number,
    dto: CheckTherapistAvailabilityQueryDto,
    options?: {
      manager?: EntityManager;
      excludeBookingId?: number;
    },
  ): Promise<TherapistAvailabilityCheckResult> {
    this.validateDate(dto.date);

    const context = await this.loadContext(
      therapistId,
      dto.serviceId,
      dto.serviceOptionId,
      dto.date,
      options,
    );

    const durationMinutes = context.serviceOption?.durationMinutes ?? 0;
    const startMinutes = this.timeToMinutes(dto.startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = this.minutesToTime(endMinutes);

    if (context.baseReason) {
      return {
        therapistId,
        serviceId: dto.serviceId,
        serviceOptionId: dto.serviceOptionId,
        date: dto.date,
        startTime: dto.startTime,
        endTime,
        durationMinutes,
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
      serviceId: dto.serviceId,
      serviceOptionId: dto.serviceOptionId,
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      durationMinutes,
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

    const context = await this.loadContext(
      therapistId,
      dto.serviceId,
      dto.serviceOptionId,
      dto.date,
    );

    const durationMinutes = context.serviceOption?.durationMinutes ?? 0;

    if (context.baseReason) {
      return {
        therapistId,

        serviceId: dto.serviceId,
        serviceOptionId: dto.serviceOptionId,

        date: dto.date,

        durationMinutes,
        slotInterval,

        available: false,
        reason: context.baseReason,

        slots: [],
      };
    }

    const slots: TherapistAvailabilitySlot[] = [];

    for (const workingHour of context.workingHours) {
      const workingStart = this.timeToMinutes(workingHour.startTime);

      const workingEnd = this.timeToMinutes(workingHour.endTime);

      for (
        let slotStart = workingStart;
        slotStart + durationMinutes <= workingEnd;
        slotStart += slotInterval
      ) {
        const slotEnd = slotStart + durationMinutes;

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

    slots.sort(
      (a, b) =>
        this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
    );

    return {
      therapistId,

      serviceId: dto.serviceId,
      serviceOptionId: dto.serviceOptionId,

      date: dto.date,

      durationMinutes,
      slotInterval,

      available: true,
      reason: null,

      slots,
    };
  }

  /**
   * ================================================================
   * LOAD ALL DATA REQUIRED TO CALCULATE AVAILABILITY
   * ================================================================
   */
  private async loadContext(
    therapistId: number,
    serviceId: number,
    serviceOptionId: number,
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

    const serviceOptionRepository = options?.manager
      ? options.manager.getRepository(ServiceOption)
      : this.serviceOptionRepository;

    const bookingRepository = options?.manager
      ? options.manager.getRepository(Booking)
      : this.bookingRepository;

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
      serviceOption: ServiceOption | null = null,
    ): AvailabilityContext => ({
      therapist,

      therapistService: null,

      serviceOption,

      workingHours: [],

      exceptions: [],

      bookings: [],

      baseReason: reason,
    });

    if (!therapist.user || therapist.user.status !== UserStatus.ACTIVE) {
      return emptyContext(TherapistUnavailableReason.THERAPIST_INACTIVE);
    }

    if (therapist.verificationStatus !== TherapistVerificationStatus.VERIFIED) {
      return emptyContext(TherapistUnavailableReason.NOT_VERIFIED);
    }

    if (!therapist.isAcceptingBookings) {
      return emptyContext(TherapistUnavailableReason.NOT_ACCEPTING_BOOKINGS);
    }

    const serviceOption = await serviceOptionRepository.findOne({
      where: {
        id: serviceOptionId,

        serviceId,

        isActive: true,
      },
    });

    if (!serviceOption) {
      return emptyContext(
        TherapistUnavailableReason.SERVICE_OPTION_UNAVAILABLE,
      );
    }

    const therapistService = await therapistServiceRepository.findOne({
      where: {
        therapistId,
        serviceOptionId,
        isActive: true,
      },
    });

    if (!therapistService) {
      return emptyContext(
        TherapistUnavailableReason.SERVICE_NOT_SUPPORTED,
        serviceOption,
      );
    }

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
     * ================================================================
     * LOAD BOOKING CONFLICTS OF THE DAY
     * ================================================================
     */
    const dayStart = new Date(`${date}T00:00:00+07:00`);

    const dayEnd = new Date(`${date}T00:00:00+07:00`);

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
      therapistService,
      serviceOption,
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
     * INVALID / CROSS MIDNIGHT
     */
    if (endMinutes <= startMinutes || endMinutes > 24 * 60) {
      return TherapistUnavailableReason.OUTSIDE_WORKING_HOURS;
    }

    /**
     * PAST
     */
    if (this.isPastInterval(date, startMinutes)) {
      return TherapistUnavailableReason.PAST_TIME;
    }

    /**
     * WORKING HOURS
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
     * SCHEDULE EXCEPTION
     */
    const blockedByException = context.exceptions.some((exception) => {
      /**
       * Full day off
       */
      if (exception.isDayOff) {
        return true;
      }

      /**
       * Defensive:
       * nếu exception không phải day off
       * nhưng không có time range thì block ngày đó.
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
     * ================================================================
     * BOOKING CONFLICT
     * ================================================================
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
   * TIME HELPERS
   * ================================================================
   */
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
   * date chỉ cần lấy thứ trong tuần.
   *
   * Dùng 12:00 UTC để tránh chuyện
   * midnight bị lệch ngày khi parse timezone.
   */
  private getDayOfWeek(date: string): number {
    const parsed = new Date(`${date}T12:00:00Z`);

    return parsed.getUTCDay();
  }

  /**
   * Business timezone hiện tại:
   * Asia/Ho_Chi_Minh = UTC+07:00
   *
   * Việt Nam không có DST nên cách này
   * ổn định cho business rule hiện tại.
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
