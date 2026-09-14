import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { Rating } from '../entities/rating.entity.js';
import { Booking } from '../entities/booking.entity.js';
import { ClientProfile } from '../entities/client-profile.entity.js';
import { TherapistProfile } from '../entities/therapist-profile.entity.js';
import { BookingStatus } from '../enums/business.enums.js';
import type { CreateRatingDto } from './dto/create-rating.dto.js';
import type { UpdateRatingDto } from './dto/update-rating.dto.js';
import type { AdminUpdateRatingDto } from './dto/admin-update-rating.dto.js';
import type { AdminRatingQueryDto } from './dto/admin-rating-query.dto.js';

@Injectable()
export class RatingService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  /**
   * ================================================================
   * CLIENT CREATE
   * ================================================================
   */
  async createRating(clientUserId: number, dto: CreateRatingDto) {
    return this.dataSource.transaction(async (manager) => {
      const client = await this.getClientProfile(manager, clientUserId);

      /**
       * Lock Booking:
       * tránh 2 request cùng đánh giá một booking.
       */
      const booking = await manager.getRepository(Booking).findOne({
        where: {
          id: dto.bookingId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.clientId !== client.id) {
        throw new ForbiddenException('You cannot rate this booking');
      }

      if (booking.status !== BookingStatus.COMPLETED) {
        throw new BadRequestException('Only completed bookings can be rated');
      }

      if (!booking.therapistId) {
        throw new BadRequestException('Booking has no therapist');
      }

      const ratingRepository = manager.getRepository(Rating);

      const existed = await ratingRepository.findOne({
        where: {
          bookingId: booking.id,
        },
      });

      if (existed) {
        throw new ConflictException('Booking has already been rated');
      }

      const rating = ratingRepository.create({
        bookingId: booking.id,

        clientId: client.id,

        therapistId: booking.therapistId,

        rating: dto.rating,

        comment: dto.comment?.trim() || null,

        isVisible: true,

        adminNote: null,
      });

      const saved = await ratingRepository.save(rating);

      await this.recalculateTherapistRating(manager, booking.therapistId);

      return this.findDetail(manager, saved.id);
    });
  }

  /**
   * ================================================================
   * CLIENT UPDATE OWN RATING
   * ================================================================
   */
  async updateMyRating(
    clientUserId: number,
    ratingId: number,
    dto: UpdateRatingDto,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const client = await this.getClientProfile(manager, clientUserId);

      const repository = manager.getRepository(Rating);

      const rating = await repository.findOne({
        where: {
          id: ratingId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!rating) {
        throw new NotFoundException('Rating not found');
      }

      if (rating.clientId !== client.id) {
        throw new ForbiddenException();
      }

      if (dto.rating !== undefined) {
        rating.rating = dto.rating;
      }

      if (dto.comment !== undefined) {
        rating.comment = dto.comment.trim() || null;
      }

      const saved = await repository.save(rating);

      await this.recalculateTherapistRating(manager, rating.therapistId);

      return this.findDetail(manager, saved.id);
    });
  }

  /**
   * ================================================================
   * GET MY RATING BY BOOKING
   * ================================================================
   */
  async getMyRatingByBooking(clientUserId: number, bookingId: number) {
    const manager = this.dataSource.manager;

    const client = await this.getClientProfile(manager, clientUserId);

    const rating = await manager.getRepository(Rating).findOne({
      where: {
        bookingId,
        clientId: client.id,
      },

      relations: {
        booking: true,
        therapist: {
          user: true,
        },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }

  /**
   * ================================================================
   * ADMIN LIST
   * ================================================================
   */
  async getAdminRatings(query: AdminRatingQueryDto) {
    const page = query.page ?? 1;

    const limit = query.limit ?? 20;

    const qb = this.dataSource
      .getRepository(Rating)
      .createQueryBuilder('rating')
      .leftJoinAndSelect('rating.booking', 'booking')
      .leftJoinAndSelect('rating.client', 'client')
      .leftJoinAndSelect('client.user', 'clientUser')
      .leftJoinAndSelect('rating.therapist', 'therapist')
      .leftJoinAndSelect('therapist.user', 'therapistUser');

    if (query.therapistId) {
      qb.andWhere('rating.therapistId = :therapistId', {
        therapistId: query.therapistId,
      });
    }

    if (query.rating !== undefined) {
      qb.andWhere('rating.rating = :rating', {
        rating: query.rating,
      });
    }

    if (query.isVisible !== undefined) {
      qb.andWhere('rating.isVisible = :isVisible', {
        isVisible: query.isVisible,
      });
    }

    if (query.from) {
      qb.andWhere('rating.createdAt >= :from', {
        from: new Date(`${query.from}T00:00:00+07:00`),
      });
    }

    if (query.to) {
      const to = new Date(`${query.to}T00:00:00+07:00`);

      to.setUTCDate(to.getUTCDate() + 1);

      qb.andWhere('rating.createdAt < :to', {
        to,
      });
    }

    if (query.q?.trim()) {
      const q = `%${query.q.trim()}%`;

      qb.andWhere(
        `(
            booking.bookingCode ILIKE :q
            OR rating.comment ILIKE :q
            OR clientUser.fullName ILIKE :q
            OR clientUser.phone ILIKE :q
            OR therapistUser.fullName ILIKE :q
            OR therapistUser.phone ILIKE :q
          )`,
        {
          q,
        },
      );
    }

    const [items, total] = await qb
      .orderBy('rating.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,

      pagination: {
        page,
        limit,
        total,

        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * ================================================================
   * ADMIN DETAIL
   * ================================================================
   */
  async getAdminRating(id: number) {
    return this.findDetail(this.dataSource.manager, id);
  }

  /**
   * ================================================================
   * ADMIN MODERATION
   * ================================================================
   */
  async updateAdminRating(id: number, dto: AdminUpdateRatingDto) {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(Rating);

      const rating = await repository.findOne({
        where: {
          id,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!rating) {
        throw new NotFoundException('Rating not found');
      }

      const oldVisible = rating.isVisible;

      if (dto.isVisible !== undefined) {
        rating.isVisible = dto.isVisible;
      }

      if (dto.adminNote !== undefined) {
        rating.adminNote = dto.adminNote?.trim() || null;
      }

      await repository.save(rating);

      /**
       * Nếu visibility thay đổi,
       * rating aggregate cũng phải tính lại.
       */
      if (oldVisible !== rating.isVisible) {
        await this.recalculateTherapistRating(manager, rating.therapistId);
      }

      return this.findDetail(manager, rating.id);
    });
  }

  /**
   * ================================================================
   * RECALCULATE THERAPIST RATING
   * ================================================================
   *
   * Không cộng trừ dựa trên giá trị cũ.
   * Query lại AVG + COUNT để tránh drift.
   *
   * Chỉ rating đang visible được tính.
   */
  private async recalculateTherapistRating(
    manager: EntityManager,
    therapistId: number,
  ) {
    const result = await manager
      .getRepository(Rating)
      .createQueryBuilder('rating')
      .select('COUNT(rating.id)', 'count')
      .addSelect('AVG(rating.rating)', 'average')
      .where('rating.therapistId = :therapistId', {
        therapistId,
      })
      .andWhere('rating.isVisible = true')
      .getRawOne<{
        count: string;
        average: string | null;
      }>();

    const ratingCount = Number(result?.count ?? 0);

    const ratingAverage = result?.average
      ? Number(Number(result.average).toFixed(2))
      : 0;

    await manager.getRepository(TherapistProfile).update(therapistId, {
      ratingCount,
      ratingAverage,
    });
  }

  /**
   * ================================================================
   * CLIENT PROFILE
   * ================================================================
   */
  private async getClientProfile(manager: EntityManager, userId: number) {
    const client = await manager.getRepository(ClientProfile).findOne({
      where: {
        userId,
      },
    });

    if (!client) {
      throw new NotFoundException('Client profile not found');
    }

    return client;
  }

  /**
   * ================================================================
   * DETAIL
   * ================================================================
   */
  private async findDetail(manager: EntityManager, id: number) {
    const rating = await manager.getRepository(Rating).findOne({
      where: {
        id,
      },

      relations: {
        booking: true,

        client: {
          user: true,
        },

        therapist: {
          user: true,
        },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return rating;
  }
}
