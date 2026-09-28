import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistServicesI18nResources1790596000000 implements MigrationInterface {
  name = 'AddTherapistServicesI18nResources1790596000000';

  private readonly namespace = 'therapistServices';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * PAGE
     * =========================================
     */
    {
      key: 'page.title',
      vi: 'Dịch vụ của tôi',
      en: 'My services',
    },
    {
      key: 'page.description',
      vi: 'Quản lý giá và trạng thái nhận từng dịch vụ.',
      en: 'Manage your pricing and availability for each service.',
    },
    {
      key: 'page.loadError',
      vi: 'Không thể tải dịch vụ',
      en: 'Unable to load services',
    },

    /**
     * =========================================
     * EMPTY
     * =========================================
     */
    {
      key: 'empty.title',
      vi: 'Chưa có dịch vụ',
      en: 'No services yet',
    },
    {
      key: 'empty.description',
      vi: 'Admin chưa gán dịch vụ nào cho tài khoản của bạn.',
      en: 'No services have been assigned to your account yet.',
    },

    /**
     * =========================================
     * SERVICE CARD
     * =========================================
     */
    {
      key: 'card.updateSuccess',
      vi: 'Đã cập nhật dịch vụ.',
      en: 'Service updated successfully.',
    },
    {
      key: 'card.status.active',
      vi: 'Đang nhận',
      en: 'Active',
    },
    {
      key: 'card.status.inactive',
      vi: 'Tạm ẩn',
      en: 'Hidden',
    },
    {
      key: 'card.defaultPrice',
      vi: 'Giá mặc định',
      en: 'Default price',
    },
    {
      key: 'card.platformFee',
      vi: 'Phí nền tảng',
      en: 'Platform fee',
    },
    {
      key: 'card.yourPrice',
      vi: 'Giá của bạn',
      en: 'Your price',
    },
    {
      key: 'card.toggle.active',
      vi: 'Đang nhận dịch vụ',
      en: 'Accepting service',
    },
    {
      key: 'card.toggle.inactive',
      vi: 'Đang tạm ẩn',
      en: 'Service hidden',
    },
    {
      key: 'card.save',
      vi: 'Lưu',
      en: 'Save',
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
            language."id",
            $1,
            $2,
            CASE
              WHEN language."code" = 'vi' THEN $3
              WHEN language."code" = 'en' THEN $4
            END
          FROM "i18n_languages" language
          WHERE language."code" IN ('vi', 'en')
          ON CONFLICT ("language_id", "namespace", "key")
          DO UPDATE SET
            "value" = EXCLUDED."value",
            "updated_at" = NOW()
        `,
        [this.namespace, item.key, item.vi, item.en],
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
    const keys = this.translations.map((item) => item.key);

    await queryRunner.query(
      `
        DELETE FROM "i18n_resources"
        WHERE "namespace" = $1
          AND "key" = ANY($2::varchar[])
          AND "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE "code" IN ('vi', 'en')
          )
      `,
      [this.namespace, keys],
    );

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
