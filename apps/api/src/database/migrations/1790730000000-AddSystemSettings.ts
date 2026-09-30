import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSystemSettings1790730000000 implements MigrationInterface {
  name = 'AddSystemSettings1790730000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TYPE "system_setting_value_type_enum"
        AS ENUM (
          'string',
          'number',
          'boolean',
          'json'
        )
      `);

    await queryRunner.query(`
        CREATE TABLE "system_settings" (
          "id" SERIAL NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT now(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
          "deleted_at" TIMESTAMP,
          "key" varchar(100) NOT NULL,
          "value" text NOT NULL,
          "value_type" "system_setting_value_type_enum"
            NOT NULL DEFAULT 'string',
          "description" varchar(255),
          "is_public" boolean NOT NULL DEFAULT false,
  
          CONSTRAINT "PK_system_settings"
            PRIMARY KEY ("id")
        )
      `);

    await queryRunner.query(`
        CREATE UNIQUE INDEX "UQ_system_settings_key"
        ON "system_settings" ("key")
      `);

    /**
     * ==============================================================
     * DEFAULT SETTINGS
     * ==============================================================
     */

    await queryRunner.query(`
        INSERT INTO "system_settings" (
          "key",
          "value",
          "value_type",
          "description",
          "is_public"
        )
        VALUES (
          'THERAPIST_BOOKING_ACCEPT_FEE',
          '10000',
          'number',
          'Phí nền tảng thu từ kỹ thuật viên khi chấp nhận booking',
          false
        )
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DROP INDEX IF EXISTS
        "UQ_system_settings_key"
      `);

    await queryRunner.query(`
        DROP TABLE IF EXISTS
        "system_settings"
      `);

    await queryRunner.query(`
        DROP TYPE IF EXISTS
        "system_setting_value_type_enum"
      `);
  }
}
