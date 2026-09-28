import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class AddServiceDetailI18nResources1790568000000 implements MigrationInterface {
  name = 'AddServiceDetailI18nResources1790568000000';

  private readonly translations: Translation[] = [
    {
      namespace: 'services',
      key: 'detail.chooseOptionDescription',
      vi: 'Chọn thời lượng và mức giá phù hợp trước khi tìm kỹ thuật viên.',
      en: 'Choose a duration and price before finding a therapist.',
    },
    {
      namespace: 'services',
      key: 'detail.noOptionsDescription',
      vi: 'Dịch vụ này hiện chưa có lựa chọn thời lượng đang mở.',
      en: 'This service currently has no active duration options.',
    },
    {
      namespace: 'services',
      key: 'detail.selection.title',
      vi: 'Lựa chọn của bạn',
      en: 'Your selection',
    },
    {
      namespace: 'services',
      key: 'detail.selection.empty',
      vi: 'Hãy chọn một liệu trình để tiếp tục tìm kỹ thuật viên phù hợp.',
      en: 'Select a treatment option to continue finding a suitable therapist.',
    },
    {
      namespace: 'services',
      key: 'detail.durationValue',
      vi: '{{count}} phút',
      en: '{{count}} minutes',
    },
    {
      namespace: 'services',
      key: 'detail.priceNotice',
      vi: 'Giá thực tế có thể thay đổi theo bảng giá của từng kỹ thuật viên.',
      en: "The actual price may vary depending on each therapist's pricing.",
    },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const item of this.translations) {
      await queryRunner.query(
        `
          INSERT INTO "i18n_resources"
          (
            "language_id",
            "namespace",
            "key",
            "value"
          )
          SELECT
            language.id,
            $1,
            $2,
            CASE
              WHEN language.code = 'vi' THEN $3
              WHEN language.code = 'en' THEN $4
            END
          FROM "i18n_languages" language
          WHERE language.code IN ('vi', 'en')
          ON CONFLICT (
            "language_id",
            "namespace",
            "key"
          )
          DO UPDATE SET
            "value" = EXCLUDED."value",
            "updated_at" = NOW()
        `,
        [item.namespace, item.key, item.vi, item.en],
      );
    }

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const item of this.translations) {
      await queryRunner.query(
        `
          DELETE FROM "i18n_resources"
          WHERE "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE "code" IN ('vi', 'en')
          )
          AND "namespace" = $1
          AND "key" = $2
        `,
        [item.namespace, item.key],
      );
    }

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
