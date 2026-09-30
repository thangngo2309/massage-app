import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherSnapshotToBooking1790751000000 implements MigrationInterface {
  name = 'AddVoucherSnapshotToBooking1790751000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN "user_voucher_id" INTEGER,
      ADD COLUMN "voucher_code" VARCHAR(100),
      ADD COLUMN "discount_amount" INTEGER NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "FK_bookings_user_voucher"
      FOREIGN KEY ("user_voucher_id")
      REFERENCES "user_vouchers"("id")
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD CONSTRAINT "chk_bookings_discount_amount"
      CHECK ("discount_amount" >= 0)
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_bookings_user_voucher"
      ON "bookings" ("user_voucher_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_bookings_user_voucher"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "chk_bookings_discount_amount"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP CONSTRAINT IF EXISTS "FK_bookings_user_voucher"
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      DROP COLUMN IF EXISTS "discount_amount",
      DROP COLUMN IF EXISTS "voucher_code",
      DROP COLUMN IF EXISTS "user_voucher_id"
    `);
  }
}
