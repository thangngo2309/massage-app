import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class SeedBookingTransferUnavailableReasons1791513300000 implements MigrationInterface {
  name = 'SeedBookingTransferUnavailableReasons1791513300000';

  private readonly translations: Translation[] = [
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.therapist_inactive',
      vi: 'Kỹ thuật viên hiện không hoạt động.',
      en: 'The therapist is currently inactive.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.not_verified',
      vi: 'Kỹ thuật viên chưa được xác minh.',
      en: 'The therapist has not been verified.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.not_accepting_bookings',
      vi: 'Kỹ thuật viên hiện không nhận lịch mới.',
      en: 'The therapist is not currently accepting new bookings.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.service_option_unavailable',
      vi: 'Gói dịch vụ đã chọn hiện không khả dụng với kỹ thuật viên này.',
      en: 'The selected service option is unavailable for this therapist.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.service_not_supported',
      vi: 'Kỹ thuật viên không cung cấp dịch vụ này.',
      en: 'The therapist does not provide this service.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.outside_working_hours',
      vi: 'Thời gian booking nằm ngoài lịch làm việc của kỹ thuật viên.',
      en: "The booking time is outside the therapist's working hours.",
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.schedule_exception',
      vi: 'Kỹ thuật viên không khả dụng trong khung giờ này.',
      en: 'The therapist is unavailable during this time.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.booking_conflict',
      vi: 'Kỹ thuật viên đã có booking khác trùng khung giờ này.',
      en: 'The therapist already has another booking during this time.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.past_time',
      vi: 'Thời gian booking đã qua.',
      en: 'The booking time has already passed.',
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

    /**
     * Resource DB thay đổi nên tăng revision
     * để Web Portal reload translation mới.
     *
     * Chỉ tăng một lần cho toàn bộ migration.
     */
    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Chỉ xóa đúng resource thuộc migration này.
     *
     * Không xóa toàn bộ namespace bookingTransfer
     * vì namespace còn nhiều translation khác.
     */
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

    /**
     * Rollback cũng thay đổi resource DB,
     * nên tăng revision để client refresh cache.
     */
    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
