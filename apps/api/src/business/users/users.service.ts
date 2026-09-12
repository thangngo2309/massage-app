import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../entities/user.entity.js';

import { UserRole, UserStatus } from '../enums/business.enums.js';

import { AdminUserQueryDto } from './dto/admin-user-query.dto.js';
import { CreateSystemAdminDto } from './dto/create-system-admin.dto.js';
import { UpdateSystemAdminDto } from './dto/update-system-admin.dto.js';
import { AuthUser } from '../auth/types/auth-user.type.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async createUser(currentUser: AuthUser, dto: CreateAdminUserDto) {
    this.ensureCanManageRole(currentUser, dto.role);
    const phone = this.normalizePhone(dto.phone);
    const email = dto.email?.trim().toLowerCase() ?? null;
    await this.ensureUnique(phone, email);

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = this.userRepository.create({
      fullName: dto.fullName.trim(),
      phone,
      email,
      passwordHash,
      role: dto.role,
      status: UserStatus.ACTIVE,
    });

    const saved = await this.userRepository.save(user);

    return this.toResponse(saved);
  }

  async updateUser(currentUser: AuthUser, id: number, dto: UpdateAdminUserDto) {
    const user = await this.userRepository.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    /**
     * Kiểm tra quyền đối với role hiện tại.
     *
     * SUPER_ADMIN account sẽ luôn bị chặn.
     */
    this.ensureCanManageRole(currentUser, user.role);

    /**
     * Nếu đổi role thì cũng phải kiểm tra
     * role mới có nằm trong quyền không.
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

    const saved = await this.userRepository.save(user);
    return this.toResponse(saved);
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

//   async createSystemAdmin(dto: CreateSystemAdminDto) {
//     const phone = this.normalizePhone(dto.phone);

//     const email = dto.email ? dto.email.trim().toLowerCase() : null;

//     await this.ensureUnique(phone, email);

//     const passwordHash = await bcrypt.hash(dto.password, 12);

//     const user = this.userRepository.create({
//       fullName: dto.fullName.trim(),
//       phone,
//       email,
//       passwordHash,
//       role: UserRole.SYSTEM_ADMIN,
//       status: UserStatus.ACTIVE,
//     });

//     const saved = await this.userRepository.save(user);

//     return this.toResponse(saved);
//   }

//   async updateSystemAdmin(id: number, dto: UpdateSystemAdminDto) {
//     const user = await this.userRepository.findOne({
//       where: {
//         id,
//       },
//     });

//     if (!user) {
//       throw new NotFoundException('System Admin không tồn tại');
//     }

//     if (user.role !== UserRole.SYSTEM_ADMIN) {
//       throw new ForbiddenException('Tài khoản không phải System Admin');
//     }

//     if (dto.fullName !== undefined) {
//       user.fullName = dto.fullName.trim();
//     }

//     if (dto.phone !== undefined) {
//       const phone = this.normalizePhone(dto.phone);

//       await this.ensureUnique(phone, undefined, user.id);

//       user.phone = phone;
//     }

//     if (dto.email !== undefined) {
//       const email = dto.email ? dto.email.trim().toLowerCase() : null;

//       if (email) {
//         await this.ensureUnique(undefined, email, user.id);
//       }

//       user.email = email;
//     }

//     if (dto.password) {
//       /**
//        * Nếu entity dùng tên khác `password`,
//        * sửa property này giống createSystemAdmin.
//        */
//       user.passwordHash = await bcrypt.hash(dto.password, 12);
//     }

//     const saved = await this.userRepository.save(user);

//     return this.toResponse(saved);
//   }

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
}
