import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Booking } from '../entities/booking.entity.js';
import { ClientProfile } from '../entities/client-profile.entity.js';
import { Promotion } from '../entities/promotion.entity.js';
import { PromotionUsage } from '../entities/promotion-usage.entity.js';
import { Referral } from '../entities/referral.entity.js';
import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { User } from '../entities/user.entity.js';
import { UserVoucher } from '../entities/user-voucher.entity.js';
import { Voucher } from '../entities/voucher.entity.js';
import {
  PromotionAudience,
  PromotionRewardRecipient,
  PromotionRewardType,
  PromotionTriggerType,
  ReferralStatus,
  UserVoucherSourceType,
  UserVoucherStatus,
} from '../enums/promotion.enums.js';
import { BookingStatus, UserRole } from '../enums/business.enums.js';
import { WalletService } from '../wallet/wallet.service.js';
interface HandleTriggerParams {
  triggerType: PromotionTriggerType;
  /**
   * Người thực hiện hành động tạo trigger.
   */
  actorUserId: number;
  bookingId?: number | null;
  referralId?: number | null;
}
@Injectable()
export class PromotionRewardService {
  constructor(private readonly walletService: WalletService) {}
  /**
   * ================================================================
   * HANDLE TRIGGER
   * ================================================================
   */
  async handleTrigger(manager: EntityManager, params: HandleTriggerParams) {
    const actor = await manager.getRepository(User).findOne({
      where: {
        id: params.actorUserId,
      },
    });
    if (!actor) {
      return [];
    }
    const audience = this.resolveAudience(actor.role);
    if (!audience) {
      return [];
    }
    const now = new Date();
    const promotions = await manager
      .getRepository(Promotion)
      .createQueryBuilder('promotion')
      .where('promotion.isActive = true')
      .andWhere('promotion.audience = :audience', {
        audience,
      })
      .andWhere('promotion.triggerType = :triggerType', {
        triggerType: params.triggerType,
      })
      .andWhere('(promotion.startsAt IS NULL OR promotion.startsAt <= :now)', {
        now,
      })
      .andWhere('(promotion.endsAt IS NULL OR promotion.endsAt >= :now)', {
        now,
      })
      .orderBy('promotion.id', 'ASC')
      .getMany();
    const results: unknown[] = [];
    for (const promotion of promotions) {
      const result = await this.applyPromotion(manager, promotion, params);
      if (result) {
        results.push(result);
      }
    }
    return results;
  }
  /**
   * ================================================================
   * BOOKING COMPLETED
   * ================================================================
   */
  async handleBookingCompleted(manager: EntityManager, booking: Booking) {
    /**
     * Booking đã được save COMPLETED trước khi gọi method này.
     */
    if (booking.status !== BookingStatus.COMPLETED) {
      return;
    }
    /**
     * ==============================================================
     * CLIENT
     * ==============================================================
     */
    const client = await manager.getRepository(ClientProfile).findOne({
      where: {
        id: booking.clientId,
      },
    });
    if (client) {
      const clientCompletedCount = await manager.getRepository(Booking).count({
        where: {
          clientId: client.id,
          status: BookingStatus.COMPLETED,
        },
      });
      /**
       * Chỉ booking COMPLETED đầu tiên.
       */
      if (clientCompletedCount === 1) {
        await this.handleTrigger(manager, {
          triggerType: PromotionTriggerType.FIRST_BOOKING_COMPLETED,
          actorUserId: client.userId,
          bookingId: booking.id,
        });
        // await this.qualifyReferral(manager, client.userId, booking.id);
      }
    }
    /**
     * ==============================================================
     * THERAPIST
     * ==============================================================
     */
    if (booking.therapistId) {
      const therapist = await manager.getRepository(TherapistProfile).findOne({
        where: {
          id: booking.therapistId,
        },
      });
      if (therapist) {
        const therapistCompletedCount = await manager
          .getRepository(Booking)
          .count({
            where: {
              therapistId: therapist.id,
              status: BookingStatus.COMPLETED,
            },
          });
        if (therapistCompletedCount === 1) {
          await this.handleTrigger(manager, {
            triggerType: PromotionTriggerType.FIRST_BOOKING_COMPLETED,
            actorUserId: therapist.userId,
            bookingId: booking.id,
          });
          // await this.qualifyReferral(manager, therapist.userId, booking.id);
        }
      }
    }
  }
  /**
   * ================================================================
   * QUALIFY REFERRAL
   * ================================================================
   */
  // private async qualifyReferral(
  //   manager: EntityManager,
  //   referredUserId: number,
  //   bookingId: number,
  // ) {
  //   const referralRepository = manager.getRepository(Referral);
  //   const referral = await referralRepository.findOne({
  //     where: {
  //       referredUserId,
  //     },
  //     lock: {
  //       mode: 'pessimistic_write',
  //     },
  //   });
  //   if (!referral) {
  //     return;
  //   }
  //   if (
  //     referral.status !== ReferralStatus.PENDING &&
  //     referral.status !== ReferralStatus.QUALIFIED
  //   ) {
  //     return;
  //   }
  //   if (referral.status === ReferralStatus.PENDING) {
  //     referral.status = ReferralStatus.QUALIFIED;
  //     referral.qualifiedAt = new Date();
  //     await referralRepository.save(referral);
  //   }
  //   /**
  //    * Actor vẫn là người được giới thiệu.
  //    *
  //    * PromotionRewardRecipient.REFERRER sẽ tự resolve
  //    * sang referrerUserId.
  //    */
  //   await this.handleTrigger(manager, {
  //     triggerType: PromotionTriggerType.REFERRAL_QUALIFIED,
  //     actorUserId: referral.referredUserId,
  //     bookingId,
  //     referralId: referral.id,
  //   });
  //   /**
  //    * Nếu đã có ít nhất một reward dành cho referral này
  //    * thì đánh dấu REWARDED.
  //    */
  //   const rewarded = await manager
  //     .getRepository(PromotionUsage)
  //     .createQueryBuilder('usage')
  //     .innerJoin(
  //       Promotion,
  //       'rewardPromotion',
  //       'rewardPromotion.id = usage.promotionId',
  //     )
  //     .where('usage.referralId = :referralId', { referralId: referral.id })
  //     .andWhere('rewardPromotion.triggerType = :triggerType', {
  //       triggerType: PromotionTriggerType.REFERRAL_QUALIFIED,
  //     })
  //     .getExists();
  //   if (rewarded) {
  //     referral.status = ReferralStatus.REWARDED;
  //     referral.rewardedAt = new Date();
  //     await referralRepository.save(referral);
  //   }
  // }
  /**
   * ================================================================
   * APPLY PROMOTION
   * ================================================================
   */
  private async applyPromotion(
    manager: EntityManager,
    promotion: Promotion,
    params: HandleTriggerParams,
  ) {
    /**
     * Lock promotion.
     *
     * Usage limit được kiểm tra trong cùng transaction.
     */
    const lockedPromotion = await manager.getRepository(Promotion).findOne({
      where: {
        id: promotion.id,
      },
      lock: {
        mode: 'pessimistic_write',
      },
    });
    if (!lockedPromotion || !lockedPromotion.isActive) {
      return null;
    }
    const rewardUserId = await this.resolveRewardUserId(
      manager,
      lockedPromotion,
      params,
    );
    if (!rewardUserId) {
      return null;
    }
    const uniqueKey = this.buildUniqueKey(
      lockedPromotion,
      rewardUserId,
      params,
    );
    const usageRepository = manager.getRepository(PromotionUsage);
    /**
     * ==============================================================
     * IDEMPOTENCY
     * ==============================================================
     */
    const existingUsage = await usageRepository.findOne({
      where: {
        uniqueKey,
      },
    });
    if (existingUsage) {
      return {
        applied: false,
        alreadyApplied: true,
        promotionId: lockedPromotion.id,
        usageId: existingUsage.id,
      };
    }
    /**
     * ==============================================================
     * TOTAL USAGE LIMIT
     * ==============================================================
     */
    if (lockedPromotion.usageLimit !== null) {
      const totalUsage = await usageRepository.count({
        where: {
          promotionId: lockedPromotion.id,
        },
      });
      if (totalUsage >= lockedPromotion.usageLimit) {
        return null;
      }
    }
    /**
     * ==============================================================
     * PER USER LIMIT
     * ==============================================================
     */
    if (lockedPromotion.usageLimitPerUser !== null) {
      const userUsage = await usageRepository.count({
        where: {
          promotionId: lockedPromotion.id,
          userId: rewardUserId,
        },
      });
      if (userUsage >= lockedPromotion.usageLimitPerUser) {
        return null;
      }
    }
    /**
     * ==============================================================
     * WALLET CREDIT
     * ==============================================================
     */
    if (lockedPromotion.rewardType === PromotionRewardType.WALLET_CREDIT) {
      const rewardAmount = Number(lockedPromotion.rewardValue);
      if (!Number.isFinite(rewardAmount) || rewardAmount <= 0) {
        return null;
      }
      const usage = await usageRepository.save(
        usageRepository.create({
          promotionId: lockedPromotion.id,
          userId: rewardUserId,
          bookingId: params.bookingId ?? null,
          referralId: params.referralId ?? null,
          uniqueKey,
          rewardAmount,
        }),
      );
      await this.walletService.creditPromotionWallet(manager, {
        userId: rewardUserId,
        amount: rewardAmount,
        referenceId: `promotion-usage:${usage.id}`,
        description: `Thưởng khuyến mãi ${lockedPromotion.code}`,
      });
      return {
        applied: true,
        promotionId: lockedPromotion.id,
        usageId: usage.id,
        rewardType: lockedPromotion.rewardType,
        rewardAmount,
      };
    }
    /**
     * ==============================================================
     * VOUCHER
     * ==============================================================
     */
    if (lockedPromotion.rewardType === PromotionRewardType.VOUCHER) {
      if (!lockedPromotion.voucherId) {
        return null;
      }
      const voucherRepository = manager.getRepository(Voucher);
      const voucher = await voucherRepository.findOne({
        where: {
          id: lockedPromotion.voucherId,
        },
        lock: {
          mode: 'pessimistic_write',
        },
      });
      if (!voucher || !voucher.isActive) {
        return null;
      }
      const now = new Date();
      if (voucher.startsAt && voucher.startsAt > now) {
        return null;
      }
      if (voucher.endsAt && voucher.endsAt < now) {
        return null;
      }
      const userVoucherRepository = manager.getRepository(UserVoucher);
      /**
       * Global issuance limit.
       */
      if (voucher.issuanceLimit !== null) {
        const issuedCount = await userVoucherRepository.count({
          where: {
            voucherId: voucher.id,
          },
        });
        if (issuedCount >= voucher.issuanceLimit) {
          return null;
        }
      }
      const usage = await usageRepository.save(
        usageRepository.create({
          promotionId: lockedPromotion.id,
          userId: rewardUserId,
          bookingId: params.bookingId ?? null,
          referralId: params.referralId ?? null,
          uniqueKey,
          rewardAmount: 0,
        }),
      );
      const sourceType = this.resolveVoucherSourceType(
        lockedPromotion.triggerType,
      );
      const sourceReferenceId = `promotion-usage:${usage.id}`;
      const existingVoucher = await userVoucherRepository.findOne({
        where: {
          userId: rewardUserId,
          voucherId: voucher.id,
          sourceType,
          sourceReferenceId,
        },
      });
      if (!existingVoucher) {
        await userVoucherRepository.save(
          userVoucherRepository.create({
            userId: rewardUserId,
            voucherId: voucher.id,
            status: UserVoucherStatus.AVAILABLE,
            sourceType,
            sourceReferenceId,
            expiresAt: voucher.endsAt ?? null,
            reservedAt: null,
            reservedBookingId: null,
            usedAt: null,
            usedBookingId: null,
          }),
        );
      }
      return {
        applied: true,
        promotionId: lockedPromotion.id,
        usageId: usage.id,
        rewardType: lockedPromotion.rewardType,
        voucherId: voucher.id,
      };
    }
    return null;
  }
  /**
   * ================================================================
   * REWARD USER
   * ================================================================
   */
  private async resolveRewardUserId(
    manager: EntityManager,
    promotion: Promotion,
    params: HandleTriggerParams,
  ) {
    if (promotion.rewardRecipient === PromotionRewardRecipient.ACTOR) {
      return params.actorUserId;
    }
    if (promotion.rewardRecipient === PromotionRewardRecipient.REFERRER) {
      if (!params.referralId) {
        return null;
      }
      const referral = await manager.getRepository(Referral).findOne({
        where: {
          id: params.referralId,
        },
      });
      return referral?.referrerUserId ?? null;
    }
    return null;
  }
  /**
   * ================================================================
   * UNIQUE KEY
   * ================================================================
   */
  private buildUniqueKey(
    promotion: Promotion,
    rewardUserId: number,
    params: HandleTriggerParams,
  ) {
    const parts = [
      `promotion:${promotion.id}`,
      `user:${rewardUserId}`,
      `trigger:${params.triggerType}`,
    ];
    if (params.bookingId) {
      parts.push(`booking:${params.bookingId}`);
    }
    if (params.referralId) {
      parts.push(`referral:${params.referralId}`);
    }
    return parts.join(':');
  }
  /**
   * ================================================================
   * AUDIENCE
   * ================================================================
   */
  private resolveAudience(role: UserRole): PromotionAudience | null {
    if (role === UserRole.CLIENT) {
      return PromotionAudience.CLIENT;
    }
    if (role === UserRole.THERAPIST) {
      return PromotionAudience.THERAPIST;
    }
    return null;
  }
  private resolveVoucherSourceType(triggerType: PromotionTriggerType) {
    switch (triggerType) {
      case PromotionTriggerType.REFERRAL_CODE_ENTERED:
      case PromotionTriggerType.REFERRAL_QUALIFIED:
        return UserVoucherSourceType.REFERRAL;
      case PromotionTriggerType.FIRST_BOOKING_COMPLETED:
        return UserVoucherSourceType.FIRST_BOOKING;
      default:
        return UserVoucherSourceType.PROMOTION;
    }
  }
}
