import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddClientBookingListI18nResources1790575000000 implements MigrationInterface {
  name = 'AddClientBookingListI18nResources1790575000000';

  private readonly namespace = 'booking';

  private readonly translations: Translation[] = [
    /**
     * =========================================
     * BOOKING LIST
     * =========================================
     */
    {
      key: 'list.title',
      vi: 'Lịch hẹn của tôi',
      en: 'My bookings',
    },
    {
      key: 'list.description',
      vi: 'Theo dõi các booking và trạng thái dịch vụ của bạn.',
      en: 'Track your bookings and service status.',
    },

    /**
     * Filters
     */
    {
      key: 'list.filters.all',
      vi: 'Tất cả',
      en: 'All',
    },
    {
      key: 'list.filters.waitingTherapistAccept',
      vi: 'Chờ xác nhận',
      en: 'Waiting for confirmation',
    },
    {
      key: 'list.filters.confirmed',
      vi: 'Đã xác nhận',
      en: 'Confirmed',
    },
    {
      key: 'list.filters.inProgress',
      vi: 'Đang thực hiện',
      en: 'In progress',
    },
    {
      key: 'list.filters.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },

    /**
     * Error / Empty
     */
    {
      key: 'list.error.title',
      vi: 'Không thể tải lịch hẹn',
      en: 'Unable to load bookings',
    },
    {
      key: 'list.empty.title',
      vi: 'Chưa có lịch hẹn',
      en: 'No bookings yet',
    },
    {
      key: 'list.empty.description',
      vi: 'Booking của bạn sẽ xuất hiện tại đây.',
      en: 'Your bookings will appear here.',
    },

    /**
     * Pagination
     */
    {
      key: 'list.pagination.previous',
      vi: 'Trước',
      en: 'Previous',
    },
    {
      key: 'list.pagination.next',
      vi: 'Sau',
      en: 'Next',
    },
    {
      key: 'list.pagination.page',
      vi: 'Trang {{page}} / {{totalPages}}',
      en: 'Page {{page}} / {{totalPages}}',
    },

    /**
     * =========================================
     * BOOKING CARD
     * =========================================
     */
    {
      key: 'card.therapistUpdating',
      vi: 'Đang cập nhật',
      en: 'Updating',
    },
    {
      key: 'card.totalAmount',
      vi: 'Tổng tiền',
      en: 'Total',
    },

    /**
     * Duration
     */
    {
      key: 'duration.minutes',
      vi: '{{count}} phút',
      en: '{{count}} minutes',
    },
    {
      key: 'duration.hours',
      vi: '{{count}} giờ',
      en: '{{count}} hours',
    },
    {
      key: 'duration.hoursMinutes',
      vi: '{{hours}} giờ {{minutes}} phút',
      en: '{{hours}} hours {{minutes}} minutes',
    },

    /**
     * =========================================
     * BOOKING STATUS
     * =========================================
     */
    {
      key: 'status.pending',
      vi: 'Đang xử lý',
      en: 'Pending',
    },
    {
      key: 'status.searchingTherapist',
      vi: 'Đang tìm kỹ thuật viên',
      en: 'Searching for therapist',
    },
    {
      key: 'status.waitingTherapistAccept',
      vi: 'Chờ kỹ thuật viên xác nhận',
      en: 'Waiting for therapist confirmation',
    },
    {
      key: 'status.confirmed',
      vi: 'Đã xác nhận',
      en: 'Confirmed',
    },
    {
      key: 'status.therapistOnTheWay',
      vi: 'Kỹ thuật viên đang đến',
      en: 'Therapist is on the way',
    },
    {
      key: 'status.arrived',
      vi: 'Kỹ thuật viên đã đến',
      en: 'Therapist has arrived',
    },
    {
      key: 'status.inProgress',
      vi: 'Đang thực hiện',
      en: 'In progress',
    },
    {
      key: 'status.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },
    {
      key: 'status.cancelledByClient',
      vi: 'Khách hàng đã hủy',
      en: 'Cancelled by customer',
    },
    {
      key: 'status.cancelledByTherapist',
      vi: 'Kỹ thuật viên đã hủy',
      en: 'Cancelled by therapist',
    },
    {
      key: 'status.cancelledByAdmin',
      vi: 'Hệ thống đã hủy',
      en: 'Cancelled by system',
    },
    {
      key: 'status.rejected',
      vi: 'Kỹ thuật viên từ chối',
      en: 'Rejected by therapist',
    },
    {
      key: 'status.expired',
      vi: 'Đã hết hạn',
      en: 'Expired',
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

    /**
     * Chỉ tăng revision 1 lần sau khi seed xong toàn bộ resource.
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
