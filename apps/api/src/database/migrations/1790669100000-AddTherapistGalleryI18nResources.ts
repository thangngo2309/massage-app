import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistGalleryI18nResources1790669100000 implements MigrationInterface {
  name = 'AddTherapistGalleryI18nResources1790669100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    /**
     * ================================================================
     * VIETNAMESE
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
              'therapistProfile',
              'gallery.title',
              'Hình ảnh của bạn'
            ),
            (
              'therapistProfile',
              'gallery.description',
              'Thêm tối đa {{max}} hình ảnh để khách hàng hiểu rõ hơn về bạn. Hỗ trợ JPG, PNG và WEBP, tối đa 8 MB mỗi ảnh.'
            ),
            (
              'therapistProfile',
              'gallery.add',
              'Thêm ảnh'
            ),
            (
              'therapistProfile',
              'gallery.addImages',
              'Thêm hình ảnh'
            ),
            (
              'therapistProfile',
              'gallery.selectFromDevice',
              'Chọn ảnh từ thiết bị của bạn'
            ),
            (
              'therapistProfile',
              'gallery.imageCount',
              '{{count}}/{{max}} hình ảnh'
            ),
            (
              'therapistProfile',
              'gallery.maxImages',
              'Bạn chỉ được tải tối đa {{max}} hình ảnh.'
            ),
            (
              'therapistProfile',
              'gallery.invalidType',
              'Chỉ hỗ trợ hình ảnh JPEG, PNG hoặc WEBP.'
            ),
            (
              'therapistProfile',
              'gallery.maxFileSize',
              'Mỗi hình ảnh không được vượt quá 8 MB.'
            ),
            (
              'therapistProfile',
              'gallery.deleteConfirm',
              'Bạn có chắc chắn muốn xóa hình ảnh này?'
            ),
            (
              'therapistProfile',
              'gallery.imageAlt',
              'Hình ảnh {{index}}'
            ),
            (
              'therapistProfile',
              'gallery.firstImage',
              'Ảnh đầu tiên'
            ),
            (
              'therapistProfile',
              'gallery.moveLeft',
              'Chuyển sang trái'
            ),
            (
              'therapistProfile',
              'gallery.moveRight',
              'Chuyển sang phải'
            ),
            (
              'therapistProfile',
              'gallery.deleteImage',
              'Xóa ảnh'
            ),
            (
              'therapistProfile',
              'gallery.savingOrder',
              'Đang lưu thứ tự hình ảnh...'
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
              'therapistProfile',
              'gallery.title',
              'Your photos'
            ),
            (
              'therapistProfile',
              'gallery.description',
              'Add up to {{max}} photos to help customers learn more about you. JPG, PNG and WEBP are supported, up to 8 MB per image.'
            ),
            (
              'therapistProfile',
              'gallery.add',
              'Add photos'
            ),
            (
              'therapistProfile',
              'gallery.addImages',
              'Add photos'
            ),
            (
              'therapistProfile',
              'gallery.selectFromDevice',
              'Choose photos from your device'
            ),
            (
              'therapistProfile',
              'gallery.imageCount',
              '{{count}}/{{max}} photos'
            ),
            (
              'therapistProfile',
              'gallery.maxImages',
              'You can upload up to {{max}} photos.'
            ),
            (
              'therapistProfile',
              'gallery.invalidType',
              'Only JPEG, PNG or WEBP images are supported.'
            ),
            (
              'therapistProfile',
              'gallery.maxFileSize',
              'Each image must not exceed 8 MB.'
            ),
            (
              'therapistProfile',
              'gallery.deleteConfirm',
              'Are you sure you want to delete this image?'
            ),
            (
              'therapistProfile',
              'gallery.imageAlt',
              'Photo {{index}}'
            ),
            (
              'therapistProfile',
              'gallery.firstImage',
              'First photo'
            ),
            (
              'therapistProfile',
              'gallery.moveLeft',
              'Move left'
            ),
            (
              'therapistProfile',
              'gallery.moveRight',
              'Move right'
            ),
            (
              'therapistProfile',
              'gallery.deleteImage',
              'Delete photo'
            ),
            (
              'therapistProfile',
              'gallery.savingOrder',
              'Saving photo order...'
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
        WHERE "namespace" = 'therapistProfile'
          AND "key" IN (
            'gallery.title',
            'gallery.description',
            'gallery.add',
            'gallery.addImages',
            'gallery.selectFromDevice',
            'gallery.imageCount',
            'gallery.maxImages',
            'gallery.invalidType',
            'gallery.maxFileSize',
            'gallery.deleteConfirm',
            'gallery.imageAlt',
            'gallery.firstImage',
            'gallery.moveLeft',
            'gallery.moveRight',
            'gallery.deleteImage',
            'gallery.savingOrder'
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
