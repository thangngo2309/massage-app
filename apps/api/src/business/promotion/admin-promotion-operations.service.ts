import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';

import { PromotionUsage } from '../entities/promotion-usage.entity.js';
import { Referral } from '../entities/referral.entity.js';
import { UserReferralCode } from '../entities/user-referral-code.entity.js';
import { UserVoucher } from '../entities/user-voucher.entity.js';
import { User } from '../entities/user.entity.js';
import { Voucher } from '../entities/voucher.entity.js';
import { WalletTransaction } from '../entities/wallet-transaction.entity.js';
import { Wallet } from '../entities/wallet.entity.js';
import { UserRole, UserStatus } from '../enums/business.enums.js';
import {
  PromotionAudience,
  UserVoucherSourceType,
  UserVoucherStatus,
} from '../enums/promotion.enums.js';
import { AdminGrantUserVoucherDto } from './dto/admin-grant-user-voucher.dto.js';
import {
  AdminPromotionUsageQueryDto,
  AdminReferralCodeQueryDto,
  AdminReferralQueryDto,
  AdminUserVoucherQueryDto,
  AdminWalletQueryDto,
  AdminWalletTransactionQueryDto,
} from './dto/admin-promotion-operations-query.dto.js';

@Injectable()
export class AdminPromotionOperationsService {
  constructor(
    @InjectRepository(PromotionUsage)
    private readonly promotionUsageRepository: Repository<PromotionUsage>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(UserReferralCode)
    private readonly referralCodeRepository: Repository<UserReferralCode>,
    @InjectRepository(UserVoucher)
    private readonly userVoucherRepository: Repository<UserVoucher>,
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    private readonly dataSource: DataSource,
  ) {}

  async getSummary() {
    const [promotionUsages, referrals, userVouchers, wallets] =
      await Promise.all([
        this.promotionUsageRepository.count(),
        this.referralRepository.count(),
        this.userVoucherRepository.count(),
        this.walletRepository.count(),
      ]);

    const voucherStatusRows = await this.userVoucherRepository
      .createQueryBuilder('uv')
      .select('uv.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('uv.status')
      .getRawMany<{ status: string; count: string }>();

    const referralStatusRows = await this.referralRepository
      .createQueryBuilder('referral')
      .select('referral.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('referral.status')
      .getRawMany<{ status: string; count: string }>();

    const walletRows = await this.walletRepository
      .createQueryBuilder('wallet')
      .select('wallet.type', 'type')
      .addSelect('COALESCE(SUM(wallet.balance), 0)', 'balance')
      .groupBy('wallet.type')
      .getRawMany<{ type: string; balance: string }>();

    return {
      totals: { promotionUsages, referrals, userVouchers, wallets },
      userVouchersByStatus: Object.fromEntries(
        voucherStatusRows.map((row) => [row.status, Number(row.count)]),
      ),
      referralsByStatus: Object.fromEntries(
        referralStatusRows.map((row) => [row.status, Number(row.count)]),
      ),
      walletBalanceByType: Object.fromEntries(
        walletRows.map((row) => [row.type, Number(row.balance)]),
      ),
    };
  }

  async getPromotionUsages(query: AdminPromotionUsageQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.promotionUsageRepository
      .createQueryBuilder('usage')
      .innerJoinAndSelect('usage.promotion', 'promotion')
      .innerJoinAndSelect('usage.user', 'user')
      .leftJoinAndSelect('usage.booking', 'booking');

    if (query.promotionId)
      qb.andWhere('usage.promotionId = :promotionId', {
        promotionId: query.promotionId,
      });
    if (query.userId)
      qb.andWhere('usage.userId = :userId', { userId: query.userId });
    if (query.bookingId)
      qb.andWhere('usage.bookingId = :bookingId', {
        bookingId: query.bookingId,
      });
    if (query.referralId)
      qb.andWhere('usage.referralId = :referralId', {
        referralId: query.referralId,
      });
    if (query.q?.trim()) {
      qb.andWhere(
        `(promotion.code ILIKE :q OR user.fullName ILIKE :q OR user.phone ILIKE :q OR usage.uniqueKey ILIKE :q)`,
        { q: `%${query.q.trim()}%` },
      );
    }

    qb.orderBy('usage.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => ({
        id: item.id,
        promotionId: item.promotionId,
        promotionCode: item.promotion?.code ?? null,
        userId: item.userId,
        user: item.user
          ? {
              id: item.user.id,
              fullName: item.user.fullName,
              phone: item.user.phone,
              role: item.user.role,
            }
          : null,
        bookingId: item.bookingId,
        bookingCode: item.booking?.bookingCode ?? null,
        referralId: item.referralId,
        rewardAmount: Number(item.rewardAmount),
        uniqueKey: item.uniqueKey,
        createdAt: item.createdAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  async getReferrals(query: AdminReferralQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.referralRepository
      .createQueryBuilder('referral')
      .innerJoinAndSelect('referral.referrerUser', 'referrer')
      .innerJoinAndSelect('referral.referredUser', 'referred')
      .innerJoinAndSelect('referral.referralCode', 'referralCode');

    if (query.status)
      qb.andWhere('referral.status = :status', { status: query.status });
    if (query.referrerUserId)
      qb.andWhere('referral.referrerUserId = :referrerUserId', {
        referrerUserId: query.referrerUserId,
      });
    if (query.referredUserId)
      qb.andWhere('referral.referredUserId = :referredUserId', {
        referredUserId: query.referredUserId,
      });
    if (query.q?.trim()) {
      qb.andWhere(
        `(referral.referralCodeSnapshot ILIKE :q OR referrer.fullName ILIKE :q OR referrer.phone ILIKE :q OR referred.fullName ILIKE :q OR referred.phone ILIKE :q)`,
        { q: `%${query.q.trim()}%` },
      );
    }

    qb.orderBy('referral.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => ({
        id: item.id,
        referralCode: item.referralCodeSnapshot,
        status: item.status,
        referrer: this.userSummary(item.referrerUser),
        referred: this.userSummary(item.referredUser),
        qualifiedAt: item.qualifiedAt,
        rewardedAt: item.rewardedAt,
        createdAt: item.createdAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  async getReferralCodes(query: AdminReferralCodeQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.referralCodeRepository
      .createQueryBuilder('code')
      .innerJoinAndSelect('code.user', 'user');

    if (query.userId)
      qb.andWhere('code.userId = :userId', { userId: query.userId });
    if (query.isActive !== undefined)
      qb.andWhere('code.isActive = :isActive', { isActive: query.isActive });
    if (query.q?.trim()) {
      qb.andWhere(
        '(code.code ILIKE :q OR user.fullName ILIKE :q OR user.phone ILIKE :q)',
        { q: `%${query.q.trim()}%` },
      );
    }

    qb.orderBy('code.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => ({
        id: item.id,
        code: item.code,
        isActive: item.isActive,
        user: this.userSummary(item.user),
        createdAt: item.createdAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  async getUserVouchers(query: AdminUserVoucherQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.userVoucherRepository
      .createQueryBuilder('uv')
      .innerJoinAndSelect('uv.user', 'user')
      .innerJoinAndSelect('uv.voucher', 'voucher');

    if (query.userId)
      qb.andWhere('uv.userId = :userId', { userId: query.userId });
    if (query.voucherId)
      qb.andWhere('uv.voucherId = :voucherId', { voucherId: query.voucherId });
    if (query.status)
      qb.andWhere('uv.status = :status', { status: query.status });
    if (query.sourceType)
      qb.andWhere('uv.sourceType = :sourceType', {
        sourceType: query.sourceType,
      });
    if (query.q?.trim()) {
      qb.andWhere(
        '(voucher.code ILIKE :q OR user.fullName ILIKE :q OR user.phone ILIKE :q OR uv.sourceReferenceId ILIKE :q)',
        { q: `%${query.q.trim()}%` },
      );
    }

    qb.orderBy('uv.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => ({
        id: item.id,
        user: this.userSummary(item.user),
        voucher: {
          id: item.voucher.id,
          code: item.voucher.code,
          audience: item.voucher.audience,
          discountType: item.voucher.discountType,
          discountValue: Number(item.voucher.discountValue),
        },
        status: item.status,
        sourceType: item.sourceType,
        sourceReferenceId: item.sourceReferenceId,
        expiresAt: item.expiresAt,
        reservedAt: item.reservedAt,
        reservedBookingId: item.reservedBookingId,
        usedAt: item.usedAt,
        usedBookingId: item.usedBookingId,
        createdAt: item.createdAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  async grantUserVoucher(adminUserId: number, dto: AdminGrantUserVoucherDto) {
    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .getRepository(User)
        .findOne({ where: { id: dto.userId } });
      if (!user) throw new NotFoundException('Người dùng không tồn tại');
      if (user.status !== UserStatus.ACTIVE)
        throw new BadRequestException(
          'Người dùng không ở trạng thái hoạt động',
        );
      if (user.role !== UserRole.CLIENT && user.role !== UserRole.THERAPIST)
        throw new BadRequestException('Loại tài khoản không hỗ trợ voucher');

      const voucher = await manager.getRepository(Voucher).findOne({
        where: { id: dto.voucherId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!voucher) throw new NotFoundException('Voucher không tồn tại');
      if (!voucher.isActive)
        throw new BadRequestException('Voucher đang ngừng hoạt động');

      const expectedAudience =
        user.role === UserRole.CLIENT
          ? PromotionAudience.CLIENT
          : PromotionAudience.THERAPIST;
      if (voucher.audience !== expectedAudience)
        throw new BadRequestException(
          'Voucher không áp dụng cho loại tài khoản này',
        );

      const now = new Date();
      if (voucher.startsAt && voucher.startsAt > now)
        throw new BadRequestException('Voucher chưa bắt đầu hiệu lực');
      if (voucher.endsAt && voucher.endsAt < now)
        throw new BadRequestException('Voucher đã hết hạn');

      const repo = manager.getRepository(UserVoucher);
      if (voucher.issuanceLimit !== null) {
        const issued = await repo.count({ where: { voucherId: voucher.id } });
        if (issued >= voucher.issuanceLimit)
          throw new ConflictException('Voucher đã đạt giới hạn phát hành');
      }

      let expiresAt = dto.expiresAt
        ? new Date(dto.expiresAt)
        : (voucher.endsAt ?? null);
      if (expiresAt && expiresAt <= now)
        throw new BadRequestException(
          'Thời hạn voucher được cấp phải ở tương lai',
        );
      if (voucher.endsAt && expiresAt && expiresAt > voucher.endsAt)
        expiresAt = voucher.endsAt;

      const entity = repo.create({
        userId: user.id,
        voucherId: voucher.id,
        status: UserVoucherStatus.AVAILABLE,
        sourceType: UserVoucherSourceType.ADMIN,
        sourceReferenceId: `admin:${adminUserId}:${randomUUID()}`,
        expiresAt,
        reservedAt: null,
        reservedBookingId: null,
        usedAt: null,
        usedBookingId: null,
      });
      const saved = await repo.save(entity);
      return {
        id: saved.id,
        userId: saved.userId,
        voucherId: saved.voucherId,
        status: saved.status,
        sourceType: saved.sourceType,
        expiresAt: saved.expiresAt,
        createdAt: saved.createdAt,
      };
    });
  }

  async cancelUserVoucher(id: number) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(UserVoucher);
      const item = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!item) throw new NotFoundException('User voucher không tồn tại');
      if (item.status === UserVoucherStatus.CANCELLED) return item;
      if (
        item.status !== UserVoucherStatus.AVAILABLE &&
        item.status !== UserVoucherStatus.EXPIRED
      ) {
        throw new ConflictException(
          'Chỉ có thể hủy voucher đang khả dụng hoặc đã hết hạn',
        );
      }
      item.status = UserVoucherStatus.CANCELLED;
      item.reservedAt = null;
      item.reservedBookingId = null;
      return repo.save(item);
    });
  }

  async getWallets(query: AdminWalletQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.walletRepository
      .createQueryBuilder('wallet')
      .innerJoinAndSelect('wallet.user', 'user');
    if (query.userId)
      qb.andWhere('wallet.userId = :userId', { userId: query.userId });
    if (query.role) qb.andWhere('user.role = :role', { role: query.role });
    if (query.walletType)
      qb.andWhere('wallet.type = :walletType', {
        walletType: query.walletType,
      });
    if (query.q?.trim())
      qb.andWhere(
        "(user.fullName ILIKE :q OR user.phone ILIKE :q OR COALESCE(user.email, '') ILIKE :q)",
        { q: `%${query.q.trim()}%` },
      );
    qb.orderBy('wallet.updatedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        balance: Number(item.balance),
        user: this.userSummary(item.user),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  async getWalletTransactions(query: AdminWalletTransactionQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.walletTransactionRepository
      .createQueryBuilder('tx')
      .innerJoinAndSelect('tx.wallet', 'wallet')
      .innerJoinAndSelect('wallet.user', 'user');
    if (query.userId)
      qb.andWhere('wallet.userId = :userId', { userId: query.userId });
    if (query.walletId)
      qb.andWhere('tx.walletId = :walletId', { walletId: query.walletId });
    if (query.walletType)
      qb.andWhere('wallet.type = :walletType', {
        walletType: query.walletType,
      });
    if (query.type) qb.andWhere('tx.type = :type', { type: query.type });
    if (query.referenceId?.trim())
      qb.andWhere('tx.referenceId ILIKE :referenceId', {
        referenceId: `%${query.referenceId.trim()}%`,
      });
    if (query.q?.trim())
      qb.andWhere(
        "(user.fullName ILIKE :q OR user.phone ILIKE :q OR COALESCE(tx.description, '') ILIKE :q)",
        { q: `%${query.q.trim()}%` },
      );
    qb.orderBy('tx.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return {
      items: items.map((item) => ({
        id: item.id,
        walletId: item.walletId,
        walletType: item.wallet.type,
        user: this.userSummary(item.wallet.user),
        amount: Number(item.amount),
        type: item.type,
        referenceId: item.referenceId,
        description: item.description,
        createdAt: item.createdAt,
      })),
      pagination: this.pagination(page, limit, total),
    };
  }

  private userSummary(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }

  private pagination(page: number, limit: number, total: number) {
    return { page, limit, total, totalPages: Math.ceil(total / limit) };
  }
}
