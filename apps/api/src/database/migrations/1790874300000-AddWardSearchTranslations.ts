import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWardSearchTranslations1790874300000 implements MigrationInterface {
  name = 'AddWardSearchTranslations1790874300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ============================================================
     * VIETNAMESE
     * ============================================================
     */
    await queryRunner.query(`
      INSERT INTO "i18n_resources" (
        "language_id",
        "namespace",
        "key",
        "value",
        "created_at",
        "updated_at"
      )
      SELECT
        l."id",
        'therapists',
        v."key",
        v."value",
        NOW(),
        NOW()
      FROM "i18n_languages" l
      CROSS JOIN (
        VALUES
          (
            'search.form.province',
            'Tỉnh/Thành phố'
          ),
          (
            'search.form.provincePlaceholder',
            'Chọn tỉnh/thành phố'
          ),
          (
            'search.form.ward',
            'Phường/Xã/Đặc khu'
          ),
          (
            'search.form.wardPlaceholder',
            'Chọn phường/xã/đặc khu'
          ),
          (
            'search.form.areaValue',
            '{{ward}}, {{province}}'
          )
      ) AS v("key", "value")
      WHERE
        l."code" = 'vi'
        AND l."is_active" = true
        AND l."deleted_at" IS NULL
      ON CONFLICT (
        "language_id",
        "namespace",
        "key"
      )
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "deleted_at" = NULL,
        "updated_at" = NOW()
    `);

    /**
     * ============================================================
     * ENGLISH
     * ============================================================
     */
    await queryRunner.query(`
      INSERT INTO "i18n_resources" (
        "language_id",
        "namespace",
        "key",
        "value",
        "created_at",
        "updated_at"
      )
      SELECT
        l."id",
        'therapists',
        v."key",
        v."value",
        NOW(),
        NOW()
      FROM "i18n_languages" l
      CROSS JOIN (
        VALUES
          (
            'search.form.province',
            'Province/City'
          ),
          (
            'search.form.provincePlaceholder',
            'Select province/city'
          ),
          (
            'search.form.ward',
            'Ward/Commune/Special zone'
          ),
          (
            'search.form.wardPlaceholder',
            'Select ward/commune/special zone'
          ),
          (
            'search.form.areaValue',
            '{{ward}}, {{province}}'
          )
      ) AS v("key", "value")
      WHERE
        l."code" = 'en'
        AND l."is_active" = true
        AND l."deleted_at" IS NULL
      ON CONFLICT (
        "language_id",
        "namespace",
        "key"
      )
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "deleted_at" = NULL,
        "updated_at" = NOW()
    `);

    /**
     * Resource DB thay đổi thì tăng revision
     * để frontend biết cần tải lại translation.
     */
    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE
        "code" IN ('vi', 'en')
        AND "is_active" = true
        AND "deleted_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "i18n_resources"
      WHERE
        "namespace" = 'therapists'
        AND "key" IN (
          'search.form.province',
          'search.form.provincePlaceholder',
          'search.form.ward',
          'search.form.wardPlaceholder',
          'search.form.areaValue'
        )
        AND "language_id" IN (
          SELECT "id"
          FROM "i18n_languages"
          WHERE "code" IN ('vi', 'en')
        )
    `);

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE
        "code" IN ('vi', 'en')
        AND "deleted_at" IS NULL
    `);
  }
}
