import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class SeedBookingTransferCandidateReasonKeys1791513900000
  implements MigrationInterface
{
  name = 'SeedBookingTransferCandidateReasonKeys1791513900000';

  private readonly translations: Translation[] = [
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.candidate_not_in_group',
      vi: 'Kỹ thuật viên nhận chuyển không còn thuộc cùng nhóm.',
      en: 'The receiving therapist is no longer in the same group.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.candidate_not_found',
      vi: 'Không tìm thấy kỹ thuật viên nhận chuyển.',
      en: 'The receiving therapist could not be found.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.missing_required_services',
      vi: 'Kỹ thuật viên không cung cấp đầy đủ dịch vụ của booking.',
      en: 'The therapist does not provide all services required for this booking.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.booking_service_missing',
      vi: 'Booking không có đầy đủ thông tin dịch vụ để thực hiện chuyển kỹ thuật viên.',
      en: 'The booking does not contain enough service information to transfer the therapist.',
    },
    {
      namespace: 'bookingTransfer',
      key: 'therapist.candidate.unavailableReasons.candidate_unavailable',
      vi: 'Kỹ thuật viên hiện không thể nhận booking này.',
      en: 'The therapist is currently unable to accept this booking.',
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
     * Báo cho Web Portal biết resource DB đã thay đổi.
     *
     * Chỉ tăng revision một lần cho toàn bộ migration.
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
     * Chỉ xóa đúng những key candidate-specific thuộc migration này.
     *
     * Không xóa các availability reason đã được seed bởi migration trước.
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

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
