import type { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameBookingServiceNameToSnapshot1790874600000 implements MigrationInterface {
  name = 'RenameBookingServiceNameToSnapshot1790874600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
      RENAME COLUMN "service_name"
      TO "service_name_snapshot"
    `);

    await queryRunner.query(`
      COMMENT ON COLUMN "bookings"."service_name_snapshot"
      IS 'Snapshot tên dịch vụ tại thời điểm booking được tạo. Tên hiển thị theo locale được resolve từ ServiceTranslation.'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      COMMENT ON COLUMN "bookings"."service_name_snapshot"
      IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "bookings"
      RENAME COLUMN "service_name_snapshot"
      TO "service_name"
    `);
  }
}
