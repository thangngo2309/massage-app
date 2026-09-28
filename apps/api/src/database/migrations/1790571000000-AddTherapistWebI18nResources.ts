import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  key: string;
  vi: string;
  en: string;
};

export class AddTherapistWebI18nResources1790571000000 implements MigrationInterface {
  name = 'AddTherapistWebI18nResources1790571000000';

  private readonly namespace = 'therapists';

  private readonly translations: Translation[] = [
    // Search - validation/toast
    {
      key: 'location.unsupported',
      vi: 'Trình duyệt không hỗ trợ định vị.',
      en: 'Your browser does not support geolocation.',
    },
    {
      key: 'location.success',
      vi: 'Đã lấy vị trí hiện tại.',
      en: 'Current location retrieved.',
    },
    {
      key: 'location.permissionDenied',
      vi: 'Bạn chưa cho phép trình duyệt truy cập vị trí.',
      en: 'Location permission has not been granted.',
    },
    {
      key: 'location.error',
      vi: 'Không thể lấy vị trí hiện tại.',
      en: 'Unable to get your current location.',
    },
    {
      key: 'validation.invalidService',
      vi: 'Dịch vụ không hợp lệ.',
      en: 'Invalid service.',
    },
    {
      key: 'validation.dateRequired',
      vi: 'Vui lòng chọn ngày.',
      en: 'Please select a date.',
    },
    {
      key: 'validation.startTimeRequired',
      vi: 'Vui lòng chọn giờ bắt đầu.',
      en: 'Please select a start time.',
    },
    {
      key: 'validation.invalidDate',
      vi: 'Ngày tìm kiếm không hợp lệ.',
      en: 'Invalid search date.',
    },
    {
      key: 'validation.futureTime',
      vi: 'Vui lòng chọn thời gian sau thời điểm hiện tại.',
      en: 'Please select a time later than the current time.',
    },
    {
      key: 'validation.locationRequired',
      vi: 'Vui lòng dùng vị trí hiện tại hoặc chọn khu vực.',
      en: 'Please use your current location or select an area.',
    },

    // Search - missing service
    {
      key: 'search.serviceRequired.title',
      vi: 'Hãy chọn dịch vụ trước',
      en: 'Choose a service first',
    },
    {
      key: 'search.serviceRequired.description',
      vi: 'Bạn cần chọn dịch vụ và liệu trình trước khi tìm kỹ thuật viên.',
      en: 'Select a service and treatment option before finding a therapist.',
    },
    {
      key: 'search.serviceRequired.action',
      vi: 'Chọn dịch vụ',
      en: 'Choose service',
    },

    // Search hero
    {
      key: 'search.hero.title',
      vi: 'Tìm kỹ thuật viên',
      en: 'Find a therapist',
    },
    {
      key: 'search.hero.description',
      vi: 'Chọn thời gian và vị trí, hệ thống sẽ tìm những kỹ thuật viên phù hợp và đang khả dụng.',
      en: 'Choose a time and location to find suitable therapists who are available.',
    },

    // Search form
    {
      key: 'search.form.date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      key: 'search.form.startTime',
      vi: 'Giờ bắt đầu',
      en: 'Start time',
    },
    {
      key: 'search.form.sort',
      vi: 'Sắp xếp',
      en: 'Sort by',
    },
    {
      key: 'search.form.location',
      vi: 'Vị trí',
      en: 'Location',
    },
    {
      key: 'search.form.currentLocation',
      vi: 'Vị trí hiện tại',
      en: 'Current location',
    },
    {
      key: 'search.form.locationReady',
      vi: 'Đã lấy vị trí',
      en: 'Location retrieved',
    },
    {
      key: 'search.form.district',
      vi: 'Hoặc tìm theo quận/huyện',
      en: 'Or search by district',
    },
    {
      key: 'search.form.districtPlaceholder',
      vi: 'Nhập mã quận/huyện',
      en: 'Enter district code',
    },
    {
      key: 'search.form.areaValue',
      vi: 'Khu vực: {{district}}',
      en: 'Area: {{district}}',
    },
    {
      key: 'search.form.submit',
      vi: 'Tìm kiếm',
      en: 'Search',
    },

    // Sorting
    {
      key: 'search.sort.rating',
      vi: 'Đánh giá tốt nhất',
      en: 'Highest rated',
    },
    {
      key: 'search.sort.price',
      vi: 'Giá thấp nhất',
      en: 'Lowest price',
    },
    {
      key: 'search.sort.distance',
      vi: 'Gần nhất',
      en: 'Nearest',
    },

    // Initial state
    {
      key: 'search.initial.title',
      vi: 'Bắt đầu tìm kiếm',
      en: 'Start searching',
    },
    {
      key: 'search.initial.description',
      vi: 'Chọn ngày, giờ và vị trí để tìm kỹ thuật viên phù hợp.',
      en: 'Choose a date, time and location to find a suitable therapist.',
    },

    // Results
    {
      key: 'search.results.title',
      vi: 'Kỹ thuật viên phù hợp',
      en: 'Suitable therapists',
    },
    {
      key: 'search.results.count',
      vi: 'Tìm thấy {{count}} kỹ thuật viên',
      en: 'Found {{count}} therapists',
    },
    {
      key: 'search.results.error',
      vi: 'Không thể tìm kỹ thuật viên',
      en: 'Unable to find therapists',
    },
    {
      key: 'search.results.emptyTitle',
      vi: 'Chưa tìm thấy kỹ thuật viên',
      en: 'No therapists found',
    },
    {
      key: 'search.results.emptyDescription',
      vi: 'Không có kỹ thuật viên phù hợp tại thời gian và vị trí đã chọn. Hãy thử khung giờ khác.',
      en: 'No therapists are available for the selected time and location. Try another time.',
    },

    // Pagination
    {
      key: 'pagination.previous',
      vi: 'Trước',
      en: 'Previous',
    },
    {
      key: 'pagination.next',
      vi: 'Sau',
      en: 'Next',
    },
    {
      key: 'pagination.page',
      vi: 'Trang {{page}} / {{totalPages}}',
      en: 'Page {{page}} / {{totalPages}}',
    },

    // Detail invalid/error
    {
      key: 'detail.invalid.title',
      vi: 'Thông tin tìm kiếm không hợp lệ',
      en: 'Invalid search information',
    },
    {
      key: 'detail.invalid.description',
      vi: 'Dịch vụ, thời gian hoặc vị trí tìm kiếm đã bị thiếu. Vui lòng thực hiện lại tìm kiếm.',
      en: 'Service, time or location information is missing. Please search again.',
    },
    {
      key: 'detail.invalid.action',
      vi: 'Chọn lại dịch vụ',
      en: 'Choose service again',
    },
    {
      key: 'detail.notFound.title',
      vi: 'Không tìm thấy kỹ thuật viên',
      en: 'Therapist not found',
    },
    {
      key: 'detail.notFound.description',
      vi: 'Kỹ thuật viên không còn phù hợp với điều kiện tìm kiếm.',
      en: 'This therapist no longer matches your search criteria.',
    },
    {
      key: 'detail.back',
      vi: 'Quay lại kết quả',
      en: 'Back to results',
    },

    // Therapist information
    {
      key: 'detail.badge',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      key: 'detail.reviews',
      vi: '{{count}} đánh giá',
      en: '{{count}} reviews',
    },
    {
      key: 'detail.experience',
      vi: '{{count}} năm kinh nghiệm',
      en: '{{count}} years of experience',
    },
    {
      key: 'detail.completedBookings',
      vi: '{{count}} buổi hoàn thành',
      en: '{{count}} completed sessions',
    },

    // Selected service
    {
      key: 'detail.service.title',
      vi: 'Dịch vụ đã chọn',
      en: 'Selected service',
    },

    // Availability
    {
      key: 'detail.availability.title',
      vi: 'Lịch khả dụng',
      en: 'Availability',
    },
    {
      key: 'detail.availability.yourLocation',
      vi: 'Theo vị trí của bạn',
      en: 'Based on your location',
    },
    {
      key: 'detail.availability.error',
      vi: 'Không thể tải lịch khả dụng.',
      en: 'Unable to load availability.',
    },
    {
      key: 'detail.availability.retryDescription',
      vi: 'Vui lòng thử lại.',
      en: 'Please try again.',
    },

    // Booking summary
    {
      key: 'detail.booking.title',
      vi: 'Thông tin đặt lịch',
      en: 'Booking information',
    },
    {
      key: 'detail.booking.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      key: 'detail.booking.service',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      key: 'detail.booking.date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      key: 'detail.booking.startTime',
      vi: 'Giờ bắt đầu',
      en: 'Start time',
    },
    {
      key: 'detail.booking.notSelected',
      vi: 'Chưa chọn',
      en: 'Not selected',
    },
    {
      key: 'detail.booking.price',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },
    {
      key: 'detail.booking.continue',
      vi: 'Tiếp tục đặt lịch',
      en: 'Continue booking',
    },
    {
      key: 'detail.booking.notice',
      vi: 'Bạn sẽ nhập địa chỉ phục vụ và xác nhận booking ở bước tiếp theo.',
      en: 'You will enter the service address and confirm your booking in the next step.',
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
