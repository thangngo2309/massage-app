import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddClientProfileI18nResources1790584000000 implements MigrationInterface {
  name = 'AddClientProfileI18nResources1790584000000';

  private readonly namespace = 'profile';

  private readonly translations: Translation[] = [
    {
      key: 'title',
      vi: 'Tài khoản của tôi',
      en: 'My account',
    },
    {
      key: 'description',
      vi: 'Quản lý tài khoản và các hoạt động của bạn.',
      en: 'Manage your account and activities.',
    },

    /**
     * Activity
     */
    {
      key: 'activity.title',
      vi: 'Hoạt động',
      en: 'Activity',
    },
    {
      key: 'activity.bookings',
      vi: 'Lịch đặt của tôi',
      en: 'My bookings',
    },
    {
      key: 'activity.newBooking',
      vi: 'Đặt dịch vụ mới',
      en: 'Book a new service',
    },

    /**
     * Logout
     */
    {
      key: 'logout',
      vi: 'Đăng xuất',
      en: 'Log out',
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
