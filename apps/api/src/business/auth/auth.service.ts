import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, EntityManager, Repository } from 'typeorm';

import * as bcrypt from 'bcryptjs';

import { User } from '../entities/user.entity.js';

import { RefreshToken } from '../entities/refresh-token.entity.js';

import { Referral } from '../entities/referral.entity.js';

import { UserReferralCode } from '../entities/user-referral-code.entity.js';

import { Gender, UserRole, UserStatus } from '../enums/business.enums.js';

import { ReferralStatus } from '../enums/promotion.enums.js';

import { LoginDto } from './dto/login.dto.js';

import { LogoutDto } from './dto/logout.dto.js';

import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import { RegisterDto } from './dto/register.dto.js';

import type { AuthUser } from './types/auth-user.type.js';

import {
  buildRefreshTokenExpiresAt,
  generateRefreshToken,
  hashRefreshToken,
  normalizeEmail,
  normalizeVietnamPhone,
  tryNormalizeVietnamPhone,
} from './auth.helper.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import { ClientProfile } from '../entities/client-profile.entity.js';

import { OtpService } from './otp.service.js';

type SessionMeta = {
  ipAddress?: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,

    private readonly dataSource: DataSource,

    private readonly otpService: OtpService,
  ) {}

  async register(dto: RegisterDto, meta?: SessionMeta) {
    const fullName = dto.fullName.trim();

    const phone = normalizeVietnamPhone(dto.phone);

    const email = normalizeEmail(dto.email);

    /**

     * Self-register chỉ cho CLIENT / THERAPIST.

     */

    if (dto.role !== UserRole.CLIENT && dto.role !== UserRole.THERAPIST) {
      throw new UnauthorizedException(
        'Không được phép tự đăng ký loại tài khoản này',
      );
    }

    /**

     * ================================================================

     * CHECK PHONE

     * ================================================================

     */

    const existedPhone = await this.userRepository.findOne({
      where: {
        phone,
      },
    });

    if (existedPhone) {
      /**

       * User đã đăng ký nhưng chưa verify OTP.

       *

       * Không tạo user lần nữa.

       * Gửi lại OTP và tiếp tục flow xác thực.

       */

      if (
        (existedPhone.role === UserRole.CLIENT ||
          existedPhone.role === UserRole.THERAPIST) &&
        existedPhone.status === UserStatus.INACTIVE
      ) {
        if (dto.referralCode?.trim()) {
          await this.dataSource.transaction(async (manager) => {
            await this.attachReferralCode(
              manager,
              existedPhone,
              dto.referralCode || '',
            );
          });
        }

        await this.otpService.sendRegistrationOtp(existedPhone.phone);

        return {
          user: this.toUserResponse(existedPhone),

          requiresOtp: true,

          message: 'Tài khoản chưa được xác thực. Mã OTP đã được gửi lại.',
        };
      }

      throw new ConflictException('Số điện thoại đã được sử dụng');
    }

    /**

     * ================================================================

     * CHECK EMAIL

     * ================================================================

     */

    if (email) {
      const existedEmail = await this.userRepository

        .createQueryBuilder('user')

        .where('LOWER(user.email) = :email', {
          email,
        })

        .getOne();

      if (existedEmail) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    /**

     * ================================================================

     * PASSWORD

     * ================================================================

     */

    const passwordHash = await bcrypt.hash(dto.password, 12);

    /**

     * ================================================================

     * CREATE USER + PROFILE

     * ================================================================

     *

     * Chỉ thao tác DB trong transaction.

     *

     * KHÔNG gọi Abenla trong transaction.

     */

    const savedUser = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      /**

       * User đăng ký mới chưa verify OTP.

       */

      const user = userRepository.create({
        fullName,

        phone,

        email,

        passwordHash,

        role: dto.role,

        status: UserStatus.INACTIVE,
      });

      const savedUser = await userRepository.save(user);

      /**

       * CLIENT PROFILE

       */

      if (savedUser.role === UserRole.CLIENT) {
        const repository = manager.getRepository(ClientProfile);

        const profile = repository.create({
          userId: savedUser.id,
        });

        await repository.save(profile);
      }

      /**

       * THERAPIST PROFILE

       */

      if (savedUser.role === UserRole.THERAPIST) {
        const repository = manager.getRepository(TherapistProfile);

        const profile = repository.create({
          userId: savedUser.id,

          gender: dto.gender ?? Gender.UNKNOWN,

          dateOfBirth: dto.dateOfBirth?.trim() || null,

          address: dto.address?.trim() || null,

          stageName: dto.stageName?.trim() || null,

          hasTattoo: dto.hasTattoo ?? false,

          experienceYears: dto.experienceYears ?? 0,
        });

        await repository.save(profile);
      }

      /**
       * Nếu người đăng ký nhập mã giới thiệu thì chỉ ghi nhận
       * quan hệ giới thiệu ở trạng thái PENDING.
       *
       * CHƯA phát thưởng tại đây vì user vẫn chưa verify OTP.
       */
      if (dto.referralCode?.trim()) {
        await this.attachReferralCode(manager, savedUser, dto.referralCode);
      }

      /**

       * QUAN TRỌNG:

       *

       * Không createSession().

       * User chưa verify OTP.

       */

      return savedUser;
    });

    /**

     * ================================================================

     * SEND OTP

     * ================================================================

     *

     * User/Profile đã commit DB trước.

     *

     * Không giữ DB transaction trong lúc chờ Abenla.

     */

    await this.otpService.sendRegistrationOtp(savedUser.phone);

    return {
      user: this.toUserResponse(savedUser),

      requiresOtp: true,

      message: 'Đăng ký thành công. Vui lòng xác thực số điện thoại.',
    };
  }

  async login(dto: LoginDto, meta?: SessionMeta) {
    const login = dto.login.trim();

    const loginLower = login.toLowerCase();

    const normalizedPhone = tryNormalizeVietnamPhone(login);

    const query = this.userRepository

      .createQueryBuilder('user')

      .addSelect('user.passwordHash');

    if (normalizedPhone) {
      query.where(
        `

            user.phone = :phone

            OR LOWER(user.email) = :login

          `,

        {
          phone: normalizedPhone,

          login: loginLower,
        },
      );
    } else {
      query.where('LOWER(user.email) = :login', {
        login: loginLower,
      });
    }

    const user = await query.getOne();

    if (!user) {
      throw new UnauthorizedException(
        'Thông tin đăng nhập hoặc mật khẩu không chính xác',
      );
    }

    const passwordMatched = await bcrypt.compare(
      dto.password,

      user.passwordHash || '',
    );

    if (!passwordMatched) {
      throw new UnauthorizedException(
        'Thông tin đăng nhập hoặc mật khẩu không chính xác',
      );
    }

    this.ensureUserCanLogin(user);

    user.lastLoginAt = new Date();

    await this.userRepository.save(user);

    const tokens = await this.createSession(user, {
      deviceName: dto.deviceName ?? null,

      ipAddress: meta?.ipAddress ?? null,
    });

    return {
      user: this.toUserResponse(user),

      ...tokens,
    };
  }

  async refresh(dto: RefreshTokenDto, meta?: SessionMeta) {
    const currentTokenHash = hashRefreshToken(dto.refreshToken);

    return this.dataSource.transaction(async (manager) => {
      const refreshTokenRepository = manager.getRepository(RefreshToken);

      /**

       * Lock token để 2 request refresh đồng thời

       * không thể cùng sử dụng một refresh token.

       */

      const storedToken = await refreshTokenRepository

        .createQueryBuilder('refreshToken')

        .setLock('pessimistic_write')

        .where('refreshToken.tokenHash = :tokenHash', {
          tokenHash: currentTokenHash,
        })

        .getOne();

      if (!storedToken) {
        throw new UnauthorizedException('Refresh token không hợp lệ');
      }

      if (storedToken.revokedAt) {
        throw new UnauthorizedException('Refresh token đã bị thu hồi');
      }

      if (storedToken.expiresAt.getTime() <= Date.now()) {
        throw new UnauthorizedException('Refresh token đã hết hạn');
      }

      const userRepository = manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          id: storedToken.userId,
        },
      });

      if (!user) {
        throw new UnauthorizedException('Tài khoản không tồn tại');
      }

      this.ensureUserCanLogin(user);

      /**

       * Rotation:

       *

       * refresh A

       *    ↓

       * revoke A

       *    ↓

       * tạo refresh B

       */

      storedToken.revokedAt = new Date();

      await refreshTokenRepository.save(storedToken);

      const tokens = await this.createSession(
        user,

        {
          deviceName: dto.deviceName ?? storedToken.deviceName ?? null,

          ipAddress: meta?.ipAddress ?? storedToken.ipAddress ?? null,
        },

        manager,
      );

      return {
        user: this.toUserResponse(user),

        ...tokens,
      };
    });
  }

  async logout(dto: LogoutDto) {
    const tokenHash = hashRefreshToken(dto.refreshToken);

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(RefreshToken);

      const storedToken = await repository

        .createQueryBuilder('refreshToken')

        .setLock('pessimistic_write')

        .where('refreshToken.tokenHash = :tokenHash', {
          tokenHash,
        })

        .getOne();

      /**

       * Logout idempotent.

       *

       * Token không tồn tại hoặc đã logout rồi

       * vẫn xem là logout thành công.

       */

      if (!storedToken || storedToken.revokedAt) {
        return;
      }

      storedToken.revokedAt = new Date();

      await repository.save(storedToken);
    });

    return {
      success: true,
    };
  }

  async me(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản hiện không hoạt động');
    }

    return this.toUserResponse(user);
  }

  private async createSession(
    user: User,

    meta: {
      deviceName: string | null;

      ipAddress: string | null;
    },

    manager?: EntityManager,
  ) {
    const accessToken = await this.createAccessToken(user);

    const refreshToken = generateRefreshToken();

    await this.saveRefreshToken(user.id, refreshToken, meta, manager);

    return {
      accessToken,

      refreshToken,

      tokenType: 'Bearer' as const,

      expiresIn: this.getAccessTokenExpiresIn(),
    };
  }

  private async createAccessToken(user: User): Promise<string> {
    const payload: Omit<AuthUser, 'iat' | 'exp'> = {
      sub: user.id,

      role: user.role,

      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

      expiresIn: this.getAccessTokenExpiresIn(),
    });
  }

  private async saveRefreshToken(
    userId: number,

    rawRefreshToken: string,

    meta: {
      deviceName: string | null;

      ipAddress: string | null;
    },

    manager?: EntityManager,
  ) {
    const repository = manager
      ? manager.getRepository(RefreshToken)
      : this.refreshTokenRepository;

    const refreshExpiresDays = this.getRefreshTokenExpiresDays();

    const token = repository.create({
      userId,

      tokenHash: hashRefreshToken(rawRefreshToken),

      deviceName: meta.deviceName,

      ipAddress: meta.ipAddress,

      expiresAt: buildRefreshTokenExpiresAt(refreshExpiresDays),

      revokedAt: null,
    });

    await repository.save(token);
  }

  private async attachReferralCode(
    manager: EntityManager,
    referredUser: User,
    rawCode: string,
  ): Promise<void> {
    const code = this.normalizeReferralCode(rawCode);

    const referralRepository = manager.getRepository(Referral);

    const existingReferral = await referralRepository.findOne({
      where: {
        referredUserId: referredUser.id,
      },
    });

    if (existingReferral) {
      if (existingReferral.referralCodeSnapshot === code) {
        return;
      }

      throw new ConflictException('Bạn đã sử dụng mã giới thiệu trước đó');
    }

    const referralCode = await manager
      .getRepository(UserReferralCode)
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
      throw new BadRequestException(
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
     * Giữ nguyên quy ước referral hiện tại:
     * Client giới thiệu Client, Therapist giới thiệu Therapist.
     */
    if (referrer.role !== referredUser.role) {
      throw new BadRequestException(
        'Mã giới thiệu không áp dụng cho loại tài khoản này',
      );
    }

    const referral = referralRepository.create({
      referrerUserId: referrer.id,
      referredUserId: referredUser.id,
      referralCodeId: referralCode.id,
      referralCodeSnapshot: referralCode.code,
      status: ReferralStatus.PENDING,
      qualifiedAt: null,
      rewardedAt: null,
    });

    await referralRepository.save(referral);
  }

  private normalizeReferralCode(value: string): string {
    const code = value.trim().toUpperCase().replace(/\s+/g, '');

    if (!code) {
      throw new BadRequestException('Mã giới thiệu không hợp lệ');
    }

    return code;
  }

  private ensureUserCanLogin(user: User) {
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Tài khoản đã bị tạm khóa');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Tài khoản chưa được kích hoạt');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản hiện không hoạt động');
    }
  }

  private getAccessTokenExpiresIn(): number {
    const value = this.configService.get<string>(
      'JWT_ACCESS_EXPIRES_SECONDS',

      '900',
    );

    const seconds = Number(value);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return 900;
    }

    return Math.floor(seconds);
  }

  private getRefreshTokenExpiresDays(): number {
    const value = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_DAYS',

      '30',
    );

    const days = Number(value);

    if (!Number.isFinite(days) || days <= 0) {
      return 30;
    }

    return Math.floor(days);
  }

  private toUserResponse(user: User) {
    return {
      id: user.id,

      fullName: user.fullName,

      phone: user.phone,

      email: user.email ?? null,

      avatarUrl: user.avatarUrl ?? null,

      role: user.role,

      status: user.status,

      lastLoginAt: user.lastLoginAt ?? null,
    };
  }

  async updatePhoneForTest(params: {
    userId: number;
    newPhone: string;
    testSecret: string;
  }) {
    /**
     * ============================================================
     * TEST ENDPOINT GUARD
     * ============================================================
     */
    const appEnv =
      this.configService.get<string>('APP_ENV') ??
      this.configService.get<string>('NODE_ENV') ??
      'development';

    if (appEnv.toLowerCase() === 'production') {
      throw new NotFoundException();
    }

    const configuredSecret = this.configService.get<string>('TEST_API_SECRET');

    if (!configuredSecret || params.testSecret !== configuredSecret) {
      throw new ForbiddenException('Test secret không hợp lệ');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: params.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const phone = normalizeVietnamPhone(params.newPhone);

    const existed = await this.userRepository
      .createQueryBuilder('user')
      .where('user.phone = :phone', {
        phone,
      })
      .andWhere('user.id != :userId', {
        userId: user.id,
      })
      .getExists();

    if (existed) {
      throw new BadRequestException('Số điện thoại đã được sử dụng');
    }

    const oldPhone = user.phone;

    user.phone = phone;

    const saved = await this.userRepository.save(user);

    return {
      success: true,

      user: {
        id: saved.id,

        fullName: saved.fullName,

        role: saved.role,

        status: saved.status,

        oldPhone,

        phone: saved.phone,
      },
    };
  }
}
