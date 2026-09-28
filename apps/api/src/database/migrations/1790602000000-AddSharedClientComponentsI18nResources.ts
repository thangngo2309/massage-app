import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class AddSharedClientComponentsI18nResources1790602000000
  implements MigrationInterface
{
  name = 'AddSharedClientComponentsI18nResources1790602000000';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * SERVICES - EMPTY STATE
     * =========================================
     */
    {
      namespace: 'services',
      key: 'empty.title',
      vi: 'Chưa có dịch vụ',
      en: 'No services available',
    },
    {
      namespace: 'services',
      key: 'empty.description',
      vi: 'Hiện chưa có dịch vụ nào đang được mở để đặt lịch. Vui lòng quay lại sau.',
      en: 'There are currently no services available for booking. Please check back later.',
    },

    /**
     * =========================================
     * SERVICES - CARD
     * =========================================
     */
    {
      namespace: 'services',
      key: 'card.defaultDescription',
      vi: 'Trải nghiệm dịch vụ massage chuyên nghiệp và thư giãn tại nhà.',
      en: 'Enjoy a professional and relaxing massage service in the comfort of your home.',
    },
    {
      namespace: 'services',
      key: 'card.fromDuration',
      vi: 'Từ {{duration}}',
      en: 'From {{duration}}',
    },
    {
      namespace: 'services',
      key: 'card.priceFrom',
      vi: 'Giá từ',
      en: 'From',
    },
    {
      namespace: 'services',
      key: 'card.contact',
      vi: 'Liên hệ',
      en: 'Contact',
    },

    /**
     * =========================================
     * SERVICES - OPTION
     * =========================================
     */
    {
      namespace: 'services',
      key: 'option.price',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },
    {
      namespace: 'services',
      key: 'option.selected',
      vi: 'Đã chọn',
      en: 'Selected',
    },
    {
      namespace: 'services',
      key: 'option.select',
      vi: 'Chọn',
      en: 'Select',
    },

    /**
     * =========================================
     * BOOKING - RATING
     * =========================================
     */
    {
      namespace: 'booking',
      key: 'rating.starLabel',
      vi: '{{score}} sao',
      en: '{{score}} stars',
    },

    /**
     * =========================================
     * CLIENT PROFILE CARD
     * =========================================
     */
    {
      namespace: 'profile',
      key: 'card.customerFallback',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      namespace: 'profile',
      key: 'card.accountType',
      vi: 'Tài khoản khách hàng',
      en: 'Customer account',
    },
    {
      namespace: 'profile',
      key: 'card.phone',
      vi: 'Số điện thoại',
      en: 'Phone number',
    },
    {
      namespace: 'profile',
      key: 'card.email',
      vi: 'Email',
      en: 'Email',
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
        [
          item.namespace,
          item.key,
          item.vi,
          item.en,
        ],
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
          WHERE "namespace" = $1
            AND "key" = $2
            AND "language_id" IN (
              SELECT "id"
              FROM "i18n_languages"
              WHERE "code" IN ('vi', 'en')
            )
        `,
        [
          item.namespace,
          item.key,
        ],
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