import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';

import { DataSource, In, Repository } from 'typeorm';

import { randomUUID } from 'node:crypto';

import { FirebaseService } from '../../shared/firebase/firebase.service.js';

import type { UpdateTherapistImageOrderDto } from './dto/update-therapist-image-order.dto.js';
import { TherapistImage } from '../entities/therapist-image.entity.js';
import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { AuthUser } from '../auth/types/auth-user.type.js';

const MAX_THERAPIST_IMAGES = 10;

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Injectable()
export class TherapistImagesService {
  constructor(
    @InjectRepository(TherapistImage)
    private readonly imageRepository: Repository<TherapistImage>,

    @InjectRepository(TherapistProfile)
    private readonly therapistRepository: Repository<TherapistProfile>,

    private readonly firebaseService: FirebaseService,

    private readonly dataSource: DataSource,
  ) {}

  async getMyImages(user: AuthUser) {
    const therapist = await this.getTherapistByUserId(user.sub);

    return this.imageRepository.find({
      where: {
        therapistId: therapist.id,
      },

      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });
  }

  async uploadMyImages(user: AuthUser, files: Express.Multer.File[]) {
    if (!files?.length) {
      throw new BadRequestException('Vui lòng chọn ít nhất một hình ảnh');
    }

    const therapist = await this.getTherapistByUserId(user.sub);

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          'Chỉ hỗ trợ hình ảnh JPEG, PNG hoặc WEBP',
        );
      }
    }

    const currentCount = await this.imageRepository.count({
      where: {
        therapistId: therapist.id,
      },
    });

    if (currentCount + files.length > MAX_THERAPIST_IMAGES) {
      throw new BadRequestException(
        `Mỗi kỹ thuật viên được tải tối đa ${MAX_THERAPIST_IMAGES} hình ảnh`,
      );
    }

    const lastImage = await this.imageRepository.findOne({
      where: {
        therapistId: therapist.id,
      },

      order: {
        sortOrder: 'DESC',
      },
    });

    let nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

    const uploadedPaths: string[] = [];

    const savedImageIds: number[] = [];

    try {
      const result: TherapistImage[] = [];

      for (const file of files) {
        const extension = this.getExtension(file.mimetype);

        const storagePath = this.buildStoragePath(
          user.sub,
          randomUUID(),
          extension,
        );

        const uploaded = await this.firebaseService.uploadImage({
          buffer: file.buffer,

          mimeType: file.mimetype,

          storagePath,

          metadata: {
            project: 'massage-platform',

            environment: this.firebaseService.getEnvironment(),

            entity: 'therapist',

            userId: String(user.sub),

            therapistId: String(therapist.id),

            imageType: 'gallery',
          },
        });

        uploadedPaths.push(uploaded.storagePath);

        const image = this.imageRepository.create({
          therapistId: therapist.id,

          imageUrl: uploaded.imageUrl,

          storagePath: uploaded.storagePath,

          sortOrder: nextSortOrder++,

          isActive: true,
        });

        const saved = await this.imageRepository.save(image);

        savedImageIds.push(saved.id);

        result.push(saved);
      }

      return result;
    } catch (error) {
      if (savedImageIds.length > 0) {
        try {
          await this.imageRepository.delete({
            id: In(savedImageIds),
          });
        } catch (cleanupError) {
          console.error('Therapist image DB cleanup failed:', cleanupError);
        }
      }

      for (const storagePath of uploadedPaths) {
        try {
          await this.firebaseService.deleteFile(storagePath);
        } catch (cleanupError) {
          console.error('Firebase cleanup failed:', cleanupError);
        }
      }

      throw error;
    }
  }

  async deleteMyImage(user: AuthUser, imageId: number) {
    const therapist = await this.getTherapistByUserId(user.sub);

    const image = await this.imageRepository.findOne({
      where: {
        id: imageId,
      },
    });

    if (!image) {
      throw new NotFoundException('Không tìm thấy hình ảnh');
    }

    if (image.therapistId !== therapist.id) {
      throw new ForbiddenException('Bạn không có quyền xóa hình ảnh này');
    }

    await this.firebaseService.deleteFile(image.storagePath);

    await this.imageRepository.delete(image.id);

    return {
      success: true,
    };
  }

  async updateMyImageOrder(user: AuthUser, dto: UpdateTherapistImageOrderDto) {
    const therapist = await this.getTherapistByUserId(user.sub);

    if (!dto.items.length) {
      return this.getMyImages(user);
    }

    const ids = dto.items.map((item) => item.id);

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Danh sách hình ảnh bị trùng');
    }

    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(TherapistImage);

      const images = await repository.find({
        where: {
          id: In(ids),
        },
      });

      if (images.length !== ids.length) {
        throw new NotFoundException('Có hình ảnh không tồn tại');
      }

      const hasInvalidImage = images.some(
        (image) => image.therapistId !== therapist.id,
      );

      if (hasInvalidImage) {
        throw new ForbiddenException(
          'Bạn không có quyền thay đổi hình ảnh này',
        );
      }

      for (const item of dto.items) {
        await repository.update(
          {
            id: item.id,

            therapistId: therapist.id,
          },
          {
            sortOrder: item.sortOrder,
          },
        );
      }
    });

    return this.getMyImages(user);
  }

  private async getTherapistByUserId(userId: number) {
    const therapist = await this.therapistRepository.findOne({
      where: {
        userId,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Không tìm thấy hồ sơ kỹ thuật viên');
    }

    return therapist;
  }

  private buildStoragePath(userId: number, uuid: string, extension: string) {
    return [
      this.firebaseService.getEnvironment(),

      'therapists',

      `user-${userId}`,

      'gallery',

      `${uuid}.${extension}`,
    ].join('/');
  }

  private getExtension(mimeType: string) {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';

      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      default:
        throw new BadRequestException('Định dạng hình ảnh không hợp lệ');
    }
  }

  async testFirebaseAuthentication() {
    return this.firebaseService.testAuthentication();
  }

  async testFirebaseStorage() {
    return this.firebaseService.testStorage();
  }
}
