import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistScheduleI18nResources1790594000000 implements MigrationInterface {
  name = 'AddTherapistScheduleI18nResources1790594000000';

  private readonly namespace = 'therapistSchedule';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * PAGE
     * =========================================
     */
    {
      key: 'page.title',
      vi: 'Lịch làm việc',
      en: 'Work schedule',
    },
    {
      key: 'page.description',
      vi: 'Thiết lập các ca làm việc hàng tuần và ngày nghỉ.',
      en: 'Set up your weekly working hours and days off.',
    },

    /**
     * =========================================
     * WORKING HOURS
     * =========================================
     */
    {
      key: 'workingHours.title',
      vi: 'Ca làm việc hàng tuần',
      en: 'Weekly working hours',
    },
    {
      key: 'workingHours.description',
      vi: 'Có thể thêm nhiều ca trong cùng một ngày.',
      en: 'You can add multiple shifts on the same day.',
    },
    {
      key: 'workingHours.save',
      vi: 'Lưu lịch',
      en: 'Save schedule',
    },
    {
      key: 'workingHours.updateSuccess',
      vi: 'Đã cập nhật lịch làm việc.',
      en: 'Work schedule updated successfully.',
    },

    /**
     * =========================================
     * DAYS
     * =========================================
     */
    {
      key: 'days.sunday',
      vi: 'Chủ nhật',
      en: 'Sunday',
    },
    {
      key: 'days.monday',
      vi: 'Thứ hai',
      en: 'Monday',
    },
    {
      key: 'days.tuesday',
      vi: 'Thứ ba',
      en: 'Tuesday',
    },
    {
      key: 'days.wednesday',
      vi: 'Thứ tư',
      en: 'Wednesday',
    },
    {
      key: 'days.thursday',
      vi: 'Thứ năm',
      en: 'Thursday',
    },
    {
      key: 'days.friday',
      vi: 'Thứ sáu',
      en: 'Friday',
    },
    {
      key: 'days.saturday',
      vi: 'Thứ bảy',
      en: 'Saturday',
    },

    /**
     * =========================================
     * SHIFT EDITOR
     * =========================================
     */
    {
      key: 'editor.addShift',
      vi: 'Thêm ca',
      en: 'Add shift',
    },
    {
      key: 'editor.dayOff',
      vi: 'Nghỉ',
      en: 'Day off',
    },

    /**
     * =========================================
     * SCHEDULE EXCEPTION
     * =========================================
     */
    {
      key: 'exceptions.dayOffTitle',
      vi: 'Ngày nghỉ',
      en: 'Days off',
    },
    {
      key: 'exceptions.notePlaceholder',
      vi: 'Lý do hoặc ghi chú...',
      en: 'Reason or note...',
    },
    {
      key: 'exceptions.add',
      vi: 'Thêm ngày nghỉ',
      en: 'Add day off',
    },
    {
      key: 'exceptions.addSuccess',
      vi: 'Đã thêm ngày nghỉ.',
      en: 'Day off added successfully.',
    },

    /**
     * =========================================
     * EXCEPTION LIST
     * =========================================
     */
    {
      key: 'exceptions.listTitle',
      vi: 'Ngoại lệ đã tạo',
      en: 'Created exceptions',
    },
    {
      key: 'exceptions.empty',
      vi: 'Chưa có ngoại lệ.',
      en: 'No exceptions yet.',
    },
    {
      key: 'exceptions.defaultDayOff',
      vi: 'Ngày nghỉ',
      en: 'Day off',
    },
    {
      key: 'exceptions.deleteSuccess',
      vi: 'Đã xóa ngoại lệ.',
      en: 'Exception deleted successfully.',
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
