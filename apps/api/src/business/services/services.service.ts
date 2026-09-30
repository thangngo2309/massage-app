import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';
import { MassageService } from '../entities/service.entity.js';
import { ServiceOption } from '../entities/service-option.entity.js';
import { ServiceOptionTranslation } from '../entities/service-option-translation.entity.js';
import { ServiceTranslation } from '../entities/service-translation.entity.js';

import { AdminServiceQueryDto } from './dto/admin-service-query.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { CreateServiceOptionDto } from './dto/create-service-option.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto.js';
import { UpsertServiceOptionTranslationDto } from './dto/upsert-service-option-translation.dto.js';
import { UpsertServiceTranslationDto } from './dto/upsert-service-translation.dto.js';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(MassageService)
    private readonly serviceRepository: Repository<MassageService>,

    @InjectRepository(ServiceOption)
    private readonly optionRepository: Repository<ServiceOption>,

    @InjectRepository(ServiceTranslation)
    private readonly serviceTranslationRepository: Repository<ServiceTranslation>,

    @InjectRepository(ServiceOptionTranslation)
    private readonly optionTranslationRepository: Repository<ServiceOptionTranslation>,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  /*
   * ============================================
   * ADMIN SERVICES
   * ============================================
   */

  async findAll(query: AdminServiceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.serviceRepository.createQueryBuilder('service');

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;

      qb.andWhere(
        `(
          LOWER(service.name) LIKE :q
          OR LOWER(service.slug) LIKE :q
          OR LOWER(COALESCE(service.description, '')) LIKE :q
        )`,
        {
          q,
        },
      );
    }

    if (query.isActive !== undefined) {
      qb.andWhere('service.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    qb.orderBy('service.sortOrder', 'ASC')
      .addOrderBy('service.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [services, total]: [MassageService[], number] =
      await qb.getManyAndCount();

    const serviceIds = services.map((service) => service.id);
    const optionCountMap = new Map<number, number>();

    if (serviceIds.length > 0) {
      const optionCounts = await this.optionRepository
        .createQueryBuilder('option')
        .select('option.serviceId', 'serviceId')
        .addSelect('COUNT(option.id)', 'count')
        .where('option.serviceId IN (:...serviceIds)', {
          serviceIds,
        })
        .groupBy('option.serviceId')
        .getRawMany<{
          serviceId: string;
          count: string;
        }>();

      for (const row of optionCounts) {
        optionCountMap.set(Number(row.serviceId), Number(row.count));
      }
    }

    return {
      items: services.map((service) => ({
        ...this.toServiceResponse(service),
        optionCount: optionCountMap.get(service.id) ?? 0,
      })),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const service = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.options', 'option')
      .where('service.id = :id', {
        id,
      })
      .orderBy('option.durationMinutes', 'ASC')
      .addOrderBy('option.id', 'ASC')
      .getOne();

    if (!service) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    return {
      ...this.toServiceResponse(service),

      optionCount: service.options?.length ?? 0,

      options: (service.options ?? []).map((option) =>
        this.toOptionResponse(option),
      ),
    };
  }

  async create(dto: CreateServiceDto) {
    const name = dto.name.trim();
    const slug = dto.slug?.trim() || this.slugify(name);

    await this.ensureSlugUnique(slug);

    const service = this.serviceRepository.create({
      name,
      slug,
      description: this.normalizeNullableText(dto.description),
      imageUrl: this.normalizeNullableText(dto.imageUrl),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    const saved = await this.serviceRepository.save(service);

    return this.toServiceResponse(saved);
  }

  async update(id: number, dto: UpdateServiceDto) {
    const service = await this.getServiceEntity(id);

    if (dto.name !== undefined) {
      service.name = dto.name.trim();
    }

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim();

      await this.ensureSlugUnique(slug, service.id);

      service.slug = slug;
    }

    if (dto.description !== undefined) {
      service.description = this.normalizeNullableText(dto.description);
    }

    if (dto.imageUrl !== undefined) {
      service.imageUrl = this.normalizeNullableText(dto.imageUrl);
    }

    if (dto.isActive !== undefined) {
      service.isActive = dto.isActive;
    }

    if (dto.sortOrder !== undefined) {
      service.sortOrder = dto.sortOrder;
    }

    const saved = await this.serviceRepository.save(service);

    return this.toServiceResponse(saved);
  }

  async updateActive(id: number, isActive: boolean) {
    const service = await this.getServiceEntity(id);

    service.isActive = isActive;

    const saved = await this.serviceRepository.save(service);

    return this.toServiceResponse(saved);
  }

  /*
   * ============================================
   * ADMIN SERVICE TRANSLATIONS
   * ============================================
   */

  async getServiceTranslations(serviceId: number) {
    await this.getServiceEntity(serviceId);

    const translations = await this.serviceTranslationRepository.find({
      where: {
        serviceId,
      },
      order: {
        locale: 'ASC',
      },
    });

    return translations.map((translation) =>
      this.toServiceTranslationResponse(translation),
    );
  }

  async upsertServiceTranslation(
    serviceId: number,
    locale: string,
    dto: UpsertServiceTranslationDto,
  ) {
    await this.getServiceEntity(serviceId);

    const normalizedLocale = this.businessI18nService.normalizeLocale(locale);

    await this.businessI18nService.validateLocales([normalizedLocale]);

    const name = dto.name.trim();

    if (!name) {
      throw new BadRequestException('Tên bản dịch không được để trống');
    }

    let translation = await this.serviceTranslationRepository.findOne({
      where: {
        serviceId,
        locale: normalizedLocale,
      },
    });

    if (!translation) {
      translation = this.serviceTranslationRepository.create({
        serviceId,
        locale: normalizedLocale,
        name,
        description: this.normalizeNullableText(dto.description),
      });
    } else {
      translation.name = name;
      translation.description = this.normalizeNullableText(dto.description);
    }

    const saved = await this.serviceTranslationRepository.save(translation);

    return this.toServiceTranslationResponse(saved);
  }

  /*
   * ============================================
   * ADMIN SERVICE OPTIONS
   * ============================================
   */

  async createOption(serviceId: number, dto: CreateServiceOptionDto) {
    await this.getServiceEntity(serviceId);

    await this.ensureDurationUnique(serviceId, dto.durationMinutes);

    const option = this.optionRepository.create({
      serviceId,
      label: this.normalizeNullableText(dto.label),
      durationMinutes: dto.durationMinutes,
      defaultPrice: dto.defaultPrice,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.optionRepository.save(option);

    return this.toOptionResponse(saved);
  }

  async updateOption(
    serviceId: number,
    optionId: number,
    dto: UpdateServiceOptionDto,
  ) {
    await this.getServiceEntity(serviceId);

    const option = await this.optionRepository.findOne({
      where: {
        id: optionId,
        serviceId,
      },
    });

    if (!option) {
      throw new NotFoundException('Gói dịch vụ không tồn tại');
    }

    if (
      dto.durationMinutes !== undefined &&
      dto.durationMinutes !== option.durationMinutes
    ) {
      await this.ensureDurationUnique(
        serviceId,
        dto.durationMinutes,
        option.id,
      );

      option.durationMinutes = dto.durationMinutes;
    }

    if (dto.label !== undefined) {
      option.label = this.normalizeNullableText(dto.label);
    }

    if (dto.defaultPrice !== undefined) {
      option.defaultPrice = dto.defaultPrice;
    }

    if (dto.isActive !== undefined) {
      option.isActive = dto.isActive;
    }

    const saved = await this.optionRepository.save(option);

    return this.toOptionResponse(saved);
  }

  async updateOptionActive(
    serviceId: number,
    optionId: number,
    isActive: boolean,
  ) {
    const option = await this.getServiceOptionEntity(serviceId, optionId);

    option.isActive = isActive;

    const saved = await this.optionRepository.save(option);

    return this.toOptionResponse(saved);
  }

  /*
   * ============================================
   * ADMIN SERVICE OPTION TRANSLATIONS
   * ============================================
   */

  async getServiceOptionTranslations(serviceId: number, optionId: number) {
    await this.getServiceOptionEntity(serviceId, optionId);

    const translations = await this.optionTranslationRepository.find({
      where: {
        serviceOptionId: optionId,
      },
      order: {
        locale: 'ASC',
      },
    });

    return translations.map((translation) =>
      this.toServiceOptionTranslationResponse(translation),
    );
  }

  async upsertServiceOptionTranslation(
    serviceId: number,
    optionId: number,
    locale: string,
    dto: UpsertServiceOptionTranslationDto,
  ) {
    await this.getServiceOptionEntity(serviceId, optionId);

    const normalizedLocale = this.businessI18nService.normalizeLocale(locale);

    await this.businessI18nService.validateLocales([normalizedLocale]);

    const label = dto.label.trim();

    if (!label) {
      throw new BadRequestException('Tên gói bản dịch không được để trống');
    }

    let translation = await this.optionTranslationRepository.findOne({
      where: {
        serviceOptionId: optionId,
        locale: normalizedLocale,
      },
    });

    if (!translation) {
      translation = this.optionTranslationRepository.create({
        serviceOptionId: optionId,
        locale: normalizedLocale,
        label,
      });
    } else {
      translation.label = label;
    }

    const saved = await this.optionTranslationRepository.save(translation);

    return this.toServiceOptionTranslationResponse(saved);
  }

  /*
   * ============================================
   * PUBLIC SERVICES
   * ============================================
   */

  async findPublicAll(acceptLanguage?: string | null) {
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    const services = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect(
        'service.options',
        'option',
        'option.isActive = :optionActive',
        {
          optionActive: true,
        },
      )
      .leftJoinAndSelect('service.translations', 'serviceTranslation')
      .leftJoinAndSelect('option.translations', 'optionTranslation')
      .where('service.isActive = :serviceActive', {
        serviceActive: true,
      })
      .orderBy('service.sortOrder', 'ASC')
      .addOrderBy('service.name', 'ASC')
      .addOrderBy('option.durationMinutes', 'ASC')
      .getMany();

    return services.map((service) =>
      this.toLocalizedServiceResponse(service, locale),
    );
  }

  async findPublicOne(id: number, acceptLanguage?: string | null) {
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    const service = await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect(
        'service.options',
        'option',
        'option.isActive = :optionActive',
        {
          optionActive: true,
        },
      )
      .leftJoinAndSelect('service.translations', 'serviceTranslation')
      .leftJoinAndSelect('option.translations', 'optionTranslation')
      .where('service.id = :id', {
        id,
      })
      .andWhere('service.isActive = :serviceActive', {
        serviceActive: true,
      })
      .orderBy('option.durationMinutes', 'ASC')
      .getOne();

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return this.toLocalizedServiceResponse(service, locale);
  }

  /*
   * ============================================
   * ENTITY HELPERS
   * ============================================
   */

  private async getServiceEntity(id: number) {
    const service = await this.serviceRepository.findOne({
      where: {
        id,
      },
    });

    if (!service) {
      throw new NotFoundException('Dịch vụ không tồn tại');
    }

    return service;
  }

  private async getServiceOptionEntity(serviceId: number, optionId: number) {
    await this.getServiceEntity(serviceId);

    const option = await this.optionRepository.findOne({
      where: {
        id: optionId,
        serviceId,
      },
    });

    if (!option) {
      throw new NotFoundException('Gói dịch vụ không tồn tại');
    }

    return option;
  }

  /*
   * ============================================
   * VALIDATION
   * ============================================
   */

  private async ensureSlugUnique(slug: string, excludeId?: number) {
    const existing = await this.serviceRepository.findOne({
      where: excludeId
        ? {
            slug,
            id: Not(excludeId),
          }
        : {
            slug,
          },
    });

    if (existing) {
      throw new ConflictException('Slug dịch vụ đã tồn tại');
    }
  }

  private async ensureDurationUnique(
    serviceId: number,
    durationMinutes: number,
    excludeId?: number,
  ) {
    const existing = await this.optionRepository.findOne({
      where: excludeId
        ? {
            serviceId,
            durationMinutes,
            id: Not(excludeId),
          }
        : {
            serviceId,
            durationMinutes,
          },
    });

    if (existing) {
      throw new ConflictException(`Dịch vụ đã có gói ${durationMinutes} phút`);
    }
  }

  /*
   * ============================================
   * RESPONSE MAPPERS
   * ============================================
   */

  private toServiceResponse(service: MassageService) {
    return {
      id: service.id,
      name: service.name,
      slug: service.slug,
      description: service.description ?? null,
      imageUrl: service.imageUrl ?? null,
      isActive: service.isActive,
      sortOrder: service.sortOrder,
    };
  }

  private toOptionResponse(option: ServiceOption) {
    return {
      id: option.id,
      serviceId: option.serviceId,
      label: option.label ?? null,
      durationMinutes: option.durationMinutes,
      defaultPrice: option.defaultPrice,
      isActive: option.isActive,
    };
  }

  private toServiceTranslationResponse(translation: ServiceTranslation) {
    return {
      id: translation.id,
      serviceId: translation.serviceId,
      locale: translation.locale,
      name: translation.name,
      description: translation.description ?? null,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt,
    };
  }

  private toServiceOptionTranslationResponse(
    translation: ServiceOptionTranslation,
  ) {
    return {
      id: translation.id,
      serviceOptionId: translation.serviceOptionId,
      locale: translation.locale,
      label: translation.label,
      createdAt: translation.createdAt,
      updatedAt: translation.updatedAt,
    };
  }

  private toLocalizedServiceResponse(service: MassageService, locale: string) {
    const translation = this.businessI18nService.resolveTranslation(
      service.translations,
      locale,
    );

    return {
      id: service.id,

      name: translation?.name ?? service.name,

      slug: service.slug,

      description: translation?.description ?? service.description ?? null,

      imageUrl: service.imageUrl ?? null,

      isActive: service.isActive,

      sortOrder: service.sortOrder,

      options: (service.options ?? []).map((option) =>
        this.toLocalizedOptionResponse(option, locale),
      ),
    };
  }

  private toLocalizedOptionResponse(option: ServiceOption, locale: string) {
    const translation = this.businessI18nService.resolveTranslation(
      option.translations,
      locale,
    );

    return {
      id: option.id,
      serviceId: option.serviceId,

      label:
        translation?.label ?? option.label ?? `${option.durationMinutes} phút`,

      durationMinutes: option.durationMinutes,
      defaultPrice: option.defaultPrice,
      isActive: option.isActive,
    };
  }

  /*
   * ============================================
   * UTILS
   * ============================================
   */

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private normalizeNullableText(
    value: string | null | undefined,
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const result = value.trim();

    return result || null;
  }
}
