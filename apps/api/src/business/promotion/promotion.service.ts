import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';

import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';
import { PromotionTranslation } from '../entities/promotion-translation.entity.js';
import { Promotion } from '../entities/promotion.entity.js';
import { Voucher } from '../entities/voucher.entity.js';
import { PromotionRewardType } from '../enums/promotion.enums.js';
import { AdminPromotionQueryDto } from './dto/admin-promotion-query.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { PromotionTranslationDto } from './dto/promotion-translation.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,

    @InjectRepository(PromotionTranslation)
    private readonly translationRepository: Repository<PromotionTranslation>,

    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,

    private readonly dataSource: DataSource,

    private readonly businessI18nService: BusinessI18nService,
  ) {}

  async findAll(query: AdminPromotionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.promotionRepository
      .createQueryBuilder('promotion')
      .leftJoinAndSelect('promotion.translations', 'translation');

    if (query.q?.trim()) {
      qb.andWhere(
        `(
            promotion.code ILIKE :q
            OR translation.name ILIKE :q
            OR COALESCE(translation.description, '') ILIKE :q
          )`,
        {
          q: `%${query.q.trim()}%`,
        },
      );
    }

    if (query.audience) {
      qb.andWhere('promotion.audience = :audience', {
        audience: query.audience,
      });
    }

    if (query.triggerType) {
      qb.andWhere('promotion.triggerType = :triggerType', {
        triggerType: query.triggerType,
      });
    }

    if (query.rewardType) {
      qb.andWhere('promotion.rewardType = :rewardType', {
        rewardType: query.rewardType,
      });
    }

    if (query.isActive !== undefined) {
      qb.andWhere('promotion.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    qb.orderBy('promotion.id', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toAdminResponse(item)),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: {
        id,
      },
      relations: {
        translations: true,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion không tồn tại');
    }

    return this.toAdminResponse(promotion);
  }

  async create(dto: CreatePromotionDto) {
    const code = this.normalizeCode(dto.code);

    await this.ensureCodeUnique(code);

    await this.validateTranslations(dto.translations);

    await this.validateConfiguration({
      rewardType: dto.rewardType,
      rewardValue: dto.rewardValue ?? 0,
      voucherId: dto.voucherId ?? null,
      startsAt: dto.startsAt ?? null,
      endsAt: dto.endsAt ?? null,
    });

    const id = await this.dataSource.transaction(async (manager) => {
      const promotionRepo = manager.getRepository(Promotion);

      const promotion = promotionRepo.create({
        code,
        audience: dto.audience,
        triggerType: dto.triggerType,
        rewardType: dto.rewardType,
        rewardRecipient: dto.rewardRecipient,
        rewardValue: dto.rewardValue ?? 0,
        voucherId: dto.voucherId ?? null,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        usageLimit: dto.usageLimit ?? null,
        usageLimitPerUser: dto.usageLimitPerUser ?? null,
        isActive: dto.isActive ?? true,
      });

      const saved = await promotionRepo.save(promotion);

      await this.replaceTranslations(manager, saved.id, dto.translations);

      return saved.id;
    });

    return this.findOne(id);
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const current = await this.getEntity(id);

    const code =
      dto.code !== undefined ? this.normalizeCode(dto.code) : current.code;

    if (code !== current.code) {
      await this.ensureCodeUnique(code, current.id);
    }

    if (dto.translations !== undefined) {
      await this.validateTranslations(dto.translations);
    }

    const rewardType = dto.rewardType ?? current.rewardType;

    const rewardValue = dto.rewardValue ?? Number(current.rewardValue);

    const voucherId =
      dto.voucherId !== undefined ? dto.voucherId : current.voucherId;

    const startsAt =
      dto.startsAt !== undefined
        ? dto.startsAt
        : (current.startsAt?.toISOString() ?? null);

    const endsAt =
      dto.endsAt !== undefined
        ? dto.endsAt
        : (current.endsAt?.toISOString() ?? null);

    await this.validateConfiguration({
      rewardType,
      rewardValue,
      voucherId,
      startsAt,
      endsAt,
    });

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Promotion);

      const promotion = await repo.findOne({
        where: {
          id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!promotion) {
        throw new NotFoundException('Promotion không tồn tại');
      }

      promotion.code = code;

      if (dto.audience !== undefined) {
        promotion.audience = dto.audience;
      }

      if (dto.triggerType !== undefined) {
        promotion.triggerType = dto.triggerType;
      }

      promotion.rewardType = rewardType;

      if (dto.rewardRecipient !== undefined) {
        promotion.rewardRecipient = dto.rewardRecipient;
      }

      promotion.rewardValue = rewardValue;

      promotion.voucherId = voucherId ?? null;

      if (dto.startsAt !== undefined) {
        promotion.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
      }

      if (dto.endsAt !== undefined) {
        promotion.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
      }

      if (dto.usageLimit !== undefined) {
        promotion.usageLimit = dto.usageLimit;
      }

      if (dto.usageLimitPerUser !== undefined) {
        promotion.usageLimitPerUser = dto.usageLimitPerUser;
      }

      if (dto.isActive !== undefined) {
        promotion.isActive = dto.isActive;
      }

      await repo.save(promotion);

      if (dto.translations !== undefined) {
        await this.replaceTranslations(manager, promotion.id, dto.translations);
      }
    });

    return this.findOne(id);
  }

  async updateActive(id: number, isActive: boolean) {
    const promotion = await this.getEntity(id);

    promotion.isActive = isActive;

    await this.promotionRepository.save(promotion);

    return this.findOne(id);
  }

  async remove(id: number) {
    const promotion = await this.getEntity(id);

    await this.promotionRepository.softRemove(promotion);

    return {
      success: true,
      id,
    };
  }

  async findActiveForLocale(id: number, acceptLanguage?: string) {
    const promotion = await this.promotionRepository.findOne({
      where: {
        id,
        isActive: true,
      },
      relations: {
        translations: true,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion không tồn tại');
    }

    const now = new Date();

    if (promotion.startsAt && promotion.startsAt > now) {
      throw new NotFoundException('Promotion chưa có hiệu lực');
    }

    if (promotion.endsAt && promotion.endsAt < now) {
      throw new NotFoundException('Promotion đã hết hạn');
    }

    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);

    const translation = this.businessI18nService.resolveTranslation(
      promotion.translations,
      locale,
    );

    return {
      id: promotion.id,
      code: promotion.code,
      audience: promotion.audience,
      triggerType: promotion.triggerType,
      rewardType: promotion.rewardType,
      rewardRecipient: promotion.rewardRecipient,
      rewardValue: Number(promotion.rewardValue),
      voucherId: promotion.voucherId,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      locale,
      name: translation?.name ?? promotion.code,
      description: translation?.description ?? null,
    };
  }

  private async validateConfiguration(input: {
    rewardType: PromotionRewardType;
    rewardValue: number;
    voucherId: number | null;
    startsAt: string | null;
    endsAt: string | null;
  }) {
    if (
      input.startsAt &&
      input.endsAt &&
      new Date(input.endsAt) <= new Date(input.startsAt)
    ) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    }

    if (input.rewardType === PromotionRewardType.WALLET_CREDIT) {
      if (input.rewardValue <= 0) {
        throw new BadRequestException(
          'Promotion cộng ví phải có rewardValue lớn hơn 0',
        );
      }

      if (input.voucherId !== null) {
        throw new BadRequestException(
          'Promotion cộng ví không được cấu hình voucherId',
        );
      }

      return;
    }

    if (input.rewardType === PromotionRewardType.VOUCHER) {
      if (!input.voucherId) {
        throw new BadRequestException(
          'Promotion cấp voucher phải có voucherId',
        );
      }

      const voucher = await this.voucherRepository.findOne({
        where: {
          id: input.voucherId,
        },
      });

      if (!voucher) {
        throw new BadRequestException(
          'Voucher được cấu hình cho promotion không tồn tại',
        );
      }
    }
  }

  private async validateTranslations(translations: PromotionTranslationDto[]) {
    if (!translations.length) {
      throw new BadRequestException('Promotion phải có ít nhất một bản dịch');
    }

    const locales = translations.map((item) =>
      this.businessI18nService.normalizeLocale(item.locale),
    );

    if (
      new Set(locales.map((item) => item.toLowerCase())).size !== locales.length
    ) {
      throw new BadRequestException(
        'Không được khai báo trùng locale trong translations',
      );
    }

    await this.businessI18nService.validateLocales(locales);
  }

  private async replaceTranslations(
    manager: EntityManager,
    promotionId: number,
    translations: PromotionTranslationDto[],
  ) {
    const repo = manager.getRepository(PromotionTranslation);

    await repo.delete({
      promotionId,
    });

    if (!translations.length) {
      return;
    }

    const entities = translations.map((translation) =>
      repo.create({
        promotionId,
        locale: this.businessI18nService.normalizeLocale(translation.locale),
        name: translation.name.trim(),
        description: this.normalizeNullableText(translation.description),
      }),
    );

    await repo.save(entities);
  }

  private async getEntity(id: number) {
    const promotion = await this.promotionRepository.findOne({
      where: {
        id,
      },
    });

    if (!promotion) {
      throw new NotFoundException('Promotion không tồn tại');
    }

    return promotion;
  }

  private async ensureCodeUnique(code: string, excludeId?: number) {
    const existing = await this.promotionRepository.findOne({
      where: excludeId
        ? {
            code,
            id: Not(excludeId),
          }
        : {
            code,
          },
    });

    if (existing) {
      throw new ConflictException('Mã promotion đã tồn tại');
    }
  }

  private normalizeCode(value: string) {
    const result = value.trim().toUpperCase().replace(/\s+/g, '_');

    if (!result) {
      throw new BadRequestException('Mã promotion không hợp lệ');
    }

    return result;
  }

  private normalizeNullableText(
    value: string | null | undefined,
  ): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const result = value.trim();

    return result || null;
  }

  private toAdminResponse(promotion: Promotion) {
    return {
      id: promotion.id,
      code: promotion.code,
      audience: promotion.audience,
      triggerType: promotion.triggerType,
      rewardType: promotion.rewardType,
      rewardRecipient: promotion.rewardRecipient,
      rewardValue: Number(promotion.rewardValue),
      voucherId: promotion.voucherId,
      startsAt: promotion.startsAt,
      endsAt: promotion.endsAt,
      usageLimit: promotion.usageLimit,
      usageLimitPerUser: promotion.usageLimitPerUser,
      isActive: promotion.isActive,

      translations: (promotion.translations ?? [])
        .map((translation) => ({
          id: translation.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? null,
        }))
        .sort((a, b) => a.locale.localeCompare(b.locale)),

      createdAt: promotion.createdAt,
      updatedAt: promotion.updatedAt,
    };
  }
}
