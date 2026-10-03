import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistPrivacyProfileWebI18nResources1790995200000 implements MigrationInterface {
  name = 'AddTherapistPrivacyProfileWebI18nResources1790995200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "i18n_resources" (
        "language_id",
        "namespace",
        "key",
        "value",
        "created_at",
        "updated_at"
      )
      SELECT
        language."id",
        resource."namespace",
        resource."key",
        resource."value",
        NOW(),
        NOW()
      FROM "i18n_languages" language
      CROSS JOIN (
        VALUES
          (
            'booking',
            'new.summary.therapistUpdating',
            'Đang cập nhật nghệ danh'
          ),
          (
            'booking',
            'detail.information.therapistPhone',
            'Số điện thoại kỹ thuật viên'
          ),
          (
            'booking',
            'detail.information.contactHiddenTitle',
            'Thông tin liên hệ đang được ẩn'
          ),
          (
            'booking',
            'detail.information.contactHiddenDescription',
            'Thông tin liên hệ của kỹ thuật viên sẽ hiển thị sau khi kỹ thuật viên xác nhận lịch đặt.'
          ),

          (
            'therapistBooking',
            'detail.customer.contactHiddenTitle',
            'Thông tin liên hệ đang được ẩn'
          ),
          (
            'therapistBooking',
            'detail.customer.contactHiddenDescription',
            'Số điện thoại của khách hàng sẽ hiển thị sau khi bạn xác nhận lịch đặt.'
          ),

          (
            'therapists',
            'card.stageNameUpdating',
            'Đang cập nhật nghệ danh'
          ),
          (
            'therapists',
            'detail.stageNameUpdating',
            'Đang cập nhật nghệ danh'
          ),
          (
            'therapists',
            'detail.profile.title',
            'Thông tin kỹ thuật viên'
          ),
          (
            'therapists',
            'detail.profile.stageName',
            'Nghệ danh'
          ),
          (
            'therapists',
            'detail.profile.bio',
            'Giới thiệu'
          ),
          (
            'therapists',
            'detail.profile.gender',
            'Giới tính'
          ),
          (
            'therapists',
            'detail.profile.tattoo',
            'Hình xăm'
          ),
          (
            'therapists',
            'detail.profile.tattooYes',
            'Có'
          ),
          (
            'therapists',
            'detail.profile.tattooNo',
            'Không'
          ),
          (
            'therapists',
            'detail.profile.notUpdated',
            'Chưa cập nhật'
          ),
          (
            'therapists',
            'detail.profile.genderValues.unknown',
            'Chưa xác định'
          ),
          (
            'therapists',
            'detail.profile.genderValues.male',
            'Nam'
          ),
          (
            'therapists',
            'detail.profile.genderValues.female',
            'Nữ'
          ),
          (
            'therapists',
            'detail.profile.genderValues.other',
            'Khác'
          )
      ) AS resource("namespace", "key", "value")
      WHERE language."code" = 'vi'
      ON CONFLICT ("language_id", "namespace", "key")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "updated_at" = NOW(),
        "deleted_at" = NULL
    `);

    await queryRunner.query(`
      INSERT INTO "i18n_resources" (
        "language_id",
        "namespace",
        "key",
        "value",
        "created_at",
        "updated_at"
      )
      SELECT
        language."id",
        resource."namespace",
        resource."key",
        resource."value",
        NOW(),
        NOW()
      FROM "i18n_languages" language
      CROSS JOIN (
        VALUES
          (
            'booking',
            'new.summary.therapistUpdating',
            'Stage name is being updated'
          ),
          (
            'booking',
            'detail.information.therapistPhone',
            'Therapist phone number'
          ),
          (
            'booking',
            'detail.information.contactHiddenTitle',
            'Contact information is hidden'
          ),
          (
            'booking',
            'detail.information.contactHiddenDescription',
            'The therapist contact information will be available after the therapist accepts the booking.'
          ),

          (
            'therapistBooking',
            'detail.customer.contactHiddenTitle',
            'Contact information is hidden'
          ),
          (
            'therapistBooking',
            'detail.customer.contactHiddenDescription',
            'The customer phone number will be available after you accept the booking.'
          ),

          (
            'therapists',
            'card.stageNameUpdating',
            'Stage name is being updated'
          ),
          (
            'therapists',
            'detail.stageNameUpdating',
            'Stage name is being updated'
          ),
          (
            'therapists',
            'detail.profile.title',
            'Therapist information'
          ),
          (
            'therapists',
            'detail.profile.stageName',
            'Stage name'
          ),
          (
            'therapists',
            'detail.profile.bio',
            'About'
          ),
          (
            'therapists',
            'detail.profile.gender',
            'Gender'
          ),
          (
            'therapists',
            'detail.profile.tattoo',
            'Tattoo'
          ),
          (
            'therapists',
            'detail.profile.tattooYes',
            'Yes'
          ),
          (
            'therapists',
            'detail.profile.tattooNo',
            'No'
          ),
          (
            'therapists',
            'detail.profile.notUpdated',
            'Not updated'
          ),
          (
            'therapists',
            'detail.profile.genderValues.unknown',
            'Not specified'
          ),
          (
            'therapists',
            'detail.profile.genderValues.male',
            'Male'
          ),
          (
            'therapists',
            'detail.profile.genderValues.female',
            'Female'
          ),
          (
            'therapists',
            'detail.profile.genderValues.other',
            'Other'
          )
      ) AS resource("namespace", "key", "value")
      WHERE language."code" = 'en'
      ON CONFLICT ("language_id", "namespace", "key")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "updated_at" = NOW(),
        "deleted_at" = NULL
    `);

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "i18n_resources"
      WHERE "language_id" IN (
        SELECT "id"
        FROM "i18n_languages"
        WHERE "code" IN ('vi', 'en')
      )
      AND (
        (
          "namespace" = 'booking'
          AND "key" IN (
            'new.summary.therapistUpdating',
            'detail.information.therapistPhone',
            'detail.information.contactHiddenTitle',
            'detail.information.contactHiddenDescription'
          )
        )
        OR
        (
          "namespace" = 'therapistBooking'
          AND "key" IN (
            'detail.customer.contactHiddenTitle',
            'detail.customer.contactHiddenDescription'
          )
        )
        OR
        (
          "namespace" = 'therapists'
          AND "key" IN (
            'card.stageNameUpdating',
            'detail.stageNameUpdating',
            'detail.profile.title',
            'detail.profile.stageName',
            'detail.profile.bio',
            'detail.profile.gender',
            'detail.profile.tattoo',
            'detail.profile.tattooYes',
            'detail.profile.tattooNo',
            'detail.profile.notUpdated',
            'detail.profile.genderValues.unknown',
            'detail.profile.genderValues.male',
            'detail.profile.genderValues.female',
            'detail.profile.genderValues.other'
          )
        )
      )
    `);

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
