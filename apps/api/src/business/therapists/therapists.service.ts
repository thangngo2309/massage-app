import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Not, Repository } from 'typeorm';

import { User } from '../entities/user.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import { TherapistWorkingHour } from '../entities/therapist-working-hour.entity.js';

import { TherapistScheduleException } from '../entities/therapist-schedule-exception.entity.js';

import { TherapistServiceArea } from '../entities/therapist-service-area.entity.js';

import { ServiceOption } from '../entities/service-option.entity.js';

import {
  Gender,
  TherapistOnlineStatus,
  TherapistServiceAreaType,
  TherapistVerificationStatus,
  UserRole,
  UserStatus,
} from '../enums/business.enums.js';

import { AdminTherapistQueryDto } from './dto/admin-therapist-query.dto.js';

import { UpdateTherapistProfileDto } from './dto/update-therapist-profile.dto.js';

import { UpdateTherapistVerificationDto } from './dto/update-therapist-verification.dto.js';

import { CreateTherapistServiceDto } from './dto/create-therapist-service.dto.js';

import { UpdateTherapistServiceDto } from './dto/update-therapist-service.dto.js';

import { CreateWorkingHourDto } from './dto/create-working-hour.dto.js';

import { UpdateWorkingHourDto } from './dto/update-working-hour.dto.js';

import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto.js';

import { UpdateScheduleExceptionDto } from './dto/update-schedule-exception.dto.js';

import { CreateServiceAreaDto } from './dto/create-service-area.dto.js';

import { UpdateServiceAreaDto } from './dto/update-service-area.dto.js';

@Injectable()
export class TherapistsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(TherapistProfile)
    private readonly profileRepository: Repository<TherapistProfile>,

    @InjectRepository(TherapistService)
    private readonly therapistServiceRepository: Repository<TherapistService>,

    @InjectRepository(TherapistWorkingHour)
    private readonly workingHourRepository: Repository<TherapistWorkingHour>,

    @InjectRepository(TherapistScheduleException)
    private readonly exceptionRepository: Repository<TherapistScheduleException>,

    @InjectRepository(TherapistServiceArea)
    private readonly areaRepository: Repository<TherapistServiceArea>,

    @InjectRepository(ServiceOption)
    private readonly optionRepository: Repository<ServiceOption>,
  ) {}

  async findAll(query: AdminTherapistQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.therapistProfile', 'profile')
      .where('user.role = :role', {
        role: UserRole.THERAPIST,
      });

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;

      qb.andWhere(
        `(
            LOWER(user.fullName) LIKE :q
            OR LOWER(user.phone) LIKE :q
            OR LOWER(COALESCE(user.email, '')) LIKE :q
          )`,
        {
          q,
        },
      );
    }

    if (query.verificationStatus !== undefined) {
      qb.andWhere('profile.verificationStatus = :verificationStatus', {
        verificationStatus: query.verificationStatus,
      });
    }

    if (query.onlineStatus !== undefined) {
      qb.andWhere('profile.onlineStatus = :onlineStatus', {
        onlineStatus: query.onlineStatus,
      });
    }

    if (query.isAcceptingBookings !== undefined) {
      qb.andWhere('profile.isAcceptingBookings = :isAcceptingBookings', {
        isAcceptingBookings: query.isAcceptingBookings,
      });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      items: users.map((user) => this.toListResponse(user)),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: number) {
    const profile = await this.ensureProfile(userId);

    const [services, workingHours, scheduleExceptions, serviceAreas] =
      await Promise.all([
        this.therapistServiceRepository
          .createQueryBuilder('item')
          .leftJoinAndSelect('item.serviceOption', 'option')
          .leftJoinAndSelect('option.service', 'service')
          .where('item.therapistId = :therapistId', {
            therapistId: profile.id,
          })
          .orderBy('service.sortOrder', 'ASC')
          .addOrderBy('option.durationMinutes', 'ASC')
          .getMany(),

        this.workingHourRepository.find({
          where: {
            therapistId: profile.id,
          },
          order: {
            dayOfWeek: 'ASC',
            startTime: 'ASC',
          },
        }),

        this.exceptionRepository.find({
          where: {
            therapistId: profile.id,
          },
          order: {
            date: 'ASC',
            startTime: 'ASC',
          },
        }),

        this.areaRepository.find({
          where: {
            therapistId: profile.id,
          },
          order: {
            id: 'ASC',
          },
        }),
      ]);

    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Kỹ thuật viên không tồn tại');
    }

    return {
      ...this.toProfileResponse(profile),
      user: this.toUserResponse(user),
      services: services.map((item) => ({
        id: item.id,
        serviceOptionId: item.serviceOptionId,
        price: item.price,
        platformFeeRate: Number(item.platformFeeRate),
        isActive: item.isActive,
        option: {
          id: item.serviceOption.id,
          label: item.serviceOption.label,
          durationMinutes: item.serviceOption.durationMinutes,
          defaultPrice: item.serviceOption.defaultPrice,
          service: {
            id: item.serviceOption.service.id,
            name: item.serviceOption.service.name,
            slug: item.serviceOption.service.slug,
          },
        },
      })),
      workingHours,
      scheduleExceptions,
      serviceAreas,
    };
  }

  async updateProfile(userId: number, dto: UpdateTherapistProfileDto) {
    const profile = await this.ensureProfile(userId);

    if (dto.bio !== undefined) {
      profile.bio = this.nullableText(dto.bio);
    }

    if (dto.gender !== undefined) {
      profile.gender = dto.gender;
    }

    if (dto.dateOfBirth !== undefined) {
      profile.dateOfBirth = dto.dateOfBirth || null;
    }

    if (dto.experienceYears !== undefined) {
      profile.experienceYears = dto.experienceYears;
    }

    if (dto.isAcceptingBookings !== undefined) {
      if (
        dto.isAcceptingBookings &&
        profile.verificationStatus !== TherapistVerificationStatus.VERIFIED
      ) {
        throw new BadRequestException(
          'Kỹ thuật viên phải được xác minh trước khi nhận booking',
        );
      }

      profile.isAcceptingBookings = dto.isAcceptingBookings;
    }

    if (dto.serviceRadiusKm !== undefined) {
      profile.serviceRadiusKm = dto.serviceRadiusKm;
    }

    const saved = await this.profileRepository.save(profile);

    return this.toProfileResponse(saved);
  }

  async updateVerification(
    userId: number,
    dto: UpdateTherapistVerificationDto,
  ) {
    const profile = await this.ensureProfile(userId);

    profile.verificationStatus = dto.verificationStatus;

    /**
     * Nếu bị reject thì không cho nhận booking.
     */
    if (dto.verificationStatus !== TherapistVerificationStatus.VERIFIED) {
      profile.isAcceptingBookings = false;
    }

    const saved = await this.profileRepository.save(profile);

    return this.toProfileResponse(saved);
  }

  async getServiceOptionsLookup() {
    const options = await this.optionRepository
      .createQueryBuilder('option')
      .leftJoinAndSelect('option.service', 'service')
      .orderBy('service.sortOrder', 'ASC')
      .addOrderBy('service.name', 'ASC')
      .addOrderBy('option.durationMinutes', 'ASC')
      .getMany();

    return options.map((option) => ({
      id: option.id,
      serviceId: option.service.id,
      serviceName: option.service.name,
      label: option.label,
      durationMinutes: option.durationMinutes,
      defaultPrice: option.defaultPrice,
      isActive: option.isActive,
      serviceIsActive: option.service.isActive,
    }));
  }

  async createService(userId: number, dto: CreateTherapistServiceDto) {
    const profile = await this.ensureProfile(userId);

    const option = await this.optionRepository.findOne({
      where: {
        id: dto.serviceOptionId,
      },
    });

    if (!option) {
      throw new NotFoundException('Gói dịch vụ không tồn tại');
    }

    const exists = await this.therapistServiceRepository.findOne({
      where: {
        therapistId: profile.id,
        serviceOptionId: dto.serviceOptionId,
      },
    });

    if (exists) {
      throw new ConflictException('Kỹ thuật viên đã có gói dịch vụ này');
    }

    const entity = this.therapistServiceRepository.create({
      therapistId: profile.id,
      serviceOptionId: dto.serviceOptionId,
      price: dto.price,
      platformFeeRate: dto.platformFeeRate ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.therapistServiceRepository.save(entity);
  }

  async updateService(
    userId: number,
    itemId: number,
    dto: UpdateTherapistServiceDto,
  ) {
    const profile = await this.ensureProfile(userId);

    const item = await this.therapistServiceRepository.findOne({
      where: {
        id: itemId,

        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Dịch vụ của kỹ thuật viên không tồn tại');
    }

    if (dto.price !== undefined) {
      item.price = dto.price;
    }

    if (dto.platformFeeRate !== undefined) {
      item.platformFeeRate = dto.platformFeeRate;
    }

    if (dto.isActive !== undefined) {
      item.isActive = dto.isActive;
    }

    return this.therapistServiceRepository.save(item);
  }

  async createWorkingHour(userId: number, dto: CreateWorkingHourDto) {
    const profile = await this.ensureProfile(userId);

    this.ensureTimeRange(dto.startTime, dto.endTime);

    await this.ensureNoWorkingHourOverlap(
      profile.id,
      dto.dayOfWeek,
      dto.startTime,
      dto.endTime,
    );

    const entity = this.workingHourRepository.create({
      therapistId: profile.id,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive ?? true,
    });

    return this.workingHourRepository.save(entity);
  }

  async updateWorkingHour(
    userId: number,
    itemId: number,
    dto: UpdateWorkingHourDto,
  ) {
    const profile = await this.ensureProfile(userId);

    const item = await this.workingHourRepository.findOne({
      where: {
        id: itemId,
        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Khung giờ làm việc không tồn tại');
    }

    const dayOfWeek = dto.dayOfWeek ?? item.dayOfWeek;
    const startTime = dto.startTime ?? item.startTime;
    const endTime = dto.endTime ?? item.endTime;
    const isActive = dto.isActive ?? item.isActive;

    this.ensureTimeRange(startTime, endTime);

    if (isActive) {
      await this.ensureNoWorkingHourOverlap(
        profile.id,
        dayOfWeek,
        startTime,
        endTime,
        item.id,
      );
    }

    item.dayOfWeek = dayOfWeek;
    item.startTime = startTime;
    item.endTime = endTime;
    item.isActive = isActive;

    return this.workingHourRepository.save(item);
  }

  async createScheduleException(
    userId: number,
    dto: CreateScheduleExceptionDto,
  ) {
    const profile = await this.ensureProfile(userId);

    this.validateException(dto.isDayOff, dto.startTime, dto.endTime);

    const entity = this.exceptionRepository.create({
      therapistId: profile.id,
      date: dto.date,
      isDayOff: dto.isDayOff,
      startTime: dto.isDayOff ? null : (dto.startTime ?? null),
      endTime: dto.isDayOff ? null : (dto.endTime ?? null),
      note: this.nullableText(dto.note),
    });

    return this.exceptionRepository.save(entity);
  }

  async updateScheduleException(
    userId: number,
    itemId: number,
    dto: UpdateScheduleExceptionDto,
  ) {
    const profile = await this.ensureProfile(userId);

    const item = await this.exceptionRepository.findOne({
      where: {
        id: itemId,

        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Ngày ngoại lệ không tồn tại');
    }

    const isDayOff = dto.isDayOff ?? item.isDayOff;

    const startTime = isDayOff
      ? null
      : dto.startTime !== undefined
        ? dto.startTime
        : item.startTime;

    const endTime = isDayOff
      ? null
      : dto.endTime !== undefined
        ? dto.endTime
        : item.endTime;

    this.validateException(isDayOff, startTime, endTime);

    if (dto.date !== undefined) {
      item.date = dto.date;
    }

    item.isDayOff = isDayOff;
    item.startTime = startTime;
    item.endTime = endTime;

    if (dto.note !== undefined) {
      item.note = this.nullableText(dto.note);
    }

    return this.exceptionRepository.save(item);
  }

  async deleteScheduleException(userId: number, itemId: number) {
    const profile = await this.ensureProfile(userId);

    const item = await this.exceptionRepository.findOne({
      where: {
        id: itemId,
        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Ngày ngoại lệ không tồn tại');
    }

    await this.exceptionRepository.remove(item);

    return {
      success: true,
    };
  }

  async createServiceArea(userId: number, dto: CreateServiceAreaDto) {
    const profile = await this.ensureProfile(userId);

    this.validateArea(dto.type, dto);

    const entity = this.areaRepository.create({
      therapistId: profile.id,
      type: dto.type,
      areaName: this.nullableText(dto.areaName),
      provinceCode: this.nullableText(dto.provinceCode),
      districtCode: this.nullableText(dto.districtCode),
      centerLatitude:
        dto.type === TherapistServiceAreaType.RADIUS
          ? (dto.centerLatitude ?? null)
          : null,
      centerLongitude:
        dto.type === TherapistServiceAreaType.RADIUS
          ? (dto.centerLongitude ?? null)
          : null,
      radiusKm:
        dto.type === TherapistServiceAreaType.RADIUS
          ? (dto.radiusKm ?? null)
          : null,
      isActive: dto.isActive ?? true,
    });

    return this.areaRepository.save(entity);
  }

  async updateServiceArea(
    userId: number,
    itemId: number,
    dto: UpdateServiceAreaDto,
  ) {
    const profile = await this.ensureProfile(userId);

    const item = await this.areaRepository.findOne({
      where: {
        id: itemId,
        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Khu vực phục vụ không tồn tại');
    }

    const type = dto.type ?? item.type;

    const merged = {
      areaName: dto.areaName !== undefined ? dto.areaName : item.areaName,
      provinceCode:
        dto.provinceCode !== undefined ? dto.provinceCode : item.provinceCode,
      districtCode:
        dto.districtCode !== undefined ? dto.districtCode : item.districtCode,
      centerLatitude:
        dto.centerLatitude !== undefined
          ? dto.centerLatitude
          : item.centerLatitude,
      centerLongitude:
        dto.centerLongitude !== undefined
          ? dto.centerLongitude
          : item.centerLongitude,
      radiusKm: dto.radiusKm !== undefined ? dto.radiusKm : item.radiusKm,
    };

    this.validateArea(type, merged);

    item.type = type;
    item.areaName = this.nullableText(merged.areaName);
    item.provinceCode = this.nullableText(merged.provinceCode);
    item.districtCode = this.nullableText(merged.districtCode);

    if (type === TherapistServiceAreaType.RADIUS) {
      item.centerLatitude = merged.centerLatitude ?? null;
      item.centerLongitude = merged.centerLongitude ?? null;
      item.radiusKm = merged.radiusKm ?? null;
    } else {
      item.centerLatitude = null;
      item.centerLongitude = null;
      item.radiusKm = null;
    }

    if (dto.isActive !== undefined) {
      item.isActive = dto.isActive;
    }

    return this.areaRepository.save(item);
  }

  private async ensureProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        role: UserRole.THERAPIST,
      },
    });

    if (!user) {
      throw new NotFoundException('Kỹ thuật viên không tồn tại');
    }

    let profile = await this.profileRepository.findOne({
      where: {
        userId,
      },
    });

    if (profile) {
      return profile;
    }

    profile = this.profileRepository.create({
      userId,
      bio: null,
      gender: Gender.UNKNOWN,
      dateOfBirth: null,
      experienceYears: 0,
      verificationStatus: TherapistVerificationStatus.PENDING,
      onlineStatus: TherapistOnlineStatus.OFFLINE,
      isAcceptingBookings: false,
      serviceRadiusKm: 10,
      currentLatitude: null,
      currentLongitude: null,
      ratingAverage: 0,
      ratingCount: 0,
      completedBookings: 0,
    });

    return this.profileRepository.save(profile);
  }

  private async ensureNoWorkingHourOverlap(
    therapistId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ) {
    const qb = this.workingHourRepository
      .createQueryBuilder('item')
      .where('item.therapistId = :therapistId', {
        therapistId,
      })
      .andWhere('item.dayOfWeek = :dayOfWeek', {
        dayOfWeek,
      })
      .andWhere('item.isActive = true')
      .andWhere('item.startTime < :endTime', {
        endTime,
      })
      .andWhere('item.endTime > :startTime', {
        startTime,
      });

    if (excludeId) {
      qb.andWhere('item.id != :excludeId', {
        excludeId,
      });
    }

    const overlap = await qb.getOne();

    if (overlap) {
      throw new ConflictException(
        'Khung giờ làm việc bị trùng với khung giờ hiện có',
      );
    }
  }

  private ensureTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('Giờ kết thúc phải lớn hơn giờ bắt đầu');
    }
  }

  private validateException(
    isDayOff: boolean,
    startTime?: string | null,
    endTime?: string | null,
  ) {
    if (isDayOff) {
      return;
    }

    if (!startTime || !endTime) {
      throw new BadRequestException(
        'Ngày làm việc ngoại lệ phải có giờ bắt đầu và giờ kết thúc',
      );
    }

    this.ensureTimeRange(startTime, endTime);
  }

  private validateArea(
    type: TherapistServiceAreaType,
    value: {
      areaName?: string | null;
      districtCode?: string | null;
      centerLatitude?: number | null;
      centerLongitude?: number | null;
      radiusKm?: number | null;
    },
  ) {
    if (type === TherapistServiceAreaType.DISTRICT) {
      if (!value.districtCode && !value.areaName) {
        throw new BadRequestException(
          'Khu vực theo quận/huyện phải có districtCode hoặc tên khu vực',
        );
      }

      return;
    }

    if (
      value.centerLatitude === null ||
      value.centerLatitude === undefined ||
      value.centerLongitude === null ||
      value.centerLongitude === undefined ||
      !value.radiusKm
    ) {
      throw new BadRequestException(
        'Khu vực bán kính phải có tọa độ trung tâm và bán kính',
      );
    }
  }

  private nullableText(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }

    const result = value.trim();
    return result || null;
  }

  private toListResponse(user: User) {
    const profile = user.therapistProfile;

    return {
      id: user.id,
      profileId: profile?.id ?? null,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      status: user.status,
      verificationStatus:
        profile?.verificationStatus ?? TherapistVerificationStatus.PENDING,
      onlineStatus: profile?.onlineStatus ?? TherapistOnlineStatus.OFFLINE,
      isAcceptingBookings: profile?.isAcceptingBookings ?? false,
      experienceYears: profile?.experienceYears ?? 0,
      ratingAverage: Number(profile?.ratingAverage ?? 0),
      ratingCount: profile?.ratingCount ?? 0,
      completedBookings: profile?.completedBookings ?? 0,
      createdAt: user.createdAt,
    };
  }

  private toProfileResponse(profile: TherapistProfile) {
    return {
      id: profile.id,
      userId: profile.userId,
      bio: profile.bio,
      gender: profile.gender,
      dateOfBirth: profile.dateOfBirth,
      experienceYears: profile.experienceYears,
      verificationStatus: profile.verificationStatus,
      onlineStatus: profile.onlineStatus,
      isAcceptingBookings: profile.isAcceptingBookings,
      serviceRadiusKm: profile.serviceRadiusKm,
      currentLatitude: profile.currentLatitude,
      currentLongitude: profile.currentLongitude,
      ratingAverage: Number(profile.ratingAverage),
      ratingCount: profile.ratingCount,
      completedBookings: profile.completedBookings,
    };
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      status: user.status,
    };
  }

  async deleteWorkingHour(userId: number, itemId: number) {
    const profile = await this.ensureProfile(userId);

    const item = await this.workingHourRepository.findOne({
      where: {
        id: itemId,
        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Khung giờ làm việc không tồn tại');
    }

    await this.workingHourRepository.remove(item);

    return {
      success: true,
    };
  }

  async deleteServiceArea(userId: number, itemId: number) {
    const profile = await this.ensureProfile(userId);

    const item = await this.areaRepository.findOne({
      where: {
        id: itemId,
        therapistId: profile.id,
      },
    });

    if (!item) {
      throw new NotFoundException('Khu vực phục vụ không tồn tại');
    }

    await this.areaRepository.remove(item);

    return {
      success: true,
    };
  }
}
