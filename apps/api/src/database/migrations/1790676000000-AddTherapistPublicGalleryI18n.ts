import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTherapistPublicGalleryI18n1790676000000 implements MigrationInterface {
  name = 'AddTherapistPublicGalleryI18n1790676000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.insertResources(queryRunner, 'vi', [
      ['detail.gallery.title', 'Hình ảnh kỹ thuật viên'],
      ['detail.gallery.count', '{{count}} hình ảnh'],
      ['detail.gallery.imageAlt', 'Hình ảnh {{index}} của {{name}}'],
      ['detail.gallery.viewAll', 'Xem tất cả'],
      ['detail.gallery.close', 'Đóng'],
      ['detail.gallery.previous', 'Ảnh trước'],
      ['detail.gallery.next', 'Ảnh tiếp theo'],
    ]);

    await this.insertResources(queryRunner, 'en', [
      ['detail.gallery.title', 'Therapist photos'],
      ['detail.gallery.count', '{{count}} photos'],
      ['detail.gallery.imageAlt', 'Photo {{index}} of {{name}}'],
      ['detail.gallery.viewAll', 'View all'],
      ['detail.gallery.close', 'Close'],
      ['detail.gallery.previous', 'Previous photo'],
      ['detail.gallery.next', 'Next photo'],
    ]);

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
        WHERE
          "namespace" = 'therapists'
          AND "key" IN (
            'detail.gallery.title',
            'detail.gallery.count',
            'detail.gallery.imageAlt',
            'detail.gallery.viewAll',
            'detail.gallery.close',
            'detail.gallery.previous',
            'detail.gallery.next'
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

  private async insertResources(
    queryRunner: QueryRunner,
    languageCode: string,
    resources: Array<[key: string, value: string]>,
  ): Promise<void> {
    for (const [key, value] of resources) {
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
              "id",
              'therapists',
              $2,
              $3
            FROM "i18n_languages"
            WHERE
              "code" = $1
              AND "is_active" = true
            ON CONFLICT (
              "language_id",
              "namespace",
              "key"
            )
            DO UPDATE SET
              "value" = EXCLUDED."value",
              "updated_at" = CURRENT_TIMESTAMP,
              "deleted_at" = NULL
          `,
        [languageCode, key, value],
      );
    }
  }
}
