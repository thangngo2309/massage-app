import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { randomBytes } from 'node:crypto';

import { DataSource, Repository } from 'typeorm';

import { Referral } from '../entities/referral.entity.js';
import { UserReferralCode } from '../entities/user-referral-code.entity.js';
import { User } from '../entities/user.entity.js';

import { UserRole, UserStatus } from '../enums/business.enums.js';

import {
  PromotionTriggerType,
  ReferralStatus,
} from '../enums/promotion.enums.js';

import { PromotionRewardService } from '../promotion/promotion-reward.service.js';

@Injectable()
export class ReferralService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserReferralCode)
    private readonly referralCodeRepository: Repository<UserReferralCode>,

    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,

    private readonly promotionRewardService: PromotionRewardService,

    private readonly dataSource: DataSource,
  ) {}

  async getMyReferralInfo(userId: number) {
    const user = await this.getEligibleUser(userId);

    const code = await this.getOrCreateReferralCode(user.id);

    const referredBy = await this.referralRepository.findOne({
      where: {
        referredUserId: user.id,
      },
    });

    const referralCount = await this.referralRepository.count({
      where: {
        referrerUserId: user.id,
      },
    });

    const qualifiedCount = await this.referralRepository.count({
      where: {
        referrerUserId: user.id,
        status: ReferralStatus.QUALIFIED,
      },
    });

    const rewardedCount = await this.referralRepository.count({
      where: {
        referrerUserId: user.id,
        status: ReferralStatus.REWARDED,
      },
    });

    return {
      referralCode: code.code,

      referredBy: referredBy
        ? {
            referralId: referredBy.id,
            code: referredBy.referralCodeSnapshot,
            status: referredBy.status,
            qualifiedAt: referredBy.qualifiedAt,
            rewardedAt: referredBy.rewardedAt,
          }
        : null,

      stats: {
        total: referralCount,
        qualified: qualifiedCount,
        rewarded: rewardedCount,
      },
    };
  }

  async getOrCreateReferralCode(userId: number) {
    await this.getEligibleUser(userId);

    const existing = await this.referralCodeRepository.findOne({
      where: {
        userId,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const codeRepo = manager.getRepository(UserReferralCode);

      const user = await userRepo.findOne({
        where: {
          id: userId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      const active = await codeRepo.findOne({
        where: {
          userId,
          isActive: true,
        },
      });

      if (active) {
        return active;
      }

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const code = this.generateReferralCode(user);

        const duplicate = await codeRepo.findOne({
          where: {
            code,
          },
        });

        if (duplicate) {
          continue;
        }

        const entity = codeRepo.create({
          userId,
          code,
          isActive: true,
        });

        return codeRepo.save(entity);
      }

      throw new ConflictException(
        'Không thể tạo mã giới thiệu. Vui lòng thử lại.',
      );
    });
  }

  async applyReferralCode(userId: number, rawCode: string) {
    const code = this.normalizeCode(rawCode);

    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);

      const codeRepo = manager.getRepository(UserReferralCode);

      const referralRepo = manager.getRepository(Referral);

      const referredUser = await userRepo.findOne({
        where: {
          id: userId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!referredUser) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      if (referredUser.status !== UserStatus.ACTIVE) {
        throw new BadRequestException(
          'Tài khoản hiện không thể sử dụng mã giới thiệu',
        );
      }

      if (
        referredUser.role !== UserRole.CLIENT &&
        referredUser.role !== UserRole.THERAPIST
      ) {
        throw new BadRequestException(
          'Loại tài khoản không hỗ trợ chương trình giới thiệu',
        );
      }

      const existingReferral = await referralRepo.findOne({
        where: {
          referredUserId: referredUser.id,
        },
      });

      if (existingReferral) {
        throw new ConflictException('Bạn đã sử dụng mã giới thiệu trước đó');
      }

      const referralCode = await codeRepo
        .createQueryBuilder('referralCode')
        .innerJoinAndSelect('referralCode.user', 'referrer')
        .where('UPPER(referralCode.code) = :code', {
          code,
        })
        .andWhere('referralCode.isActive = :isActive', {
          isActive: true,
        })
        .andWhere('referralCode.deletedAt IS NULL')
        .getOne();

      if (!referralCode) {
        throw new NotFoundException(
          'Mã giới thiệu không hợp lệ hoặc đã ngừng hoạt động',
        );
      }

      const referrer = referralCode.user;

      if (referrer.id === referredUser.id) {
        throw new BadRequestException(
          'Không thể sử dụng mã giới thiệu của chính mình',
        );
      }

      if (referrer.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('Mã giới thiệu hiện không khả dụng');
      }

      /**
       * Cho phép referral chéo role:
       *
       * CLIENT -> CLIENT
       * CLIENT -> THERAPIST
       * THERAPIST -> CLIENT
       * THERAPIST -> THERAPIST
       *
       * Người nhận reward luôn là chủ mã giới thiệu
       * và được PromotionRewardService resolve theo referral.referrerUserId.
       */

      const referral = referralRepo.create({
        referrerUserId: referrer.id,
        referredUserId: referredUser.id,
        referralCodeId: referralCode.id,
        referralCodeSnapshot: referralCode.code,
        status: ReferralStatus.PENDING,
        qualifiedAt: null,
        rewardedAt: null,
      });

      const saved = await referralRepo.save(referral);

      await this.promotionRewardService.handleTrigger(manager, {
        triggerType: PromotionTriggerType.REFERRAL_CODE_ENTERED,
        actorUserId: userId,
        referralId: referral.id,
      });

      return {
        id: saved.id,
        referralCode: saved.referralCodeSnapshot,
        status: saved.status,

        referrer: {
          id: referrer.id,
          fullName: referrer.fullName,
        },

        createdAt: saved.createdAt,
      };
    });
  }

  async validateReferralCode(userId: number, rawCode: string) {
    const user = await this.getEligibleUser(userId);

    const code = this.normalizeCode(rawCode);

    const referralCode = await this.referralCodeRepository
      .createQueryBuilder('referralCode')
      .innerJoinAndSelect('referralCode.user', 'referrer')
      .where('UPPER(referralCode.code) = :code', {
        code,
      })
      .andWhere('referralCode.isActive = :isActive', {
        isActive: true,
      })
      .getOne();

    if (!referralCode) {
      return {
        valid: false,
        reason: 'REFERRAL_CODE_NOT_FOUND',
      };
    }

    if (referralCode.userId === user.id) {
      return {
        valid: false,
        reason: 'SELF_REFERRAL_NOT_ALLOWED',
      };
    }

    if (referralCode.user.status !== UserStatus.ACTIVE) {
      return {
        valid: false,
        reason: 'REFERRAL_CODE_NOT_AVAILABLE',
      };
    }

    /**
     * Không kiểm tra role mismatch.
     *
     * Client và Therapist được phép sử dụng
     * mã giới thiệu của nhau.
     */

    const existing = await this.referralRepository.findOne({
      where: {
        referredUserId: user.id,
      },
    });

    if (existing) {
      return {
        valid: false,
        reason: 'REFERRAL_ALREADY_APPLIED',
      };
    }

    return {
      valid: true,

      referrer: {
        id: referralCode.user.id,
        fullName: referralCode.user.fullName,
      },
    };
  }

  private async getEligibleUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (user.role !== UserRole.CLIENT && user.role !== UserRole.THERAPIST) {
      throw new BadRequestException(
        'Loại tài khoản không hỗ trợ chương trình giới thiệu',
      );
    }

    return user;
  }

  private generateReferralCode(user: User) {
    const prefix = user.role === UserRole.THERAPIST ? 'T' : 'C';

    const random = randomBytes(4).toString('hex').toUpperCase();

    return `${prefix}${user.id}${random}`;
  }

  private normalizeCode(value: string) {
    const result = value.trim().toUpperCase().replace(/\s+/g, '');

    if (!result) {
      throw new BadRequestException('Mã giới thiệu không hợp lệ');
    }

    return result;
  }
}
