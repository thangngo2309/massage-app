import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';

import { FirebaseService } from '../../shared/firebase/firebase.service.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class ProfileService {
  private static readonly MAX_AVATAR_SIZE = 8 * 1024 * 1024;

  private static readonly ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
  ]);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly firebaseService: FirebaseService,
  ) {}

  async uploadAvatar(userId: number, file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn ảnh đại diện');
    }

    this.validateAvatar(file);

    const user = await this.getUser(userId);

    const oldStoragePath = user.avatarStoragePath;

    const storagePath = this.buildStoragePath(
      user.id,
      file.originalname,
      file.mimetype,
    );

    let uploadedStoragePath: string | null = null;

    try {
      const uploaded = await this.firebaseService.uploadImage({
        buffer: file.buffer,
        mimeType: file.mimetype,
        storagePath,
        metadata: {
          userId: String(user.id),
          type: 'avatar',
        },
      });

      uploadedStoragePath = uploaded.storagePath;

      user.avatarUrl = uploaded.imageUrl;
      user.avatarStoragePath = uploaded.storagePath;

      await this.userRepository.save(user);

      /*
       * Avatar mới đã được lưu DB thành công.
       *
       * Xóa avatar cũ sau cùng.
       * Nếu việc xóa file cũ lỗi thì không rollback avatar mới.
       */
      if (oldStoragePath && oldStoragePath !== uploaded.storagePath) {
        try {
          await this.firebaseService.deleteFile(oldStoragePath);
        } catch (error) {
          console.error(
            `Failed to delete old avatar from Firebase: ${oldStoragePath}`,
            error,
          );
        }
      }

      return this.toAvatarResponse(user);
    } catch (error) {
      /*
       * Firebase upload đã thành công nhưng DB update lỗi.
       *
       * Xóa file vừa upload để tránh orphan file.
       */
      if (uploadedStoragePath) {
        try {
          await this.firebaseService.deleteFile(uploadedStoragePath);
        } catch (cleanupError) {
          console.error(
            `Failed to rollback uploaded avatar: ${uploadedStoragePath}`,
            cleanupError,
          );
        }
      }

      throw error;
    }
  }

  async deleteAvatar(userId: number) {
    const user = await this.getUser(userId);

    const oldStoragePath = user.avatarStoragePath;

    /*
     * Clear DB trước.
     *
     * Nếu Firebase delete lỗi thì user vẫn không còn dùng avatar đó.
     */
    user.avatarUrl = null;
    user.avatarStoragePath = null;

    await this.userRepository.save(user);

    if (oldStoragePath) {
      try {
        await this.firebaseService.deleteFile(oldStoragePath);
      } catch (error) {
        console.error(
          `Failed to delete avatar from Firebase: ${oldStoragePath}`,
          error,
        );
      }
    }

    return this.toAvatarResponse(user);
  }

  private async getUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('Tài khoản không tồn tại');
    }

    return user;
  }

  private validateAvatar(file: Express.Multer.File) {
    if (!ProfileService.ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Ảnh đại diện chỉ hỗ trợ định dạng JPEG, PNG hoặc WEBP',
      );
    }

    if (!file.buffer?.length) {
      throw new BadRequestException('File ảnh không hợp lệ');
    }

    if (file.size > ProfileService.MAX_AVATAR_SIZE) {
      throw new BadRequestException('Ảnh đại diện không được vượt quá 8 MB');
    }
  }

  private buildStoragePath(
    userId: number,
    originalName: string,
    mimeType: string,
  ) {
    const environment = this.firebaseService.getEnvironment();

    const extension = this.resolveExtension(originalName, mimeType);

    return [
      environment,
      'users',
      `user-${userId}`,
      'avatar',
      `${randomUUID()}.${extension}`,
    ].join('/');
  }

  private resolveExtension(originalName: string, mimeType: string) {
    const originalExtension = originalName
      .split('.')
      .pop()
      ?.trim()
      .toLowerCase();

    if (originalExtension === 'jpg' || originalExtension === 'jpeg') {
      return 'jpg';
    }

    if (originalExtension === 'png') {
      return 'png';
    }

    if (originalExtension === 'webp') {
      return 'webp';
    }

    switch (mimeType) {
      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      default:
        return 'jpg';
    }
  }

  private toAvatarResponse(user: User) {
    return {
      avatarUrl: user.avatarUrl ?? null,
    };
  }
}
