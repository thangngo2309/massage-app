import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { InjectRepository } from '@nestjs/typeorm';

import axios from 'axios';

import * as bcrypt from 'bcryptjs';

import { randomBytes, randomInt } from 'node:crypto';

import { DataSource, EntityManager, Repository } from 'typeorm';

import { RedisService } from '../../shared/redis/redis.service.js';

import { Referral } from '../entities/referral.entity.js';

import { UserReferralCode } from '../entities/user-referral-code.entity.js';

import { User } from '../entities/user.entity.js';

import { UserRole, UserStatus } from '../enums/business.enums.js';

import { normalizeVietnamPhone } from './auth.helper.js';

import { PromotionRewardService } from '../promotion/promotion-reward.service.js';

import {
  PromotionTriggerType,
  ReferralStatus,
} from '../enums/promotion.enums.js';

@Injectable()
export class OtpService {
  constructor(
    private readonly redisService: RedisService,

    private readonly configService: ConfigService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,

    private readonly promotionRewardService: PromotionRewardService,
  ) {}

  private get ttl(): number {
    return this.getPositiveNumber('OTP_TTL_SECONDS', 120);
  }

  private get cooldown(): number {
    return this.getPositiveNumber('OTP_RESEND_COOLDOWN', 60);
  }

  private get maxAttempts(): number {
    return this.getPositiveNumber('OTP_MAX_ATTEMPTS', 5);
  }

  private get lockSeconds(): number {
    return this.getPositiveNumber('OTP_LOCK_SECONDS', 600);
  }

  private otpKey(phone: string): string {
    return `auth:registration:otp:${phone}`;
  }

  private attemptsKey(phone: string): string {
    return `auth:registration:otp:attempts:${phone}`;
  }

  private cooldownKey(phone: string): string {
    return `auth:registration:otp:cooldown:${phone}`;
  }

  private lockKey(phone: string): string {
    return `auth:registration:otp:lock:${phone}`;
  }

  /**

   * ================================================================

   * SEND REGISTRATION OTP

   * ================================================================

   */

  async sendRegistrationOtp(rawPhone: string) {
    const phone = normalizeVietnamPhone(rawPhone);

    const user = await this.userRepository.findOne({
      where: {
        phone,
      },
    });

    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    /**

     * OTP đăng ký chỉ dành cho Client/Therapist.

     */

    if (user.role !== UserRole.CLIENT && user.role !== UserRole.THERAPIST) {
      throw new ForbiddenException('Tài khoản này không sử dụng xác thực OTP');
    }

    /**

     * ACTIVE nghĩa là đã kích hoạt.

     */

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('Tài khoản đã được kích hoạt');
    }

    /**

     * SUSPENDED là trạng thái khóa quản trị,

     * không được dùng OTP để tự mở lại.

     */

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Tài khoản đã bị tạm khóa');
    }

    /**

     * Tại đây chỉ chấp nhận INACTIVE.

     */

    if (user.status !== UserStatus.INACTIVE) {
      throw new BadRequestException('Trạng thái tài khoản không hợp lệ');
    }

    /**

     * Kiểm tra lock do nhập sai OTP quá nhiều.

     */

    const lockKey = this.lockKey(phone);

    if (await this.redisService.exists(lockKey)) {
      const lockTtl = await this.redisService.ttl(lockKey);

      throw new ForbiddenException(
        `Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng thử lại sau ${
          lockTtl > 0 ? lockTtl : this.lockSeconds
        } giây.`,
      );
    }

    /**

     * Cooldown gửi lại.

     */

    const cooldownKey = this.cooldownKey(phone);

    const cooldownTtl = await this.redisService.ttl(cooldownKey);

    if (cooldownTtl > 0) {
      throw new BadRequestException(
        `Vui lòng đợi ${cooldownTtl} giây trước khi yêu cầu mã OTP mới`,
      );
    }

    /**

     * Sinh OTP bằng crypto.

     */

    const code = this.generateOtp();

    const hash = await bcrypt.hash(code, 10);

    const otpKey = this.otpKey(phone);

    const attemptsKey = this.attemptsKey(phone);

    /**

     * Chỉ lưu hash + userId.

     * Không lưu OTP plain text.

     */

    await this.redisService.set(
      otpKey,

      {
        hash,

        userId: user.id,
      },

      this.ttl,
    );

    await this.redisService.set(attemptsKey, 0, this.ttl);

    /**

     * Gửi SMS.

     */

    try {
      await this.sendViaAbenla(
        phone,
        `[INHOME MASSAGE 247] Ma xac thuc dang ky tai khoan cua ban la ${code}`,
      );
    } catch (error) {
      /**

       * SMS thất bại thì OTP này không còn giá trị.

       */

      await this.redisService.del(otpKey);

      await this.redisService.del(attemptsKey);

      console.error('Abenla send OTP failed:', error);

      throw new BadGatewayException(
        'Không thể gửi mã OTP. Vui lòng thử lại sau.',
      );
    }

    /**

     * Chỉ cooldown sau khi SMS gửi thành công.

     */

    await this.redisService.set(cooldownKey, 1, this.cooldown);

    return {
      success: true,

      message: 'Mã OTP đã được gửi',

      expiresIn: this.ttl,

      resendAfter: this.cooldown,
    };
  }

  /**

   * ================================================================

   * VERIFY REGISTRATION OTP

   * ================================================================

   */

  async verifyRegistrationOtp(rawPhone: string, code: string) {
    const phone = normalizeVietnamPhone(rawPhone);

    const lockKey = this.lockKey(phone);

    if (await this.redisService.exists(lockKey)) {
      const lockTtl = await this.redisService.ttl(lockKey);

      throw new ForbiddenException(
        `Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng thử lại sau ${
          lockTtl > 0 ? lockTtl : this.lockSeconds
        } giây.`,
      );
    }

    const otpKey = this.otpKey(phone);

    const attemptsKey = this.attemptsKey(phone);

    const record = await this.redisService.get<{
      hash: string;

      userId: number;
    }>(otpKey);

    if (!record?.hash || !record.userId) {
      throw new BadRequestException(
        'Mã OTP không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu mã mới.',
      );
    }

    const matched = await bcrypt.compare(code, record.hash);

    if (!matched) {
      await this.handleFailedAttempt(phone, otpKey, attemptsKey);

      throw new BadRequestException('Mã OTP không đúng');
    }

    /**

     * OTP đúng.

     *

     * Tìm chính xác userId đã được bind với OTP

     * và kiểm tra lại phone.

     */

    const user = await this.userRepository.findOne({
      where: {
        id: record.userId,

        phone,
      },
    });

    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    if (user.role !== UserRole.CLIENT && user.role !== UserRole.THERAPIST) {
      throw new ForbiddenException('Tài khoản này không sử dụng xác thực OTP');
    }

    /**

     * SUSPENDED tuyệt đối không được OTP mở khóa.

     */

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Tài khoản đã bị tạm khóa');
    }

    /**

     * INACTIVE -> ACTIVE

     */

    if (user.status === UserStatus.INACTIVE) {
      await this.dataSource.transaction(async (manager) => {
        const userRepository = manager.getRepository(User);

        const lockedUser = await userRepository.findOne({
          where: {
            id: user.id,

            phone,
          },

          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!lockedUser) {
          throw new NotFoundException('Tài khoản không tồn tại');
        }

        if (lockedUser.status === UserStatus.SUSPENDED) {
          throw new ForbiddenException('Tài khoản đã bị tạm khóa');
        }

        if (lockedUser.status === UserStatus.INACTIVE) {
          lockedUser.status = UserStatus.ACTIVE;

          await userRepository.save(lockedUser);

          /**

           * =========================================

           * REGISTRATION COMPLETED

           * =========================================

           *

           * Kích hoạt promotion đăng ký thành công.

           *

           * Promotion engine sẽ tự xác định audience

           * từ role của user:

           *

           * - CLIENT -> promotion client

           * - THERAPIST -> promotion therapist

           *

           * Reward thực tế phụ thuộc cấu hình Admin:

           *

           * - wallet_credit -> cộng promotion wallet

           * - voucher -> cấp UserVoucher

           */

          /**
           * Mỗi user ACTIVE có một mã giới thiệu để có thể chia sẻ
           * cho user khác ở những lần đăng ký sau.
           */
          await this.ensureReferralCode(manager, lockedUser);

          await this.promotionRewardService.handleTrigger(manager, {
            triggerType: PromotionTriggerType.REGISTRATION_COMPLETED,

            actorUserId: lockedUser.id,
          });

          /**
           * Nếu user đã nhập mã giới thiệu lúc đăng ký thì chỉ đến
           * thời điểm verify OTP thành công mới phát thưởng cho referrer.
           */
          const referralRepository = manager.getRepository(Referral);

          const referral = await referralRepository.findOne({
            where: {
              referredUserId: lockedUser.id,
            },
            lock: {
              mode: 'pessimistic_write',
            },
          });

          if (referral && referral.status === ReferralStatus.PENDING) {
            const referralRewards =
              await this.promotionRewardService.handleTrigger(manager, {
                triggerType: PromotionTriggerType.REFERRAL_CODE_ENTERED,
                actorUserId: lockedUser.id,
                referralId: referral.id,
              });

            if (referralRewards.length > 0) {
              referral.status = ReferralStatus.REWARDED;
              referral.rewardedAt = new Date();

              await referralRepository.save(referral);
            }
          }

          /**

           * Giữ nguyên logic hiện tại:

           * user ACTIVE được kiểm tra ưu đãi

           * booking đầu tiên.

           */

          // await this.promotionRewardService.handleTrigger(manager, {

          //   triggerType: PromotionTriggerType.FIRST_BOOKING_ELIGIBLE,

          //   actorUserId: lockedUser.id,

          // });
        }
      });
    }

    /**

     * DB thành công rồi mới consume OTP.

     */

    await this.redisService.del(otpKey);

    await this.redisService.del(attemptsKey);

    await this.redisService.del(this.cooldownKey(phone));

    return {
      success: true,

      message: 'Xác thực tài khoản thành công',
    };
  }

  private async ensureReferralCode(
    manager: EntityManager,
    user: User,
  ): Promise<UserReferralCode> {
    const repository = manager.getRepository(UserReferralCode);

    const existing = await repository.findOne({
      where: {
        userId: user.id,
        isActive: true,
      },
    });

    if (existing) {
      return existing;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const prefix = user.role === UserRole.THERAPIST ? 'T' : 'C';
      const random = randomBytes(4).toString('hex').toUpperCase();
      const code = `${prefix}${user.id}${random}`;

      const duplicate = await repository.findOne({
        where: {
          code,
        },
      });

      if (duplicate) {
        continue;
      }

      const entity = repository.create({
        userId: user.id,
        code,
        isActive: true,
      });

      return repository.save(entity);
    }

    throw new BadRequestException(
      'Không thể tạo mã giới thiệu. Vui lòng thử lại.',
    );
  }

  private async handleFailedAttempt(
    phone: string,

    otpKey: string,

    attemptsKey: string,
  ): Promise<void> {
    const otpTtl = await this.redisService.ttl(otpKey);

    const safeTtl = otpTtl > 0 ? otpTtl : this.ttl;

    const currentAttempts =
      (await this.redisService.get<number>(attemptsKey)) ?? 0;

    const newAttempts = currentAttempts + 1;

    await this.redisService.set(attemptsKey, newAttempts, safeTtl);

    if (newAttempts < this.maxAttempts) {
      return;
    }

    /**

     * Sai quá số lần cho phép:

     *

     * - khóa phone

     * - xóa OTP

     * - xóa attempts

     */

    await this.redisService.set(this.lockKey(phone), 1, this.lockSeconds);

    await this.redisService.del(otpKey);

    await this.redisService.del(attemptsKey);
  }

  private generateOtp(length = 6): string {
    const max = 10 ** length;

    return randomInt(0, max).toString().padStart(length, '0');
  }

  /**

   * ================================================================

   * ABENLA

   * ================================================================

   */

  private async sendViaAbenla(phone: string, message: string) {
    const apiUrl = this.configService.getOrThrow<string>('ABENLA_API_URL');

    const loginName = this.configService.getOrThrow<string>('ABENLA_LOGIN');

    const sign = this.configService.getOrThrow<string>('ABENLA_SIGN');

    const serviceTypeId = this.configService.getOrThrow<string>(
      'ABENLA_SERVICE_TYPE_ID',
    );

    const brandName =
      this.configService.getOrThrow<string>('ABENLA_BRAND_NAME');

    /**

     * +84905... -> 0905...

     */

    const phoneNumber = phone.startsWith('+84') ? `0${phone.slice(3)}` : phone;

    const params = {
      loginName,

      sign,

      serviceTypeId,

      phoneNumber,

      message,

      brandName,
    };

    const response = await axios.get(apiUrl, {
      params,

      timeout: 10_000,
    });

    return response.data;
  }

  private getPositiveNumber(key: string, fallback: number): number {
    const value = this.configService.get<string>(key);

    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallback;
    }

    return Math.floor(parsed);
  }
}
