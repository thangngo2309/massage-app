import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupBookingServiceNameSnapshot1790971200000 implements MigrationInterface {
  name = 'CleanupBookingServiceNameSnapshot1790971200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * BACKFILL service_name
     * ============================================================
     *
     * Database cũ sử dụng:
     *
     * service_name_snapshot
     *
     * Flow mới sử dụng:
     *
     * service_name
     *
     * Trước khi xoá cột legacy, copy dữ liệu sang service_name
     * cho những booking cũ nếu cần.
     */
    await queryRunner.query(`
        UPDATE "bookings"
        SET
          "service_name" =
            COALESCE(
              NULLIF(
                BTRIM("service_name"),
                ''
              ),
              "service_name_snapshot"
            )
        WHERE
          "service_name_snapshot" IS NOT NULL
      `);

    /**
     * ============================================================
     * FALLBACK
     * ============================================================
     *
     * Trường hợp rất cũ không có cả 2 giá trị,
     * resolve lại từ ServiceOption -> Service.
     */
    await queryRunner.query(`
        UPDATE "bookings" booking
        SET
          "service_name" = service."name"
        FROM
          "service_options" service_option
        INNER JOIN
          "services" service
          ON service."id" =
            service_option."service_id"
        WHERE
          service_option."id" =
            booking."service_option_id"
          AND (
            booking."service_name" IS NULL
            OR BTRIM(
              booking."service_name"
            ) = ''
          )
      `);

    /**
     * service_name là legacy summary của item đầu tiên
     * nhưng vẫn phải có giá trị để giữ compatibility
     * cho Admin/Web/Mobile cũ.
     */
    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "service_name"
        SET NOT NULL
      `);

    /**
     * ============================================================
     * DROP OLD COLUMN
     * ============================================================
     *
     * Không còn entity/service nào dùng service_name_snapshot.
     *
     * Booking detail đầy đủ hiện nằm trong booking_items.
     */
    await queryRunner.query(`
        ALTER TABLE "bookings"
        DROP COLUMN IF EXISTS
          "service_name_snapshot"
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Khôi phục schema cũ nếu rollback migration.
     */
    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "service_name_snapshot"
          VARCHAR(255)
      `);

    await queryRunner.query(`
        UPDATE "bookings"
        SET
          "service_name_snapshot" =
            "service_name"
        WHERE
          "service_name_snapshot" IS NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "service_name_snapshot"
        SET NOT NULL
      `);
  }
}
