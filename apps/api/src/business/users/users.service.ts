import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../entities/user.entity.js';

import { UserRole, UserStatus } from '../enums/business.enums.js';

import { AdminUserQueryDto } from './dto/admin-user-query.dto.js';
import { AuthUser } from '../auth/types/auth-user.type.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';
import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { ClientProfile } from '../entities/client-profile.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  private getAllowedManagedRoles(currentUser: AuthUser): UserRole[] {
    if (currentUser.role === UserRole.SUPER_ADMIN) {
      return [UserRole.SYSTEM_ADMIN, UserRole.CLIENT, UserRole.THERAPIST];
    }

    if (currentUser.role === UserRole.SYSTEM_ADMIN) {
      return [UserRole.CLIENT, UserRole.THERAPIST];
    }

    return [];
  }

  private ensureCanManageRole(currentUser: AuthUser, targetRole: UserRole) {
    const allowedRoles = this.getAllowedManagedRoles(currentUser);

    if (!allowedRoles.includes(targetRole)) {
      throw new ForbiddenException(
        'Bạn không có quyền quản lý loại tài khoản này',
      );
    }
  }

  async findAll(query: AdminUserQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.userRepository.createQueryBuilder('user');

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;

      qb.andWhere(
        new Brackets((sub) => {
          sub
            .where('LOWER(user.fullName) LIKE :q', { q })
            .orWhere('LOWER(user.email) LIKE :q', { q })
            .orWhere('LOWER(user.phone) LIKE :q', { q });
        }),
      );
    }

    if (query.role) {
      qb.andWhere('user.role = :role', {
        role: query.role,
      });
    }

    if (query.status) {
      qb.andWhere('user.status = :status', {
        status: query.status,
      });
    }

    qb.orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((user) => this.toResponse(user)),

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return this.toResponse(user);
  }

  private async ensureRoleProfile(
    manager: EntityManager,
    user: User,
  ): Promise<void> {
    /**
     * ==========================================================
     * CLIENT PROFILE
     * ==========================================================
     */
    if (user.role === UserRole.CLIENT) {
      const clientProfileRepository = manager.getRepository(ClientProfile);

      const existedClientProfile = await clientProfileRepository.findOne({
        where: {
          userId: user.id,
        },
      });

      if (!existedClientProfile) {
        const clientProfile = clientProfileRepository.create({
          userId: user.id,
        });

        await clientProfileRepository.save(clientProfile);
      }

      return;
    }

    /**
     * ==========================================================
     * THERAPIST PROFILE
     * ==========================================================
     */
    if (user.role === UserRole.THERAPIST) {
      const therapistProfileRepository =
        manager.getRepository(TherapistProfile);

      const existedTherapistProfile = await therapistProfileRepository.findOne({
        where: {
          userId: user.id,
        },
      });

      if (!existedTherapistProfile) {
        const therapistProfile = therapistProfileRepository.create({
          userId: user.id,
        });

        await therapistProfileRepository.save(therapistProfile);
      }
    }
  }

  async createUser(currentUser: AuthUser, dto: CreateAdminUserDto) {
    this.ensureCanManageRole(currentUser, dto.role);

    const phone = this.normalizePhone(dto.phone);

    const email = dto.email?.trim().toLowerCase() ?? null;

    await this.ensureUnique(phone, email);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const user = userRepository.create({
        fullName: dto.fullName.trim(),
        phone,
        email,
        passwordHash,

        role: dto.role,

        status: UserStatus.ACTIVE,
      });

      const saved = await userRepository.save(user);

      /**
       * CLIENT / THERAPIST bắt buộc
       * phải có role profile.
       */
      await this.ensureRoleProfile(manager, saved);

      return this.toResponse(saved);
    });
  }

  async updateUser(currentUser: AuthUser, id: number, dto: UpdateAdminUserDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      /**
       * Kiểm tra quyền role hiện tại.
       */
      this.ensureCanManageRole(currentUser, user.role);

      /**
       * Đổi role.
       */
      if (dto.role !== undefined) {
        this.ensureCanManageRole(currentUser, dto.role);

        user.role = dto.role;
      }

      if (dto.fullName !== undefined) {
        user.fullName = dto.fullName.trim();
      }

      if (dto.phone !== undefined) {
        const phone = this.normalizePhone(dto.phone);

        await this.ensureUnique(phone, undefined, user.id);

        user.phone = phone;
      }

      if (dto.email !== undefined) {
        const email = dto.email ? dto.email.trim().toLowerCase() : null;

        if (email) {
          await this.ensureUnique(undefined, email, user.id);
        }

        user.email = email;
      }

      if (dto.password) {
        user.passwordHash = await bcrypt.hash(dto.password, 12);
      }

      const saved = await userRepository.save(user);

      /**
       * Sau update, bảo đảm role hiện tại
       * luôn có profile tương ứng.
       */
      await this.ensureRoleProfile(manager, saved);

      return this.toResponse(saved);
    });
  }

  async updateStatus(currentUser: AuthUser, id: number, status: UserStatus) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    this.ensureCanManageRole(currentUser, user.role);

    if (user.id === currentUser.sub) {
      throw new ForbiddenException(
        'Không thể thay đổi trạng thái tài khoản đang đăng nhập',
      );
    }

    user.status = status;
    const saved = await this.userRepository.save(user);
    return this.toResponse(saved);
  }

  private async ensureUnique(
    phone?: string,
    email?: string | null,
    excludeUserId?: number,
  ) {
    if (phone) {
      const qb = this.userRepository
        .createQueryBuilder('user')
        .where('user.phone = :phone', {
          phone,
        });

      if (excludeUserId) {
        qb.andWhere('user.id != :excludeUserId', {
          excludeUserId,
        });
      }

      const exists = await qb.getExists();

      if (exists) {
        throw new ConflictException('Số điện thoại đã được sử dụng');
      }
    }

    if (email) {
      const qb = this.userRepository
        .createQueryBuilder('user')
        .where('LOWER(user.email) = :email', {
          email: email.toLowerCase(),
        });

      if (excludeUserId) {
        qb.andWhere('user.id != :excludeUserId', {
          excludeUserId,
        });
      }

      const exists = await qb.getExists();

      if (exists) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }
  }

  private normalizePhone(phone: string) {
    let value = phone.trim().replace(/[\s.-]/g, '');

    if (value.startsWith('0')) {
      value = `+84${value.slice(1)}`;
    }

    return value;
  }

  private toResponse(user: User) {
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      email: user.email ?? null,
      avatarUrl: user.avatarUrl ?? null,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
    };
  }

  async repairRoleProfile(currentUser: AuthUser, id: number) {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);

      const user = await userRepository.findOne({
        where: {
          id,
        },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      this.ensureCanManageRole(currentUser, user.role);

      /**
       * ==========================================================
       * CLIENT
       * ==========================================================
       */
      if (user.role === UserRole.CLIENT) {
        const repository = manager.getRepository(ClientProfile);

        const existed = await repository.findOne({
          where: {
            userId: user.id,
          },
        });

        if (existed) {
          return {
            repaired: false,
            profileType: 'client',
            profileId: existed.id,
            message: 'Hồ sơ khách hàng đã tồn tại',
          };
        }

        const profile = repository.create({
          userId: user.id,
        });

        const saved = await repository.save(profile);

        return {
          repaired: true,
          profileType: 'client',
          profileId: saved.id,
          message: 'Đã khôi phục hồ sơ khách hàng',
        };
      }

      /**
       * ==========================================================
       * THERAPIST
       * ==========================================================
       */
      if (user.role === UserRole.THERAPIST) {
        const repository = manager.getRepository(TherapistProfile);

        const existed = await repository.findOne({
          where: {
            userId: user.id,
          },
        });

        if (existed) {
          return {
            repaired: false,
            profileType: 'therapist',
            profileId: existed.id,
            message: 'Hồ sơ kỹ thuật viên đã tồn tại',
          };
        }

        const profile = repository.create({
          userId: user.id,
        });

        const saved = await repository.save(profile);

        return {
          repaired: true,
          profileType: 'therapist',
          profileId: saved.id,
          message: 'Đã khôi phục hồ sơ kỹ thuật viên',
        };
      }

      throw new BadRequestException(
        'Loại tài khoản này không cần hồ sơ nghiệp vụ',
      );
    });
  }
}
