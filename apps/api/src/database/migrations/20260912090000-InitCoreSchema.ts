import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitCoreSchema20260912090000 implements MigrationInterface {
  name = 'InitCoreSchema20260912090000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ENUMS
     */

    await queryRunner.query(`
        CREATE TYPE "user_role_enum" AS ENUM (
          'super_admin',
          'system_admin',
          'client',
          'therapist'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "user_status_enum" AS ENUM (
          'active',
          'inactive',
          'suspended'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "gender_enum" AS ENUM (
          'unknown',
          'male',
          'female',
          'other'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "therapist_verification_status_enum"
        AS ENUM (
          'pending',
          'verified',
          'rejected'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "therapist_online_status_enum"
        AS ENUM (
          'offline',
          'online',
          'busy'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "therapist_service_area_type_enum"
        AS ENUM (
          'district',
          'radius'
        )
      `);

    await queryRunner.query(`
        CREATE TYPE "booking_status_enum"
        AS ENUM (
          'pending',
          'searching_therapist',
          'waiting_therapist_accept',
          'confirmed',
          'therapist_on_the_way',
          'arrived',
          'in_progress',
          'completed',
          'cancelled_by_client',
          'cancelled_by_therapist',
          'cancelled_by_admin',
          'rejected',
          'expired'
        )
      `);

    /**
     * USERS
     */

    await queryRunner.query(`
        CREATE TABLE "users" (
          "id" SERIAL NOT NULL,
  
          "phone" VARCHAR(20) NOT NULL,
  
          "email" VARCHAR(255),
  
          "password_hash" VARCHAR(255),
  
          "full_name" VARCHAR(255) NOT NULL,
  
          "avatar_url" TEXT,
  
          "role" "user_role_enum" NOT NULL,
  
          "status" "user_status_enum"
            NOT NULL
            DEFAULT 'active',
  
          "last_login_at" TIMESTAMPTZ,
  
          "created_at" TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at" TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at" TIMESTAMPTZ,
  
          CONSTRAINT "pk_users"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "uq_users_phone"
            UNIQUE ("phone"),
  
          CONSTRAINT "uq_users_email"
            UNIQUE ("email")
        )
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_users_role"
        ON "users" ("role")
      `);

    await queryRunner.query(`
        CREATE INDEX "idx_users_status"
        ON "users" ("status")
      `);

    /**
     * REFRESH TOKENS
     */

    await queryRunner.query(`
        CREATE TABLE "refresh_tokens" (
          "id" SERIAL NOT NULL,
  
          "user_id" INTEGER NOT NULL,
  
          "token_hash"
            VARCHAR(255) NOT NULL,
  
          "device_name"
            VARCHAR(255),
  
          "ip_address"
            VARCHAR(64),
  
          "expires_at"
            TIMESTAMPTZ NOT NULL,
  
          "revoked_at"
            TIMESTAMPTZ,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT "pk_refresh_tokens"
            PRIMARY KEY ("id"),
  
          CONSTRAINT "fk_refresh_tokens_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_refresh_tokens_user_id"
        ON "refresh_tokens" ("user_id")
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_refresh_tokens_expires_at"
        ON "refresh_tokens" ("expires_at")
      `);

    /**
     * CLIENT PROFILE
     */

    await queryRunner.query(`
        CREATE TABLE "client_profiles" (
          "id" SERIAL NOT NULL,
  
          "user_id" INTEGER NOT NULL,
  
          "default_address" TEXT,
  
          "default_latitude"
            DOUBLE PRECISION,
  
          "default_longitude"
            DOUBLE PRECISION,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_client_profiles"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_client_profiles_user_id"
            UNIQUE ("user_id"),
  
          CONSTRAINT
          "fk_client_profiles_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    /**
     * THERAPIST PROFILE
     */

    await queryRunner.query(`
        CREATE TABLE "therapist_profiles" (
          "id" SERIAL NOT NULL,
  
          "user_id" INTEGER NOT NULL,
  
          "bio" TEXT,
  
          "gender" "gender_enum"
            NOT NULL
            DEFAULT 'unknown',
  
          "date_of_birth" DATE,
  
          "experience_years"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "verification_status"
            "therapist_verification_status_enum"
            NOT NULL
            DEFAULT 'pending',
  
          "online_status"
            "therapist_online_status_enum"
            NOT NULL
            DEFAULT 'offline',
  
          "is_accepting_bookings"
            BOOLEAN NOT NULL
            DEFAULT false,
  
          "service_radius_km"
            DOUBLE PRECISION
            NOT NULL
            DEFAULT 10,
  
          "current_latitude"
            DOUBLE PRECISION,
  
          "current_longitude"
            DOUBLE PRECISION,
  
          "rating_average"
            NUMERIC(3,2)
            NOT NULL
            DEFAULT 0,
  
          "rating_count"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "completed_bookings"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_therapist_profiles"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_therapist_profiles_user_id"
            UNIQUE ("user_id"),
  
          CONSTRAINT
          "fk_therapist_profiles_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_therapist_profiles_verification"
        ON "therapist_profiles"
        ("verification_status")
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_therapist_profiles_online_status"
        ON "therapist_profiles"
        ("online_status")
      `);

    /**
     * SERVICES
     */

    await queryRunner.query(`
        CREATE TABLE "services" (
          "id" SERIAL NOT NULL,
  
          "name" VARCHAR(255) NOT NULL,
  
          "slug" VARCHAR(255) NOT NULL,
  
          "description" TEXT,
  
          "image_url" TEXT,
  
          "is_active"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "sort_order"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_services"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_services_slug"
            UNIQUE ("slug")
        )
      `);

    /**
     * SERVICE OPTIONS
     */

    await queryRunner.query(`
        CREATE TABLE "service_options" (
          "id" SERIAL NOT NULL,
  
          "service_id"
            INTEGER NOT NULL,
  
          "label"
            VARCHAR(255),
  
          "duration_minutes"
            INTEGER NOT NULL,
  
          "default_price"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "is_active"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_service_options"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_service_options_service_duration"
            UNIQUE (
              "service_id",
              "duration_minutes"
            ),
  
          CONSTRAINT
          "fk_service_options_service"
            FOREIGN KEY ("service_id")
            REFERENCES "services"("id")
            ON DELETE CASCADE
        )
      `);

    /**
     * THERAPIST SERVICES
     */

    await queryRunner.query(`
        CREATE TABLE "therapist_services" (
          "id" SERIAL NOT NULL,
  
          "therapist_id"
            INTEGER NOT NULL,
  
          "service_option_id"
            INTEGER NOT NULL,
  
          "price"
            INTEGER NOT NULL,
  
          "platform_fee_rate"
            NUMERIC(5,2)
            NOT NULL
            DEFAULT 0,
  
          "is_active"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_therapist_services"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_therapist_services"
            UNIQUE (
              "therapist_id",
              "service_option_id"
            ),
  
          CONSTRAINT
          "fk_therapist_services_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT
          "fk_therapist_services_option"
            FOREIGN KEY ("service_option_id")
            REFERENCES
            "service_options"("id")
            ON DELETE CASCADE
        )
      `);

    /**
     * WORKING HOURS
     */

    await queryRunner.query(`
        CREATE TABLE
        "therapist_working_hours" (
          "id" SERIAL NOT NULL,
  
          "therapist_id"
            INTEGER NOT NULL,
  
          "day_of_week"
            SMALLINT NOT NULL,
  
          "start_time"
            TIME NOT NULL,
  
          "end_time"
            TIME NOT NULL,
  
          "is_active"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_therapist_working_hours"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "chk_therapist_working_hours_day"
            CHECK (
              "day_of_week"
              BETWEEN 0 AND 6
            ),
  
          CONSTRAINT
          "chk_therapist_working_hours_time"
            CHECK (
              "end_time" >
              "start_time"
            ),
  
          CONSTRAINT
          "fk_working_hours_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_therapist_working_hours_lookup"
        ON "therapist_working_hours"
        (
          "therapist_id",
          "day_of_week",
          "is_active"
        )
      `);

    /**
     * SCHEDULE EXCEPTIONS
     */

    await queryRunner.query(`
        CREATE TABLE
        "therapist_schedule_exceptions" (
          "id" SERIAL NOT NULL,
  
          "therapist_id"
            INTEGER NOT NULL,
  
          "date" DATE NOT NULL,
  
          "is_day_off"
            BOOLEAN NOT NULL
            DEFAULT false,
  
          "start_time" TIME,
  
          "end_time" TIME,
  
          "note" TEXT,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_therapist_schedule_exceptions"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "fk_schedule_exception_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_therapist_schedule_exception_date"
        ON "therapist_schedule_exceptions"
        (
          "therapist_id",
          "date"
        )
      `);

    /**
     * SERVICE AREAS
     */

    await queryRunner.query(`
        CREATE TABLE
        "therapist_service_areas" (
          "id" SERIAL NOT NULL,
  
          "therapist_id"
            INTEGER NOT NULL,
  
          "type"
            "therapist_service_area_type_enum"
            NOT NULL,
  
          "area_name"
            VARCHAR(255),
  
          "province_code"
            VARCHAR(32),
  
          "district_code"
            VARCHAR(32),
  
          "center_latitude"
            DOUBLE PRECISION,
  
          "center_longitude"
            DOUBLE PRECISION,
  
          "radius_km"
            DOUBLE PRECISION,
  
          "is_active"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_therapist_service_areas"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "fk_service_area_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE CASCADE
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_therapist_service_areas_therapist"
        ON "therapist_service_areas"
        ("therapist_id")
      `);

    /**
     * BOOKINGS
     */

    await queryRunner.query(`
        CREATE TABLE "bookings" (
          "id" SERIAL NOT NULL,
  
          "booking_code"
            VARCHAR(32) NOT NULL,
  
          "client_id"
            INTEGER NOT NULL,
  
          "therapist_id"
            INTEGER,
  
          "service_option_id"
            INTEGER NOT NULL,
  
          "therapist_service_id"
            INTEGER,
  
          "status"
            "booking_status_enum"
            NOT NULL
            DEFAULT 'pending',
  
          "scheduled_at"
            TIMESTAMPTZ NOT NULL,
  
          "expected_end_at"
            TIMESTAMPTZ NOT NULL,
  
          "service_name"
            VARCHAR(255) NOT NULL,
  
          "duration_minutes"
            INTEGER NOT NULL,
  
          "service_price"
            INTEGER NOT NULL,
  
          "platform_fee"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "tax_amount"
            INTEGER NOT NULL
            DEFAULT 0,
  
          "total_amount"
            INTEGER NOT NULL,
  
          "address"
            TEXT NOT NULL,
  
          "latitude"
            DOUBLE PRECISION NOT NULL,
  
          "longitude"
            DOUBLE PRECISION NOT NULL,
  
          "client_note"
            TEXT,
  
          "accepted_at"
            TIMESTAMPTZ,
  
          "arrived_at"
            TIMESTAMPTZ,
  
          "started_at"
            TIMESTAMPTZ,
  
          "completed_at"
            TIMESTAMPTZ,
  
          "cancelled_at"
            TIMESTAMPTZ,
  
          "cancellation_reason"
            TEXT,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_bookings"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_bookings_booking_code"
            UNIQUE ("booking_code"),
  
          CONSTRAINT
          "fk_bookings_client"
            FOREIGN KEY ("client_id")
            REFERENCES
            "client_profiles"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT
          "fk_bookings_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE SET NULL,
  
          CONSTRAINT
          "fk_bookings_service_option"
            FOREIGN KEY ("service_option_id")
            REFERENCES
            "service_options"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT
          "fk_bookings_therapist_service"
            FOREIGN KEY ("therapist_service_id")
            REFERENCES
            "therapist_services"("id")
            ON DELETE SET NULL
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_bookings_status"
        ON "bookings" ("status")
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_bookings_client_created"
        ON "bookings"
        (
          "client_id",
          "created_at"
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_bookings_therapist_schedule"
        ON "bookings"
        (
          "therapist_id",
          "scheduled_at"
        )
      `);

    /**
     * BOOKING STATUS HISTORY
     */

    await queryRunner.query(`
        CREATE TABLE
        "booking_status_histories" (
          "id" SERIAL NOT NULL,
  
          "booking_id"
            INTEGER NOT NULL,
  
          "from_status"
            "booking_status_enum",
  
          "to_status"
            "booking_status_enum"
            NOT NULL,
  
          "changed_by_user_id"
            INTEGER,
  
          "reason" TEXT,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_booking_status_histories"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "fk_booking_history_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT
          "fk_booking_history_user"
            FOREIGN KEY (
              "changed_by_user_id"
            )
            REFERENCES "users"("id")
            ON DELETE SET NULL
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_booking_status_histories_booking"
        ON "booking_status_histories"
        (
          "booking_id",
          "created_at"
        )
      `);

    /**
     * RATINGS
     */

    await queryRunner.query(`
        CREATE TABLE "ratings" (
          "id" SERIAL NOT NULL,
  
          "booking_id"
            INTEGER NOT NULL,
  
          "client_id"
            INTEGER NOT NULL,
  
          "therapist_id"
            INTEGER NOT NULL,
  
          "rating"
            SMALLINT NOT NULL,
  
          "comment" TEXT,
  
          "is_visible"
            BOOLEAN NOT NULL
            DEFAULT true,
  
          "admin_note" TEXT,
  
          "created_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "updated_at"
            TIMESTAMPTZ
            NOT NULL
            DEFAULT now(),
  
          "deleted_at"
            TIMESTAMPTZ,
  
          CONSTRAINT
          "pk_ratings"
            PRIMARY KEY ("id"),
  
          CONSTRAINT
          "uq_ratings_booking_id"
            UNIQUE ("booking_id"),
  
          CONSTRAINT
          "chk_ratings_rating"
            CHECK (
              "rating"
              BETWEEN 1 AND 5
            ),
  
          CONSTRAINT
          "fk_ratings_booking"
            FOREIGN KEY ("booking_id")
            REFERENCES "bookings"("id")
            ON DELETE CASCADE,
  
          CONSTRAINT
          "fk_ratings_client"
            FOREIGN KEY ("client_id")
            REFERENCES
            "client_profiles"("id")
            ON DELETE RESTRICT,
  
          CONSTRAINT
          "fk_ratings_therapist"
            FOREIGN KEY ("therapist_id")
            REFERENCES
            "therapist_profiles"("id")
            ON DELETE RESTRICT
        )
      `);

    await queryRunner.query(`
        CREATE INDEX
        "idx_ratings_therapist_id"
        ON "ratings"
        ("therapist_id")
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP TABLE IF EXISTS "ratings"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "booking_status_histories"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "bookings"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "therapist_service_areas"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "therapist_schedule_exceptions"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "therapist_working_hours"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "therapist_services"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "service_options"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "services"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "therapist_profiles"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "client_profiles"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "refresh_tokens"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS "users"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "booking_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "therapist_service_area_type_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "therapist_online_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "therapist_verification_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "gender_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "user_status_enum"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "user_role_enum"
      `);
  }
}
