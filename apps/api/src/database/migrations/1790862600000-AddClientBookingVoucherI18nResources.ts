import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddClientBookingVoucherI18nResources1790862600000 implements MigrationInterface {
  name = 'AddClientBookingVoucherI18nResources1790862600000';

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
            'new.voucher.title',
            'Ưu đãi'
          ),
          (
            'booking',
            'new.voucher.description',
            'Chọn voucher được cấp từ các chương trình khuyến mãi của bạn.'
          ),
          (
            'booking',
            'new.summary.discount',
            'Ưu đãi'
          ),
          (
            'booking',
            'new.summary.totalPayment',
            'Tổng thanh toán'
          ),
          (
            'booking',
            'detail.cost.discount',
            'Ưu đãi'
          ),
          (
            'booking',
            'detail.cost.voucherCode',
            'Mã voucher'
          ),
          (
            'booking',
            'detail.cost.payTherapist',
            'Bạn thanh toán cho KTV'
          ),
          (
            'booking',
            'detail.cost.compensationNotice',
            'Phần ưu đãi {{amount}} sẽ được hệ thống bù cho kỹ thuật viên sau khi booking hoàn thành.'
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
            'new.voucher.title',
            'Offers'
          ),
          (
            'booking',
            'new.voucher.description',
            'Choose a voucher granted from your promotion programs.'
          ),
          (
            'booking',
            'new.summary.discount',
            'Discount'
          ),
          (
            'booking',
            'new.summary.totalPayment',
            'Total payment'
          ),
          (
            'booking',
            'detail.cost.discount',
            'Discount'
          ),
          (
            'booking',
            'detail.cost.voucherCode',
            'Voucher code'
          ),
          (
            'booking',
            'detail.cost.payTherapist',
            'You pay the therapist'
          ),
          (
            'booking',
            'detail.cost.compensationNotice',
            'The {{amount}} discount will be compensated to the therapist by the platform after the booking is completed.'
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
        'new.voucher.title',
        'new.voucher.description',
        'new.summary.discount',
        'new.summary.totalPayment',
        'detail.cost.discount',
        'detail.cost.voucherCode',
        'detail.cost.payTherapist',
        'detail.cost.compensationNotice'
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
