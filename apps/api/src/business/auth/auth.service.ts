import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../entities/user.entity.js';
import { RefreshToken } from '../entities/refresh-token.entity.js';
import { UserRole, UserStatus } from '../enums/business.enums.js';

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
  ) {}

  async register(dto: RegisterDto, meta?: SessionMeta) {
    const fullName = dto.fullName.trim();
    const phone = normalizeVietnamPhone(dto.phone);
    const email = normalizeEmail(dto.email);

    /**
     * RegisterDto đã chặn role khác bằng @IsIn.
     * Check lại ở service để tránh phụ thuộc hoàn toàn DTO validation.
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
     * TRANSACTION
     * ================================================================
     */
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      /**
       * ==============================================================
       * CREATE USER
       * ==============================================================
       */
      const user = userRepository.create({
        fullName,
        phone,
        email,
        passwordHash,

        role: dto.role,

        status: UserStatus.ACTIVE,
      });

      const savedUser = await userRepository.save(user);

      /**
       * ==============================================================
       * CREATE ROLE PROFILE
       * ==============================================================
       *
       * User CLIENT luôn phải có ClientProfile.
       *
       * User THERAPIST luôn phải có TherapistProfile.
       *
       * Không tạo profile cho SUPER_ADMIN / SYSTEM_ADMIN
       * vì register() không cho hai role đó tự đăng ký.
       */
      if (savedUser.role === UserRole.CLIENT) {
        const clientProfileRepository = manager.getRepository(ClientProfile);

        const clientProfile = clientProfileRepository.create({
          userId: savedUser.id,
        });

        await clientProfileRepository.save(clientProfile);
      }

      if (savedUser.role === UserRole.THERAPIST) {
        const therapistProfileRepository =
          manager.getRepository(TherapistProfile);

        const therapistProfile = therapistProfileRepository.create({
          userId: savedUser.id,
        });

        await therapistProfileRepository.save(therapistProfile);
      }

      /**
       * ==============================================================
       * CREATE SESSION
       * ==============================================================
       *
       * Chỉ tạo session sau khi User + Profile
       * đã được tạo thành công.
       *
       * Nếu profile lỗi thì toàn transaction rollback.
       */
      const tokens = await this.createSession(
        savedUser,
        {
          deviceName: dto.deviceName ?? null,
          ipAddress: meta?.ipAddress ?? null,
        },
        manager,
      );

      return {
        user: this.toUserResponse(savedUser),

        ...tokens,
      };
    });
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
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? null,
    };
  }
}
