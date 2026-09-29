import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { memoryStorage } from 'multer';

import { CurrentUser } from '../../shared/decorators/current-user.decorator.js';

import { Roles } from '../../shared/decorators/roles.decorator.js';

import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard.js';

import { RolesGuard } from '../../shared/guards/roles.guard.js';

import { TherapistImagesService } from './therapist-images.service.js';

import { UpdateTherapistImageOrderDto } from './dto/update-therapist-image-order.dto.js';

import { UserRole } from '../enums/business.enums.js';

import type { AuthUser } from '../auth/types/auth-user.type.js';

const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Controller('therapist/images')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.THERAPIST)
export class TherapistImagesController {
  constructor(private readonly service: TherapistImagesService) {}

  @Get()
  getMyImages(
    @CurrentUser()
    user: AuthUser,
  ) {
    return this.service.getMyImages(user);
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 10, {
      storage: memoryStorage(),

      limits: {
        fileSize: MAX_FILE_SIZE,
      },

      fileFilter: (_request, file, callback) => {
        if (!ALLOWED_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException('Chỉ hỗ trợ hình ảnh JPEG, PNG hoặc WEBP'),
            false,
          );

          return;
        }

        callback(null, true);
      },
    }),
  )
  uploadMyImages(
    @CurrentUser()
    user: AuthUser,

    @UploadedFiles()
    files: Express.Multer.File[],
  ) {
    return this.service.uploadMyImages(user, files);
  }

  @Patch('order')
  updateOrder(
    @CurrentUser()
    user: AuthUser,

    @Body()
    dto: UpdateTherapistImageOrderDto,
  ) {
    return this.service.updateMyImageOrder(user, dto);
  }

  @Delete(':imageId')
  deleteImage(
    @CurrentUser()
    user: AuthUser,

    @Param('imageId', ParseIntPipe)
    imageId: number,
  ) {
    return this.service.deleteMyImage(user, imageId);
  }

  @Get('test/firebase-auth')
  testFirebaseAuthentication() {
    return this.service.testFirebaseAuthentication();
  }

  @Get('test/firebase-storage')
  testFirebaseStorage() {
    return this.service.testFirebaseStorage();
  }
}
