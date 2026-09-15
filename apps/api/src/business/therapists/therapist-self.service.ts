import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, Repository } from 'typeorm';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { TherapistService } from '../entities/therapist-service.entity.js';
import { TherapistWorkingHour } from '../entities/therapist-working-hour.entity.js';
import { TherapistScheduleException } from '../entities/therapist-schedule-exception.entity.js';
import { User } from '../entities/user.entity.js';

import { TherapistVerificationStatus } from '../enums/business.enums.js';

import { UpdateTherapistSelfProfileDto } from './dto/update-therapist-self-profile.dto.js';
import { UpdateTherapistAcceptingDto } from './dto/update-therapist-accepting.dto.js';
import { UpdateTherapistSelfServiceDto } from './dto/update-therapist-self-service.dto.js';
import { CreateTherapistScheduleExceptionDto } from './dto/create-therapist-schedule-exception.dto.js';
import { ReplaceTherapistWorkingHoursDto } from './dto/therapist-working-hour-item.dto.js';

@Injectable()
export class TherapistSelfService {
  constructor(
    @InjectRepository(TherapistProfile)
    private readonly therapistProfileRepository: Repository<TherapistProfile>,

    @InjectRepository(TherapistService)
    private readonly therapistServiceRepository: Repository<TherapistService>,

    @InjectRepository(TherapistWorkingHour)
    private readonly therapistWorkingHourRepository: Repository<TherapistWorkingHour>,

    @InjectRepository(TherapistScheduleException)
    private readonly therapistScheduleExceptionRepository: Repository<TherapistScheduleException>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  /**
   * =========================================
   * HELPERS
   * =========================================
   */

  private async getTherapistProfileByUserId(
    userId: number,
  ): Promise<TherapistProfile> {
    const therapist = await this.therapistProfileRepository.findOne({
      where: {
        userId,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    return therapist;
  }

  private normalizeTime(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    /**
     * PostgreSQL TIME thường trả:
     *
     * 08:00:00
     *
     * FE input[type=time] hiện chỉ cần:
     *
     * 08:00
     */

    return value.slice(0, 5);
  }

  /**
   * Convert HH:mm -> phút trong ngày.
   *
   * Dùng để:
   *
   * - validate start < end
   * - kiểm tra overlap
   */
  private timeToMinutes(value: string): number {
    const [hour, minute] = value.slice(0, 5).split(':').map(Number);

    return hour * 60 + minute;
  }

  /**
   * =========================================
   * PROFILE RESPONSE
   * =========================================
   */

  private mapProfile(therapist: TherapistProfile, user: User) {
    return {
      id: therapist.id,

      userId: therapist.userId,

      fullName: user.fullName,

      phone: user.phone,

      email: user.email ?? null,

      bio: therapist.bio,

      gender: therapist.gender,

      dateOfBirth: therapist.dateOfBirth,

      experienceYears: therapist.experienceYears,

      verificationStatus: therapist.verificationStatus,

      onlineStatus: therapist.onlineStatus,

      isAcceptingBookings: therapist.isAcceptingBookings,

      serviceRadiusKm: Number(therapist.serviceRadiusKm),

      ratingAverage: Number(therapist.ratingAverage),

      ratingCount: therapist.ratingCount,

      completedBookings: therapist.completedBookings,

      createdAt: therapist.createdAt,

      updatedAt: therapist.updatedAt,
    };
  }

  /**
   * =========================================
   * GET PROFILE
   * GET /therapist/me
   * =========================================
   */

  async getProfile(userId: number) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapProfile(therapist, user);
  }

  /**
   * =========================================
   * UPDATE PROFILE
   * PATCH /therapist/me
   * =========================================
   *
   * fullName thuộc User.
   *
   * bio / experienceYears thuộc
   * TherapistProfile.
   *
   * Vì update 2 bảng nên chạy transaction.
   */

  async updateProfile(userId: number, dto: UpdateTherapistSelfProfileDto) {
    return this.dataSource.transaction(async (manager) => {
      const therapistRepository = manager.getRepository(TherapistProfile);

      const userRepository = manager.getRepository(User);

      const therapist = await therapistRepository.findOne({
        where: {
          userId,
        },
      });

      if (!therapist) {
        throw new NotFoundException('Therapist profile not found');
      }

      const user = await userRepository.findOne({
        where: {
          id: userId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      /**
       * USER
       */

      user.fullName = dto.fullName.trim();

      await userRepository.save(user);

      /**
       * THERAPIST PROFILE
       */

      if (dto.bio !== undefined) {
        therapist.bio = dto.bio.trim() || null;
      }

      if (dto.experienceYears !== undefined) {
        therapist.experienceYears = dto.experienceYears;
      }

      await therapistRepository.save(therapist);

      return this.mapProfile(therapist, user);
    });
  }

  /**
   * =========================================
   * ACCEPTING BOOKINGS
   * PATCH /therapist/me/accepting-bookings
   * =========================================
   */

  async updateAcceptingBookings(
    userId: number,
    dto: UpdateTherapistAcceptingDto,
  ) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    /**
     * Chỉ VERIFIED mới được bật nhận booking.
     *
     * Tắt nhận booking thì luôn cho phép.
     */

    if (
      dto.isAcceptingBookings &&
      therapist.verificationStatus !== TherapistVerificationStatus.VERIFIED
    ) {
      throw new BadRequestException(
        'Only verified therapists can accept bookings',
      );
    }

    therapist.isAcceptingBookings = dto.isAcceptingBookings;

    await this.therapistProfileRepository.save(therapist);

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapProfile(therapist, user);
  }

  /**
   * =========================================
   * THERAPIST SERVICES
   * =========================================
   */

  private mapTherapistService(item: TherapistService) {
    return {
      id: item.id,

      therapistId: item.therapistId,

      serviceOptionId: item.serviceOptionId,

      serviceName: item.serviceOption?.service?.name ?? '',

      optionLabel: item.serviceOption?.label ?? '',

      durationMinutes: item.serviceOption?.durationMinutes ?? 0,

      defaultPrice: item.serviceOption?.defaultPrice ?? 0,

      price: item.price,

      platformFeeRate: Number(item.platformFeeRate),

      isActive: item.isActive,
    };
  }

  /**
   * GET /therapist/me/services
   */

  async getServices(userId: number) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    const items = await this.therapistServiceRepository
      .createQueryBuilder('therapistService')
      .leftJoinAndSelect('therapistService.serviceOption', 'serviceOption')
      .leftJoinAndSelect('serviceOption.service', 'service')
      .where('therapistService.therapistId = :therapistId', {
        therapistId: therapist.id,
      })
      .orderBy('service.sortOrder', 'ASC')
      .addOrderBy('serviceOption.durationMinutes', 'ASC')
      .addOrderBy('therapistService.id', 'ASC')
      .getMany();

    return items.map((item) => this.mapTherapistService(item));
  }

  /**
   * PATCH /therapist/me/services/:id
   */

  async updateService(
    userId: number,
    therapistServiceId: number,
    dto: UpdateTherapistSelfServiceDto,
  ) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    const item = await this.therapistServiceRepository.findOne({
      where: {
        id: therapistServiceId,

        therapistId: therapist.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Therapist service not found');
    }

    item.price = Math.round(dto.price);

    item.isActive = dto.isActive;

    await this.therapistServiceRepository.save(item);

    /**
     * Load lại relation để trả đúng
     * structure cho FE.
     */

    const updated = await this.therapistServiceRepository
      .createQueryBuilder('therapistService')
      .leftJoinAndSelect('therapistService.serviceOption', 'serviceOption')
      .leftJoinAndSelect('serviceOption.service', 'service')
      .where('therapistService.id = :id', {
        id: therapistServiceId,
      })
      .andWhere('therapistService.therapistId = :therapistId', {
        therapistId: therapist.id,
      })
      .getOne();

    if (!updated) {
      throw new NotFoundException('Therapist service not found');
    }

    return this.mapTherapistService(updated);
  }

  /**
   * =========================================
   * WORKING HOURS
   * =========================================
   */

  async getWorkingHours(userId: number) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    const items = await this.therapistWorkingHourRepository.find({
      where: {
        therapistId: therapist.id,
      },

      order: {
        dayOfWeek: 'ASC',

        startTime: 'ASC',
      },
    });

    return items.map((item) => ({
      id: item.id,

      dayOfWeek: item.dayOfWeek,

      startTime: this.normalizeTime(item.startTime),

      endTime: this.normalizeTime(item.endTime),

      isActive: item.isActive,
    }));
  }

  /**
   * Validate toàn bộ working hours trước
   * khi ghi DB.
   *
   * Có thể có nhiều ca trong một ngày,
   * nhưng không được overlap.
   *
   * Ví dụ hợp lệ:
   *
   * 08:00 - 12:00
   * 13:00 - 17:00
   *
   * Không hợp lệ:
   *
   * 08:00 - 12:00
   * 11:00 - 17:00
   */

  private validateWorkingHours(
    items: ReplaceTherapistWorkingHoursDto['items'],
  ) {
    const grouped = new Map<number, ReplaceTherapistWorkingHoursDto['items']>();

    for (const item of items) {
      const startMinutes = this.timeToMinutes(item.startTime);

      const endMinutes = this.timeToMinutes(item.endTime);

      if (endMinutes <= startMinutes) {
        throw new BadRequestException(
          `Invalid working hours for day ${item.dayOfWeek}: endTime must be after startTime`,
        );
      }

      const list = grouped.get(item.dayOfWeek) ?? [];

      list.push(item);

      grouped.set(item.dayOfWeek, list);
    }

    for (const [dayOfWeek, dayItems] of grouped) {
      /**
       * Chỉ active shift mới cần
       * kiểm tra overlap.
       */

      const activeItems = dayItems
        .filter((item) => item.isActive)
        .sort(
          (a, b) =>
            this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime),
        );

      for (let index = 1; index < activeItems.length; index += 1) {
        const previous = activeItems[index - 1];

        const current = activeItems[index];

        const previousEnd = this.timeToMinutes(previous.endTime);

        const currentStart = this.timeToMinutes(current.startTime);

        if (currentStart < previousEnd) {
          throw new BadRequestException(
            `Working hours overlap on day ${dayOfWeek}`,
          );
        }
      }
    }
  }

  /**
   * PUT /therapist/me/working-hours
   *
   * Đây là replace toàn bộ schedule.
   *
   * Transaction:
   *
   * delete cũ
   * -> insert mới
   *
   * Nếu insert lỗi thì rollback,
   * lịch cũ vẫn còn.
   */

  async replaceWorkingHours(
    userId: number,
    dto: ReplaceTherapistWorkingHoursDto,
  ) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    this.validateWorkingHours(dto.items);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(TherapistWorkingHour);

      /**
       * Replace toàn bộ.
       */

      await repository.delete({
        therapistId: therapist.id,
      });

      if (!dto.items.length) {
        return;
      }

      const entities = dto.items.map((item) =>
        repository.create({
          therapistId: therapist.id,

          dayOfWeek: item.dayOfWeek,

          startTime: item.startTime,

          endTime: item.endTime,

          isActive: item.isActive,
        }),
      );

      await repository.save(entities);
    });

    return this.getWorkingHours(userId);
  }

  /**
   * =========================================
   * SCHEDULE EXCEPTIONS
   * =========================================
   */

  async getScheduleExceptions(userId: number) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    const items = await this.therapistScheduleExceptionRepository.find({
      where: {
        therapistId: therapist.id,
      },

      order: {
        date: 'ASC',

        startTime: 'ASC',
      },
    });

    return items.map((item) => ({
      id: item.id,

      date: item.date,

      isDayOff: item.isDayOff,

      startTime: this.normalizeTime(item.startTime),

      endTime: this.normalizeTime(item.endTime),

      note: item.note,

      createdAt: item.createdAt,
    }));
  }

  /**
   * POST /therapist/me/schedule-exceptions
   *
   * Rule:
   *
   * isDayOff = true
   * → nghỉ nguyên ngày
   * → startTime/endTime phải null
   *
   * isDayOff = false
   * → custom time window
   * → startTime/endTime bắt buộc
   */

  async createScheduleException(
    userId: number,
    dto: CreateTherapistScheduleExceptionDto,
  ) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    /**
     * =====================================
     * DAY OFF
     * =====================================
     */

    if (dto.isDayOff) {
      /**
       * Nếu chuyển ngày đó thành nghỉ cả ngày
       * thì xóa các custom exception khác
       * của cùng ngày trước.
       */

      return this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(TherapistScheduleException);

        await repository.delete({
          therapistId: therapist.id,

          date: dto.date,
        });

        const entity = repository.create({
          therapistId: therapist.id,

          date: dto.date,

          isDayOff: true,

          startTime: null,

          endTime: null,

          note: dto.note?.trim() || null,
        });

        const saved = await repository.save(entity);

        return {
          id: saved.id,

          date: saved.date,

          isDayOff: saved.isDayOff,

          startTime: null,

          endTime: null,

          note: saved.note,

          createdAt: saved.createdAt,
        };
      });
    }

    /**
     * =====================================
     * CUSTOM WINDOW
     * =====================================
     */

    if (!dto.startTime || !dto.endTime) {
      throw new BadRequestException(
        'startTime and endTime are required when isDayOff is false',
      );
    }

    const startMinutes = this.timeToMinutes(dto.startTime);

    const endMinutes = this.timeToMinutes(dto.endTime);

    if (endMinutes <= startMinutes) {
      throw new BadRequestException('endTime must be after startTime');
    }

    /**
     * Lấy exception cùng ngày.
     */

    const existing = await this.therapistScheduleExceptionRepository.find({
      where: {
        therapistId: therapist.id,

        date: dto.date,
      },
    });

    /**
     * Nếu đã đánh dấu nghỉ cả ngày thì
     * không được thêm custom window.
     */

    const hasDayOff = existing.some((item) => item.isDayOff);

    if (hasDayOff) {
      throw new BadRequestException('This date is already marked as a day off');
    }

    /**
     * Check overlap với custom windows
     * đã tồn tại.
     */

    for (const item of existing) {
      if (!item.startTime || !item.endTime) {
        continue;
      }

      const existingStart = this.timeToMinutes(item.startTime);

      const existingEnd = this.timeToMinutes(item.endTime);

      const overlaps = startMinutes < existingEnd && endMinutes > existingStart;

      if (overlaps) {
        throw new BadRequestException(
          'Schedule exception overlaps with an existing exception',
        );
      }
    }

    const entity = this.therapistScheduleExceptionRepository.create({
      therapistId: therapist.id,

      date: dto.date,

      isDayOff: false,

      startTime: dto.startTime,

      endTime: dto.endTime,

      note: dto.note?.trim() || null,
    });

    const saved = await this.therapistScheduleExceptionRepository.save(entity);

    return {
      id: saved.id,

      date: saved.date,

      isDayOff: saved.isDayOff,

      startTime: this.normalizeTime(saved.startTime),

      endTime: this.normalizeTime(saved.endTime),

      note: saved.note,

      createdAt: saved.createdAt,
    };
  }

  /**
   * DELETE /therapist/me/schedule-exceptions/:id
   */

  async deleteScheduleException(userId: number, exceptionId: number) {
    const therapist = await this.getTherapistProfileByUserId(userId);

    /**
     * Bắt buộc filter therapistId.
     *
     * Therapist A không được xóa
     * exception của Therapist B.
     */

    const exception = await this.therapistScheduleExceptionRepository.findOne({
      where: {
        id: exceptionId,

        therapistId: therapist.id,
      },
    });

    if (!exception) {
      throw new NotFoundException('Schedule exception not found');
    }

    await this.therapistScheduleExceptionRepository.remove(exception);

    return {
      success: true,
    };
  }
}
