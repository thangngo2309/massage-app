import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistGroupsAndBookingTransfers1791000000000 implements MigrationInterface {
  name = 'AddTherapistGroupsAndBookingTransfers1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * THERAPIST GROUPS
     * ============================================================
     */
    await queryRunner.query(`
        CREATE TABLE "therapist_groups" (
          "id" SERIAL NOT NULL,
  
          "name" varchar(120) NOT NULL,
  
          "description" text,
  
          "owner_therapist_id" integer NOT NULL,
  
          "is_active" boolean NOT NULL DEFAULT true,
  
          "created_at" timestamptz NOT NULL DEFAULT now(),
  
          "updated_at" timestamptz NOT NULL DEFAULT now(),
  
          "deleted_at" timestamptz,
  
          CONSTRAINT "pk_therapist_groups"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "fk_therapist_groups_owner"
            FOREIGN KEY ("owner_therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE RESTRICT
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_therapist_groups_owner"
        ON "therapist_groups" ("owner_therapist_id")
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_therapist_groups_active"
        ON "therapist_groups" ("is_active")
      `);

    /**
     * ============================================================
     * GROUP MEMBERS
     * ============================================================
     */
    await queryRunner.query(`
        CREATE TABLE "therapist_group_members" (
          "id" SERIAL NOT NULL,
  
          "group_id" integer NOT NULL,
  
          "therapist_id" integer NOT NULL,
  
          "role" varchar(20) NOT NULL DEFAULT 'member',
  
          "created_at" timestamptz NOT NULL DEFAULT now(),
  
          "updated_at" timestamptz NOT NULL DEFAULT now(),
  
          "deleted_at" timestamptz,
  
          CONSTRAINT "pk_therapist_group_members"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "fk_therapist_group_members_group"
            FOREIGN KEY ("group_id")
            REFERENCES "therapist_groups"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT "fk_therapist_group_members_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE CASCADE
        )
      `);

    /**
     * Một KTV chỉ thuộc một group active.
     *
     * Dùng partial unique index vì entity có soft-delete.
     */
    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "uq_active_therapist_group_member_therapist"
        ON "therapist_group_members" ("therapist_id")
        WHERE "deleted_at" IS NULL
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "uq_active_therapist_group_member_pair"
        ON "therapist_group_members" (
          "group_id",
          "therapist_id"
        )
        WHERE "deleted_at" IS NULL
      `);

    await queryRunner.query(`
        CREATE INDEX
          "idx_therapist_group_members_group"
        ON "therapist_group_members" ("group_id")
      `);

    /**
     * ============================================================
     * GROUP INVITATIONS
     * ============================================================
     */
    await queryRunner.query(`
        CREATE TABLE "therapist_group_invitations" (
          "id" SERIAL NOT NULL,
  
          "group_id" integer NOT NULL,
  
          "invited_by_therapist_id" integer NOT NULL,
  
          "invited_therapist_id" integer NOT NULL,
  
          "status" varchar(32) NOT NULL DEFAULT 'pending',
  
          "responded_at" timestamptz,
  
          "created_at" timestamptz NOT NULL DEFAULT now(),
  
          "updated_at" timestamptz NOT NULL DEFAULT now(),
  
          "deleted_at" timestamptz,
  
          CONSTRAINT "pk_therapist_group_invitations"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "fk_therapist_group_invitations_group"
            FOREIGN KEY ("group_id")
            REFERENCES "therapist_groups"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT "fk_therapist_group_invitations_invited_by"
            FOREIGN KEY ("invited_by_therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT "fk_therapist_group_invitations_invited"
            FOREIGN KEY ("invited_therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "uq_pending_group_invitation"
        ON "therapist_group_invitations" (
          "group_id",
          "invited_therapist_id"
        )
        WHERE
          "deleted_at" IS NULL
          AND "status" = 'pending'
      `);

    await queryRunner.query(`
        CREATE INDEX
          "idx_therapist_group_invitations_invited"
        ON "therapist_group_invitations" (
          "invited_therapist_id",
          "status"
        )
      `);

    /**
     * ============================================================
     * CLIENT CONSENT
     * ============================================================
     */
    await queryRunner.query(`
        CREATE TABLE "booking_group_transfer_consents" (
          "id" SERIAL NOT NULL,
  
          "booking_id" integer NOT NULL,
  
          "allowed" boolean NOT NULL DEFAULT false,
  
          "accepted_at" timestamptz,
  
          "created_at" timestamptz NOT NULL DEFAULT now(),
  
          "updated_at" timestamptz NOT NULL DEFAULT now(),
  
          "deleted_at" timestamptz,
  
          CONSTRAINT "pk_booking_group_transfer_consents"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_booking_group_transfer_consents_booking"
            UNIQUE ("booking_id"),
  
          CONSTRAINT "fk_booking_group_transfer_consents_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE CASCADE
        )
      `);

    /**
     * ============================================================
     * BOOKING TRANSFERS
     * ============================================================
     */
    await queryRunner.query(`
        CREATE TABLE "booking_therapist_transfers" (
          "id" SERIAL NOT NULL,
  
          "booking_id" integer NOT NULL,
  
          "group_id" integer NOT NULL,
  
          "from_therapist_id" integer NOT NULL,
  
          "to_therapist_id" integer NOT NULL,
  
          "status" varchar(40) NOT NULL DEFAULT 'pending_therapist',
  
          "reason" text,
  
          "therapist_responded_at" timestamptz,
  
          "client_responded_at" timestamptz,
  
          "completed_at" timestamptz,
  
          "cancelled_at" timestamptz,
  
          "created_at" timestamptz NOT NULL DEFAULT now(),
  
          "updated_at" timestamptz NOT NULL DEFAULT now(),
  
          "deleted_at" timestamptz,
  
          CONSTRAINT "pk_booking_therapist_transfers"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "fk_booking_therapist_transfers_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT "fk_booking_therapist_transfers_group"
            FOREIGN KEY ("group_id")
            REFERENCES "therapist_groups"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "fk_booking_therapist_transfers_from"
            FOREIGN KEY ("from_therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "fk_booking_therapist_transfers_to"
            FOREIGN KEY ("to_therapist_id")
            REFERENCES "therapist_profiles"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "chk_booking_therapist_transfer_not_same"
            CHECK (
              "from_therapist_id" <> "to_therapist_id"
            )
        )
      `);

    /**
     * Một booking chỉ được có
     * một transfer active tại một thời điểm.
     */
    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "uq_active_booking_therapist_transfer"
        ON "booking_therapist_transfers" ("booking_id")
        WHERE
          "deleted_at" IS NULL
          AND "status" IN (
            'pending_therapist',
            'pending_client',
            'ready_to_accept'
          )
      `);

    await queryRunner.query(`
        CREATE INDEX
          "idx_booking_therapist_transfers_booking"
        ON "booking_therapist_transfers" (
          "booking_id",
          "created_at"
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
          "idx_booking_therapist_transfers_to_status"
        ON "booking_therapist_transfers" (
          "to_therapist_id",
          "status"
        )
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "booking_therapist_transfers"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "booking_group_transfer_consents"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "therapist_group_invitations"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "therapist_group_members"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "therapist_groups"
      `);
  }
}
