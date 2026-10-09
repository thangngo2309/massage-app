import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class SeedTherapistGroupTransferBookingDetails1791516960000 implements MigrationInterface {
  name = 'SeedTherapistGroupTransferBookingDetails1791516960000';

  private readonly translations: Translation[] = [
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.detailsTitle',
      vi: 'Thông tin booking',
      en: 'Booking details',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.time',
      vi: 'Thời gian',
      en: 'Time',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.address',
      vi: 'Địa chỉ',
      en: 'Address',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.services',
      vi: 'Dịch vụ',
      en: 'Services',
    },
    {
      namespace: 'therapistGroup',
      key: 'transfers.booking.durationMinutes',
      vi: '{{count}} phút',
      en: '{{count}} min',
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
            "updated_at" = now()
        `,
        [item.namespace, item.key, item.vi, item.en],
      );
    }

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
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
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
