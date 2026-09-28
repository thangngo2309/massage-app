import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistWalletI18nResources1790600000000 implements MigrationInterface {
  name = 'AddTherapistWalletI18nResources1790600000000';

  private readonly namespace = 'wallet';

  private readonly translations: Translation[] = [
    {
      key: 'page.title',
      vi: 'Ví của tôi',
      en: 'My wallet',
    },
    {
      key: 'page.description',
      vi: 'Quản lý số dư và các giao dịch của bạn',
      en: 'Manage your balance and wallet transactions',
    },
    {
      key: 'page.loadError',
      vi: 'Không thể tải thông tin ví.',
      en: 'Unable to load wallet information.',
    },

    {
      key: 'balance.available',
      vi: 'Số dư khả dụng',
      en: 'Available balance',
    },
    {
      key: 'balance.topup',
      vi: 'Nạp tiền',
      en: 'Top up',
    },

    {
      key: 'topup.back',
      vi: 'Quay lại ví',
      en: 'Back to wallet',
    },
    {
      key: 'topup.title',
      vi: 'Nạp tiền vào ví',
      en: 'Top up wallet',
    },
    {
      key: 'topup.description',
      vi: 'Chọn số tiền bạn muốn nạp. Giao dịch sẽ được thanh toán an toàn qua VNPAY.',
      en: 'Choose the amount you want to add. The transaction will be securely processed through VNPAY.',
    },
    {
      key: 'topup.quickAmount',
      vi: 'Chọn nhanh số tiền',
      en: 'Quick amount',
    },
    {
      key: 'topup.or',
      vi: 'HOẶC',
      en: 'OR',
    },
    {
      key: 'topup.customAmount',
      vi: 'Nhập số tiền khác',
      en: 'Enter another amount',
    },
    {
      key: 'topup.amountPlaceholder',
      vi: 'Nhập số tiền',
      en: 'Enter amount',
    },
    {
      key: 'topup.currency',
      vi: 'VNĐ',
      en: 'VND',
    },
    {
      key: 'topup.limit',
      vi: 'Tối thiểu 10.000đ · Tối đa 100.000.000đ',
      en: 'Minimum 10,000 VND · Maximum 100,000,000 VND',
    },
    {
      key: 'topup.amount',
      vi: 'Số tiền nạp',
      en: 'Top-up amount',
    },
    {
      key: 'topup.creating',
      vi: 'Đang tạo giao dịch...',
      en: 'Creating transaction...',
    },
    {
      key: 'topup.payWithVnpay',
      vi: 'Thanh toán qua VNPAY',
      en: 'Pay with VNPAY',
    },
    {
      key: 'topup.securityNotice',
      vi: 'Thanh toán được thực hiện trên hệ thống VNPAY. Số dư ví chỉ được cập nhật sau khi hệ thống xác nhận giao dịch thành công.',
      en: 'Payment is processed through VNPAY. Your wallet balance will only be updated after the system confirms a successful transaction.',
    },

    {
      key: 'topup.errors.noPaymentUrl',
      vi: 'Không nhận được đường dẫn thanh toán',
      en: 'Payment URL was not received',
    },
    {
      key: 'topup.errors.createFailed',
      vi: 'Không thể tạo giao dịch nạp tiền',
      en: 'Unable to create top-up transaction',
    },
    {
      key: 'topup.errors.minimum',
      vi: 'Số tiền nạp tối thiểu là 10.000đ',
      en: 'The minimum top-up amount is 10,000 VND',
    },
    {
      key: 'topup.errors.maximum',
      vi: 'Số tiền nạp tối đa là 100.000.000đ',
      en: 'The maximum top-up amount is 100,000,000 VND',
    },

    {
      key: 'history.title',
      vi: 'Lịch sử giao dịch',
      en: 'Transaction history',
    },
    {
      key: 'history.empty.title',
      vi: 'Chưa có giao dịch',
      en: 'No transactions yet',
    },
    {
      key: 'history.empty.description',
      vi: 'Các giao dịch ví sẽ xuất hiện tại đây.',
      en: 'Your wallet transactions will appear here.',
    },

    {
      key: 'transaction.topup',
      vi: 'Nạp tiền',
      en: 'Top up',
    },
    {
      key: 'transaction.refund',
      vi: 'Hoàn tiền',
      en: 'Refund',
    },
    {
      key: 'transaction.withdraw',
      vi: 'Rút tiền',
      en: 'Withdrawal',
    },
    {
      key: 'transaction.payment',
      vi: 'Thanh toán',
      en: 'Payment',
    },
    {
      key: 'transaction.adjustment',
      vi: 'Điều chỉnh số dư',
      en: 'Balance adjustment',
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
