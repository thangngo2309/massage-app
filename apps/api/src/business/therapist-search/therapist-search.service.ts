import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { In, Repository } from 'typeorm';

import { BOOKING_BLOCKING_STATUSES } from '../booking/booking.constants.js';

import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';

import { Booking } from '../entities/booking.entity.js';

import { ServiceOption } from '../entities/service-option.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { TherapistService } from '../entities/therapist-service.entity.js';

import { TherapistServiceArea } from '../entities/therapist-service-area.entity.js';

import {
  BookingStatus,
  TherapistVerificationStatus,
  UserStatus,
} from '../enums/business.enums.js';

import {
  type SearchTherapistsQueryDto,
  type TherapistSearchSort,
} from './dto/search-therapists.dto.js';

import type {
  TherapistSearchAvailabilityStatus,
  TherapistSearchItem,
  TherapistSearchResponse,
} from './types/therapist-search.types.js';

type CurrentAvailability = {
  availabilityStatus: TherapistSearchAvailabilityStatus;

  busyUntil: string | null;
};

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

    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  /**
   * ============================================================
   * SEARCH THERAPISTS
   * ============================================================
   *
   * Flow:
   *
   * Service
   *   ↓
   * ServiceOption active
   *   ↓
   * TherapistService active
   *   ↓
   * Therapist ACTIVE + VERIFIED + accepting
   *   ↓
   * Service Area
   *   ↓
   * Current booking availability
   *   ↓
   * sort + pagination
   *
   * QUAN TRỌNG:
   *
   * Không loại KTV đang bận khỏi search.
   *
   * KTV vẫn xuất hiện với:
   *
   * availabilityStatus = busy
   * busyUntil = thời gian dự kiến rảnh
   */
  async search(
    query: SearchTherapistsQueryDto,
    acceptLanguage?: string | null,
  ): Promise<TherapistSearchResponse> {
    this.validateLocation(query);

    const page = query.page ?? 1;

    const limit = query.limit ?? 20;

    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    /**
     * ============================================================
     * 1. SERVICE OPTIONS
     * ============================================================
     */

    const serviceOptions = await this.serviceOptionRepository.find({
      where: {
        serviceId: query.serviceId,

        isActive: true,
      },

      relations: {
        service: {
          translations: true,
        },
      },

      order: {
        durationMinutes: 'ASC',
      },
    });

    /**
     * ServiceOption active nhưng Service cha
     * cũng phải active.
     */
    const activeServiceOptions = serviceOptions.filter(
      (option) => option.service?.isActive,
    );

    if (!activeServiceOptions.length) {
      throw new NotFoundException(
        'Service not found or has no active service options',
      );
    }

    const service = activeServiceOptions[0].service;

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found');
    }

    const serviceTranslation = this.businessI18nService.resolveTranslation(
      service.translations,
      locale,
    );

    const localizedServiceName = serviceTranslation?.name ?? service.name;

    const serviceOptionIds = activeServiceOptions.map((option) => option.id);

    /**
     * ============================================================
     * 2. THERAPIST SERVICES
     * ============================================================
     */

    const therapistServices = await this.therapistServiceRepository.find({
      where: {
        serviceOptionId: In(serviceOptionIds),

        isActive: true,
      },
    });

    if (!therapistServices.length) {
      return this.emptyResponse(page, limit);
    }

    /**
     * therapistId -> TherapistService[]
     */
    const therapistServicesByTherapist = new Map<number, TherapistService[]>();

    for (const item of therapistServices) {
      const list = therapistServicesByTherapist.get(item.therapistId) ?? [];

      list.push(item);

      therapistServicesByTherapist.set(item.therapistId, list);
    }

    const therapistIds = Array.from(therapistServicesByTherapist.keys());

    /**
     * ============================================================
     * 3. THERAPIST PROFILES
     * ============================================================
     */

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

    /**
     * ============================================================
     * 4. SERVICE AREAS
     * ============================================================
     */

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

    /**
     * ============================================================
     * 5. CURRENT BOOKING AVAILABILITY
     * ============================================================
     *
     * Không loại KTV.
     *
     * Chỉ lấy các booking có khả năng liên quan đến
     * trạng thái đang bận hiện tại.
     *
     * Booking đã completed / cancelled / rejected /
     * expired không nằm trong BOOKING_BLOCKING_STATUSES.
     */

    const now = new Date();

    /**
     * Các trạng thái cho biết KTV đang thực sự
     * tham gia booking.
     *
     * Nếu booking đã quá expectedEndAt nhưng vẫn còn
     * những status này, KTV vẫn được xem là BUSY.
     */
    const executionStatuses: BookingStatus[] = [
      BookingStatus.THERAPIST_ON_THE_WAY,

      BookingStatus.ARRIVED,

      BookingStatus.IN_PROGRESS,
    ];

    const blockingBookings = await this.bookingRepository
      .createQueryBuilder('booking')

      .where('booking.therapistId IN (:...therapistIds)', {
        therapistIds: validTherapistIds,
      })

      .andWhere('booking.status IN (:...blockingStatuses)', {
        blockingStatuses: BOOKING_BLOCKING_STATUSES,
      })

      /**
       * Không cần load toàn bộ booking cũ.
       *
       * Giữ:
       *
       * 1. Booking chưa qua expectedEndAt.
       *
       * 2. Booking đang di chuyển / arrived / in_progress
       *    dù đã quá expectedEndAt.
       */
      .andWhere(
        `(
            booking.expectedEndAt > :now
            OR booking.status IN (:...executionStatuses)
          )`,
        {
          now,

          executionStatuses,
        },
      )

      .orderBy('booking.therapistId', 'ASC')

      .addOrderBy('booking.scheduledAt', 'ASC')

      .getMany();

    const bookingsByTherapist = new Map<number, Booking[]>();

    for (const booking of blockingBookings) {
      if (booking.therapistId === null) {
        continue;
      }

      const list = bookingsByTherapist.get(booking.therapistId) ?? [];

      list.push(booking);

      bookingsByTherapist.set(booking.therapistId, list);
    }

    /**
     * ============================================================
     * 6. MATCH SERVICE AREA + BUILD RESULT
     * ============================================================
     */

    const matchedItems: TherapistSearchItem[] = [];

    for (const therapist of therapists) {
      const areas = serviceAreasByTherapist.get(therapist.id) ?? [];

      const areaMatched = this.isServiceAreaMatched(areas, query);

      if (!areaMatched) {
        continue;
      }

      const therapistServiceItems =
        therapistServicesByTherapist.get(therapist.id) ?? [];

      if (!therapistServiceItems.length) {
        continue;
      }

      /**
       * Giá sử dụng giá của KTV,
       * không sử dụng ServiceOption.defaultPrice.
       */
      const prices = therapistServiceItems.map((item) => Number(item.price));

      if (!prices.length) {
        continue;
      }

      const minPrice = Math.min(...prices);

      const maxPrice = Math.max(...prices);

      const optionCount = therapistServiceItems.length;

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

      /**
       * Xác định trạng thái rảnh / bận hiện tại.
       */
      const currentAvailability = this.resolveCurrentAvailability(
        bookingsByTherapist.get(therapist.id) ?? [],
        now,
      );

      matchedItems.push({
        therapistId: therapist.id,

        userId: therapist.userId,

        fullName: therapist.user.fullName,

        stageName: therapist.stageName,

        bio: therapist.bio,

        gender: therapist.gender,

        hasTattoo: therapist.hasTattoo,

        avatarUrl: therapist.user.avatarUrl,

        images,

        serviceId: service.id,

        serviceName: localizedServiceName,

        minPrice,

        maxPrice,

        optionCount,

        experienceYears: therapist.experienceYears,

        ratingAverage: Number(therapist.ratingAverage),

        ratingCount: therapist.ratingCount,

        completedBookings: therapist.completedBookings,

        onlineStatus: therapist.onlineStatus,

        distanceKm,

        availabilityStatus: currentAvailability.availabilityStatus,

        busyUntil: currentAvailability.busyUntil,
      });
    }

    /**
     * ============================================================
     * 7. SORT
     * ============================================================
     *
     * Giữ nguyên logic sort hiện tại.
     *
     * BUSY không bị đẩy ra khỏi kết quả.
     *
     * Nếu sau này muốn AVAILABLE_NOW luôn đứng trên BUSY
     * thì xử lý thêm tại đây.
     */

    this.sortItems(matchedItems, query.sortBy ?? 'distance');

    /**
     * ============================================================
     * 8. PAGINATION
     * ============================================================
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
   * RESOLVE CURRENT AVAILABILITY
   * ============================================================
   *
   * Mục tiêu:
   *
   * - Không có booking hiện tại
   *   => available_now.
   *
   * - Booking đang chiếm thời điểm hiện tại
   *   => busy.
   *
   * - Nếu có nhiều booking nối tiếp nhau
   *   => busyUntil kéo dài đến booking cuối cùng
   *      trong chuỗi liên tục.
   *
   * Ví dụ:
   *
   * 13:00 - 14:00
   * 14:00 - 15:30
   *
   * => busyUntil = 15:30.
   *
   * Nếu booking đang thực hiện nhưng đã vượt
   * expectedEndAt:
   *
   * => vẫn BUSY
   * => busyUntil = null
   *
   * vì không nên hiển thị một giờ rảnh đã nằm
   * trong quá khứ.
   */
  private resolveCurrentAvailability(
    bookings: Booking[],
    now: Date,
  ): CurrentAvailability {
    if (!bookings.length) {
      return {
        availabilityStatus: 'available_now',

        busyUntil: null,
      };
    }

    const executionStatuses = new Set<BookingStatus>([
      BookingStatus.THERAPIST_ON_THE_WAY,

      BookingStatus.ARRIVED,

      BookingStatus.IN_PROGRESS,
    ]);

    const nowTime = now.getTime();

    /**
     * Booking đang thực sự chiếm KTV hiện tại.
     */
    const busyNow = bookings.filter((booking) => {
      const scheduledAt = booking.scheduledAt.getTime();

      const expectedEndAt = booking.expectedEndAt.getTime();

      /**
       * Khi KTV đã ON_THE_WAY / ARRIVED / IN_PROGRESS
       * thì coi là BUSY theo trạng thái thực tế,
       * không phụ thuộc scheduledAt nữa.
       */
      if (executionStatuses.has(booking.status)) {
        return true;
      }

      /**
       * Các trạng thái còn lại chỉ BUSY khi
       * thời điểm hiện tại thực sự nằm trong
       * khoảng booking.
       */
      return scheduledAt <= nowTime && expectedEndAt > nowTime;
    });

    if (!busyNow.length) {
      return {
        availabilityStatus: 'available_now',

        busyUntil: null,
      };
    }

    /**
     * Booking đang thực hiện nhưng đã quá
     * thời gian dự kiến.
     *
     * Không thể biết chính xác mấy giờ kết thúc.
     */
    const hasOverdueExecutionBooking = busyNow.some(
      (booking) =>
        executionStatuses.has(booking.status) &&
        booking.expectedEndAt.getTime() <= nowTime,
    );

    if (hasOverdueExecutionBooking) {
      return {
        availabilityStatus: 'busy',

        busyUntil: null,
      };
    }

    /**
     * Điểm kết thúc ban đầu.
     */
    let busyUntilTime = Math.max(
      ...busyNow.map((booking) => booking.expectedEndAt.getTime()),
    );

    /**
     * Sắp xếp toàn bộ booking blocking
     * để nối các booking liên tiếp.
     */
    const orderedBookings = [...bookings].sort(
      (a, b) =>
        a.scheduledAt.getTime() - b.scheduledAt.getTime() ||
        a.expectedEndAt.getTime() - b.expectedEndAt.getTime(),
    );

    /**
     * Ví dụ:
     *
     * booking A: 13:00 → 14:00
     * booking B: 14:00 → 15:00
     * booking C: 15:00 → 16:30
     *
     * => busyUntil phải là 16:30.
     */
    let extended = true;

    while (extended) {
      extended = false;

      for (const booking of orderedBookings) {
        const scheduledAt = booking.scheduledAt.getTime();

        const expectedEndAt = booking.expectedEndAt.getTime();

        if (scheduledAt <= busyUntilTime && expectedEndAt > busyUntilTime) {
          busyUntilTime = expectedEndAt;

          extended = true;
        }
      }
    }

    return {
      availabilityStatus: 'busy',

      busyUntil: new Date(busyUntilTime).toISOString(),
    };
  }

  /**
   * ============================================================
   * GET THERAPIST SERVICES
   * ============================================================
   *
   * Trả toàn bộ Service + ServiceOption
   * mà một KTV hiện đang cung cấp.
   *
   * Đây là API dùng sau khi khách hàng
   * đã chọn KTV.
   *
   * Khách hàng có thể chọn nhiều option.
   */
  async getTherapistServices(
    therapistId: number,
    acceptLanguage?: string | null,
  ) {
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    /**
     * ============================================================
     * 1. VALIDATE THERAPIST
     * ============================================================
     *
     * Không bắt buộc isAcceptingBookings tại đây.
     *
     * Frontend sẽ nhận isAcceptingBookings
     * để quyết định cho phép tiếp tục hay không.
     *
     * Booking API vẫn phải validate lại.
     */

    const therapist = await this.therapistProfileRepository
      .createQueryBuilder('therapist')

      .innerJoinAndSelect('therapist.user', 'user')

      .where('therapist.id = :therapistId', {
        therapistId,
      })

      .andWhere('user.status = :userStatus', {
        userStatus: UserStatus.ACTIVE,
      })

      .andWhere('therapist.verificationStatus = :verificationStatus', {
        verificationStatus: TherapistVerificationStatus.VERIFIED,
      })

      .getOne();

    if (!therapist) {
      throw new NotFoundException('Therapist not found');
    }

    /**
     * ============================================================
     * 2. LOAD THERAPIST SERVICES
     * ============================================================
     */

    const therapistServices = await this.therapistServiceRepository

      .createQueryBuilder('therapistService')

      .innerJoinAndSelect('therapistService.serviceOption', 'serviceOption')

      .innerJoinAndSelect('serviceOption.service', 'service')

      .leftJoinAndSelect('service.translations', 'serviceTranslation')

      .leftJoinAndSelect('serviceOption.translations', 'optionTranslation')

      .where('therapistService.therapistId = :therapistId', {
        therapistId,
      })

      .andWhere('therapistService.isActive = true')

      .andWhere('serviceOption.isActive = true')

      .andWhere('service.isActive = true')

      .orderBy('service.sortOrder', 'ASC')

      .addOrderBy('service.id', 'ASC')

      .addOrderBy('serviceOption.durationMinutes', 'ASC')

      .addOrderBy('serviceOption.id', 'ASC')

      .getMany();

    /**
     * ============================================================
     * 3. GROUP BY SERVICE
     * ============================================================
     */

    const groupedServices = new Map<
      number,
      {
        serviceId: number;

        serviceName: string;

        serviceSlug: string;

        serviceImageUrl: string | null;

        options: Array<{
          therapistServiceId: number;

          serviceOptionId: number;

          label: string | null;

          durationMinutes: number;

          price: number;

          platformFeeRate: number;
        }>;
      }
    >();

    for (const therapistService of therapistServices) {
      const option = therapistService.serviceOption;

      const currentService = option.service;

      const serviceTranslation = this.businessI18nService.resolveTranslation(
        currentService.translations,
        locale,
      );

      const optionTranslation = this.businessI18nService.resolveTranslation(
        option.translations,
        locale,
      );

      const serviceName = serviceTranslation?.name ?? currentService.name;

      const optionLabel = optionTranslation?.label ?? option.label ?? null;

      let group = groupedServices.get(currentService.id);

      if (!group) {
        group = {
          serviceId: currentService.id,

          serviceName,

          serviceSlug: currentService.slug,

          serviceImageUrl: currentService.imageUrl,

          options: [],
        };

        groupedServices.set(currentService.id, group);
      }

      group.options.push({
        therapistServiceId: therapistService.id,

        serviceOptionId: option.id,

        label: optionLabel,

        durationMinutes: option.durationMinutes,

        price: Number(therapistService.price),

        platformFeeRate: Number(therapistService.platformFeeRate),
      });
    }

    return {
      therapistId: therapist.id,

      userId: therapist.userId,

      fullName: therapist.user.fullName,

      avatarUrl: therapist.user.avatarUrl,

      onlineStatus: therapist.onlineStatus,

      isAcceptingBookings: therapist.isAcceptingBookings,

      services: Array.from(groupedServices.values()),
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

    if (hasProvince && !hasWard && !hasCoordinates) {
      throw new BadRequestException(
        'wardCode is required when provinceCode is provided',
      );
    }
  }

  /**
   * ============================================================
   * SERVICE AREA MATCHING
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
       * WARD
       */
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
   * THERAPIST DISTANCE
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
   * Haversine distance.
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

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),

        Math.sqrt(1 - a),
      );

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
    /**
     * PRICE
     */
    if (sortBy === 'price') {
      items.sort((a, b) => {
        if (a.minPrice !== b.minPrice) {
          return a.minPrice - b.minPrice;
        }

        if (b.ratingAverage !== a.ratingAverage) {
          return b.ratingAverage - a.ratingAverage;
        }

        return b.ratingCount - a.ratingCount;
      });

      return;
    }

    /**
     * RATING
     */
    if (sortBy === 'rating') {
      items.sort((a, b) => {
        if (b.ratingAverage !== a.ratingAverage) {
          return b.ratingAverage - a.ratingAverage;
        }

        if (b.ratingCount !== a.ratingCount) {
          return b.ratingCount - a.ratingCount;
        }

        if (a.distanceKm !== null && b.distanceKm !== null) {
          return a.distanceKm - b.distanceKm;
        }

        return 0;
      });

      return;
    }

    /**
     * DISTANCE
     */
    items.sort((a, b) => {
      if (a.distanceKm === null && b.distanceKm === null) {
        if (b.ratingAverage !== a.ratingAverage) {
          return b.ratingAverage - a.ratingAverage;
        }

        return b.ratingCount - a.ratingCount;
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

      if (b.ratingAverage !== a.ratingAverage) {
        return b.ratingAverage - a.ratingAverage;
      }

      return b.ratingCount - a.ratingCount;
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
