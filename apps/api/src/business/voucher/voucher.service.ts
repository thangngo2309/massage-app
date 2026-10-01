import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { BusinessI18nService } from '../business-i18n/business-i18n.service.js';
import { Booking } from '../entities/booking.entity.js';
import { UserVoucher } from '../entities/user-voucher.entity.js';
import { TherapistService } from '../entities/therapist-service.entity.js';
import { VoucherTranslation } from '../entities/voucher-translation.entity.js';
import { Voucher } from '../entities/voucher.entity.js';
import {
  PromotionAudience,
  UserVoucherStatus,
  VoucherDiscountType,
} from '../enums/promotion.enums.js';
import { AdminVoucherQueryDto } from './dto/admin-voucher-query.dto.js';
import { CreateVoucherDto } from './dto/create-voucher.dto.js';
import { MyVoucherQueryDto } from './dto/my-voucher-query.dto.js';
import { UpdateVoucherDto } from './dto/update-voucher.dto.js';
import { VoucherTranslationDto } from './dto/voucher-translation.dto.js';
import { Promotion } from '../entities/promotion.entity.js';
import { EligibleVoucherQueryDto } from './dto/eligible-voucher-query.dto.js';
@Injectable()
export class VoucherService {
  constructor(
    @InjectRepository(Voucher)
    private readonly voucherRepository: Repository<Voucher>,
    @InjectRepository(VoucherTranslation)
    private readonly translationRepository: Repository<VoucherTranslation>,
    @InjectRepository(UserVoucher)
    private readonly userVoucherRepository: Repository<UserVoucher>,
    private readonly dataSource: DataSource,
    private readonly businessI18nService: BusinessI18nService,
    @InjectRepository(Promotion)
    private readonly promotionRepository: Repository<Promotion>,
  ) {}
  async findAll(query: AdminVoucherQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.voucherRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.translations', 'translation');
    if (query.q?.trim()) {
      qb.andWhere(
        `(
            voucher.code ILIKE :q
            OR translation.name ILIKE :q
            OR COALESCE(translation.description, '') ILIKE :q
            OR COALESCE(translation.terms, '') ILIKE :q
          )`,
        {
          q: `%${query.q.trim()}%`,
        },
      );
    }
    if (query.audience) {
      qb.andWhere('voucher.audience = :audience', {
        audience: query.audience,
      });
    }
    if (query.discountType) {
      qb.andWhere('voucher.discountType = :discountType', {
        discountType: query.discountType,
      });
    }
    if (query.isActive !== undefined) {
      qb.andWhere('voucher.isActive = :isActive', {
        isActive: query.isActive,
      });
    }
    qb.orderBy('voucher.id', 'DESC')
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
    const voucher = await this.voucherRepository.findOne({
      where: {
        id,
      },
      relations: {
        translations: true,
      },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }
    return this.toAdminResponse(voucher);
  }
  async create(dto: CreateVoucherDto) {
    const code = this.normalizeCode(dto.code);
    await this.ensureCodeUnique(code);
    await this.validateTranslations(dto.translations);
    this.validateConfiguration({
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      maxDiscountAmount: dto.maxDiscountAmount ?? null,
      startsAt: dto.startsAt ?? null,
      endsAt: dto.endsAt ?? null,
    });
    const id = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Voucher);
      const voucher = repo.create({
        code,
        audience: dto.audience ?? PromotionAudience.CLIENT,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        maxDiscountAmount: dto.maxDiscountAmount ?? null,
        minOrderAmount: dto.minOrderAmount ?? 0,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        issuanceLimit: dto.issuanceLimit ?? null,
        isActive: dto.isActive ?? true,
      });
      const saved = await repo.save(voucher);
      await this.replaceTranslations(manager, saved.id, dto.translations);
      return saved.id;
    });
    return this.findOne(id);
  }
  async update(id: number, dto: UpdateVoucherDto) {
    const current = await this.getEntity(id);
    const code =
      dto.code !== undefined ? this.normalizeCode(dto.code) : current.code;
    if (code !== current.code) {
      await this.ensureCodeUnique(code, current.id);
    }
    if (dto.translations !== undefined) {
      await this.validateTranslations(dto.translations);
    }
    const discountType = dto.discountType ?? current.discountType;
    const discountValue = dto.discountValue ?? Number(current.discountValue);
    const maxDiscountAmount =
      dto.maxDiscountAmount !== undefined
        ? dto.maxDiscountAmount
        : current.maxDiscountAmount !== null
          ? Number(current.maxDiscountAmount)
          : null;
    const startsAt =
      dto.startsAt !== undefined
        ? dto.startsAt
        : (current.startsAt?.toISOString() ?? null);
    const endsAt =
      dto.endsAt !== undefined
        ? dto.endsAt
        : (current.endsAt?.toISOString() ?? null);
    this.validateConfiguration({
      discountType,
      discountValue,
      maxDiscountAmount,
      startsAt,
      endsAt,
    });
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Voucher);
      const voucher = await repo.findOne({
        where: {
          id,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      if (!voucher) {
        throw new NotFoundException('Voucher không tồn tại');
      }
      voucher.code = code;
      voucher.discountType = discountType;
      voucher.discountValue = discountValue;
      voucher.maxDiscountAmount = maxDiscountAmount;
      if (dto.audience !== undefined) {
        voucher.audience = dto.audience;
      }
      if (dto.minOrderAmount !== undefined) {
        voucher.minOrderAmount = dto.minOrderAmount;
      }
      if (dto.startsAt !== undefined) {
        voucher.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
      }
      if (dto.endsAt !== undefined) {
        voucher.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
      }
      if (dto.issuanceLimit !== undefined) {
        voucher.issuanceLimit = dto.issuanceLimit;
      }
      if (dto.isActive !== undefined) {
        voucher.isActive = dto.isActive;
      }
      await repo.save(voucher);
      if (dto.translations !== undefined) {
        await this.replaceTranslations(manager, voucher.id, dto.translations);
      }
    });
    return this.findOne(id);
  }
  async updateActive(id: number, isActive: boolean) {
    const voucher = await this.getEntity(id);
    voucher.isActive = isActive;
    await this.voucherRepository.save(voucher);
    return this.findOne(id);
  }
  async remove(id: number) {
    const voucher = await this.getEntity(id);
    const promotionCount = await this.promotionRepository
      .createQueryBuilder('promotion')
      .where('promotion.voucherId = :id', {
        id,
      })
      .getCount();
    if (promotionCount > 0) {
      throw new ConflictException('Voucher đang được sử dụng bởi promotion');
    }
    await this.voucherRepository.softRemove(voucher);
    return {
      success: true,
      id,
    };
  }
  async getMyVouchers(
    userId: number,
    query: MyVoucherQueryDto,
    acceptLanguage?: string,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);
    const qb = this.userVoucherRepository
      .createQueryBuilder('userVoucher')
      .innerJoinAndSelect('userVoucher.voucher', 'voucher')
      .leftJoinAndSelect('voucher.translations', 'translation')
      .where('userVoucher.userId = :userId', {
        userId,
      });
    if (query.status) {
      qb.andWhere('userVoucher.status = :status', {
        status: query.status,
      });
    }
    qb.orderBy('userVoucher.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => this.toMyVoucherResponse(item, locale)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getMyVoucher(
    userId: number,
    userVoucherId: number,
    acceptLanguage?: string,
  ) {
    const item = await this.userVoucherRepository.findOne({
      where: {
        id: userVoucherId,
        userId,
      },
      relations: {
        voucher: {
          translations: true,
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Voucher không tồn tại');
    }
    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);
    return this.toMyVoucherResponse(item, locale);
  }
  async getEligibleBookingVouchers(
    userId: number,
    query: EligibleVoucherQueryDto,
    acceptLanguage?: string,
  ) {
    const therapistService = await this.dataSource
      .getRepository(TherapistService)
      .findOne({
        where: {
          therapistId: query.therapistId,
          serviceOptionId: query.serviceOptionId,
          isActive: true,
        },
      });

    if (!therapistService) {
      throw new NotFoundException(
        'Kỹ thuật viên không cung cấp dịch vụ này hoặc dịch vụ đã ngừng hoạt động',
      );
    }

    const orderAmount = Number(therapistService.price);

    if (!Number.isFinite(orderAmount) || orderAmount < 0) {
      throw new BadRequestException('Giá dịch vụ không hợp lệ');
    }

    const locale = await this.businessI18nService.resolveLocale(acceptLanguage);
    const now = new Date();

    const items = await this.userVoucherRepository
      .createQueryBuilder('userVoucher')
      .innerJoinAndSelect('userVoucher.voucher', 'voucher')
      .leftJoinAndSelect('voucher.translations', 'translation')
      .where('userVoucher.userId = :userId', { userId })
      .andWhere('userVoucher.status = :status', {
        status: UserVoucherStatus.AVAILABLE,
      })
      .andWhere('voucher.isActive = true')
      .andWhere('voucher.audience = :audience', {
        audience: PromotionAudience.CLIENT,
      })
      .andWhere('(voucher.startsAt IS NULL OR voucher.startsAt <= :now)', {
        now,
      })
      .andWhere('(voucher.endsAt IS NULL OR voucher.endsAt >= :now)', { now })
      .andWhere(
        '(userVoucher.expiresAt IS NULL OR userVoucher.expiresAt >= :now)',
        { now },
      )
      .andWhere('voucher.minOrderAmount <= :orderAmount', { orderAmount })
      .orderBy('userVoucher.expiresAt', 'ASC', 'NULLS LAST')
      .addOrderBy('userVoucher.createdAt', 'ASC')
      .getMany();

    return {
      orderAmount,
      therapistId: query.therapistId,
      serviceOptionId: query.serviceOptionId,
      items: items.map((item) => {
        const voucher = item.voucher;
        const discountAmount = this.calculateDiscountAmount(
          voucher,
          orderAmount,
        );
        const translation = this.businessI18nService.resolveTranslation(
          voucher.translations,
          locale,
        );

        return {
          userVoucherId: item.id,
          voucherId: voucher.id,
          code: voucher.code,
          discountType: voucher.discountType,
          discountValue: Number(voucher.discountValue),
          maxDiscountAmount:
            voucher.maxDiscountAmount !== null
              ? Number(voucher.maxDiscountAmount)
              : null,
          minOrderAmount: Number(voucher.minOrderAmount),
          discountAmount,
          finalAmount: Math.max(0, orderAmount - discountAmount),
          expiresAt: item.expiresAt ?? voucher.endsAt ?? null,
          sourceType: item.sourceType,
          name: translation?.name ?? voucher.code,
          description: translation?.description ?? null,
          terms: translation?.terms ?? null,
        };
      }),
    };
  }

  async prepareBookingVoucher(
    manager: EntityManager,
    input: {
      userId: number;
      userVoucherId: number | null;
      orderAmount: number;
    },
  ) {
    if (!input.userVoucherId) {
      return {
        userVoucherId: null,
        voucherId: null,
        voucherCode: null,
        discountAmount: 0,
      };
    }

    const orderAmount = Number(input.orderAmount);

    if (!Number.isFinite(orderAmount) || orderAmount < 0) {
      throw new BadRequestException('Giá trị đơn hàng không hợp lệ');
    }

    /**
     * ================================================================
     * LOCK USER VOUCHER
     * ================================================================
     *
     * Không load relation voucher trong cùng query có FOR UPDATE.
     *
     * PostgreSQL không cho phép:
     *
     * LEFT JOIN ... FOR UPDATE
     *
     * trên nullable side của outer join.
     *
     * Vì vậy:
     *
     * 1. Lock UserVoucher trước.
     * 2. Load Voucher bằng query riêng.
     */
    const userVoucherRepository = manager.getRepository(UserVoucher);

    const userVoucher = await userVoucherRepository.findOne({
      where: {
        id: input.userVoucherId,
        userId: input.userId,
      },

      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!userVoucher) {
      throw new NotFoundException(
        'Voucher không tồn tại hoặc không thuộc tài khoản',
      );
    }

    if (userVoucher.status !== UserVoucherStatus.AVAILABLE) {
      throw new BadRequestException('Voucher hiện không khả dụng');
    }

    /**
     * ================================================================
     * LOAD VOUCHER
     * ================================================================
     *
     * Load riêng sau khi UserVoucher đã được lock.
     */
    const voucherRepository = manager.getRepository(Voucher);

    const voucher = await voucherRepository.findOne({
      where: {
        id: userVoucher.voucherId,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }

    const now = new Date();

    if (!voucher.isActive) {
      throw new BadRequestException('Voucher đã ngừng hoạt động');
    }

    if (voucher.audience !== PromotionAudience.CLIENT) {
      throw new BadRequestException('Voucher không áp dụng cho khách hàng');
    }

    if (voucher.startsAt && voucher.startsAt > now) {
      throw new BadRequestException('Voucher chưa đến thời gian sử dụng');
    }

    if (voucher.endsAt && voucher.endsAt < now) {
      throw new BadRequestException('Voucher đã hết hạn');
    }

    if (userVoucher.expiresAt && userVoucher.expiresAt < now) {
      throw new BadRequestException('Voucher đã hết hạn');
    }

    const minOrderAmount = Number(voucher.minOrderAmount);

    if (orderAmount < minOrderAmount) {
      throw new BadRequestException({
        code: 'VOUCHER_MIN_ORDER_NOT_MET',
        message: 'Đơn hàng chưa đạt giá trị tối thiểu để sử dụng voucher',
        minOrderAmount,
        orderAmount,
      });
    }

    const discountAmount = this.calculateDiscountAmount(voucher, orderAmount);

    return {
      userVoucherId: userVoucher.id,
      voucherId: voucher.id,
      voucherCode: voucher.code,
      discountAmount,
    };
  }

  async reserveBookingVoucher(
    manager: EntityManager,
    userVoucherId: number,
    userId: number,
    bookingId: number,
  ) {
    const repository = manager.getRepository(UserVoucher);
    const userVoucher = await repository.findOne({
      where: {
        id: userVoucherId,
        userId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });
    if (!userVoucher) {
      throw new NotFoundException(
        'Voucher không tồn tại hoặc không thuộc tài khoản',
      );
    }
    if (
      userVoucher.status === UserVoucherStatus.RESERVED &&
      userVoucher.reservedBookingId === bookingId
    ) {
      return userVoucher;
    }
    if (userVoucher.status !== UserVoucherStatus.AVAILABLE) {
      throw new BadRequestException(
        'Voucher đã được sử dụng hoặc đang được giữ',
      );
    }
    userVoucher.status = UserVoucherStatus.RESERVED;
    userVoucher.reservedAt = new Date();
    userVoucher.reservedBookingId = bookingId;
    return repository.save(userVoucher);
  }
  async markBookingVoucherUsed(manager: EntityManager, booking: Booking) {
    if (!booking.userVoucherId) {
      return;
    }
    const repository = manager.getRepository(UserVoucher);
    const userVoucher = await repository.findOne({
      where: {
        id: booking.userVoucherId,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });
    if (!userVoucher) {
      throw new NotFoundException('Voucher của booking không tồn tại');
    }
    if (
      userVoucher.status === UserVoucherStatus.USED &&
      userVoucher.usedBookingId === booking.id
    ) {
      return;
    }
    if (
      userVoucher.status !== UserVoucherStatus.RESERVED ||
      userVoucher.reservedBookingId !== booking.id
    ) {
      throw new BadRequestException(
        'Trạng thái voucher của booking không hợp lệ',
      );
    }
    userVoucher.status = UserVoucherStatus.USED;
    userVoucher.usedAt = new Date();
    userVoucher.usedBookingId = booking.id;
    userVoucher.reservedAt = null;
    userVoucher.reservedBookingId = null;
    return repository.save(userVoucher);
  }

  async releaseBookingVoucher(manager: EntityManager, booking: Booking) {
    if (!booking.userVoucherId) {
      return;
    }

    /**
     * ================================================================
     * LOCK USER VOUCHER
     * ================================================================
     *
     * Không load Voucher relation trong query có FOR UPDATE.
     */
    const userVoucherRepository = manager.getRepository(UserVoucher);

    const userVoucher = await userVoucherRepository.findOne({
      where: {
        id: booking.userVoucherId,
      },

      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!userVoucher) {
      return;
    }

    if (userVoucher.status === UserVoucherStatus.AVAILABLE) {
      return;
    }

    if (
      userVoucher.status !== UserVoucherStatus.RESERVED ||
      userVoucher.reservedBookingId !== booking.id
    ) {
      return;
    }

    /**
     * Voucher được load bằng query riêng.
     */
    const voucher = await manager.getRepository(Voucher).findOne({
      where: {
        id: userVoucher.voucherId,
      },
    });

    const now = new Date();

    const userVoucherExpired =
      userVoucher.expiresAt !== null && userVoucher.expiresAt < now;

    const voucherExpired = voucher?.endsAt != null && voucher.endsAt < now;

    const expired = userVoucherExpired || voucherExpired;

    userVoucher.status = expired
      ? UserVoucherStatus.EXPIRED
      : UserVoucherStatus.AVAILABLE;

    userVoucher.reservedAt = null;
    userVoucher.reservedBookingId = null;

    return userVoucherRepository.save(userVoucher);
  }

  private calculateDiscountAmount(voucher: Voucher, orderAmount: number) {
    let discountAmount = 0;

    if (voucher.discountType === VoucherDiscountType.FIXED) {
      discountAmount = Number(voucher.discountValue);
    } else {
      discountAmount = Math.round(
        orderAmount * (Number(voucher.discountValue) / 100),
      );

      if (voucher.maxDiscountAmount !== null) {
        discountAmount = Math.min(
          discountAmount,
          Number(voucher.maxDiscountAmount),
        );
      }
    }

    return Math.max(0, Math.min(discountAmount, orderAmount));
  }

  private validateConfiguration(input: {
    discountType: VoucherDiscountType;
    discountValue: number;
    maxDiscountAmount: number | null;
    startsAt: string | null;
    endsAt: string | null;
  }) {
    if (input.discountValue <= 0) {
      throw new BadRequestException('Giá trị giảm phải lớn hơn 0');
    }
    if (
      input.discountType === VoucherDiscountType.PERCENT &&
      input.discountValue > 100
    ) {
      throw new BadRequestException(
        'Voucher phần trăm không được lớn hơn 100%',
      );
    }
    if (input.maxDiscountAmount !== null && input.maxDiscountAmount <= 0) {
      throw new BadRequestException('Mức giảm tối đa phải lớn hơn 0');
    }
    if (
      input.startsAt &&
      input.endsAt &&
      new Date(input.endsAt) <= new Date(input.startsAt)
    ) {
      throw new BadRequestException(
        'Thời gian kết thúc phải sau thời gian bắt đầu',
      );
    }
  }
  private async validateTranslations(translations: VoucherTranslationDto[]) {
    if (!translations.length) {
      throw new BadRequestException('Voucher phải có ít nhất một bản dịch');
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
    voucherId: number,
    translations: VoucherTranslationDto[],
  ) {
    const repo = manager.getRepository(VoucherTranslation);
    await repo.delete({
      voucherId,
    });
    if (!translations.length) {
      return;
    }
    await repo.save(
      translations.map((translation) =>
        repo.create({
          voucherId,
          locale: this.businessI18nService.normalizeLocale(translation.locale),
          name: translation.name.trim(),
          description: this.normalizeNullableText(translation.description),
          terms: this.normalizeNullableText(translation.terms),
        }),
      ),
    );
  }
  private async getEntity(id: number) {
    const voucher = await this.voucherRepository.findOne({
      where: {
        id,
      },
    });
    if (!voucher) {
      throw new NotFoundException('Voucher không tồn tại');
    }
    return voucher;
  }
  private async ensureCodeUnique(code: string, excludeId?: number) {
    const existing = await this.voucherRepository.findOne({
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
      throw new ConflictException('Mã voucher đã tồn tại');
    }
  }
  private normalizeCode(value: string) {
    const code = value.trim().toUpperCase().replace(/\s+/g, '_');
    if (!code) {
      throw new BadRequestException('Mã voucher không hợp lệ');
    }
    return code;
  }
  private normalizeNullableText(value: string | null | undefined) {
    if (value === undefined || value === null) {
      return null;
    }
    return value.trim() || null;
  }
  private toAdminResponse(voucher: Voucher) {
    return {
      id: voucher.id,
      code: voucher.code,
      audience: voucher.audience,
      discountType: voucher.discountType,
      discountValue: Number(voucher.discountValue),
      maxDiscountAmount:
        voucher.maxDiscountAmount !== null
          ? Number(voucher.maxDiscountAmount)
          : null,
      minOrderAmount: Number(voucher.minOrderAmount),
      startsAt: voucher.startsAt,
      endsAt: voucher.endsAt,
      issuanceLimit: voucher.issuanceLimit,
      isActive: voucher.isActive,
      translations: (voucher.translations ?? [])
        .map((translation) => ({
          id: translation.id,
          locale: translation.locale,
          name: translation.name,
          description: translation.description ?? null,
          terms: translation.terms ?? null,
        }))
        .sort((a, b) => a.locale.localeCompare(b.locale)),
      createdAt: voucher.createdAt,
      updatedAt: voucher.updatedAt,
    };
  }
  private toMyVoucherResponse(item: UserVoucher, locale: string) {
    const translation = this.businessI18nService.resolveTranslation(
      item.voucher.translations,
      locale,
    );
    return {
      id: item.id,
      status: item.status,
      expiresAt: item.expiresAt,
      reservedAt: item.reservedAt,
      reservedBookingId: item.reservedBookingId,
      usedAt: item.usedAt,
      usedBookingId: item.usedBookingId,
      sourceType: item.sourceType,
      voucher: {
        id: item.voucher.id,
        code: item.voucher.code,
        audience: item.voucher.audience,
        discountType: item.voucher.discountType,
        discountValue: Number(item.voucher.discountValue),
        maxDiscountAmount:
          item.voucher.maxDiscountAmount !== null
            ? Number(item.voucher.maxDiscountAmount)
            : null,
        minOrderAmount: Number(item.voucher.minOrderAmount),
        startsAt: item.voucher.startsAt,
        endsAt: item.voucher.endsAt,
        locale,
        name: translation?.name ?? item.voucher.code,
        description: translation?.description ?? null,
        terms: translation?.terms ?? null,
      },
      createdAt: item.createdAt,
    };
  }
}
