import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProfileAvatarI18nResources1790668800000 implements MigrationInterface {
  name = 'AddProfileAvatarI18nResources1790668800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ================================================================
     * PROFILE / AVATAR
     * ================================================================
     *
     * Namespace:
     *
     * profile
     *
     * Frontend:
     *
     * t("avatar.title")
     * t("avatar.description")
     * ...
     *
     * khi sử dụng:
     *
     * useTranslation("profile")
     */

    await queryRunner.query(`
        INSERT INTO "i18n_resources"
        (
          "language_id",
          "namespace",
          "key",
          "value"
        )
        SELECT
          l.id,
          v.namespace,
          v.key,
          v.value
        FROM "i18n_languages" l
        CROSS JOIN (
          VALUES
            (
              'profile',
              'avatar.title',
              'Ảnh đại diện'
            ),
            (
              'profile',
              'avatar.description',
              'Cập nhật ảnh đại diện cho tài khoản của bạn.'
            ),
            (
              'profile',
              'avatar.therapistDescription',
              'Ảnh đại diện được hiển thị với khách hàng khi tìm kiếm và xem thông tin kỹ thuật viên.'
            ),
            (
              'profile',
              'avatar.formats',
              'JPEG, PNG hoặc WEBP. Tối đa 8 MB.'
            ),
            (
              'profile',
              'avatar.change',
              'Đổi ảnh đại diện'
            ),
            (
              'profile',
              'avatar.remove',
              'Xóa ảnh'
            ),
            (
              'profile',
              'avatar.uploading',
              'Đang tải ảnh...'
            ),
            (
              'profile',
              'avatar.deleting',
              'Đang xóa ảnh...'
            ),
            (
              'profile',
              'avatar.uploadSuccess',
              'Cập nhật ảnh đại diện thành công'
            ),
            (
              'profile',
              'avatar.deleteSuccess',
              'Đã xóa ảnh đại diện'
            ),
            (
              'profile',
              'avatar.invalidType',
              'Chỉ hỗ trợ ảnh JPEG, PNG hoặc WEBP'
            ),
            (
              'profile',
              'avatar.maxSize',
              'Ảnh đại diện không được vượt quá 8 MB'
            ),
            (
              'profile',
              'avatar.required',
              'Vui lòng chọn ảnh đại diện'
            ),
            (
              'profile',
              'avatar.invalidFile',
              'File ảnh không hợp lệ'
            ),
            (
              'profile',
              'avatar.alt',
              'Ảnh đại diện'
            )
        ) AS v(namespace, key, value)
        WHERE l.code = 'vi'
          AND l.is_active = true
        ON CONFLICT ("language_id", "namespace", "key")
        DO UPDATE SET
          "value" = EXCLUDED."value",
          "updated_at" = CURRENT_TIMESTAMP,
          "deleted_at" = NULL
      `);

    /**
     * ================================================================
     * ENGLISH
     * ================================================================
     */

    await queryRunner.query(`
        INSERT INTO "i18n_resources"
        (
          "language_id",
          "namespace",
          "key",
          "value"
        )
        SELECT
          l.id,
          v.namespace,
          v.key,
          v.value
        FROM "i18n_languages" l
        CROSS JOIN (
          VALUES
            (
              'profile',
              'avatar.title',
              'Profile photo'
            ),
            (
              'profile',
              'avatar.description',
              'Update your account profile photo.'
            ),
            (
              'profile',
              'avatar.therapistDescription',
              'Your profile photo is shown to customers when they search for and view therapist information.'
            ),
            (
              'profile',
              'avatar.formats',
              'JPEG, PNG or WEBP. Maximum 8 MB.'
            ),
            (
              'profile',
              'avatar.change',
              'Change profile photo'
            ),
            (
              'profile',
              'avatar.remove',
              'Remove photo'
            ),
            (
              'profile',
              'avatar.uploading',
              'Uploading photo...'
            ),
            (
              'profile',
              'avatar.deleting',
              'Removing photo...'
            ),
            (
              'profile',
              'avatar.uploadSuccess',
              'Profile photo updated successfully'
            ),
            (
              'profile',
              'avatar.deleteSuccess',
              'Profile photo removed successfully'
            ),
            (
              'profile',
              'avatar.invalidType',
              'Only JPEG, PNG or WEBP images are supported'
            ),
            (
              'profile',
              'avatar.maxSize',
              'Profile photo must not exceed 8 MB'
            ),
            (
              'profile',
              'avatar.required',
              'Please select a profile photo'
            ),
            (
              'profile',
              'avatar.invalidFile',
              'Invalid image file'
            ),
            (
              'profile',
              'avatar.alt',
              'Profile photo'
            )
        ) AS v(namespace, key, value)
        WHERE l.code = 'en'
          AND l.is_active = true
        ON CONFLICT ("language_id", "namespace", "key")
        DO UPDATE SET
          "value" = EXCLUDED."value",
          "updated_at" = CURRENT_TIMESTAMP,
          "deleted_at" = NULL
      `);

    /**
     * Resource thay đổi => tăng revision.
     *
     * Frontend hiện dùng revision/version để biết
     * khi nào cần tải lại resource.
     */
    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" = "revision" + 1,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "code" IN ('vi', 'en')
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM "i18n_resources"
        WHERE "namespace" = 'profile'
          AND "key" IN (
            'avatar.title',
            'avatar.description',
            'avatar.therapistDescription',
            'avatar.formats',
            'avatar.change',
            'avatar.remove',
            'avatar.uploading',
            'avatar.deleting',
            'avatar.uploadSuccess',
            'avatar.deleteSuccess',
            'avatar.invalidType',
            'avatar.maxSize',
            'avatar.required',
            'avatar.invalidFile',
            'avatar.alt'
          )
          AND "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE "code" IN ('vi', 'en')
          )
      `);

    await queryRunner.query(`
        UPDATE "i18n_languages"
        SET
          "revision" = "revision" + 1,
          "updated_at" = CURRENT_TIMESTAMP
        WHERE "code" IN ('vi', 'en')
      `);
  }
}
