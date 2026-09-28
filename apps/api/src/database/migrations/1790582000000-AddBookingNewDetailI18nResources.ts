import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddBookingNewDetailI18nResources1790582000000 implements MigrationInterface {
  name = 'AddBookingNewDetailI18nResources1790582000000';

  private readonly namespace = 'booking';

  private readonly translations: Translation[] = [
    // =========================================
    // NEW BOOKING - LOCATION
    // =========================================
    {
      key: 'new.location.unsupported',
      vi: 'Trình duyệt không hỗ trợ định vị.',
      en: 'Your browser does not support geolocation.',
    },
    {
      key: 'new.location.success',
      vi: 'Đã lấy vị trí phục vụ.',
      en: 'Service location detected.',
    },
    {
      key: 'new.location.permissionDenied',
      vi: 'Bạn chưa cho phép trình duyệt truy cập vị trí.',
      en: 'Location permission has not been granted.',
    },
    {
      key: 'new.location.unavailable',
      vi: 'Không xác định được vị trí hiện tại.',
      en: 'Your current location could not be determined.',
    },
    {
      key: 'new.location.timeout',
      vi: 'Quá thời gian lấy vị trí. Vui lòng thử lại.',
      en: 'Location request timed out. Please try again.',
    },
    {
      key: 'new.location.error',
      vi: 'Không thể lấy vị trí hiện tại.',
      en: 'Unable to get your current location.',
    },
    {
      key: 'new.location.required',
      vi: 'Vui lòng xác định vị trí phục vụ.',
      en: 'Please specify the service location.',
    },

    // =========================================
    // NEW BOOKING - CREATE
    // =========================================
    {
      key: 'new.errors.serviceNotFound',
      vi: 'Không tìm thấy dịch vụ.',
      en: 'Service not found.',
    },
    {
      key: 'new.errors.optionNotFound',
      vi: 'Không tìm thấy liệu trình.',
      en: 'Service option not found.',
    },
    {
      key: 'new.errors.therapistUnavailable',
      vi: 'Kỹ thuật viên không còn khả dụng.',
      en: 'The therapist is no longer available.',
    },
    {
      key: 'new.errors.slotUnavailable',
      vi: 'Khung giờ này không còn khả dụng. Vui lòng chọn lại.',
      en: 'This time slot is no longer available. Please select another time.',
    },
    {
      key: 'new.success',
      vi: 'Đặt lịch thành công.',
      en: 'Booking created successfully.',
    },

    // =========================================
    // NEW BOOKING - INVALID PARAMS
    // =========================================
    {
      key: 'new.invalid.title',
      vi: 'Thông tin đặt lịch không hợp lệ',
      en: 'Invalid booking information',
    },
    {
      key: 'new.invalid.description',
      vi: 'Thông tin dịch vụ, kỹ thuật viên, thời gian hoặc khu vực đã bị thiếu.',
      en: 'Service, therapist, time, or location information is missing.',
    },
    {
      key: 'new.invalid.selectService',
      vi: 'Chọn lại dịch vụ',
      en: 'Select service again',
    },

    // =========================================
    // NEW BOOKING - UNAVAILABLE
    // =========================================
    {
      key: 'new.unavailable.title',
      vi: 'Không thể tiếp tục đặt lịch',
      en: 'Unable to continue booking',
    },
    {
      key: 'new.unavailable.description',
      vi: 'Dịch vụ hoặc kỹ thuật viên không còn phù hợp với điều kiện đã chọn.',
      en: 'The service or therapist is no longer available for your selected conditions.',
    },
    {
      key: 'new.unavailable.action',
      vi: 'Chọn lại',
      en: 'Select again',
    },

    // =========================================
    // NEW BOOKING - PAGE
    // =========================================
    {
      key: 'new.title',
      vi: 'Xác nhận đặt lịch',
      en: 'Confirm booking',
    },
    {
      key: 'new.description',
      vi: 'Kiểm tra lại dịch vụ, kỹ thuật viên và nhập địa chỉ phục vụ trước khi gửi booking.',
      en: 'Review the service and therapist, then enter the service address before submitting your booking.',
    },

    // =========================================
    // NEW BOOKING - ADDRESS
    // =========================================
    {
      key: 'new.address.title',
      vi: 'Địa chỉ phục vụ',
      en: 'Service address',
    },
    {
      key: 'new.address.description',
      vi: 'Đây là địa điểm kỹ thuật viên sẽ đến thực hiện dịch vụ.',
      en: 'This is where the therapist will provide the service.',
    },
    {
      key: 'new.address.label',
      vi: 'Địa chỉ chi tiết',
      en: 'Detailed address',
    },
    {
      key: 'new.address.placeholder',
      vi: 'Ví dụ: 20 Quang Trung, Hải Châu, Đà Nẵng',
      en: 'Example: 20 Quang Trung, Hai Chau, Da Nang',
    },
    {
      key: 'new.address.validation.required',
      vi: 'Vui lòng nhập địa chỉ phục vụ.',
      en: 'Please enter the service address.',
    },
    {
      key: 'new.address.validation.minLength',
      vi: 'Địa chỉ quá ngắn.',
      en: 'The address is too short.',
    },
    {
      key: 'new.address.validation.maxLength',
      vi: 'Địa chỉ không được vượt quá 500 ký tự.',
      en: 'The address must not exceed 500 characters.',
    },

    // =========================================
    // NEW BOOKING - LOCATION UI
    // =========================================
    {
      key: 'new.location.label',
      vi: 'Vị trí phục vụ',
      en: 'Service location',
    },
    {
      key: 'new.location.description',
      vi: 'Tọa độ giúp hệ thống và kỹ thuật viên xác định chính xác nơi phục vụ.',
      en: 'Coordinates help the system and therapist locate the service address accurately.',
    },
    {
      key: 'new.location.useCurrent',
      vi: 'Dùng vị trí hiện tại',
      en: 'Use current location',
    },
    {
      key: 'new.location.update',
      vi: 'Cập nhật vị trí',
      en: 'Update location',
    },
    {
      key: 'new.location.notSelected',
      vi: 'Vui lòng xác định vị trí trước khi đặt lịch.',
      en: 'Please specify your location before booking.',
    },
    {
      key: 'new.location.selected',
      vi: 'Đã xác định vị trí phục vụ.',
      en: 'Service location confirmed.',
    },

    // =========================================
    // NEW BOOKING - NOTE
    // =========================================
    {
      key: 'new.note.label',
      vi: 'Ghi chú cho kỹ thuật viên',
      en: 'Note for therapist',
    },
    {
      key: 'new.note.placeholder',
      vi: 'Ví dụ: Vui lòng gọi trước khi đến...',
      en: 'Example: Please call before arriving...',
    },
    {
      key: 'new.note.validation.maxLength',
      vi: 'Ghi chú không được vượt quá 1000 ký tự.',
      en: 'The note must not exceed 1000 characters.',
    },

    // =========================================
    // NEW BOOKING - SUMMARY
    // =========================================
    {
      key: 'new.summary.title',
      vi: 'Thông tin booking',
      en: 'Booking summary',
    },
    {
      key: 'new.summary.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      key: 'new.summary.date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      key: 'new.summary.startTime',
      vi: 'Bắt đầu',
      en: 'Start time',
    },
    {
      key: 'new.summary.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      key: 'new.summary.servicePrice',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },
    {
      key: 'new.summary.availabilityNotice',
      vi: 'Hệ thống sẽ kiểm tra lại lịch khả dụng ngay trước khi tạo booking.',
      en: 'Availability will be checked again immediately before the booking is created.',
    },
    {
      key: 'new.submit',
      vi: 'Xác nhận đặt lịch',
      en: 'Confirm booking',
    },
    {
      key: 'new.afterSubmit',
      vi: 'Sau khi gửi, booking sẽ chờ kỹ thuật viên xác nhận.',
      en: 'After submission, the booking will wait for therapist confirmation.',
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
      vi: 'Lịch hẹn của tôi',
      en: 'My bookings',
    },
    {
      key: 'detail.bookingNumber',
      vi: 'Booking #{{id}}',
      en: 'Booking #{{id}}',
    },
    {
      key: 'detail.information.title',
      vi: 'Thông tin lịch hẹn',
      en: 'Booking information',
    },
    {
      key: 'detail.information.time',
      vi: 'Thời gian',
      en: 'Time',
    },
    {
      key: 'detail.information.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      key: 'detail.information.address',
      vi: 'Địa chỉ',
      en: 'Address',
    },
    {
      key: 'detail.information.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      key: 'detail.information.therapistUpdating',
      vi: 'Đang cập nhật',
      en: 'Updating',
    },
    {
      key: 'detail.information.note',
      vi: 'Ghi chú',
      en: 'Note',
    },

    // Rating section wrapper
    {
      key: 'detail.ratingSection.title',
      vi: 'Đánh giá dịch vụ',
      en: 'Service review',
    },
    {
      key: 'detail.ratingSection.description',
      vi: 'Chia sẻ trải nghiệm của bạn về kỹ thuật viên và dịch vụ vừa hoàn thành.',
      en: 'Share your experience with the therapist and the service you just completed.',
    },

    // Timeline
    {
      key: 'detail.timelineTitle',
      vi: 'Tiến trình booking',
      en: 'Booking progress',
    },

    // Cost
    {
      key: 'detail.cost.title',
      vi: 'Chi phí',
      en: 'Cost',
    },
    {
      key: 'detail.cost.service',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      key: 'detail.cost.tax',
      vi: 'Thuế',
      en: 'Tax',
    },
    {
      key: 'detail.cost.total',
      vi: 'Tổng tiền',
      en: 'Total',
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
