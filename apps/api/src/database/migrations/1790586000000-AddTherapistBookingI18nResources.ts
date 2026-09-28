import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistBookingI18nResources1790586000000 implements MigrationInterface {
  name = 'AddTherapistBookingI18nResources1790586000000';

  private readonly namespace = 'therapistBooking';

  private readonly translations: Translation[] = [
    // =========================================
    // BOOKING LIST
    // =========================================
    {
      key: 'list.title',
      vi: 'Booking của tôi',
      en: 'My bookings',
    },
    {
      key: 'list.description',
      vi: 'Xác nhận booking và theo dõi các lịch dịch vụ của bạn.',
      en: 'Confirm bookings and keep track of your service appointments.',
    },

    // Filters
    {
      key: 'list.filters.all',
      vi: 'Tất cả',
      en: 'All',
    },
    {
      key: 'list.filters.waitingAccept',
      vi: 'Chờ xác nhận',
      en: 'Awaiting confirmation',
    },
    {
      key: 'list.filters.confirmed',
      vi: 'Đã xác nhận',
      en: 'Confirmed',
    },
    {
      key: 'list.filters.onTheWay',
      vi: 'Đang di chuyển',
      en: 'On the way',
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

    // Error
    {
      key: 'list.loadError',
      vi: 'Không thể tải booking',
      en: 'Unable to load bookings',
    },

    // Empty
    {
      key: 'list.empty.title',
      vi: 'Chưa có booking',
      en: 'No bookings yet',
    },
    {
      key: 'list.empty.description',
      vi: 'Booking của khách hàng sẽ xuất hiện tại đây.',
      en: 'Customer bookings will appear here.',
    },

    // Pagination
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

    // =========================================
    // BOOKING DETAIL
    // =========================================
    {
      key: 'detail.loadError',
      vi: 'Không thể tải booking',
      en: 'Unable to load booking',
    },
    {
      key: 'detail.backToBookings',
      vi: 'Booking của tôi',
      en: 'My bookings',
    },
    {
      key: 'detail.bookingNumber',
      vi: 'Booking #{{id}}',
      en: 'Booking #{{id}}',
    },

    // Customer
    {
      key: 'detail.customer.title',
      vi: 'Thông tin khách hàng',
      en: 'Customer information',
    },
    {
      key: 'detail.customer.name',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      key: 'detail.customer.fallbackName',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      key: 'detail.customer.phone',
      vi: 'Số điện thoại',
      en: 'Phone number',
    },

    // Appointment
    {
      key: 'detail.appointment.title',
      vi: 'Thông tin lịch hẹn',
      en: 'Appointment information',
    },
    {
      key: 'detail.appointment.time',
      vi: 'Thời gian',
      en: 'Time',
    },
    {
      key: 'detail.appointment.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      key: 'detail.appointment.address',
      vi: 'Địa chỉ phục vụ',
      en: 'Service address',
    },
    {
      key: 'detail.appointment.clientNote',
      vi: 'Ghi chú của khách',
      en: 'Customer note',
    },

    // Timeline
    {
      key: 'detail.timeline.title',
      vi: 'Tiến trình',
      en: 'Progress',
    },

    // Service
    {
      key: 'detail.service.title',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      key: 'detail.service.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      key: 'detail.service.price',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },

    // Actions
    {
      key: 'detail.actions.title',
      vi: 'Thao tác',
      en: 'Actions',
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
