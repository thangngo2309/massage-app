import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { MassageService } from '../entities/service.entity.js';
import { ServiceOption } from '../entities/service-option.entity.js';
import { AdminServiceQueryDto } from './dto/admin-service-query.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CreateServiceOptionDto } from './dto/create-service-option.dto.js';
import { UpdateServiceOptionDto } from './dto/update-service-option.dto.js';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(MassageService)
    private readonly serviceRepository: Repository<MassageService>,
    @InjectRepository(ServiceOption)
    private readonly optionRepository: Repository<ServiceOption>,
  ) {}

  async findAll(query: AdminServiceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    /**
     * ============================================
     * 1. QUERY SERVICES
     * ============================================
     */
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

    /**
     * ============================================
     * 2. COUNT OPTIONS
     * ============================================
     *
     * Chỉ count option của những service
     * đang xuất hiện trong page hiện tại.
     */
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

    /**
     * ============================================
     * 3. RESPONSE
     * ============================================
     */
    return {
      items: services.map((service: MassageService) => ({
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
    const option = await this.optionRepository.findOne({
      where: {
        id: optionId,
        serviceId,
      },
    });

    if (!option) {
      throw new NotFoundException('Gói dịch vụ không tồn tại');
    }

    option.isActive = isActive;

    const saved = await this.optionRepository.save(option);

    return this.toOptionResponse(saved);
  }

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
}
