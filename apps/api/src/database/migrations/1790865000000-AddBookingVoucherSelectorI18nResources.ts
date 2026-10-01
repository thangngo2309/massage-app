import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingVoucherSelectorI18nResources1790865000000 implements MigrationInterface {
  name = 'AddBookingVoucherSelectorI18nResources1790865000000';

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
            'voucherSelector.loadError',
            'Không thể tải ưu đãi lúc này. Bạn vẫn có thể đặt lịch mà không dùng ưu đãi.'
          ),
          (
            'booking',
            'voucherSelector.empty.title',
            'Chưa có ưu đãi khả dụng'
          ),
          (
            'booking',
            'voucherSelector.empty.description',
            'Voucher được cấp từ chương trình khuyến mãi sẽ xuất hiện tại đây khi đủ điều kiện.'
          ),
          (
            'booking',
            'voucherSelector.select',
            'Chọn ưu đãi'
          ),
          (
            'booking',
            'voucherSelector.discountAmount',
            'Giảm {{amount}}'
          ),
          (
            'booking',
            'voucherSelector.availableCount',
            '{{count}} ưu đãi có thể áp dụng'
          ),
          (
            'booking',
            'voucherSelector.none.title',
            'Không sử dụng ưu đãi'
          ),
          (
            'booking',
            'voucherSelector.none.description',
            'Thanh toán theo giá dịch vụ hiện tại'
          ),
          (
            'booking',
            'voucherSelector.code',
            'Mã {{code}}'
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
            'voucherSelector.loadError',
            'Unable to load offers right now. You can still book without using an offer.'
          ),
          (
            'booking',
            'voucherSelector.empty.title',
            'No offers available'
          ),
          (
            'booking',
            'voucherSelector.empty.description',
            'Vouchers granted from promotion programs will appear here when you are eligible.'
          ),
          (
            'booking',
            'voucherSelector.select',
            'Select an offer'
          ),
          (
            'booking',
            'voucherSelector.discountAmount',
            'Save {{amount}}'
          ),
          (
            'booking',
            'voucherSelector.availableCount',
            '{{count}} offers available'
          ),
          (
            'booking',
            'voucherSelector.none.title',
            'Do not use an offer'
          ),
          (
            'booking',
            'voucherSelector.none.description',
            'Pay the current service price'
          ),
          (
            'booking',
            'voucherSelector.code',
            'Code {{code}}'
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
      AND "namespace" = 'booking'
      AND "key" IN (
        'voucherSelector.loadError',
        'voucherSelector.empty.title',
        'voucherSelector.empty.description',
        'voucherSelector.select',
        'voucherSelector.discountAmount',
        'voucherSelector.availableCount',
        'voucherSelector.none.title',
        'voucherSelector.none.description',
        'voucherSelector.code'
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
