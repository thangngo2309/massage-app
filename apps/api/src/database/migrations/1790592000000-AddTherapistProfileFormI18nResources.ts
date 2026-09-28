import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistProfileFormI18nResources1790592000000 implements MigrationInterface {
  name = 'AddTherapistProfileFormI18nResources1790592000000';

  private readonly namespace = 'therapistProfile';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * UPDATE
     * =========================================
     */
    {
      key: 'form.updateSuccess',
      vi: 'Đã cập nhật hồ sơ.',
      en: 'Profile updated successfully.',
    },
    {
      key: 'form.acceptingUpdateSuccess',
      vi: 'Đã cập nhật trạng thái nhận lịch.',
      en: 'Booking availability status updated.',
    },

    /**
     * =========================================
     * STATISTICS
     * =========================================
     */
    {
      key: 'form.stats.verification',
      vi: 'Xác minh',
      en: 'Verification',
    },
    {
      key: 'form.stats.verified',
      vi: 'Đã xác minh',
      en: 'Verified',
    },
    {
      key: 'form.stats.pendingVerification',
      vi: 'Chờ xác minh',
      en: 'Pending verification',
    },
    {
      key: 'form.stats.rating',
      vi: 'Đánh giá',
      en: 'Rating',
    },
    {
      key: 'form.stats.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },

    /**
     * =========================================
     * ACCEPTING BOOKINGS
     * =========================================
     */
    {
      key: 'form.accepting.title',
      vi: 'Trạng thái nhận lịch',
      en: 'Booking availability',
    },
    {
      key: 'form.accepting.description',
      vi: 'Chỉ kỹ thuật viên đã xác minh mới được bật nhận booking.',
      en: 'Only verified therapists can enable booking availability.',
    },
    {
      key: 'form.accepting.updating',
      vi: 'Đang cập nhật...',
      en: 'Updating...',
    },
    {
      key: 'form.accepting.active',
      vi: 'Đang nhận lịch',
      en: 'Accepting bookings',
    },
    {
      key: 'form.accepting.inactive',
      vi: 'Tạm ngừng nhận lịch',
      en: 'Not accepting bookings',
    },

    /**
     * =========================================
     * FULL NAME
     * =========================================
     */
    {
      key: 'form.fullName.label',
      vi: 'Họ và tên',
      en: 'Full name',
    },
    {
      key: 'form.fullName.required',
      vi: 'Vui lòng nhập họ và tên.',
      en: 'Please enter your full name.',
    },
    {
      key: 'form.fullName.minLength',
      vi: 'Họ và tên quá ngắn.',
      en: 'Full name is too short.',
    },
    {
      key: 'form.fullName.maxLength',
      vi: 'Họ và tên không được vượt quá 255 ký tự.',
      en: 'Full name must not exceed 255 characters.',
    },

    /**
     * =========================================
     * EXPERIENCE
     * =========================================
     */
    {
      key: 'form.experienceYears.label',
      vi: 'Số năm kinh nghiệm',
      en: 'Years of experience',
    },
    {
      key: 'form.experienceYears.invalid',
      vi: 'Số năm kinh nghiệm không hợp lệ.',
      en: 'Years of experience is invalid.',
    },

    /**
     * =========================================
     * BIO
     * =========================================
     */
    {
      key: 'form.bio.label',
      vi: 'Giới thiệu bản thân',
      en: 'About me',
    },
    {
      key: 'form.bio.placeholder',
      vi: 'Giới thiệu kinh nghiệm, phong cách phục vụ...',
      en: 'Describe your experience and service style...',
    },
    {
      key: 'form.bio.maxLength',
      vi: 'Giới thiệu không được vượt quá 2000 ký tự.',
      en: 'Introduction must not exceed 2000 characters.',
    },

    /**
     * =========================================
     * SAVE
     * =========================================
     */
    {
      key: 'form.save',
      vi: 'Lưu hồ sơ',
      en: 'Save profile',
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
