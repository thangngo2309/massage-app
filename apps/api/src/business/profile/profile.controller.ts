import {
  BadRequestException,
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

import { ProfileService } from './profile.service.js';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),

      limits: {
        fileSize: 8 * 1024 * 1024,
        files: 1,
      },

      fileFilter: (_request, file, callback) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Ảnh đại diện chỉ hỗ trợ định dạng JPEG, PNG hoặc WEBP',
            ),
            false,
          );

          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() currentUser: AuthUser,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.profileService.uploadAvatar(currentUser.sub, file);
  }

  @Delete('avatar')
  deleteAvatar(@CurrentUser() currentUser: AuthUser) {
    return this.profileService.deleteAvatar(currentUser.sub);
  }
}
