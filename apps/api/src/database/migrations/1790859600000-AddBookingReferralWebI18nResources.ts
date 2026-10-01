import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingReferralWebI18nResources1790859600000 implements MigrationInterface {
  name = 'AddBookingReferralWebI18nResources1790859600000';

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
          ('booking', 'card.servicePrice', 'Giá dịch vụ'),
          ('booking', 'card.discount', 'Ưu đãi'),
          ('booking', 'card.youPay', 'Bạn thanh toán'),

          ('therapistBooking', 'card.servicePrice', 'Giá dịch vụ'),
          ('therapistBooking', 'card.systemCompensation', 'Hệ thống bù'),
          ('therapistBooking', 'card.customerPayment', 'Khách thanh toán'),

          ('therapistBooking', 'detail.service.price', 'Giá dịch vụ'),
          ('therapistBooking', 'detail.service.customerPromotion', 'Khuyến mãi của khách'),
          ('therapistBooking', 'detail.service.voucherCode', 'Mã voucher'),
          ('therapistBooking', 'detail.service.customerPayment', 'Khách thanh toán'),
          ('therapistBooking', 'detail.service.compensation.completedTitle', 'Đã bù vào ví chính'),
          ('therapistBooking', 'detail.service.compensation.pendingTitle', 'Hệ thống sẽ bù'),
          (
            'therapistBooking',
            'detail.service.compensation.completedDescription',
            'Khoản khuyến mãi của khách đã được hệ thống bù vào ví chính sau khi booking hoàn thành.'
          ),
          (
            'therapistBooking',
            'detail.service.compensation.pendingDescription',
            'Khoản khuyến mãi này sẽ được cộng vào ví chính của bạn khi booking hoàn thành.'
          ),

          ('referral', 'card.title', 'Mã giới thiệu'),
          ('referral', 'card.loadError', 'Không thể tải mã giới thiệu.'),
          ('referral', 'card.retry', 'Thử lại'),
          ('referral', 'card.myTitle', 'Mã giới thiệu của bạn'),
          (
            'referral',
            'card.description',
            'Chia sẻ mã này cho người khác khi họ đăng ký tài khoản.'
          ),
          ('referral', 'card.copySuccess', 'Đã sao chép mã giới thiệu'),
          ('referral', 'card.copyError', 'Không thể sao chép mã giới thiệu'),
          ('referral', 'card.copied', 'Đã sao chép'),
          ('referral', 'card.copy', 'Sao chép')
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
          ('booking', 'card.servicePrice', 'Service price'),
          ('booking', 'card.discount', 'Discount'),
          ('booking', 'card.youPay', 'You pay'),

          ('therapistBooking', 'card.servicePrice', 'Service price'),
          ('therapistBooking', 'card.systemCompensation', 'Platform compensation'),
          ('therapistBooking', 'card.customerPayment', 'Customer pays'),

          ('therapistBooking', 'detail.service.price', 'Service price'),
          ('therapistBooking', 'detail.service.customerPromotion', 'Customer promotion'),
          ('therapistBooking', 'detail.service.voucherCode', 'Voucher code'),
          ('therapistBooking', 'detail.service.customerPayment', 'Customer pays'),
          (
            'therapistBooking',
            'detail.service.compensation.completedTitle',
            'Credited to main wallet'
          ),
          (
            'therapistBooking',
            'detail.service.compensation.pendingTitle',
            'Platform compensation'
          ),
          (
            'therapistBooking',
            'detail.service.compensation.completedDescription',
            'The customer promotion amount has been credited to your main wallet after the booking was completed.'
          ),
          (
            'therapistBooking',
            'detail.service.compensation.pendingDescription',
            'This promotion amount will be credited to your main wallet when the booking is completed.'
          ),

          ('referral', 'card.title', 'Referral code'),
          ('referral', 'card.loadError', 'Unable to load your referral code.'),
          ('referral', 'card.retry', 'Try again'),
          ('referral', 'card.myTitle', 'Your referral code'),
          (
            'referral',
            'card.description',
            'Share this code with others when they create an account.'
          ),
          ('referral', 'card.copySuccess', 'Referral code copied'),
          ('referral', 'card.copyError', 'Unable to copy referral code'),
          ('referral', 'card.copied', 'Copied'),
          ('referral', 'card.copy', 'Copy')
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
            'card.servicePrice',
            'card.discount',
            'card.youPay'
          )
        )
        OR
        (
          "namespace" = 'therapistBooking'
          AND "key" IN (
            'card.servicePrice',
            'card.systemCompensation',
            'card.customerPayment',
            'detail.service.price',
            'detail.service.customerPromotion',
            'detail.service.voucherCode',
            'detail.service.customerPayment',
            'detail.service.compensation.completedTitle',
            'detail.service.compensation.pendingTitle',
            'detail.service.compensation.completedDescription',
            'detail.service.compensation.pendingDescription'
          )
        )
        OR
        (
          "namespace" = 'referral'
          AND "key" IN (
            'card.title',
            'card.loadError',
            'card.retry',
            'card.myTitle',
            'card.description',
            'card.copySuccess',
            'card.copyError',
            'card.copied',
            'card.copy'
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
