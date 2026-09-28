import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddBookingRatingFormI18nResources1790580000000 implements MigrationInterface {
  name = 'AddBookingRatingFormI18nResources1790580000000';

  private readonly namespace = 'booking';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * BOOKING RATING CARD
     * =========================================
     */
    {
      key: 'detail.rating.yourRating',
      vi: 'Đánh giá của bạn',
      en: 'Your review',
    },

    /**
     * =========================================
     * CREATE RATING FORM
     * =========================================
     */
    {
      key: 'detail.rating.question',
      vi: 'Bạn đánh giá dịch vụ này thế nào?',
      en: 'How would you rate this service?',
    },

    /**
     * Score labels
     */
    {
      key: 'detail.rating.score.excellent',
      vi: 'Tuyệt vời',
      en: 'Excellent',
    },
    {
      key: 'detail.rating.score.veryGood',
      vi: 'Rất tốt',
      en: 'Very good',
    },
    {
      key: 'detail.rating.score.good',
      vi: 'Khá tốt',
      en: 'Good',
    },
    {
      key: 'detail.rating.score.notGood',
      vi: 'Chưa tốt',
      en: 'Not good',
    },
    {
      key: 'detail.rating.score.dissatisfied',
      vi: 'Không hài lòng',
      en: 'Dissatisfied',
    },

    /**
     * Comment
     */
    {
      key: 'detail.rating.commentLabel',
      vi: 'Nhận xét',
      en: 'Comment',
    },
    {
      key: 'detail.rating.commentPlaceholder',
      vi: 'Chia sẻ trải nghiệm của bạn về kỹ thuật viên và dịch vụ...',
      en: 'Share your experience with the therapist and service...',
    },

    /**
     * Submit
     */
    {
      key: 'detail.rating.submit',
      vi: 'Gửi đánh giá',
      en: 'Submit review',
    },

    /**
     * Toast / validation
     */
    {
      key: 'detail.rating.success',
      vi: 'Cảm ơn bạn đã đánh giá.',
      en: 'Thank you for your review.',
    },
    {
      key: 'detail.rating.selectStars',
      vi: 'Vui lòng chọn số sao.',
      en: 'Please select a star rating.',
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

    /**
     * Tăng revision một lần sau khi cập nhật
     * toàn bộ resource của migration.
     */
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
