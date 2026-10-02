import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAutocompleteTranslations1790874500000 implements MigrationInterface {
  name = 'AddAutocompleteTranslations1790874500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
              'search.form.autocomplete.loading',
              'Đang tải...'
            ),
            (
              'search.form.autocomplete.empty',
              'Không tìm thấy kết quả'
            ),
            (
              'search.form.autocomplete.clear',
              'Xóa lựa chọn'
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
              'search.form.autocomplete.loading',
              'Loading...'
            ),
            (
              'search.form.autocomplete.empty',
              'No results found'
            ),
            (
              'search.form.autocomplete.clear',
              'Clear selection'
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

    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" =
            "revision" + 1,
          "updated_at" = NOW()
        WHERE
          "code" IN (
            'vi',
            'en'
          )
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
            'search.form.autocomplete.loading',
            'search.form.autocomplete.empty',
            'search.form.autocomplete.clear'
          )
          AND "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE
              "code" IN (
                'vi',
                'en'
              )
          )
      `);

    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" =
            "revision" + 1,
          "updated_at" = NOW()
        WHERE
          "code" IN (
            'vi',
            'en'
          )
          AND "deleted_at" IS NULL
      `);
  }
}
