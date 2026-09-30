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

    /**
     * ==========================================================
     * RESOLVE BUSINESS LOCALE
     * ==========================================================
     *
     * Locale được lấy từ Accept-Language.
     *
     * Ví dụ:
     *
     * Accept-Language: en
     *
     * => locale = en
     *
     * Nếu language không hợp lệ hoặc không được cấu hình,
     * BusinessI18nService sẽ resolve về default language.
     */
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    /**
     * ==========================================================
     * GET SERVICE OPTION + BUSINESS TRANSLATIONS
     * ==========================================================
     *
     * Một request search chỉ tìm theo một serviceOptionId,
     * do đó chỉ cần load ServiceOption một lần.
     *
     * Đồng thời load:
     *
     * - ServiceOption translations
     * - Service
     * - Service translations
     *
     * Không tạo N+1 query theo therapist.
     */
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

    /**
     * Resolve translation một lần cho toàn bộ kết quả search.
     *
     * Tất cả therapist trong request này đều đang cung cấp
     * cùng một ServiceOption.
     */
    const serviceTranslation = this.businessI18nService.resolveTranslation(
      serviceOption.service.translations,
      locale,
    );

    const optionTranslation = this.businessI18nService.resolveTranslation(
      serviceOption.translations,
      locale,
    );

    /**
     * Nếu không có translation phù hợp thì fallback về
     * dữ liệu gốc trên Service / ServiceOption.
     */
    const localizedServiceName =
      serviceTranslation?.name ?? serviceOption.service.name;

    const localizedOptionLabel =
      optionTranslation?.label ?? serviceOption.label ?? null;

    /**
     * ==========================================================
     * 1. GET THERAPIST SERVICES
     * ==========================================================
     */
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

    /**
     * ==========================================================
     * 2. GET VALID THERAPIST PROFILES + IMAGES
     * ==========================================================
     */
    const therapists = await this.therapistProfileRepository
      .createQueryBuilder('therapist')

      .innerJoinAndSelect('therapist.user', 'user')

      /**
       * Chỉ lấy ảnh đang active.
       *
       * LEFT JOIN để KTV chưa có gallery
       * vẫn xuất hiện trong kết quả tìm kiếm.
       */
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

      /**
       * Đảm bảo gallery có thứ tự ổn định.
       */
      .addOrderBy('therapistImage.sortOrder', 'ASC')

      .addOrderBy('therapistImage.id', 'ASC')

      .getMany();

    if (!therapists.length) {
      return this.emptyResponse(page, limit);
    }

    const validTherapistIds = therapists.map((item) => item.id);

    /**
     * ==========================================================
     * 3. GET SERVICE AREAS
     * ==========================================================
     */
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

    /**
     * ==========================================================
     * 4. MATCH AREA + AVAILABILITY
     * ==========================================================
     */
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

      /**
       * Chỉ expose dữ liệu ảnh cần thiết
       * cho Web Client.
       *
       * Không trả storagePath.
       */
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

        /**
         * Gallery KTV
         */
        images,

        serviceOptionId: serviceOption.id,

        /**
         * Business translation đã được resolve
         * theo Accept-Language.
         */
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

    /**
     * ==========================================================
     * 5. SORT
     * ==========================================================
     */
    this.sortItems(matchedItems, query.sortBy ?? 'distance');

    /**
     * ==========================================================
     * 6. PAGINATION
     * ==========================================================
     */
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

  /**
   * ============================================================
   * LOCATION VALIDATION
   * ============================================================
   */
  private validateLocation(query: SearchTherapistsQueryDto): void {
    const hasLatitude = query.latitude !== undefined;

    const hasLongitude = query.longitude !== undefined;

    if (hasLatitude !== hasLongitude) {
      throw new BadRequestException(
        'latitude and longitude must be provided together',
      );
    }

    const hasCoordinates = hasLatitude && hasLongitude;

    const hasDistrict = Boolean(query.districtCode);

    if (!hasCoordinates && !hasDistrict) {
      throw new BadRequestException(
        'Either latitude/longitude or districtCode is required',
      );
    }
  }

  /**
   * ============================================================
   * SERVICE AREA MATCH
   * ============================================================
   */
  private isServiceAreaMatched(
    areas: TherapistServiceArea[],
    query: SearchTherapistsQueryDto,
  ): boolean {
    if (!areas.length) {
      return false;
    }

    return areas.some((area) => {
      /**
       * DISTRICT
       */
      if (area.type === 'district') {
        if (!query.districtCode) {
          return false;
        }

        if (area.districtCode !== query.districtCode) {
          return false;
        }

        /**
         * Nếu cả hai phía đều có provinceCode
         * thì phải khớp province.
         */
        if (
          area.provinceCode &&
          query.provinceCode &&
          area.provinceCode !== query.provinceCode
        ) {
          return false;
        }

        return true;
      }

      /**
       * RADIUS
       */
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

  /**
   * ============================================================
   * DISTANCE CUSTOMER -> CURRENT THERAPIST LOCATION
   * ============================================================
   */
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

  /**
   * HAVERSINE
   */
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

  /**
   * ============================================================
   * SORT
   * ============================================================
   */
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

    /**
     * DISTANCE
     *
     * Null luôn xuống cuối.
     * Nếu bằng nhau thì rating cao hơn trước.
     */
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
