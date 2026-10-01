import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAdministrativeLocations1790874000000
  implements MigrationInterface
{
  name = 'CreateAdministrativeLocations1790874000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * =========================================================
     * PROVINCES / CITIES
     * =========================================================
     *
     * Cấp hành chính thứ nhất:
     *
     * - Tỉnh
     * - Thành phố trực thuộc trung ương
     */
    await queryRunner.query(`
      CREATE TABLE "administrative_provinces" (
        "id" SERIAL NOT NULL,
        "code" character varying(32) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_en" character varying(255),
        "type" character varying(64),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_administrative_provinces_id"
          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_administrative_provinces_code"
          UNIQUE ("code")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_administrative_provinces_active_sort"
      ON "administrative_provinces" (
        "is_active",
        "sort_order",
        "name"
      )
    `);

    /**
     * =========================================================
     * WARDS / COMMUNES
     * =========================================================
     *
     * Cấp hành chính thứ hai:
     *
     * - Phường
     * - Xã
     * - Đặc khu hoặc loại tương đương nếu dataset có
     *
     * Không còn district_id.
     *
     * Ward liên kết trực tiếp Province.
     */
    await queryRunner.query(`
      CREATE TABLE "administrative_wards" (
        "id" SERIAL NOT NULL,
        "province_id" integer NOT NULL,
        "code" character varying(32) NOT NULL,
        "name" character varying(255) NOT NULL,
        "name_en" character varying(255),
        "type" character varying(64),
        "sort_order" integer NOT NULL DEFAULT 0,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_administrative_wards_id"
          PRIMARY KEY ("id"),
        CONSTRAINT "UQ_administrative_wards_code"
          UNIQUE ("code"),
        CONSTRAINT "FK_administrative_wards_province"
          FOREIGN KEY ("province_id")
          REFERENCES "administrative_provinces"("id")
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_administrative_wards_province"
      ON "administrative_wards" ("province_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_administrative_wards_province_active_sort"
      ON "administrative_wards" (
        "province_id",
        "is_active",
        "sort_order",
        "name"
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Drop bảng con trước bảng cha.
     */

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_administrative_wards_province_active_sort"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_administrative_wards_province"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "administrative_wards"
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_administrative_provinces_active_sort"
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS "administrative_provinces"
    `);
  }
}