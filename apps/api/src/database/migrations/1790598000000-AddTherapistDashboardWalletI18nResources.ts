import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistDashboardWalletI18nResources1790598000000 implements MigrationInterface {
  name = 'AddTherapistDashboardWalletI18nResources1790598000000';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * THERAPIST DASHBOARD
     * =========================================
     */
    {
      namespace: 'therapistDashboard',
      key: 'page.title',
      vi: 'Tổng quan',
      en: 'Overview',
    },
    {
      namespace: 'therapistDashboard',
      key: 'page.description',
      vi: 'Theo dõi booking và lịch làm việc của bạn.',
      en: 'Track your bookings and work schedule.',
    },

    {
      namespace: 'therapistDashboard',
      key: 'stats.today',
      vi: 'Lịch hôm nay',
      en: "Today's bookings",
    },
    {
      namespace: 'therapistDashboard',
      key: 'stats.waiting',
      vi: 'Chờ xác nhận',
      en: 'Awaiting confirmation',
    },
    {
      namespace: 'therapistDashboard',
      key: 'stats.active',
      vi: 'Đang thực hiện',
      en: 'In progress',
    },
    {
      namespace: 'therapistDashboard',
      key: 'stats.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },
    {
      namespace: 'therapistDashboard',
      key: 'stats.booking',
      vi: 'booking',
      en: 'booking',
    },

    {
      namespace: 'therapistDashboard',
      key: 'upcoming.title',
      vi: 'Booking sắp tới',
      en: 'Upcoming bookings',
    },
    {
      namespace: 'therapistDashboard',
      key: 'upcoming.description',
      vi: 'Những booking cần bạn theo dõi.',
      en: 'Bookings that need your attention.',
    },
    {
      namespace: 'therapistDashboard',
      key: 'upcoming.viewAll',
      vi: 'Xem tất cả',
      en: 'View all',
    },
    {
      namespace: 'therapistDashboard',
      key: 'upcoming.empty',
      vi: 'Chưa có booking sắp tới.',
      en: 'No upcoming bookings.',
    },

    /**
     * =========================================
     * WALLET - PAYMENT RESULT
     * =========================================
     */
    {
      namespace: 'wallet',
      key: 'paymentResult.invalid.title',
      vi: 'Không xác định được giao dịch',
      en: 'Transaction not found',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.invalid.description',
      vi: 'Không tìm thấy mã giao dịch thanh toán.',
      en: 'The payment transaction reference could not be found.',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.checking.title',
      vi: 'Đang xác nhận giao dịch',
      en: 'Confirming transaction',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.checking.description',
      vi: 'Hệ thống đang kiểm tra kết quả thanh toán với VNPAY.',
      en: 'The system is checking the payment result with VNPAY.',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.error.title',
      vi: 'Không thể kiểm tra giao dịch',
      en: 'Unable to check transaction',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.error.retry',
      vi: 'Kiểm tra lại',
      en: 'Check again',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.success.title',
      vi: 'Nạp tiền thành công',
      en: 'Top-up successful',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.success.description',
      vi: 'Tiền đã được cộng vào ví của bạn.',
      en: 'The funds have been added to your wallet.',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.success.amount',
      vi: 'Số tiền nạp',
      en: 'Top-up amount',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.failed.title',
      vi: 'Thanh toán không thành công',
      en: 'Payment unsuccessful',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.failed.description',
      vi: 'Giao dịch chưa hoàn tất hoặc đã bị hủy. Số dư ví không bị thay đổi.',
      en: 'The transaction was not completed or was cancelled. Your wallet balance has not changed.',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.pending.title',
      vi: 'Đang xác nhận thanh toán',
      en: 'Confirming payment',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.pending.description',
      vi: 'VNPAY đã chuyển bạn về hệ thống. Chúng tôi đang chờ xác nhận giao dịch từ VNPAY.',
      en: 'VNPAY has redirected you back. We are waiting for transaction confirmation from VNPAY.',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.pending.autoChecking',
      vi: 'Đang kiểm tra tự động...',
      en: 'Checking automatically...',
    },

    {
      namespace: 'wallet',
      key: 'paymentResult.transaction.txnRef',
      vi: 'Mã giao dịch',
      en: 'Transaction reference',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.transaction.bank',
      vi: 'Ngân hàng',
      en: 'Bank',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.transaction.vnpayTxnRef',
      vi: 'Mã giao dịch VNPAY',
      en: 'VNPAY transaction ID',
    },
    {
      namespace: 'wallet',
      key: 'paymentResult.backToWallet',
      vi: 'Quay lại ví',
      en: 'Back to wallet',
    },

    /**
     * =========================================
     * NAVIGATION
     * =========================================
     */
    {
      namespace: 'navigation',
      key: 'therapist.wallet',
      vi: 'Ví của tôi',
      en: 'My wallet',
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
        [item.namespace, item.key, item.vi, item.en],
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
    for (const item of this.translations) {
      await queryRunner.query(
        `
          DELETE FROM "i18n_resources"
          WHERE "namespace" = $1
            AND "key" = $2
            AND "language_id" IN (
              SELECT "id"
              FROM "i18n_languages"
              WHERE "code" IN ('vi', 'en')
            )
        `,
        [item.namespace, item.key],
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
}
