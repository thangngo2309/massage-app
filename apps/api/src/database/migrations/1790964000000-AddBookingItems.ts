import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingItems1790964000000 implements MigrationInterface {
  name = 'AddBookingItems1790964000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * 1. ENSURE LEGACY BOOKING SNAPSHOT COLUMNS
     * ============================================================
     *
     * Tạm giữ các field này trên bookings để:
     *
     * - Admin cũ vẫn hoạt động
     * - Web cũ vẫn hoạt động
     * - Mobile cũ vẫn hoạt động
     *
     * booking_items sẽ là nguồn chi tiết cho multi-service.
     */

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "service_name" VARCHAR(255)
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "duration_minutes" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "service_price" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "platform_fee" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "tax_amount" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "user_voucher_id" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "voucher_code" VARCHAR(100)
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "discount_amount" INTEGER
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS
          "total_amount" INTEGER
      `);

    /**
     * ============================================================
     * 2. BACKFILL LEGACY BOOKING SNAPSHOT
     * ============================================================
     *
     * Không UPDATE bằng:
     *
     * UPDATE bookings booking
     * FROM ...
     * LEFT JOIN ... ON ... booking.xxx
     *
     * vì PostgreSQL không cho target alias booking được tham chiếu
     * ở vị trí JOIN ON đó.
     *
     * Thay vào đó:
     *
     * bookings
     *    ↓
     * snapshot CTE
     *    ↓
     * UPDATE bookings theo booking_id
     */

    await queryRunner.query(`
        WITH "booking_snapshot" AS (
          SELECT
            booking."id"
              AS "booking_id",
  
            service."name"
              AS "resolved_service_name",
  
            service_option."duration_minutes"
              AS "resolved_duration_minutes",
  
            COALESCE(
              booking."service_price",
  
              CASE
                WHEN booking."total_amount" IS NOT NULL
                THEN GREATEST(
                  0,
  
                  booking."total_amount"
                  +
                  COALESCE(
                    booking."discount_amount",
                    0
                  )
                  -
                  COALESCE(
                    booking."tax_amount",
                    0
                  )
                )
  
                ELSE NULL
              END,
  
              therapist_service."price",
  
              service_option."default_price",
  
              0
            )
              AS "resolved_service_price",
  
            COALESCE(
              therapist_service."platform_fee_rate",
              0
            )
              AS "resolved_platform_fee_rate"
  
          FROM "bookings" booking
  
          INNER JOIN "service_options" service_option
            ON service_option."id" =
              booking."service_option_id"
  
          INNER JOIN "services" service
            ON service."id" =
              service_option."service_id"
  
          LEFT JOIN "therapist_services" therapist_service
            ON therapist_service."id" =
              booking."therapist_service_id"
        )
  
        UPDATE "bookings" booking
  
        SET
          "service_name" = COALESCE(
            booking."service_name",
            snapshot."resolved_service_name"
          ),
  
          "duration_minutes" = COALESCE(
            booking."duration_minutes",
            snapshot."resolved_duration_minutes"
          ),
  
          "service_price" = COALESCE(
            booking."service_price",
            snapshot."resolved_service_price"
          ),
  
          "platform_fee" = COALESCE(
            booking."platform_fee",
  
            ROUND(
              snapshot."resolved_service_price"::numeric
              *
              snapshot."resolved_platform_fee_rate"::numeric
              /
              100
            )::integer,
  
            0
          ),
  
          "tax_amount" = COALESCE(
            booking."tax_amount",
            0
          ),
  
          "discount_amount" = COALESCE(
            booking."discount_amount",
            0
          )
  
        FROM "booking_snapshot" snapshot
  
        WHERE
          snapshot."booking_id" =
            booking."id"
      `);

    /**
     * ============================================================
     * 3. TOTAL AMOUNT
     * ============================================================
     *
     * Chạy riêng để chắc chắn service_price / tax / discount
     * đã được backfill xong.
     */

    await queryRunner.query(`
        UPDATE "bookings"
  
        SET
          "total_amount" = COALESCE(
            "total_amount",
  
            GREATEST(
              0,
  
              COALESCE(
                "service_price",
                0
              )
              +
              COALESCE(
                "tax_amount",
                0
              )
              -
              COALESCE(
                "discount_amount",
                0
              )
            )
          )
      `);

    /**
     * ============================================================
     * 4. VERIFY BACKFILL
     * ============================================================
     *
     * Nếu có booking nào không resolve được dữ liệu legacy,
     * fail migration ngay thay vì SET NOT NULL rồi nhận lỗi khó đọc.
     */

    const invalidRows: Array<{
      count: string;
    }> = await queryRunner.query(`
        SELECT
          COUNT(*)::text AS "count"
  
        FROM "bookings"
  
        WHERE
          "service_name" IS NULL
          OR
          "duration_minutes" IS NULL
          OR
          "service_price" IS NULL
          OR
          "platform_fee" IS NULL
          OR
          "tax_amount" IS NULL
          OR
          "discount_amount" IS NULL
          OR
          "total_amount" IS NULL
      `);

    const invalidCount = Number(invalidRows[0]?.count ?? 0);

    if (invalidCount > 0) {
      throw new Error(
        `Cannot backfill ${invalidCount} existing booking(s) before creating booking_items`,
      );
    }

    /**
     * ============================================================
     * 5. DEFAULTS / NOT NULL
     * ============================================================
     */

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "service_name"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "duration_minutes"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "service_price"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "platform_fee"
        SET DEFAULT 0
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "platform_fee"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "tax_amount"
        SET DEFAULT 0
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "tax_amount"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "discount_amount"
        SET DEFAULT 0
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "discount_amount"
        SET NOT NULL
      `);

    await queryRunner.query(`
        ALTER TABLE "bookings"
        ALTER COLUMN "total_amount"
        SET NOT NULL
      `);

    /**
     * ============================================================
     * 6. CREATE BOOKING ITEMS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "booking_items" (
          "id"
            SERIAL
            NOT NULL,
  
          "booking_id"
            INTEGER
            NOT NULL,
  
          "service_id"
            INTEGER
            NOT NULL,
  
          "service_option_id"
            INTEGER
            NOT NULL,
  
          "therapist_service_id"
            INTEGER,
  
          "service_name"
            VARCHAR(255)
            NOT NULL,
  
          "option_label"
            VARCHAR(255),
  
          "duration_minutes"
            INTEGER
            NOT NULL,
  
          "price"
            INTEGER
            NOT NULL,
  
          "platform_fee_rate"
            NUMERIC(5,2)
            NOT NULL
            DEFAULT 0,
  
          "platform_fee"
            INTEGER
            NOT NULL
            DEFAULT 0,
  
          "sort_order"
            INTEGER
            NOT NULL
            DEFAULT 0,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT NOW(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT NOW(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
            "pk_booking_items"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
            "fk_booking_items_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT
            "fk_booking_items_service"
            FOREIGN KEY ("service_id")
            REFERENCES "services"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT
            "fk_booking_items_service_option"
            FOREIGN KEY ("service_option_id")
            REFERENCES "service_options"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT
            "fk_booking_items_therapist_service"
            FOREIGN KEY ("therapist_service_id")
            REFERENCES "therapist_services"("id")
            ON DELETE SET NULL,
  
          CONSTRAINT
            "uq_booking_items_booking_sort_order"
            UNIQUE (
              "booking_id",
              "sort_order"
            )
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
          "idx_booking_items_booking_id"
  
        ON "booking_items"
          ("booking_id")
      `);

    /**
     * ============================================================
     * 7. BACKFILL EXISTING BOOKINGS → BOOKING ITEMS
     * ============================================================
     *
     * Booking cũ:
     *
     * 1 booking = 1 service option
     *
     * nên mỗi booking cũ tạo đúng 1 BookingItem.
     */

    await queryRunner.query(`
        INSERT INTO "booking_items" (
          "booking_id",
  
          "service_id",
  
          "service_option_id",
  
          "therapist_service_id",
  
          "service_name",
  
          "option_label",
  
          "duration_minutes",
  
          "price",
  
          "platform_fee_rate",
  
          "platform_fee",
  
          "sort_order",
  
          "created_at",
  
          "updated_at",
  
          "deleted_at"
        )
  
        SELECT
          booking."id",
  
          service_option."service_id",
  
          booking."service_option_id",
  
          booking."therapist_service_id",
  
          booking."service_name",
  
          service_option."label",
  
          booking."duration_minutes",
  
          booking."service_price",
  
          COALESCE(
            therapist_service."platform_fee_rate",
            0
          ),
  
          booking."platform_fee",
  
          0,
  
          booking."created_at",
  
          booking."updated_at",
  
          booking."deleted_at"
  
        FROM "bookings" booking
  
        INNER JOIN "service_options" service_option
          ON service_option."id" =
            booking."service_option_id"
  
        LEFT JOIN "therapist_services" therapist_service
          ON therapist_service."id" =
            booking."therapist_service_id"
  
        WHERE NOT EXISTS (
          SELECT 1
  
          FROM "booking_items" existing_item
  
          WHERE
            existing_item."booking_id" =
              booking."id"
        )
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Không drop các legacy snapshot columns.
     *
     * Một số database đã có các cột đó từ trước,
     * nên down migration không được phá schema cũ.
     */

    await queryRunner.query(`
        DROP TABLE IF EXISTS
          "booking_items"
      `);
  }
}
