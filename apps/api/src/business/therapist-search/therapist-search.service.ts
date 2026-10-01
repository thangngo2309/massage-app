import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';

import { ServiceOption } from '../entities/service-option.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import { TherapistServiceArea } from '../entities/therapist-service-area.entity.js';

import {
  TherapistVerificationStatus,
  UserStatus,
} from '../enums/business.enums.js';

import {
  type SearchTherapistsQueryDto,
  type TherapistSearchSort,
} from './dto/search-therapists.dto.js';

import type {
  TherapistSearchItem,
  TherapistSearchResponse,
} from './types/therapist-search.types.js';

import { TherapistAvailabilityService } from '../therapist-availability/therapist-availability.service.js';

@Injectable()
export class TherapistSearchService {
  constructor(
    @InjectRepository(TherapistProfile)
    private readonly therapistProfileRepository: Repository<TherapistProfile>,

    @InjectRepository(TherapistService)
    private readonly therapistServiceRepository: Repository<TherapistService>,

    @InjectRepository(TherapistServiceArea)
    private readonly therapistServiceAreaRepository: Repository<TherapistServiceArea>,

    @InjectRepository(ServiceOption)
    private readonly serviceOptionRepository: Repository<ServiceOption>,

    private readonly therapistAvailabilityService: TherapistAvailabilityService,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  async search(
    query: SearchTherapistsQueryDto,
    acceptLanguage?: string | null,
  ): Promise<TherapistSearchResponse> {
    this.validateLocation(query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    const serviceOption = await this.serviceOptionRepository.findOne({
      where: {
        id: query.serviceOptionId,
        isActive: true,
      },

      relations: {
        service: {
          translations: true,
        },

        translations: true,
      },
    });

    if (!serviceOption) {
      throw new NotFoundException('Service option not found');
    }

    const serviceTranslation = this.businessI18nService.resolveTranslation(
      serviceOption.service.translations,
      locale,
    );

    const optionTranslation = this.businessI18nService.resolveTranslation(
      serviceOption.translations,
      locale,
    );

    const localizedServiceName =
      serviceTranslation?.name ?? serviceOption.service.name;

    const localizedOptionLabel =
      optionTranslation?.label ?? serviceOption.label ?? null;

    const therapistServices = await this.therapistServiceRepository.find({
      where: {
        serviceOptionId: query.serviceOptionId,
        isActive: true,
      },
    });

    if (!therapistServices.length) {
      return this.emptyResponse(page, limit);
    }

    const therapistServiceMap = new Map<number, TherapistService>();

    for (const item of therapistServices) {
      therapistServiceMap.set(item.therapistId, item);
    }

    const therapistIds = Array.from(therapistServiceMap.keys());

    const therapists = await this.therapistProfileRepository
      .createQueryBuilder('therapist')

      .innerJoinAndSelect('therapist.user', 'user')

      .leftJoinAndSelect(
        'therapist.images',
        'therapistImage',
        'therapistImage.isActive = :imageActive',
        {
          imageActive: true,
        },
      )

      .where('therapist.id IN (:...therapistIds)', {
        therapistIds,
      })

      .andWhere('user.status = :userStatus', {
        userStatus: UserStatus.ACTIVE,
      })

      .andWhere('therapist.verificationStatus = :verificationStatus', {
        verificationStatus: TherapistVerificationStatus.VERIFIED,
      })

      .andWhere('therapist.isAcceptingBookings = true')

      .addOrderBy('therapistImage.sortOrder', 'ASC')

      .addOrderBy('therapistImage.id', 'ASC')

      .getMany();

    if (!therapists.length) {
      return this.emptyResponse(page, limit);
    }

    const validTherapistIds = therapists.map((item) => item.id);

    const serviceAreas = await this.therapistServiceAreaRepository
      .createQueryBuilder('area')

      .where('area.therapistId IN (:...therapistIds)', {
        therapistIds: validTherapistIds,
      })

      .andWhere('area.isActive = true')

      .getMany();

    const serviceAreasByTherapist = new Map<number, TherapistServiceArea[]>();

    for (const area of serviceAreas) {
      const list = serviceAreasByTherapist.get(area.therapistId) ?? [];

      list.push(area);

      serviceAreasByTherapist.set(area.therapistId, list);
    }

    const matchedItems: TherapistSearchItem[] = [];

    for (const therapist of therapists) {
      const areas = serviceAreasByTherapist.get(therapist.id) ?? [];

      const areaMatched = this.isServiceAreaMatched(areas, query);

      if (!areaMatched) {
        continue;
      }

      const availability =
        await this.therapistAvailabilityService.checkAvailability(
          therapist.id,
          {
            serviceId: serviceOption.serviceId,

            serviceOptionId: serviceOption.id,

            date: query.date,

            startTime: query.startTime,
          },
        );

      if (!availability.available) {
        continue;
      }

      const therapistService = therapistServiceMap.get(therapist.id);

      if (!therapistService) {
        continue;
      }

      const distanceKm = this.calculateTherapistDistance(
        therapist,
        query.latitude,
        query.longitude,
      );

      const images = (therapist.images ?? [])
        .filter((image) => image.isActive)

        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)

        .map((image) => ({
          id: image.id,

          imageUrl: image.imageUrl,

          sortOrder: image.sortOrder,
        }));

      matchedItems.push({
        therapistId: therapist.id,

        userId: therapist.userId,

        fullName: therapist.user.fullName,

        avatarUrl: therapist.user.avatarUrl,

        images,

        serviceOptionId: serviceOption.id,

        serviceName: localizedServiceName,

        optionLabel: localizedOptionLabel,

        durationMinutes: serviceOption.durationMinutes,

        price: Number(therapistService.price),

        platformFeeRate: Number(therapistService.platformFeeRate),

        experienceYears: therapist.experienceYears,

        ratingAverage: Number(therapist.ratingAverage),

        ratingCount: therapist.ratingCount,

        completedBookings: therapist.completedBookings,

        onlineStatus: therapist.onlineStatus,

        distanceKm,

        available: true,
      });
    }

    this.sortItems(matchedItems, query.sortBy ?? 'distance');

    const total = matchedItems.length;

    const totalPages = Math.ceil(total / limit);

    const offset = (page - 1) * limit;

    const items = matchedItems.slice(offset, offset + limit);

    return {
      items,

      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  private validateLocation(query: SearchTherapistsQueryDto): void {
    const hasLatitude = query.latitude !== undefined;

    const hasLongitude = query.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }

    const hasCoordinates = hasLatitude && hasLongitude;

    const hasWard = Boolean(query.wardCode?.trim());

    const hasProvince = Boolean(query.provinceCode?.trim());

    if (!hasCoordinates && !hasWard) {
      throw new BadRequestException(
        'Either latitude/longitude or wardCode is required',
      );
    }

    if (!hasCoordinates && hasWard && !hasProvince) {
      throw new BadRequestException(
        'provinceCode is required when wardCode is provided',
      );
    }
  }

  private isServiceAreaMatched(
    areas: TherapistServiceArea[],
    query: SearchTherapistsQueryDto,
  ): boolean {
    if (!areas.length) {
      return false;
    }

    return areas.some((area) => {
      if (area.type === 'ward') {
        if (!query.provinceCode || !query.wardCode) {
          return false;
        }

        if (area.provinceCode !== query.provinceCode) {
          return false;
        }

        if (area.wardCode !== query.wardCode) {
          return false;
        }

        return true;
      }

      if (area.type === 'radius') {
        if (
          query.latitude === undefined ||
          query.longitude === undefined ||
          area.centerLatitude === null ||
          area.centerLongitude === null ||
          area.radiusKm === null
        ) {
          return false;
        }

        const distance = this.calculateDistanceKm(
          query.latitude,
          query.longitude,
          Number(area.centerLatitude),
          Number(area.centerLongitude),
        );

        return distance <= Number(area.radiusKm);
      }

      return false;
    });
  }

  private calculateTherapistDistance(
    therapist: TherapistProfile,
    latitude?: number,
    longitude?: number,
  ): number | null {
    if (
      latitude === undefined ||
      longitude === undefined ||
      therapist.currentLatitude === null ||
      therapist.currentLongitude === null
    ) {
      return null;
    }

    return this.calculateDistanceKm(
      latitude,
      longitude,
      Number(therapist.currentLatitude),
      Number(therapist.currentLongitude),
    );
  }

  private calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const earthRadiusKm = 6371;

    const dLat = this.toRadians(lat2 - lat1);

    const dLon = this.toRadians(lon2 - lon1);

    const firstLat = this.toRadians(lat1);

    const secondLat = this.toRadians(lat2);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(firstLat) *
        Math.cos(secondLat) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadiusKm * c;

    return Number(distance.toFixed(2));
  }

  private toRadians(value: number): number {
    return value * (Math.PI / 180);
  }

  private sortItems(
    items: TherapistSearchItem[],
    sortBy: TherapistSearchSort,
  ): void {
    if (sortBy === 'price') {
      items.sort((a, b) => a.price - b.price);

      return;
    }

    if (sortBy === 'rating') {
      items.sort((a, b) => {
        if (b.ratingAverage !== a.ratingAverage) {
          return b.ratingAverage - a.ratingAverage;
        }

        return b.ratingCount - a.ratingCount;
      });

      return;
    }

    items.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) {
        return b.ratingAverage - a.ratingAverage;
      }

      if (a.distanceKm === null) {
        return 1;
      }

      if (b.distanceKm === null) {
        return -1;
      }

      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }

      return b.ratingAverage - a.ratingAverage;
    });
  }

  private emptyResponse(page: number, limit: number): TherapistSearchResponse {
    return {
      items: [],

      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    };
  }
}
