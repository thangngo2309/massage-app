import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWalletSplitTranslations1790819200000 implements MigrationInterface {
  name = 'AddWalletSplitTranslations1790819200000';

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
        l."id",
        'wallet',
        v."key",
        v."value",
        NOW(),
        NOW()
      FROM "i18n_languages" l
      CROSS JOIN (
        VALUES
          (
            'balance.totalAvailable',
            'Tổng số dư khả dụng'
          ),
          (
            'balance.totalAvailableDescription',
            'Bao gồm số dư ví chính và ví khuyến mãi có thể sử dụng.'
          ),
          (
            'balance.main.title',
            'Ví chính'
          ),
          (
            'balance.main.balance',
            'Số dư ví chính'
          ),
          (
            'balance.main.description',
            'Tiền nạp qua VNPAY, tiền hoàn và các khoản tiền thuộc ví chính.'
          ),
          (
            'balance.promotion.title',
            'Ví khuyến mãi'
          ),
          (
            'balance.promotion.balance',
            'Số dư khuyến mãi'
          ),
          (
            'balance.promotion.description',
            'Bao gồm tiền thưởng, ưu đãi và các khoản khuyến mãi do hệ thống cấp.'
          ),
          (
            'balance.promotion.noTopup',
            'Ví khuyến mãi không hỗ trợ nạp tiền trực tiếp.'
          ),
          (
            'topup.mainWallet.title',
            'Nạp vào ví chính'
          ),
          (
            'topup.mainWallet.description',
            'Số tiền thanh toán thành công qua VNPAY sẽ được cộng vào ví chính của bạn.'
          ),
          (
            'history.loadError',
            'Không thể tải lịch sử giao dịch.'
          )
      ) AS v("key", "value")
      WHERE l."code" = 'vi'
      ON CONFLICT ("language_id", "namespace", "key")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "updated_at" = NOW()
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
        l."id",
        'wallet',
        v."key",
        v."value",
        NOW(),
        NOW()
      FROM "i18n_languages" l
      CROSS JOIN (
        VALUES
          (
            'balance.totalAvailable',
            'Total available balance'
          ),
          (
            'balance.totalAvailableDescription',
            'Includes the available balance from your main wallet and promotion wallet.'
          ),
          (
            'balance.main.title',
            'Main wallet'
          ),
          (
            'balance.main.balance',
            'Main wallet balance'
          ),
          (
            'balance.main.description',
            'Includes funds topped up via VNPAY, refunds, and other funds credited to your main wallet.'
          ),
          (
            'balance.promotion.title',
            'Promotion wallet'
          ),
          (
            'balance.promotion.balance',
            'Promotion balance'
          ),
          (
            'balance.promotion.description',
            'Includes rewards, incentives, and promotional credits issued by the system.'
          ),
          (
            'balance.promotion.noTopup',
            'The promotion wallet does not support direct top-ups.'
          ),
          (
            'topup.mainWallet.title',
            'Top up main wallet'
          ),
          (
            'topup.mainWallet.description',
            'Successful payments via VNPAY will be credited to your main wallet.'
          ),
          (
            'history.loadError',
            'Unable to load transaction history.'
          )
      ) AS v("key", "value")
      WHERE l."code" = 'en'
      ON CONFLICT ("language_id", "namespace", "key")
      DO UPDATE SET
        "value" = EXCLUDED."value",
        "updated_at" = NOW()
    `);

    /**
     * Thay đổi resource DB phải tăng revision
     * để frontend nhận biết resource đã thay đổi.
     */
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
      WHERE
        "namespace" = 'wallet'
        AND "key" IN (
          'balance.totalAvailable',
          'balance.totalAvailableDescription',
          'balance.main.title',
          'balance.main.balance',
          'balance.main.description',
          'balance.promotion.title',
          'balance.promotion.balance',
          'balance.promotion.description',
          'balance.promotion.noTopup',
          'topup.mainWallet.title',
          'topup.mainWallet.description',
          'history.loadError'
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
        "updated_at" = NOW()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
