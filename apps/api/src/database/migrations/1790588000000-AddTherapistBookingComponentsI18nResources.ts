import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistBookingComponentsI18nResources1790588000000 implements MigrationInterface {
  name = 'AddTherapistBookingComponentsI18nResources1790588000000';

  private readonly namespace = 'therapistBooking';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * BOOKING CARD
     * =========================================
     */
    {
      key: 'card.customerFallback',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      key: 'card.servicePrice',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },

    /**
     * =========================================
     * BOOKING ACTIONS
     * =========================================
     */
    {
      key: 'actions.updateSuccess',
      vi: 'Cập nhật booking thành công.',
      en: 'Booking updated successfully.',
    },

    /**
     * Reject
     */
    {
      key: 'actions.reject.reasonLabel',
      vi: 'Lý do từ chối',
      en: 'Reason for rejection',
    },
    {
      key: 'actions.reject.reasonPlaceholder',
      vi: 'Nhập lý do...',
      en: 'Enter a reason...',
    },
    {
      key: 'actions.reject.confirm',
      vi: 'Xác nhận từ chối',
      en: 'Confirm rejection',
    },
    {
      key: 'actions.reject.cancel',
      vi: 'Hủy',
      en: 'Cancel',
    },

    /**
     * Status actions
     */
    {
      key: 'actions.accept',
      vi: 'Xác nhận',
      en: 'Confirm',
    },
    {
      key: 'actions.reject.button',
      vi: 'Từ chối',
      en: 'Reject',
    },
    {
      key: 'actions.startTravel',
      vi: 'Bắt đầu di chuyển',
      en: 'Start travelling',
    },
    {
      key: 'actions.arrived',
      vi: 'Đã đến nơi',
      en: 'Arrived',
    },
    {
      key: 'actions.startService',
      vi: 'Bắt đầu dịch vụ',
      en: 'Start service',
    },
    {
      key: 'actions.complete',
      vi: 'Hoàn thành',
      en: 'Complete',
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
