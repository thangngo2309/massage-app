import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class SeedTherapistScheduleErrorTranslations1791527557000 implements MigrationInterface {
  name = 'SeedTherapistScheduleErrorTranslations1791527557000';

  private readonly translations: Translation[] = [
    {
      namespace: 'therapistSchedule',
      key: 'errors.working_hours_invalid_range',
      vi: 'Giờ kết thúc phải sau giờ bắt đầu.',
      en: 'End time must be after start time.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.working_hours_overlap',
      vi: 'Các ca làm việc trong cùng một ngày không được trùng thời gian.',
      en: 'Working shifts on the same day must not overlap.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.schedule_exception_time_required',
      vi: 'Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.',
      en: 'Start time and end time are required.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.schedule_exception_invalid_range',
      vi: 'Giờ kết thúc phải sau giờ bắt đầu.',
      en: 'End time must be after start time.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.schedule_exception_day_off_exists',
      vi: 'Ngày này đã được đánh dấu là ngày nghỉ.',
      en: 'This date is already marked as a day off.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.schedule_exception_overlap',
      vi: 'Khung giờ ngoại lệ bị trùng với một khung giờ đã tồn tại.',
      en: 'The schedule exception overlaps with an existing time window.',
    },
    {
      namespace: 'therapistSchedule',
      key: 'errors.schedule_exception_not_found',
      vi: 'Không tìm thấy ngày nghỉ hoặc ngoại lệ lịch.',
      en: 'The schedule exception could not be found.',
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
