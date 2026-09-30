import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromotionReferralVoucher1790749620000 implements MigrationInterface {
  name = 'CreatePromotionReferralVoucher1790749620000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /*
     * ============================================================
     * ENUMS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TYPE "promotion_audience_enum"
        AS ENUM (
          'client',
          'therapist'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "promotion_trigger_type_enum"
        AS ENUM (
          'referral_code_entered',
          'referral_qualified',
          'first_booking_completed'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "promotion_reward_type_enum"
        AS ENUM (
          'wallet_credit',
          'voucher'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "promotion_reward_recipient_enum"
        AS ENUM (
          'actor',
          'referrer'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "referral_status_enum"
        AS ENUM (
          'pending',
          'qualified',
          'rewarded',
          'invalid'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "voucher_audience_enum"
        AS ENUM (
          'client',
          'therapist'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "voucher_discount_type_enum"
        AS ENUM (
          'fixed',
          'percent'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "user_voucher_status_enum"
        AS ENUM (
          'available',
          'reserved',
          'used',
          'expired',
          'cancelled'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "user_voucher_source_type_enum"
        AS ENUM (
          'promotion',
          'referral',
          'first_booking',
          'admin'
        )
      `);

    /*
     * ============================================================
     * EXISTING WALLET ENUMS
     * ============================================================
     */

    await queryRunner.query(`
        ALTER TYPE "wallet_type_enum"
        ADD VALUE IF NOT EXISTS 'promotion'
      `);

    await queryRunner.query(`
        ALTER TYPE "wallet_transaction_type_enum"
        ADD VALUE IF NOT EXISTS 'promotion_reward'
      `);

    /*
     * ============================================================
     * VOUCHERS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "vouchers" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "code" VARCHAR(100) NOT NULL,
          "audience" "voucher_audience_enum" NOT NULL DEFAULT 'client',
          "discount_type" "voucher_discount_type_enum" NOT NULL,
          "discount_value" DECIMAL(15,2) NOT NULL,
          "max_discount_amount" DECIMAL(15,2),
          "min_order_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "starts_at" TIMESTAMPTZ,
          "ends_at" TIMESTAMPTZ,
          "issuance_limit" INTEGER,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
  
          CONSTRAINT "PK_vouchers"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_vouchers_code"
            UNIQUE ("code"),
  
          CONSTRAINT "chk_vouchers_discount_value"
            CHECK ("discount_value" > 0),
  
          CONSTRAINT "chk_vouchers_min_order_amount"
            CHECK ("min_order_amount" >= 0),
  
          CONSTRAINT "chk_vouchers_max_discount_amount"
            CHECK (
              "max_discount_amount" IS NULL
              OR "max_discount_amount" > 0
            ),
  
          CONSTRAINT "chk_vouchers_percent"
            CHECK (
              "discount_type" <> 'percent'
              OR (
                "discount_value" > 0
                AND "discount_value" <= 100
              )
            ),
  
          CONSTRAINT "chk_vouchers_period"
            CHECK (
              "starts_at" IS NULL
              OR "ends_at" IS NULL
              OR "ends_at" > "starts_at"
            ),
  
          CONSTRAINT "chk_vouchers_issuance_limit"
            CHECK (
              "issuance_limit" IS NULL
              OR "issuance_limit" > 0
            )
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_vouchers_active_period"
        ON "vouchers" (
          "is_active",
          "starts_at",
          "ends_at"
        )
      `);

    await queryRunner.query(`
        CREATE TABLE "voucher_translations" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "voucher_id" INTEGER NOT NULL,
          "locale" VARCHAR(20) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
          "terms" TEXT,
  
          CONSTRAINT "PK_voucher_translations"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_voucher_translations_voucher_locale"
            UNIQUE ("voucher_id", "locale"),
  
          CONSTRAINT "FK_voucher_translations_voucher"
            FOREIGN KEY ("voucher_id")
            REFERENCES "vouchers"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_voucher_translations_locale"
        ON "voucher_translations" ("locale")
      `);

    /*
     * ============================================================
     * PROMOTIONS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "promotions" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "code" VARCHAR(100) NOT NULL,
          "audience" "promotion_audience_enum" NOT NULL,
          "trigger_type" "promotion_trigger_type_enum" NOT NULL,
          "reward_type" "promotion_reward_type_enum" NOT NULL,
          "reward_recipient" "promotion_reward_recipient_enum"
            NOT NULL DEFAULT 'actor',
          "reward_value" DECIMAL(15,2) NOT NULL DEFAULT 0,
          "voucher_id" INTEGER,
          "starts_at" TIMESTAMPTZ,
          "ends_at" TIMESTAMPTZ,
          "usage_limit" INTEGER,
          "usage_limit_per_user" INTEGER,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
  
          CONSTRAINT "PK_promotions"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_promotions_code"
            UNIQUE ("code"),
  
          CONSTRAINT "FK_promotions_voucher"
            FOREIGN KEY ("voucher_id")
            REFERENCES "vouchers"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "chk_promotions_reward_value"
            CHECK ("reward_value" >= 0),
  
          CONSTRAINT "chk_promotions_reward_configuration"
            CHECK (
              (
                "reward_type" = 'wallet_credit'
                AND "reward_value" > 0
                AND "voucher_id" IS NULL
              )
              OR
              (
                "reward_type" = 'voucher'
                AND "voucher_id" IS NOT NULL
              )
            ),
  
          CONSTRAINT "chk_promotions_period"
            CHECK (
              "starts_at" IS NULL
              OR "ends_at" IS NULL
              OR "ends_at" > "starts_at"
            ),
  
          CONSTRAINT "chk_promotions_usage_limit"
            CHECK (
              "usage_limit" IS NULL
              OR "usage_limit" > 0
            ),
  
          CONSTRAINT "chk_promotions_usage_limit_per_user"
            CHECK (
              "usage_limit_per_user" IS NULL
              OR "usage_limit_per_user" > 0
            )
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotions_active_period"
        ON "promotions" (
          "is_active",
          "starts_at",
          "ends_at"
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotions_audience_trigger"
        ON "promotions" (
          "audience",
          "trigger_type"
        )
      `);

    await queryRunner.query(`
        CREATE TABLE "promotion_translations" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "promotion_id" INTEGER NOT NULL,
          "locale" VARCHAR(20) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
  
          CONSTRAINT "PK_promotion_translations"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_promotion_translations_promotion_locale"
            UNIQUE ("promotion_id", "locale"),
  
          CONSTRAINT "FK_promotion_translations_promotion"
            FOREIGN KEY ("promotion_id")
            REFERENCES "promotions"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotion_translations_locale"
        ON "promotion_translations" ("locale")
      `);

    /*
     * ============================================================
     * REFERRAL CODES
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "user_referral_codes" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "user_id" INTEGER NOT NULL,
          "code" VARCHAR(32) NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
  
          CONSTRAINT "PK_user_referral_codes"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_user_referral_codes_code"
            UNIQUE ("code"),
  
          CONSTRAINT "FK_user_referral_codes_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_user_referral_codes_user_active"
        ON "user_referral_codes" (
          "user_id",
          "is_active"
        )
      `);

    /*
     * Chỉ cho phép một referral code ACTIVE cho mỗi user.
     *
     * User vẫn có thể giữ lịch sử các code cũ đã disable.
     */
    await queryRunner.query(`
        CREATE UNIQUE INDEX
          "uq_user_referral_codes_one_active_per_user"
        ON "user_referral_codes" ("user_id")
        WHERE
          "is_active" = true
          AND "deleted_at" IS NULL
      `);

    /*
     * ============================================================
     * REFERRALS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "referrals" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "referrer_user_id" INTEGER NOT NULL,
          "referred_user_id" INTEGER NOT NULL,
          "referral_code_id" INTEGER NOT NULL,
          "referral_code" VARCHAR(32) NOT NULL,
          "status" "referral_status_enum"
            NOT NULL DEFAULT 'pending',
          "qualified_at" TIMESTAMPTZ,
          "rewarded_at" TIMESTAMPTZ,
  
          CONSTRAINT "PK_referrals"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_referrals_referred_user"
            UNIQUE ("referred_user_id"),
  
          CONSTRAINT "FK_referrals_referrer_user"
            FOREIGN KEY ("referrer_user_id")
            REFERENCES "users"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "FK_referrals_referred_user"
            FOREIGN KEY ("referred_user_id")
            REFERENCES "users"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "FK_referrals_referral_code"
            FOREIGN KEY ("referral_code_id")
            REFERENCES "user_referral_codes"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "chk_referrals_not_self"
            CHECK ("referrer_user_id" <> "referred_user_id")
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_referrals_referrer_status"
        ON "referrals" (
          "referrer_user_id",
          "status"
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_referrals_status"
        ON "referrals" ("status")
      `);

    /*
     * ============================================================
     * PROMOTION USAGES
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "promotion_usages" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "promotion_id" INTEGER NOT NULL,
          "user_id" INTEGER NOT NULL,
          "booking_id" INTEGER,
          "referral_id" INTEGER,
          "unique_key" VARCHAR(255) NOT NULL,
          "reward_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
  
          CONSTRAINT "PK_promotion_usages"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_promotion_usages_unique_key"
            UNIQUE ("unique_key"),
  
          CONSTRAINT "FK_promotion_usages_promotion"
            FOREIGN KEY ("promotion_id")
            REFERENCES "promotions"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "FK_promotion_usages_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "FK_promotion_usages_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE SET NULL,
  
          CONSTRAINT "FK_promotion_usages_referral"
            FOREIGN KEY ("referral_id")
            REFERENCES "referrals"("id")
            ON DELETE SET NULL,
  
          CONSTRAINT "chk_promotion_usages_reward_amount"
            CHECK ("reward_amount" >= 0)
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotion_usages_promotion"
        ON "promotion_usages" ("promotion_id")
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotion_usages_user"
        ON "promotion_usages" ("user_id")
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_promotion_usages_booking"
        ON "promotion_usages" ("booking_id")
      `);

    /*
     * ============================================================
     * USER VOUCHERS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "user_vouchers" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "user_id" INTEGER NOT NULL,
          "voucher_id" INTEGER NOT NULL,
          "status" "user_voucher_status_enum"
            NOT NULL DEFAULT 'available',
          "source_type" "user_voucher_source_type_enum" NOT NULL,
          "source_reference_id" VARCHAR(100) NOT NULL,
          "expires_at" TIMESTAMPTZ,
          "reserved_at" TIMESTAMPTZ,
          "reserved_booking_id" INTEGER,
          "used_at" TIMESTAMPTZ,
          "used_booking_id" INTEGER,
  
          CONSTRAINT "PK_user_vouchers"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_user_vouchers_source"
            UNIQUE (
              "user_id",
              "voucher_id",
              "source_type",
              "source_reference_id"
            ),
  
          CONSTRAINT "FK_user_vouchers_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT "FK_user_vouchers_voucher"
            FOREIGN KEY ("voucher_id")
            REFERENCES "vouchers"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT "FK_user_vouchers_reserved_booking"
            FOREIGN KEY ("reserved_booking_id")
            REFERENCES "bookings"("id")
            ON DELETE SET NULL,
  
          CONSTRAINT "FK_user_vouchers_used_booking"
            FOREIGN KEY ("used_booking_id")
            REFERENCES "bookings"("id")
            ON DELETE SET NULL
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_user_vouchers_user_status"
        ON "user_vouchers" (
          "user_id",
          "status"
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_user_vouchers_voucher"
        ON "user_vouchers" ("voucher_id")
      `);

    /*
     * ============================================================
     * SERVICE TRANSLATIONS
     * ============================================================
     */

    await queryRunner.query(`
        CREATE TABLE "service_translations" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "service_id" INTEGER NOT NULL,
          "locale" VARCHAR(20) NOT NULL,
          "name" VARCHAR(255) NOT NULL,
          "description" TEXT,
  
          CONSTRAINT "PK_service_translations"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_service_translations_service_locale"
            UNIQUE ("service_id", "locale"),
  
          CONSTRAINT "FK_service_translations_service"
            FOREIGN KEY ("service_id")
            REFERENCES "services"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_service_translations_locale"
        ON "service_translations" ("locale")
      `);

    await queryRunner.query(`
        CREATE TABLE "service_option_translations" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMPTZ,
          "service_option_id" INTEGER NOT NULL,
          "locale" VARCHAR(20) NOT NULL,
          "label" VARCHAR(255) NOT NULL,
  
          CONSTRAINT "PK_service_option_translations"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_service_option_translations_option_locale"
            UNIQUE (
              "service_option_id",
              "locale"
            ),
  
          CONSTRAINT "FK_service_option_translations_option"
            FOREIGN KEY ("service_option_id")
            REFERENCES "service_options"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_service_option_translations_locale"
        ON "service_option_translations" ("locale")
      `);

    /*
     * ============================================================
     * BACKFILL CURRENT VIETNAMESE SERVICE CONTENT
     * ============================================================
     */

    await queryRunner.query(`
        INSERT INTO "service_translations" (
          "service_id",
          "locale",
          "name",
          "description"
        )
        SELECT
          "id",
          'vi',
          "name",
          "description"
        FROM "services"
        WHERE "deleted_at" IS NULL
        ON CONFLICT (
          "service_id",
          "locale"
        ) DO NOTHING
      `);

    await queryRunner.query(`
        INSERT INTO "service_option_translations" (
          "service_option_id",
          "locale",
          "label"
        )
        SELECT
          "id",
          'vi',
          "label"
        FROM "service_options"
        WHERE
          "deleted_at" IS NULL
          AND "label" IS NOT NULL
        ON CONFLICT (
          "service_option_id",
          "locale"
        ) DO NOTHING
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /*
     * PostgreSQL enum ADD VALUE không thể rollback an toàn
     * bằng DROP VALUE.
     *
     * Hai giá trị:
     * - wallet_type_enum.promotion
     * - wallet_transaction_type_enum.promotion_reward
     *
     * được giữ lại khi rollback migration.
     */

    await queryRunner.query(`
        DROP TABLE IF EXISTS "service_option_translations"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "service_translations"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "user_vouchers"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "promotion_usages"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "referrals"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "user_referral_codes"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "promotion_translations"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "promotions"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "voucher_translations"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "vouchers"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "user_voucher_source_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "user_voucher_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "voucher_discount_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "voucher_audience_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "referral_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "promotion_reward_recipient_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "promotion_reward_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "promotion_trigger_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS "promotion_audience_enum"
      `);
  }
}
