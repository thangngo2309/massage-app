import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddBookingRatingTimelineI18nResources1790577000000 implements MigrationInterface {
  name = 'AddBookingRatingTimelineI18nResources1790577000000';

  private readonly namespace = 'booking';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * BOOKING RATING STATUS
     * =========================================
     */
    {
      key: 'ratingStatus.rated',
      vi: 'Đã đánh giá',
      en: 'Reviewed',
    },
    {
      key: 'ratingStatus.notRated',
      vi: 'Chưa đánh giá',
      en: 'Not reviewed yet',
    },

    /**
     * =========================================
     * BOOKING TIMELINE
     * =========================================
     */
    {
      key: 'timeline.empty',
      vi: 'Chưa có lịch sử trạng thái.',
      en: 'No status history yet.',
    },

    /**
     * Timeline status labels.
     *
     * Đây là nội dung mô tả EVENT trong timeline,
     * khác với status badge nên giữ nhóm riêng.
     */
    {
      key: 'timeline.status.pending',
      vi: 'Booking được tạo',
      en: 'Booking created',
    },
    {
      key: 'timeline.status.searchingTherapist',
      vi: 'Đang tìm kỹ thuật viên',
      en: 'Searching for a therapist',
    },
    {
      key: 'timeline.status.waitingTherapistAccept',
      vi: 'Đang chờ kỹ thuật viên xác nhận',
      en: 'Waiting for therapist confirmation',
    },
    {
      key: 'timeline.status.confirmed',
      vi: 'Kỹ thuật viên đã xác nhận',
      en: 'Therapist confirmed',
    },
    {
      key: 'timeline.status.therapistOnTheWay',
      vi: 'Kỹ thuật viên đang di chuyển',
      en: 'Therapist is on the way',
    },
    {
      key: 'timeline.status.arrived',
      vi: 'Kỹ thuật viên đã đến',
      en: 'Therapist arrived',
    },
    {
      key: 'timeline.status.inProgress',
      vi: 'Bắt đầu dịch vụ',
      en: 'Service started',
    },
    {
      key: 'timeline.status.completed',
      vi: 'Hoàn thành dịch vụ',
      en: 'Service completed',
    },
    {
      key: 'timeline.status.rejected',
      vi: 'Kỹ thuật viên từ chối',
      en: 'Therapist rejected the booking',
    },
    {
      key: 'timeline.status.cancelledByClient',
      vi: 'Khách hàng hủy',
      en: 'Cancelled by customer',
    },
    {
      key: 'timeline.status.cancelledByTherapist',
      vi: 'Kỹ thuật viên hủy',
      en: 'Cancelled by therapist',
    },
    {
      key: 'timeline.status.cancelledByAdmin',
      vi: 'Hệ thống hủy',
      en: 'Cancelled by system',
    },
    {
      key: 'timeline.status.expired',
      vi: 'Booking hết hạn',
      en: 'Booking expired',
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
