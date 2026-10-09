import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource, EntityManager } from 'typeorm';

import { TherapistGroup } from '../entities/therapist-group.entity.js';

import { TherapistGroupMember } from '../entities/therapist-group-member.entity.js';

import { TherapistGroupInvitation } from '../entities/therapist-group-invitation.entity.js';

import { BookingTherapistTransfer } from '../entities/booking-therapist-transfer.entity.js';

import { TherapistProfile } from '../entities/therapist-profile.entity.js';

import {
  BookingStatus,
  TherapistVerificationStatus,
  UserRole,
  UserStatus,
} from '../enums/business.enums.js';

import {
  BookingTherapistTransferStatus,
  TherapistGroupInvitationStatus,
  TherapistGroupMemberRole,
} from './therapist-group.enums.js';

import type {
  CreateTherapistGroupDto,
  TherapistGroupCandidateQueryDto,
} from './dto/therapist-group.dto.js';

const ACTIVE_TRANSFER_STATUSES: BookingTherapistTransferStatus[] = [
  BookingTherapistTransferStatus.PENDING_THERAPIST,

  BookingTherapistTransferStatus.PENDING_CLIENT,

  BookingTherapistTransferStatus.READY_TO_ACCEPT,
];

@Injectable()
export class TherapistGroupService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getMyGroup(userId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      userId,
    );

    const membership = await this.dataSource.manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          therapistId: therapist.id,
        },

        relations: {
          group: true,
        },
      });

    if (!membership || !membership.group.isActive) {
      return {
        group: null,
      };
    }

    const members = await this.dataSource.manager

      .getRepository(TherapistGroupMember)

      .find({
        where: {
          groupId: membership.groupId,
        },

        relations: {
          therapist: {
            user: true,
          },
        },

        order: {
          createdAt: 'ASC',
        },
      });

    return {
      group: {
        id: membership.group.id,

        name: membership.group.name,

        description: membership.group.description,

        ownerTherapistId: membership.group.ownerTherapistId,

        isActive: membership.group.isActive,

        myRole: membership.role,

        members: members.map((item) => ({
          id: item.id,

          therapistId: item.therapistId,

          role: item.role,

          stageName: item.therapist.stageName ?? null,

          fullName: item.therapist.user?.fullName ?? null,

          phone: item.therapist.user?.phone ?? null,

          verificationStatus: item.therapist.verificationStatus,

          isAcceptingBookings: item.therapist.isAcceptingBookings,

          onlineStatus: item.therapist.onlineStatus,
        })),
      },
    };
  }

  async createGroup(userId: number, dto: CreateTherapistGroupDto) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(manager, userId, true);

      await this.ensureTherapistHasNoGroup(manager, therapist.id);

      const name = dto.name.trim();

      if (!name) {
        throw new BadRequestException('Tên nhóm không được để trống');
      }

      const group = await manager.getRepository(TherapistGroup).save({
        name,

        description: dto.description?.trim() || null,

        ownerTherapistId: therapist.id,

        isActive: true,
      });

      await manager.getRepository(TherapistGroupMember).save({
        groupId: group.id,

        therapistId: therapist.id,

        role: TherapistGroupMemberRole.OWNER,
      });

      /**

       * Khi KTV đã tự tạo nhóm mới, mọi lời mời PENDING gửi tới KTV

       * không còn actionable nữa. Hủy ngay trong cùng transaction để

       * màn lời mời không tiếp tục hiển thị dữ liệu stale.

       */

      await this.cancelPendingInvitationsForTherapist(manager, therapist.id);

      return this.getGroupDetail(manager, group.id, therapist.id);
    });
  }

  async searchCandidates(
    userId: number,

    query: TherapistGroupCandidateQueryDto,
  ) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      userId,
    );

    const qb = this.dataSource.manager

      .getRepository(TherapistProfile)

      .createQueryBuilder('therapist')

      .innerJoinAndSelect('therapist.user', 'user')

      .where('therapist.id != :therapistId', {
        therapistId: therapist.id,
      })

      .andWhere('therapist.verificationStatus = :verificationStatus', {
        verificationStatus: TherapistVerificationStatus.VERIFIED,
      })

      .andWhere('user.role = :role', {
        role: UserRole.THERAPIST,
      })

      .andWhere('user.status = :userStatus', {
        userStatus: UserStatus.ACTIVE,
      }).andWhere(`

          NOT EXISTS (

            SELECT 1

            FROM therapist_group_members group_member

            WHERE

              group_member.therapist_id = therapist.id

              AND group_member.deleted_at IS NULL

          )

        `);

    const q = query.q?.trim();

    if (q) {
      qb.andWhere(
        `

          (

            LOWER(user.fullName) LIKE LOWER(:q)

            OR user.phone LIKE :q

            OR LOWER(COALESCE(user.email, '')) LIKE LOWER(:q)

            OR LOWER(COALESCE(therapist.stageName, '')) LIKE LOWER(:q)

          )

          `,

        {
          q: `%${q}%`,
        },
      );
    }

    const items = await qb.orderBy('therapist.id', 'DESC').take(30).getMany();

    return {
      items: items.map((item) => ({
        therapistId: item.id,

        stageName: item.stageName ?? null,

        fullName: item.user?.fullName ?? null,

        phone: item.user?.phone ?? null,

        ratingAverage: Number(item.ratingAverage ?? 0),

        ratingCount: Number(item.ratingCount ?? 0),

        completedBookings: Number(item.completedBookings ?? 0),
      })),
    };
  }

  async invite(userId: number, groupId: number, invitedTherapistId: number) {
    return this.dataSource.transaction(async (manager) => {
      const inviter = await this.getTherapistByUserId(manager, userId);

      /**

       * Bất kỳ thành viên nào trong nhóm

       * đều có thể mời thêm KTV.

       */

      await this.requireGroupMember(manager, groupId, inviter.id);

      if (inviter.id === invitedTherapistId) {
        throw new BadRequestException('Không thể tự mời chính mình');
      }

      const invitedTherapist = await manager

        .getRepository(TherapistProfile)

        .findOne({
          where: {
            id: invitedTherapistId,
          },

          relations: {
            user: true,
          },
        });

      if (!invitedTherapist) {
        throw new NotFoundException('Không tìm thấy kỹ thuật viên');
      }

      if (invitedTherapist.user.status !== UserStatus.ACTIVE) {
        throw new BadRequestException('Kỹ thuật viên không hoạt động');
      }

      if (
        invitedTherapist.verificationStatus !==
        TherapistVerificationStatus.VERIFIED
      ) {
        throw new BadRequestException('Kỹ thuật viên chưa được xác minh');
      }

      const existingMembership = await manager

        .getRepository(TherapistGroupMember)

        .findOne({
          where: {
            therapistId: invitedTherapistId,
          },
        });

      if (existingMembership) {
        throw new ConflictException('Kỹ thuật viên đã thuộc một nhóm khác');
      }

      const existingInvitation = await manager

        .getRepository(TherapistGroupInvitation)

        .findOne({
          where: {
            groupId,

            invitedTherapistId,

            status: TherapistGroupInvitationStatus.PENDING,
          },
        });

      if (existingInvitation) {
        throw new ConflictException('Đã có lời mời đang chờ xử lý');
      }

      return manager.getRepository(TherapistGroupInvitation).save({
        groupId,

        invitedByTherapistId: inviter.id,

        invitedTherapistId,

        status: TherapistGroupInvitationStatus.PENDING,

        respondedAt: null,
      });
    });
  }

  async getMyInvitations(userId: number) {
    const therapist = await this.getTherapistByUserId(
      this.dataSource.manager,

      userId,
    );

    /**

     * Safety net cho dữ liệu cũ:

     * nếu KTV hiện đã thuộc một nhóm nhưng DB vẫn còn invitation PENDING,

     * tự động CANCELLED rồi trả danh sách rỗng.

     */

    const membership = await this.dataSource.manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          therapistId: therapist.id,
        },
      });

    if (membership) {
      await this.cancelPendingInvitationsForTherapist(
        this.dataSource.manager,

        therapist.id,
      );

      return {
        items: [],
      };
    }

    const items = await this.dataSource.manager

      .getRepository(TherapistGroupInvitation)

      .find({
        where: {
          invitedTherapistId: therapist.id,

          status: TherapistGroupInvitationStatus.PENDING,
        },

        relations: {
          group: true,

          invitedByTherapist: {
            user: true,
          },
        },

        order: {
          createdAt: 'DESC',
        },
      });

    return {
      items: items.map((item) => ({
        id: item.id,

        group: {
          id: item.group.id,

          name: item.group.name,

          description: item.group.description,
        },

        invitedBy: {
          therapistId: item.invitedByTherapistId,

          stageName: item.invitedByTherapist.stageName ?? null,

          fullName: item.invitedByTherapist.user?.fullName ?? null,
        },

        status: item.status,

        createdAt: item.createdAt,
      })),
    };
  }

  async respondInvitation(
    userId: number,

    invitationId: number,

    action: 'accept' | 'reject',
  ) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(manager, userId, true);

      const invitationRepository = manager.getRepository(
        TherapistGroupInvitation,
      );

      /**

       * Bước 1:

       * Lock invitation nhưng KHÔNG load relation.

       */

      const lockedInvitation = await invitationRepository.findOne({
        where: {
          id: invitationId,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedInvitation) {
        throw new NotFoundException('Không tìm thấy lời mời');
      }

      /**

       * Bước 2:

       * Row invitation đã bị lock.

       *

       * Load relation group bằng query riêng

       * không có FOR UPDATE.

       */

      const invitation = await invitationRepository.findOne({
        where: {
          id: lockedInvitation.id,
        },

        relations: {
          group: true,
        },
      });

      if (!invitation) {
        throw new NotFoundException('Không tìm thấy lời mời');
      }

      if (invitation.invitedTherapistId !== therapist.id) {
        throw new ForbiddenException();
      }

      if (invitation.status !== TherapistGroupInvitationStatus.PENDING) {
        throw new ConflictException('Lời mời đã được xử lý');
      }

      /**

       * ========================================================

       * REJECT

       * ========================================================

       */

      if (action === 'reject') {
        invitation.status = TherapistGroupInvitationStatus.REJECTED;

        invitation.respondedAt = new Date();

        return invitationRepository.save(invitation);
      }

      /**

       * ========================================================

       * ACCEPT

       * ========================================================

       */

      if (!invitation.group.isActive) {
        throw new ConflictException('Nhóm không còn hoạt động');
      }

      await this.ensureTherapistHasNoGroup(manager, therapist.id);

      await manager.getRepository(TherapistGroupMember).save({
        groupId: invitation.groupId,

        therapistId: therapist.id,

        role: TherapistGroupMemberRole.MEMBER,
      });

      invitation.status = TherapistGroupInvitationStatus.ACCEPTED;

      invitation.respondedAt = new Date();

      await invitationRepository.save(invitation);

      /**

       * Khi đã vào một nhóm, hủy mọi lời mời PENDING còn lại.

       */

      await this.cancelPendingInvitationsForTherapist(
        manager,

        therapist.id,

        invitation.id,
      );

      return this.getGroupDetail(manager, invitation.groupId, therapist.id);
    });
  }

  async leaveGroup(userId: number) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(manager, userId, true);

      const membershipRepository = manager.getRepository(TherapistGroupMember);

      /**

       * Lock membership trước,

       * không JOIN relation.

       */

      const lockedMembership = await membershipRepository.findOne({
        where: {
          therapistId: therapist.id,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!lockedMembership) {
        throw new NotFoundException('Bạn chưa thuộc nhóm nào');
      }

      /**

       * Sau khi membership đã được lock,

       * load group bằng query riêng.

       */

      const membership = await membershipRepository.findOne({
        where: {
          id: lockedMembership.id,
        },

        relations: {
          group: true,
        },
      });

      if (!membership) {
        throw new NotFoundException('Bạn chưa thuộc nhóm nào');
      }

      await this.ensureTherapistHasNoBlockingTransfer(
        manager,

        membership.groupId,

        therapist.id,
      );

      /**

       * Chủ nhóm chỉ được rời khi

       * không còn thành viên khác.

       */

      if (membership.role === TherapistGroupMemberRole.OWNER) {
        const memberCount = await membershipRepository.count({
          where: {
            groupId: membership.groupId,
          },
        });

        if (memberCount > 1) {
          throw new ConflictException(
            'Chủ nhóm không thể rời nhóm khi vẫn còn thành viên. Hãy giải tán nhóm trước.',
          );
        }

        membership.group.isActive = false;

        await manager.getRepository(TherapistGroup).save(membership.group);
      }

      await membershipRepository.softDelete(membership.id);

      return {
        success: true,
      };
    });
  }

  async removeMember(userId: number, groupId: number, therapistId: number) {
    return this.dataSource.transaction(async (manager) => {
      const owner = await this.getTherapistByUserId(manager, userId);

      const group = await manager.getRepository(TherapistGroup).findOne({
        where: {
          id: groupId,

          isActive: true,
        },
      });

      if (!group) {
        throw new NotFoundException('Không tìm thấy nhóm');
      }

      if (group.ownerTherapistId !== owner.id) {
        throw new ForbiddenException('Chỉ chủ nhóm mới được xóa thành viên');
      }

      if (therapistId === group.ownerTherapistId) {
        throw new BadRequestException('Không thể xóa chủ nhóm');
      }

      const membership = await manager

        .getRepository(TherapistGroupMember)

        .findOne({
          where: {
            groupId,

            therapistId,
          },
        });

      if (!membership) {
        throw new NotFoundException('Kỹ thuật viên không thuộc nhóm');
      }

      await this.ensureTherapistHasNoBlockingTransfer(
        manager,

        groupId,

        therapistId,
      );

      await manager

        .getRepository(TherapistGroupMember)

        .softDelete(membership.id);

      return {
        success: true,
      };
    });
  }

  async disbandGroup(userId: number, groupId: number) {
    return this.dataSource.transaction(async (manager) => {
      const therapist = await this.getTherapistByUserId(manager, userId);

      const group = await manager.getRepository(TherapistGroup).findOne({
        where: {
          id: groupId,

          isActive: true,
        },

        lock: {
          mode: 'pessimistic_write',
        },
      });

      if (!group) {
        throw new NotFoundException('Không tìm thấy nhóm');
      }

      if (group.ownerTherapistId !== therapist.id) {
        throw new ForbiddenException('Chỉ chủ nhóm mới được giải tán nhóm');
      }

      await this.ensureGroupHasNoBlockingTransfers(manager, group.id);

      group.isActive = false;

      await manager.getRepository(TherapistGroup).save(group);

      await manager

        .getRepository(TherapistGroupMember)

        .createQueryBuilder()

        .softDelete()

        .where('group_id = :groupId', {
          groupId,
        })

        .execute();

      await manager

        .getRepository(TherapistGroupInvitation)

        .createQueryBuilder()

        .update()

        .set({
          status: TherapistGroupInvitationStatus.CANCELLED,

          respondedAt: new Date(),
        })

        .where('group_id = :groupId', {
          groupId,
        })

        .andWhere('status = :status', {
          status: TherapistGroupInvitationStatus.PENDING,
        })

        .execute();

      return {
        success: true,
      };
    });
  }

  /**

   * ================================================================

   * GROUP / TRANSFER CONSISTENCY

   * ================================================================

   */

  private buildBlockingTransferQuery(manager: EntityManager, groupId: number) {
    /**
     * QUAN TRỌNG:
     *
     * Những biểu thức viết trong template/raw SQL bên dưới phải dùng
     * physical column name của PostgreSQL (snake_case).
     *
     * TypeORM không luôn map property path camelCase ở trong raw fragment.
     * Nếu viết transfer.fromTherapistId, PostgreSQL có thể hiểu thành
     * transfer.fromtherapistid và phát sinh lỗi 42703.
     */
    return manager

      .getRepository(BookingTherapistTransfer)

      .createQueryBuilder('transfer')

      .innerJoin('transfer.booking', 'booking')

      .where('"transfer"."group_id" = :groupId', {
        groupId,
      })

      .andWhere('"transfer"."status" IN (:...statuses)', {
        statuses: ACTIVE_TRANSFER_STATUSES,
      })

      .andWhere('"booking"."status" = :bookingStatus', {
        bookingStatus: BookingStatus.WAITING_THERAPIST_ACCEPT,
      })

      .andWhere('"booking"."scheduled_at" > :now', {
        now: new Date(),
      })

      .andWhere(
        `

          (

            "booking"."therapist_id" = "transfer"."from_therapist_id"

            OR (

              "transfer"."status" = :readyToAccept

              AND "booking"."therapist_id" = "transfer"."to_therapist_id"

            )

          )

        `,

        {
          readyToAccept: BookingTherapistTransferStatus.READY_TO_ACCEPT,
        },
      )

      .andWhere(
        `

          EXISTS (

            SELECT 1

            FROM therapist_group_members source_member

            WHERE

              source_member.group_id = "transfer"."group_id"

              AND source_member.therapist_id = "transfer"."from_therapist_id"

              AND source_member.deleted_at IS NULL

          )

        `,
      )

      .andWhere(
        `

          EXISTS (

            SELECT 1

            FROM therapist_group_members target_member

            WHERE

              target_member.group_id = "transfer"."group_id"

              AND target_member.therapist_id = "transfer"."to_therapist_id"

              AND target_member.deleted_at IS NULL

          )

        `,
      );
  }

  private async ensureTherapistHasNoBlockingTransfer(
    manager: EntityManager,

    groupId: number,

    therapistId: number,
  ) {
    const exists = await this.buildBlockingTransferQuery(manager, groupId)

      .andWhere(
        `

          (

            "transfer"."from_therapist_id" = :therapistId

            OR "transfer"."to_therapist_id" = :therapistId

          )

        `,

        {
          therapistId,
        },
      )

      .getExists();

    if (exists) {
      throw new ConflictException(
        'Bạn đang có yêu cầu chuyển booking chưa hoàn tất. Vui lòng xử lý yêu cầu trước khi rời nhóm.',
      );
    }
  }

  private async ensureGroupHasNoBlockingTransfers(
    manager: EntityManager,

    groupId: number,
  ) {
    const exists = await this.buildBlockingTransferQuery(
      manager,

      groupId,
    ).getExists();

    if (exists) {
      throw new ConflictException(
        'Không thể giải tán nhóm khi đang có yêu cầu chuyển booking chưa hoàn tất',
      );
    }
  }

  /**

   * Khi KTV đã vào một nhóm, mọi lời mời PENDING khác gửi tới KTV

   * không còn hợp lệ. Helper này dùng chung cho createGroup và accept invite.

   */

  private async cancelPendingInvitationsForTherapist(
    manager: EntityManager,

    therapistId: number,

    excludeInvitationId?: number,
  ) {
    const qb = manager

      .getRepository(TherapistGroupInvitation)

      .createQueryBuilder()

      .update()

      .set({
        status: TherapistGroupInvitationStatus.CANCELLED,

        respondedAt: new Date(),
      })

      .where('invited_therapist_id = :therapistId', {
        therapistId,
      })

      .andWhere('status = :status', {
        status: TherapistGroupInvitationStatus.PENDING,
      });

    if (excludeInvitationId) {
      qb.andWhere('id != :excludeInvitationId', {
        excludeInvitationId,
      });
    }

    await qb.execute();
  }

  private async getGroupDetail(
    manager: EntityManager,

    groupId: number,

    currentTherapistId: number,
  ) {
    const group = await manager.getRepository(TherapistGroup).findOne({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Không tìm thấy nhóm');
    }

    const members = await manager.getRepository(TherapistGroupMember).find({
      where: {
        groupId,
      },

      relations: {
        therapist: {
          user: true,
        },
      },

      order: {
        createdAt: 'ASC',
      },
    });

    const myMembership =
      members.find((item) => item.therapistId === currentTherapistId) ?? null;

    return {
      group: {
        id: group.id,

        name: group.name,

        description: group.description,

        ownerTherapistId: group.ownerTherapistId,

        isActive: group.isActive,

        myRole: myMembership?.role ?? null,

        members: members.map((item) => ({
          id: item.id,

          therapistId: item.therapistId,

          role: item.role,

          stageName: item.therapist.stageName ?? null,

          fullName: item.therapist.user?.fullName ?? null,

          phone: item.therapist.user?.phone ?? null,
        })),
      },
    };
  }

  private async requireGroupMember(
    manager: EntityManager,

    groupId: number,

    therapistId: number,
  ) {
    const membership = await manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          groupId,

          therapistId,
        },

        relations: {
          group: true,
        },
      });

    if (!membership || !membership.group.isActive) {
      throw new ForbiddenException('Bạn không thuộc nhóm này');
    }

    return membership;
  }

  private async ensureTherapistHasNoGroup(
    manager: EntityManager,

    therapistId: number,
  ) {
    const membership = await manager

      .getRepository(TherapistGroupMember)

      .findOne({
        where: {
          therapistId,
        },
      });

    if (membership) {
      throw new ConflictException('Kỹ thuật viên đã thuộc một nhóm');
    }
  }

  private async getTherapistByUserId(
    manager: EntityManager,

    userId: number,

    lock = false,
  ) {
    const repository = manager.getRepository(TherapistProfile);

    /**

     * ============================================================

     * KHÔNG LOCK

     * ============================================================

     *

     * Có thể load relation user bình thường.

     */

    if (!lock) {
      const therapist = await repository.findOne({
        where: {
          userId,
        },

        relations: {
          user: true,
        },
      });

      if (!therapist) {
        throw new NotFoundException('Therapist profile not found');
      }

      return therapist;
    }

    /**

     * ============================================================

     * LOCK THERAPIST PROFILE

     * ============================================================

     *

     * QUAN TRỌNG:

     *

     * Không được load relation trong query có FOR UPDATE.

     *

     * Nếu dùng:

     *

     * relations: {

     *   user: true,

     * }

     *

     * TypeORM sẽ sinh:

     *

     * LEFT JOIN users

     * FOR UPDATE

     *

     * PostgreSQL sẽ báo:

     *

     * FOR UPDATE cannot be applied to the nullable side

     * of an outer join

     */

    const lockedTherapist = await repository.findOne({
      where: {
        userId,
      },

      lock: {
        mode: 'pessimistic_write',
      },
    });

    if (!lockedTherapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    /**

     * Row therapist_profiles đã được khóa bởi transaction.

     *

     * Query thứ hai chỉ dùng để load relation user,

     * không cần FOR UPDATE nữa.

     *

     * Lock ở query trước vẫn được giữ đến khi

     * transaction COMMIT hoặc ROLLBACK.

     */

    const therapist = await repository.findOne({
      where: {
        id: lockedTherapist.id,
      },

      relations: {
        user: true,
      },
    });

    if (!therapist) {
      throw new NotFoundException('Therapist profile not found');
    }

    return therapist;
  }
}
