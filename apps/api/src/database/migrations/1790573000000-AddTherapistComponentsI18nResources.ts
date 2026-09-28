import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistComponentsI18nResources1790573000000
  implements MigrationInterface
{
  name = 'AddTherapistComponentsI18nResources1790573000000';

  private readonly namespace = 'therapists';

  private readonly translations: Translation[] = [
    // TherapistSearchCard
    {
      key: 'card.available',
      vi: 'Có thể đặt',
      en: 'Available',
    },
    {
      key: 'card.unavailable',
      vi: 'Không khả dụng',
      en: 'Unavailable',
    },
    {
      key: 'card.reviews',
      vi: '{{count}} đánh giá',
      en: '{{count}} reviews',
    },
    {
      key: 'card.experience',
      vi: '{{count}} năm kinh nghiệm',
      en: '{{count}} years of experience',
    },
    {
      key: 'card.distance',
      vi: '{{distance}} km',
      en: '{{distance}} km',
    },
    {
      key: 'card.price',
      vi: 'Giá kỹ thuật viên',
      en: 'Therapist price',
    },
    {
      key: 'card.detail',
      vi: 'Chi tiết',
      en: 'Details',
    },

    // Duration
    {
      key: 'duration.minutes',
      vi: '{{count}} phút',
      en: '{{count}} minutes',
    },
    {
      key: 'duration.hours',
      vi: '{{count}} giờ',
      en: '{{count}} hours',
    },
    {
      key: 'duration.hoursMinutes',
      vi: '{{hours}} giờ {{minutes}} phút',
      en: '{{hours}} hours {{minutes}} minutes',
    },

    // AvailabilitySlots
    {
      key: 'availability.empty.title',
      vi: 'Không còn khung giờ',
      en: 'No available time slots',
    },
    {
      key: 'availability.empty.description',
      vi: 'Kỹ thuật viên không còn lịch khả dụng trong ngày này.',
      en: 'The therapist has no remaining availability on this day.',
    },
    {
      key: 'availability.until',
      vi: 'đến {{time}}',
      en: 'until {{time}}',
    },

    // TherapistReviews
    {
      key: 'reviews.title',
      vi: 'Đánh giá từ khách hàng',
      en: 'Customer reviews',
    },
    {
      key: 'reviews.description',
      vi: 'Trải nghiệm thực tế từ những khách hàng đã sử dụng dịch vụ.',
      en: 'Real experiences from customers who have used the service.',
    },
    {
      key: 'reviews.loadError',
      vi: 'Chưa thể tải danh sách đánh giá.',
      en: 'Unable to load reviews.',
    },
    {
      key: 'reviews.empty.title',
      vi: 'Chưa có đánh giá',
      en: 'No reviews yet',
    },
    {
      key: 'reviews.empty.description',
      vi: 'Kỹ thuật viên chưa nhận được đánh giá nào.',
      en: 'This therapist has not received any reviews yet.',
    },
    {
      key: 'reviews.anonymousCustomer',
      vi: 'Khách hàng',
      en: 'Customer',
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