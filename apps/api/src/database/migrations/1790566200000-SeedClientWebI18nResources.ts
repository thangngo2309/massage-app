import { MigrationInterface, QueryRunner } from 'typeorm';

type Translation = {
  namespace: string;
  key: string;
  vi: string;
  en: string;
};

export class SeedClientWebI18nResources1790566200000 implements MigrationInterface {
  name = 'SeedClientWebI18nResources1790566200000';

  private readonly translations: Translation[] = [
    // ============================================================
    // COMMON
    // ============================================================

    {
      namespace: 'common',
      key: 'processing',
      vi: 'Đang xử lý...',
      en: 'Processing...',
    },
    {
      namespace: 'common',
      key: 'save',
      vi: 'Lưu',
      en: 'Save',
    },
    {
      namespace: 'common',
      key: 'cancel',
      vi: 'Hủy',
      en: 'Cancel',
    },
    {
      namespace: 'common',
      key: 'confirm',
      vi: 'Xác nhận',
      en: 'Confirm',
    },
    {
      namespace: 'common',
      key: 'delete',
      vi: 'Xóa',
      en: 'Delete',
    },
    {
      namespace: 'common',
      key: 'edit',
      vi: 'Chỉnh sửa',
      en: 'Edit',
    },
    {
      namespace: 'common',
      key: 'close',
      vi: 'Đóng',
      en: 'Close',
    },
    {
      namespace: 'common',
      key: 'back',
      vi: 'Quay lại',
      en: 'Back',
    },
    {
      namespace: 'common',
      key: 'search',
      vi: 'Tìm kiếm',
      en: 'Search',
    },
    {
      namespace: 'common',
      key: 'loading',
      vi: 'Đang tải...',
      en: 'Loading...',
    },
    {
      namespace: 'common',
      key: 'retry',
      vi: 'Thử lại',
      en: 'Retry',
    },
    {
      namespace: 'common',
      key: 'previous',
      vi: 'Trước',
      en: 'Previous',
    },
    {
      namespace: 'common',
      key: 'next',
      vi: 'Tiếp theo',
      en: 'Next',
    },
    {
      namespace: 'common',
      key: 'yes',
      vi: 'Có',
      en: 'Yes',
    },
    {
      namespace: 'common',
      key: 'no',
      vi: 'Không',
      en: 'No',
    },
    {
      namespace: 'common',
      key: 'minutes',
      vi: 'phút',
      en: 'minutes',
    },
    {
      namespace: 'common',
      key: 'yearsExperience',
      vi: '{{count}} năm kinh nghiệm',
      en: '{{count}} years of experience',
    },
    {
      namespace: 'common',
      key: 'reviews',
      vi: '{{count}} đánh giá',
      en: '{{count}} reviews',
    },
    {
      namespace: 'common',
      key: 'completedSessions',
      vi: '{{count}} buổi hoàn thành',
      en: '{{count}} completed sessions',
    },

    // ============================================================
    // COMMON - LANGUAGE / MENU / ACCOUNT
    // ============================================================

    {
      namespace: 'common',
      key: 'language.change',
      vi: 'Thay đổi ngôn ngữ',
      en: 'Change language',
    },
    {
      namespace: 'common',
      key: 'menu.open',
      vi: 'Mở menu',
      en: 'Open menu',
    },
    {
      namespace: 'common',
      key: 'menu.close',
      vi: 'Đóng menu',
      en: 'Close menu',
    },
    {
      namespace: 'common',
      key: 'notification.label',
      vi: 'Thông báo',
      en: 'Notifications',
    },
    {
      namespace: 'common',
      key: 'notification.comingSoon',
      vi: 'Thông báo sẽ được bổ sung sau',
      en: 'Notifications will be available soon',
    },
    {
      namespace: 'common',
      key: 'account.customer',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      namespace: 'common',
      key: 'account.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      namespace: 'common',
      key: 'account.yourAccount',
      vi: 'Tài khoản của bạn',
      en: 'Your account',
    },
    {
      namespace: 'common',
      key: 'account.active',
      vi: 'Đang hoạt động',
      en: 'Active',
    },
    {
      namespace: 'common',
      key: 'logout.action',
      vi: 'Đăng xuất',
      en: 'Log out',
    },
    {
      namespace: 'common',
      key: 'logout.processing',
      vi: 'Đang đăng xuất...',
      en: 'Logging out...',
    },

    // ============================================================
    // NAVIGATION
    // ============================================================

    {
      namespace: 'navigation',
      key: 'client.home',
      vi: 'Trang chủ',
      en: 'Home',
    },
    {
      namespace: 'navigation',
      key: 'client.services',
      vi: 'Dịch vụ',
      en: 'Services',
    },
    {
      namespace: 'navigation',
      key: 'client.therapists',
      vi: 'Kỹ thuật viên',
      en: 'Therapists',
    },
    {
      namespace: 'navigation',
      key: 'client.bookings',
      vi: 'Lịch hẹn',
      en: 'Bookings',
    },
    {
      namespace: 'navigation',
      key: 'client.account',
      vi: 'Tài khoản',
      en: 'Account',
    },
    {
      namespace: 'navigation',
      key: 'client.search',
      vi: 'Tìm kiếm',
      en: 'Search',
    },
    {
      namespace: 'navigation',
      key: 'client.profile',
      vi: 'Hồ sơ',
      en: 'Profile',
    },

    // ============================================================
    // HOME
    // ============================================================

    {
      namespace: 'home',
      key: 'hero.eyebrow',
      vi: 'Massage tại nhà',
      en: 'In-home massage',
    },
    {
      namespace: 'home',
      key: 'hero.title',
      vi: 'Thư giãn và chăm sóc sức khỏe ngay tại nhà',
      en: 'Relax and take care of your well-being at home',
    },
    {
      namespace: 'home',
      key: 'hero.description',
      vi: 'Tìm kỹ thuật viên massage phù hợp và đặt lịch nhanh chóng theo thời gian, địa điểm bạn mong muốn.',
      en: 'Find the right massage therapist and book quickly at your preferred time and location.',
    },
    {
      namespace: 'home',
      key: 'hero.exploreServices',
      vi: 'Khám phá dịch vụ',
      en: 'Explore services',
    },
    {
      namespace: 'home',
      key: 'hero.viewBookings',
      vi: 'Xem lịch hẹn',
      en: 'View bookings',
    },
    {
      namespace: 'home',
      key: 'services.eyebrow',
      vi: 'Dịch vụ',
      en: 'Services',
    },
    {
      namespace: 'home',
      key: 'services.title',
      vi: 'Dịch vụ nổi bật',
      en: 'Featured services',
    },
    {
      namespace: 'home',
      key: 'services.description',
      vi: 'Lựa chọn dịch vụ phù hợp với nhu cầu thư giãn và chăm sóc sức khỏe của bạn.',
      en: 'Choose a service that fits your relaxation and wellness needs.',
    },
    {
      namespace: 'home',
      key: 'services.viewAll',
      vi: 'Xem tất cả dịch vụ',
      en: 'View all services',
    },
    {
      namespace: 'home',
      key: 'therapists.eyebrow',
      vi: 'Kỹ thuật viên',
      en: 'Therapists',
    },
    {
      namespace: 'home',
      key: 'therapists.title',
      vi: 'Kỹ thuật viên nổi bật',
      en: 'Featured therapists',
    },
    {
      namespace: 'home',
      key: 'therapists.description',
      vi: 'Tìm kỹ thuật viên phù hợp với dịch vụ và thời gian của bạn.',
      en: 'Find a therapist who matches your service and schedule.',
    },
    {
      namespace: 'home',
      key: 'therapists.find',
      vi: 'Tìm kỹ thuật viên',
      en: 'Find therapists',
    },
    {
      namespace: 'home',
      key: 'upcoming.title',
      vi: 'Lịch hẹn sắp tới',
      en: 'Upcoming booking',
    },
    {
      namespace: 'home',
      key: 'upcoming.viewDetail',
      vi: 'Xem chi tiết',
      en: 'View details',
    },
    {
      namespace: 'home',
      key: 'upcoming.empty',
      vi: 'Bạn chưa có lịch hẹn sắp tới.',
      en: 'You have no upcoming bookings.',
    },
    {
      namespace: 'home',
      key: 'safety.title',
      vi: 'An tâm khi đặt lịch',
      en: 'Book with confidence',
    },
    {
      namespace: 'home',
      key: 'safety.description',
      vi: 'Thông tin kỹ thuật viên được xác minh trước khi cung cấp dịch vụ trên hệ thống.',
      en: 'Therapist information is verified before services are offered on the platform.',
    },

    // ============================================================
    // SERVICES
    // ============================================================

    {
      namespace: 'services',
      key: 'hero.eyebrow',
      vi: 'Dịch vụ massage',
      en: 'Massage services',
    },
    {
      namespace: 'services',
      key: 'hero.title',
      vi: 'Chọn dịch vụ phù hợp với bạn',
      en: 'Choose the right service for you',
    },
    {
      namespace: 'services',
      key: 'hero.description',
      vi: 'Khám phá các dịch vụ massage và lựa chọn liệu trình phù hợp với nhu cầu của bạn.',
      en: 'Explore massage services and choose the treatment that best fits your needs.',
    },
    {
      namespace: 'services',
      key: 'search.placeholder',
      vi: 'Tìm kiếm dịch vụ...',
      en: 'Search services...',
    },
    {
      namespace: 'services',
      key: 'verification.title',
      vi: 'Kỹ thuật viên được xác minh',
      en: 'Verified therapists',
    },
    {
      namespace: 'services',
      key: 'verification.description',
      vi: 'Các kỹ thuật viên trên hệ thống được xác minh thông tin trước khi nhận lịch.',
      en: 'Therapists on the platform are verified before accepting bookings.',
    },
    {
      namespace: 'services',
      key: 'list.title',
      vi: 'Tất cả dịch vụ',
      en: 'All services',
    },
    {
      namespace: 'services',
      key: 'list.count',
      vi: '{{count}} dịch vụ',
      en: '{{count}} services',
    },
    {
      namespace: 'services',
      key: 'empty',
      vi: 'Không tìm thấy dịch vụ phù hợp.',
      en: 'No matching services found.',
    },
    {
      namespace: 'services',
      key: 'error',
      vi: 'Không thể tải danh sách dịch vụ.',
      en: 'Unable to load services.',
    },

    // ============================================================
    // SERVICE DETAIL
    // ============================================================

    {
      namespace: 'services',
      key: 'detail.invalid',
      vi: 'Dịch vụ không hợp lệ.',
      en: 'Invalid service.',
    },
    {
      namespace: 'services',
      key: 'detail.notFound',
      vi: 'Không tìm thấy dịch vụ.',
      en: 'Service not found.',
    },
    {
      namespace: 'services',
      key: 'detail.back',
      vi: 'Quay lại danh sách dịch vụ',
      en: 'Back to services',
    },
    {
      namespace: 'services',
      key: 'detail.defaultDescription',
      vi: 'Lựa chọn dịch vụ phù hợp và tìm kỹ thuật viên cho lịch hẹn của bạn.',
      en: 'Choose the right service and find a therapist for your booking.',
    },
    {
      namespace: 'services',
      key: 'detail.verifiedTherapists',
      vi: 'Kỹ thuật viên được xác minh',
      en: 'Verified therapists',
    },
    {
      namespace: 'services',
      key: 'detail.flexibleBooking',
      vi: 'Đặt lịch linh hoạt',
      en: 'Flexible booking',
    },
    {
      namespace: 'services',
      key: 'detail.chooseOption',
      vi: 'Chọn liệu trình',
      en: 'Choose a treatment',
    },
    {
      namespace: 'services',
      key: 'detail.noOptions',
      vi: 'Dịch vụ hiện chưa có liệu trình khả dụng.',
      en: 'There are currently no available treatments for this service.',
    },
    {
      namespace: 'services',
      key: 'detail.selectedOption',
      vi: 'Liệu trình đã chọn',
      en: 'Selected treatment',
    },
    {
      namespace: 'services',
      key: 'detail.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      namespace: 'services',
      key: 'detail.defaultPrice',
      vi: 'Giá mặc định',
      en: 'Default price',
    },
    {
      namespace: 'services',
      key: 'detail.findTherapist',
      vi: 'Tìm kỹ thuật viên',
      en: 'Find a therapist',
    },

    // ============================================================
    // THERAPISTS
    // ============================================================

    {
      namespace: 'therapists',
      key: 'title',
      vi: 'Tìm kỹ thuật viên',
      en: 'Find a therapist',
    },
    {
      namespace: 'therapists',
      key: 'description',
      vi: 'Tìm kỹ thuật viên phù hợp theo dịch vụ, thời gian và vị trí của bạn.',
      en: 'Find the right therapist based on your service, time and location.',
    },
    {
      namespace: 'therapists',
      key: 'service',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      namespace: 'therapists',
      key: 'date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      namespace: 'therapists',
      key: 'time',
      vi: 'Thời gian',
      en: 'Time',
    },
    {
      namespace: 'therapists',
      key: 'location',
      vi: 'Vị trí',
      en: 'Location',
    },
    {
      namespace: 'therapists',
      key: 'location.placeholder',
      vi: 'Nhập địa chỉ phục vụ',
      en: 'Enter service address',
    },
    {
      namespace: 'therapists',
      key: 'location.current',
      vi: 'Sử dụng vị trí hiện tại',
      en: 'Use current location',
    },
    {
      namespace: 'therapists',
      key: 'location.success',
      vi: 'Đã lấy vị trí hiện tại.',
      en: 'Current location retrieved.',
    },
    {
      namespace: 'therapists',
      key: 'location.unsupported',
      vi: 'Trình duyệt không hỗ trợ định vị.',
      en: 'Your browser does not support geolocation.',
    },
    {
      namespace: 'therapists',
      key: 'location.permissionDenied',
      vi: 'Bạn chưa cho phép truy cập vị trí.',
      en: 'Location permission was denied.',
    },
    {
      namespace: 'therapists',
      key: 'location.unavailable',
      vi: 'Không thể xác định vị trí hiện tại.',
      en: 'Your current location is unavailable.',
    },
    {
      namespace: 'therapists',
      key: 'location.timeout',
      vi: 'Quá thời gian lấy vị trí. Vui lòng thử lại.',
      en: 'Location request timed out. Please try again.',
    },
    {
      namespace: 'therapists',
      key: 'location.error',
      vi: 'Không thể lấy vị trí hiện tại.',
      en: 'Unable to retrieve your current location.',
    },
    {
      namespace: 'therapists',
      key: 'sort.label',
      vi: 'Sắp xếp',
      en: 'Sort by',
    },
    {
      namespace: 'therapists',
      key: 'sort.rating',
      vi: 'Đánh giá tốt nhất',
      en: 'Highest rated',
    },
    {
      namespace: 'therapists',
      key: 'sort.price',
      vi: 'Giá thấp nhất',
      en: 'Lowest price',
    },
    {
      namespace: 'therapists',
      key: 'sort.distance',
      vi: 'Gần nhất',
      en: 'Nearest',
    },
    {
      namespace: 'therapists',
      key: 'search',
      vi: 'Tìm kỹ thuật viên',
      en: 'Search therapists',
    },
    {
      namespace: 'therapists',
      key: 'searching',
      vi: 'Đang tìm kỹ thuật viên...',
      en: 'Searching for therapists...',
    },
    {
      namespace: 'therapists',
      key: 'initial',
      vi: 'Chọn dịch vụ, thời gian và vị trí để tìm kỹ thuật viên phù hợp.',
      en: 'Choose a service, time and location to find matching therapists.',
    },
    {
      namespace: 'therapists',
      key: 'results',
      vi: 'Tìm thấy {{count}} kỹ thuật viên',
      en: '{{count}} therapists found',
    },
    {
      namespace: 'therapists',
      key: 'empty',
      vi: 'Không tìm thấy kỹ thuật viên phù hợp.',
      en: 'No matching therapists found.',
    },
    {
      namespace: 'therapists',
      key: 'error',
      vi: 'Không thể tìm kiếm kỹ thuật viên.',
      en: 'Unable to search for therapists.',
    },
    {
      namespace: 'therapists',
      key: 'validation.serviceRequired',
      vi: 'Vui lòng chọn dịch vụ.',
      en: 'Please select a service.',
    },
    {
      namespace: 'therapists',
      key: 'validation.dateRequired',
      vi: 'Vui lòng chọn ngày.',
      en: 'Please select a date.',
    },
    {
      namespace: 'therapists',
      key: 'validation.timeRequired',
      vi: 'Vui lòng chọn thời gian.',
      en: 'Please select a time.',
    },
    {
      namespace: 'therapists',
      key: 'validation.locationRequired',
      vi: 'Vui lòng xác định vị trí phục vụ.',
      en: 'Please specify the service location.',
    },

    // ============================================================
    // THERAPIST DETAIL
    // ============================================================

    {
      namespace: 'therapists',
      key: 'detail.invalid',
      vi: 'Kỹ thuật viên không hợp lệ.',
      en: 'Invalid therapist.',
    },
    {
      namespace: 'therapists',
      key: 'detail.notFound',
      vi: 'Không tìm thấy kỹ thuật viên.',
      en: 'Therapist not found.',
    },
    {
      namespace: 'therapists',
      key: 'detail.back',
      vi: 'Quay lại danh sách kỹ thuật viên',
      en: 'Back to therapists',
    },
    {
      namespace: 'therapists',
      key: 'detail.badge',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      namespace: 'therapists',
      key: 'detail.services',
      vi: 'Dịch vụ',
      en: 'Services',
    },
    {
      namespace: 'therapists',
      key: 'detail.selectedService',
      vi: 'Dịch vụ đã chọn',
      en: 'Selected service',
    },
    {
      namespace: 'therapists',
      key: 'detail.availability',
      vi: 'Lịch khả dụng',
      en: 'Availability',
    },
    {
      namespace: 'therapists',
      key: 'detail.availabilityLoading',
      vi: 'Đang tải lịch khả dụng...',
      en: 'Loading availability...',
    },
    {
      namespace: 'therapists',
      key: 'detail.availabilityEmpty',
      vi: 'Không có khung giờ phù hợp trong ngày này.',
      en: 'No available time slots for this date.',
    },
    {
      namespace: 'therapists',
      key: 'detail.availabilityError',
      vi: 'Không thể tải lịch khả dụng.',
      en: 'Unable to load availability.',
    },
    {
      namespace: 'therapists',
      key: 'detail.bookingSummary',
      vi: 'Thông tin đặt lịch',
      en: 'Booking summary',
    },
    {
      namespace: 'therapists',
      key: 'detail.selectTime',
      vi: 'Chọn thời gian',
      en: 'Select time',
    },
    {
      namespace: 'therapists',
      key: 'detail.continueBooking',
      vi: 'Tiếp tục đặt lịch',
      en: 'Continue booking',
    },

    // ============================================================
    // BOOKING
    // ============================================================

    {
      namespace: 'booking',
      key: 'title',
      vi: 'Lịch hẹn của tôi',
      en: 'My bookings',
    },
    {
      namespace: 'booking',
      key: 'subtitle',
      vi: 'Theo dõi và quản lý các lịch massage của bạn.',
      en: 'Track and manage your massage bookings.',
    },
    {
      namespace: 'booking',
      key: 'create',
      vi: 'Đặt lịch',
      en: 'Book now',
    },
    {
      namespace: 'booking',
      key: 'detail',
      vi: 'Chi tiết lịch đặt',
      en: 'Booking details',
    },

    // ============================================================
    // BOOKING STATUS
    // ============================================================

    {
      namespace: 'booking',
      key: 'status.waiting_therapist_accept',
      vi: 'Chờ kỹ thuật viên xác nhận',
      en: 'Waiting for therapist confirmation',
    },
    {
      namespace: 'booking',
      key: 'status.accepted',
      vi: 'Kỹ thuật viên đã xác nhận',
      en: 'Therapist accepted',
    },
    {
      namespace: 'booking',
      key: 'status.arrived',
      vi: 'Kỹ thuật viên đã đến',
      en: 'Therapist arrived',
    },
    {
      namespace: 'booking',
      key: 'status.in_progress',
      vi: 'Đang thực hiện',
      en: 'In progress',
    },
    {
      namespace: 'booking',
      key: 'status.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },
    {
      namespace: 'booking',
      key: 'status.cancelled',
      vi: 'Đã hủy',
      en: 'Cancelled',
    },

    // ============================================================
    // BOOKING FILTER
    // ============================================================

    {
      namespace: 'booking',
      key: 'filter.all',
      vi: 'Tất cả',
      en: 'All',
    },
    {
      namespace: 'booking',
      key: 'filter.waiting',
      vi: 'Chờ xác nhận',
      en: 'Waiting for confirmation',
    },
    {
      namespace: 'booking',
      key: 'filter.accepted',
      vi: 'Đã xác nhận',
      en: 'Confirmed',
    },
    {
      namespace: 'booking',
      key: 'filter.inProgress',
      vi: 'Đang thực hiện',
      en: 'In progress',
    },
    {
      namespace: 'booking',
      key: 'filter.completed',
      vi: 'Hoàn thành',
      en: 'Completed',
    },
    {
      namespace: 'booking',
      key: 'empty',
      vi: 'Bạn chưa có lịch hẹn phù hợp.',
      en: 'You have no matching bookings.',
    },
    {
      namespace: 'booking',
      key: 'error',
      vi: 'Không thể tải danh sách lịch hẹn.',
      en: 'Unable to load bookings.',
    },

    // ============================================================
    // BOOKING DETAIL
    // ============================================================

    {
      namespace: 'booking',
      key: 'detailPage.title',
      vi: 'Lịch hẹn của tôi',
      en: 'My booking',
    },
    {
      namespace: 'booking',
      key: 'detailPage.bookingNumber',
      vi: 'Lịch hẹn #{{id}}',
      en: 'Booking #{{id}}',
    },
    {
      namespace: 'booking',
      key: 'detailPage.notFound',
      vi: 'Không tìm thấy lịch hẹn.',
      en: 'Booking not found.',
    },
    {
      namespace: 'booking',
      key: 'detailPage.error',
      vi: 'Không thể tải thông tin lịch hẹn.',
      en: 'Unable to load booking details.',
    },
    {
      namespace: 'booking',
      key: 'detailPage.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      namespace: 'booking',
      key: 'detailPage.service',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      namespace: 'booking',
      key: 'detailPage.date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      namespace: 'booking',
      key: 'detailPage.time',
      vi: 'Thời gian',
      en: 'Time',
    },
    {
      namespace: 'booking',
      key: 'detailPage.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      namespace: 'booking',
      key: 'detailPage.address',
      vi: 'Địa chỉ',
      en: 'Address',
    },
    {
      namespace: 'booking',
      key: 'detailPage.note',
      vi: 'Ghi chú',
      en: 'Note',
    },
    {
      namespace: 'booking',
      key: 'detailPage.updating',
      vi: 'Đang cập nhật',
      en: 'Updating',
    },
    {
      namespace: 'booking',
      key: 'detailPage.timeline',
      vi: 'Tiến trình lịch hẹn',
      en: 'Booking timeline',
    },
    {
      namespace: 'booking',
      key: 'detailPage.rating',
      vi: 'Đánh giá dịch vụ',
      en: 'Rate your experience',
    },
    {
      namespace: 'booking',
      key: 'detailPage.servicePrice',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },
    {
      namespace: 'booking',
      key: 'detailPage.platformFee',
      vi: 'Phí nền tảng',
      en: 'Platform fee',
    },
    {
      namespace: 'booking',
      key: 'detailPage.tax',
      vi: 'Thuế',
      en: 'Tax',
    },
    {
      namespace: 'booking',
      key: 'detailPage.total',
      vi: 'Tổng cộng',
      en: 'Total',
    },

    // ============================================================
    // CREATE BOOKING
    // ============================================================

    {
      namespace: 'booking',
      key: 'new.title',
      vi: 'Xác nhận đặt lịch',
      en: 'Confirm booking',
    },
    {
      namespace: 'booking',
      key: 'new.description',
      vi: 'Kiểm tra thông tin dịch vụ và địa điểm trước khi xác nhận.',
      en: 'Review your service and location before confirming the booking.',
    },
    {
      namespace: 'booking',
      key: 'new.invalidParams',
      vi: 'Thông tin đặt lịch không hợp lệ.',
      en: 'Invalid booking information.',
    },
    {
      namespace: 'booking',
      key: 'new.serviceNotFound',
      vi: 'Không tìm thấy dịch vụ.',
      en: 'Service not found.',
    },
    {
      namespace: 'booking',
      key: 'new.optionNotFound',
      vi: 'Không tìm thấy liệu trình.',
      en: 'Treatment option not found.',
    },
    {
      namespace: 'booking',
      key: 'new.therapistUnavailable',
      vi: 'Kỹ thuật viên không còn khả dụng.',
      en: 'The therapist is no longer available.',
    },
    {
      namespace: 'booking',
      key: 'new.locationRequired',
      vi: 'Vui lòng xác định vị trí phục vụ.',
      en: 'Please specify the service location.',
    },
    {
      namespace: 'booking',
      key: 'new.success',
      vi: 'Đặt lịch thành công.',
      en: 'Booking created successfully.',
    },

    // ============================================================
    // CREATE BOOKING - ADDRESS
    // ============================================================

    {
      namespace: 'booking',
      key: 'new.address.title',
      vi: 'Địa điểm phục vụ',
      en: 'Service location',
    },
    {
      namespace: 'booking',
      key: 'new.address.label',
      vi: 'Địa chỉ chi tiết',
      en: 'Detailed address',
    },
    {
      namespace: 'booking',
      key: 'new.address.placeholder',
      vi: 'Nhập số nhà, tên đường, phường/xã...',
      en: 'Enter house number, street, ward...',
    },
    {
      namespace: 'booking',
      key: 'new.address.required',
      vi: 'Vui lòng nhập địa chỉ.',
      en: 'Please enter the address.',
    },
    {
      namespace: 'booking',
      key: 'new.address.minLength',
      vi: 'Địa chỉ phải có ít nhất {{count}} ký tự.',
      en: 'Address must contain at least {{count}} characters.',
    },
    {
      namespace: 'booking',
      key: 'new.address.maxLength',
      vi: 'Địa chỉ không được vượt quá {{count}} ký tự.',
      en: 'Address must not exceed {{count}} characters.',
    },

    // ============================================================
    // CREATE BOOKING - LOCATION
    // ============================================================

    {
      namespace: 'booking',
      key: 'new.location.current',
      vi: 'Sử dụng vị trí hiện tại',
      en: 'Use current location',
    },
    {
      namespace: 'booking',
      key: 'new.location.success',
      vi: 'Đã lấy vị trí phục vụ.',
      en: 'Service location retrieved.',
    },
    {
      namespace: 'booking',
      key: 'new.location.unsupported',
      vi: 'Trình duyệt không hỗ trợ định vị.',
      en: 'Your browser does not support geolocation.',
    },
    {
      namespace: 'booking',
      key: 'new.location.permissionDenied',
      vi: 'Bạn chưa cho phép truy cập vị trí.',
      en: 'Location permission was denied.',
    },
    {
      namespace: 'booking',
      key: 'new.location.unavailable',
      vi: 'Không thể xác định vị trí hiện tại.',
      en: 'Your current location is unavailable.',
    },
    {
      namespace: 'booking',
      key: 'new.location.timeout',
      vi: 'Quá thời gian lấy vị trí. Vui lòng thử lại.',
      en: 'Location request timed out. Please try again.',
    },
    {
      namespace: 'booking',
      key: 'new.location.error',
      vi: 'Không thể lấy vị trí hiện tại.',
      en: 'Unable to retrieve your current location.',
    },

    // ============================================================
    // CREATE BOOKING - NOTE / SUMMARY
    // ============================================================

    {
      namespace: 'booking',
      key: 'new.note.label',
      vi: 'Ghi chú cho kỹ thuật viên',
      en: 'Note for therapist',
    },
    {
      namespace: 'booking',
      key: 'new.note.placeholder',
      vi: 'Nhập ghi chú nếu có...',
      en: 'Enter a note if needed...',
    },
    {
      namespace: 'booking',
      key: 'new.summary.title',
      vi: 'Thông tin đặt lịch',
      en: 'Booking summary',
    },
    {
      namespace: 'booking',
      key: 'new.summary.therapist',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      namespace: 'booking',
      key: 'new.summary.service',
      vi: 'Dịch vụ',
      en: 'Service',
    },
    {
      namespace: 'booking',
      key: 'new.summary.date',
      vi: 'Ngày',
      en: 'Date',
    },
    {
      namespace: 'booking',
      key: 'new.summary.startTime',
      vi: 'Giờ bắt đầu',
      en: 'Start time',
    },
    {
      namespace: 'booking',
      key: 'new.summary.duration',
      vi: 'Thời lượng',
      en: 'Duration',
    },
    {
      namespace: 'booking',
      key: 'new.summary.price',
      vi: 'Giá dịch vụ',
      en: 'Service price',
    },
    {
      namespace: 'booking',
      key: 'new.submit',
      vi: 'Xác nhận đặt lịch',
      en: 'Confirm booking',
    },
    {
      namespace: 'booking',
      key: 'new.submitting',
      vi: 'Đang đặt lịch...',
      en: 'Booking...',
    },

    // ============================================================
    // PROFILE
    // ============================================================

    {
      namespace: 'profile',
      key: 'title',
      vi: 'Tài khoản của tôi',
      en: 'My account',
    },
    {
      namespace: 'profile',
      key: 'subtitle',
      vi: 'Quản lý thông tin tài khoản và các hoạt động của bạn.',
      en: 'Manage your account information and activity.',
    },
    {
      namespace: 'profile',
      key: 'status.active',
      vi: 'Hoạt động',
      en: 'Active',
    },
    {
      namespace: 'profile',
      key: 'actions.bookings',
      vi: 'Lịch đặt của tôi',
      en: 'My bookings',
    },
    {
      namespace: 'profile',
      key: 'actions.newBooking',
      vi: 'Đặt dịch vụ mới',
      en: 'Book a new service',
    },
    {
      namespace: 'profile',
      key: 'actions.logout',
      vi: 'Đăng xuất',
      en: 'Log out',
    },

    // ============================================================
    // AUTH
    // ============================================================

    {
      namespace: 'auth',
      key: 'login.title',
      vi: 'Đăng nhập',
      en: 'Sign in',
    },
    {
      namespace: 'auth',
      key: 'login.subtitle',
      vi: 'Đăng nhập để quản lý lịch hẹn và tài khoản.',
      en: 'Sign in to manage your bookings and account.',
    },
    {
      namespace: 'auth',
      key: 'login.accountLabel',
      vi: 'Số điện thoại hoặc email',
      en: 'Phone number or email',
    },
    {
      namespace: 'auth',
      key: 'login.accountPlaceholder',
      vi: 'Số điện thoại hoặc email',
      en: 'Phone number or email',
    },
    {
      namespace: 'auth',
      key: 'login.passwordLabel',
      vi: 'Mật khẩu',
      en: 'Password',
    },
    {
      namespace: 'auth',
      key: 'login.passwordPlaceholder',
      vi: 'Nhập mật khẩu',
      en: 'Enter your password',
    },
    {
      namespace: 'auth',
      key: 'login.submit',
      vi: 'Đăng nhập',
      en: 'Sign in',
    },
    {
      namespace: 'auth',
      key: 'login.noAccount',
      vi: 'Chưa có tài khoản?',
      en: "Don't have an account?",
    },
    {
      namespace: 'auth',
      key: 'login.registerNow',
      vi: 'Đăng ký ngay',
      en: 'Create account',
    },
    {
      namespace: 'auth',
      key: 'login.success',
      vi: 'Đăng nhập thành công.',
      en: 'Signed in successfully.',
    },
    {
      namespace: 'auth',
      key: 'login.adminNotAllowed',
      vi: 'Tài khoản quản trị không sử dụng Web Portal.',
      en: 'Administrator accounts cannot use the Web Portal.',
    },
    {
      namespace: 'auth',
      key: 'login.marketing.eyebrow',
      vi: 'Massage Home Care',
      en: 'Massage Home Care',
    },
    {
      namespace: 'auth',
      key: 'login.marketing.title',
      vi: 'Thư giãn bắt đầu từ một lịch hẹn.',
      en: 'Relaxation starts with a booking.',
    },
    {
      namespace: 'auth',
      key: 'login.marketing.description',
      vi: 'Kết nối khách hàng với kỹ thuật viên massage phù hợp, nhanh chóng và tiện lợi ngay tại nhà.',
      en: 'Connect with the right massage therapist quickly and conveniently, right at your home.',
    },

    // ============================================================
    // REGISTER
    // ============================================================

    {
      namespace: 'auth',
      key: 'register.title',
      vi: 'Tạo tài khoản',
      en: 'Create an account',
    },
    {
      namespace: 'auth',
      key: 'register.subtitle',
      vi: 'Chọn loại tài khoản phù hợp để bắt đầu.',
      en: 'Choose the account type that best suits you.',
    },
    {
      namespace: 'auth',
      key: 'register.role.client.title',
      vi: 'Khách hàng',
      en: 'Customer',
    },
    {
      namespace: 'auth',
      key: 'register.role.client.description',
      vi: 'Tìm và đặt lịch massage.',
      en: 'Find therapists and book massage services.',
    },
    {
      namespace: 'auth',
      key: 'register.role.therapist.title',
      vi: 'Kỹ thuật viên',
      en: 'Therapist',
    },
    {
      namespace: 'auth',
      key: 'register.role.therapist.description',
      vi: 'Nhận và quản lý booking.',
      en: 'Receive and manage bookings.',
    },
    {
      namespace: 'auth',
      key: 'register.fullNameLabel',
      vi: 'Họ và tên',
      en: 'Full name',
    },
    {
      namespace: 'auth',
      key: 'register.fullNamePlaceholder',
      vi: 'Nguyễn Văn A',
      en: 'John Doe',
    },
    {
      namespace: 'auth',
      key: 'register.phoneLabel',
      vi: 'Số điện thoại',
      en: 'Phone number',
    },
    {
      namespace: 'auth',
      key: 'register.phonePlaceholder',
      vi: '0901234567',
      en: '0901234567',
    },
    {
      namespace: 'auth',
      key: 'register.emailLabel',
      vi: 'Email (không bắt buộc)',
      en: 'Email (optional)',
    },
    {
      namespace: 'auth',
      key: 'register.emailPlaceholder',
      vi: 'example@gmail.com',
      en: 'example@gmail.com',
    },
    {
      namespace: 'auth',
      key: 'register.passwordLabel',
      vi: 'Mật khẩu',
      en: 'Password',
    },
    {
      namespace: 'auth',
      key: 'register.passwordPlaceholder',
      vi: 'Tối thiểu 8 ký tự',
      en: 'At least 8 characters',
    },
    {
      namespace: 'auth',
      key: 'register.confirmPasswordLabel',
      vi: 'Xác nhận mật khẩu',
      en: 'Confirm password',
    },
    {
      namespace: 'auth',
      key: 'register.confirmPasswordPlaceholder',
      vi: 'Nhập lại mật khẩu',
      en: 'Re-enter your password',
    },
    {
      namespace: 'auth',
      key: 'register.submit',
      vi: 'Đăng ký',
      en: 'Create account',
    },
    {
      namespace: 'auth',
      key: 'register.alreadyAccount',
      vi: 'Đã có tài khoản?',
      en: 'Already have an account?',
    },
    {
      namespace: 'auth',
      key: 'register.loginNow',
      vi: 'Đăng nhập',
      en: 'Sign in',
    },
    {
      namespace: 'auth',
      key: 'register.success',
      vi: 'Đăng ký thành công.',
      en: 'Account created successfully.',
    },

    // ============================================================
    // VALIDATION
    // ============================================================

    {
      namespace: 'validation',
      key: 'required',
      vi: 'Vui lòng nhập thông tin',
      en: 'This field is required',
    },
    {
      namespace: 'validation',
      key: 'invalidEmail',
      vi: 'Email không hợp lệ',
      en: 'Invalid email address',
    },
    {
      namespace: 'validation',
      key: 'invalidPhone',
      vi: 'Số điện thoại không hợp lệ',
      en: 'Invalid phone number',
    },
    {
      namespace: 'validation',
      key: 'passwordTooShort',
      vi: 'Mật khẩu quá ngắn',
      en: 'Password is too short',
    },
    {
      namespace: 'validation',
      key: 'login.required',
      vi: 'Vui lòng nhập tài khoản.',
      en: 'Please enter your account.',
    },
    {
      namespace: 'validation',
      key: 'login.minLength',
      vi: 'Tài khoản phải có ít nhất {{count}} ký tự.',
      en: 'Account must contain at least {{count}} characters.',
    },
    {
      namespace: 'validation',
      key: 'fullName.required',
      vi: 'Vui lòng nhập họ và tên.',
      en: 'Please enter your full name.',
    },
    {
      namespace: 'validation',
      key: 'fullName.minLength',
      vi: 'Họ và tên phải có ít nhất {{count}} ký tự.',
      en: 'Full name must contain at least {{count}} characters.',
    },
    {
      namespace: 'validation',
      key: 'phone.required',
      vi: 'Vui lòng nhập số điện thoại.',
      en: 'Please enter your phone number.',
    },
    {
      namespace: 'validation',
      key: 'phone.invalid',
      vi: 'Số điện thoại không hợp lệ.',
      en: 'Invalid phone number.',
    },
    {
      namespace: 'validation',
      key: 'email.invalid',
      vi: 'Email không hợp lệ.',
      en: 'Invalid email address.',
    },
    {
      namespace: 'validation',
      key: 'password.required',
      vi: 'Vui lòng nhập mật khẩu.',
      en: 'Please enter your password.',
    },
    {
      namespace: 'validation',
      key: 'password.minLength',
      vi: 'Mật khẩu phải có ít nhất {{count}} ký tự.',
      en: 'Password must contain at least {{count}} characters.',
    },
    {
      namespace: 'validation',
      key: 'confirmPassword.required',
      vi: 'Vui lòng xác nhận mật khẩu.',
      en: 'Please confirm your password.',
    },
    {
      namespace: 'validation',
      key: 'confirmPassword.mismatch',
      vi: 'Mật khẩu xác nhận không khớp.',
      en: 'Passwords do not match.',
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
            language.id,
            $1,
            $2,
            CASE
              WHEN language.code = 'vi' THEN $3
              WHEN language.code = 'en' THEN $4
            END
          FROM "i18n_languages" language
          WHERE language.code IN ('vi', 'en')
          ON CONFLICT (
            "language_id",
            "namespace",
            "key"
          )
          DO UPDATE SET
            "value" = EXCLUDED."value",
            "updated_at" = now()
        `,
        [item.namespace, item.key, item.vi, item.en],
      );
    }

    /**
     * Báo cho client biết resource DB đã thay đổi.
     *
     * Chỉ tăng 1 lần cho toàn bộ migration,
     * không tăng theo từng resource.
     */
    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    /**
     * Chỉ xóa đúng những resource thuộc migration này.
     *
     * Không xóa toàn bộ namespace vì có thể sau này
     * Admin đã thêm resource khác vào cùng namespace.
     */
    for (const item of this.translations) {
      await queryRunner.query(
        `
          DELETE FROM "i18n_resources"
          WHERE "language_id" IN (
            SELECT "id"
            FROM "i18n_languages"
            WHERE "code" IN ('vi', 'en')
          )
          AND "namespace" = $1
          AND "key" = $2
        `,
        [item.namespace, item.key],
      );
    }

    await queryRunner.query(`
      UPDATE "i18n_languages"
      SET
        "revision" = "revision" + 1,
        "updated_at" = now()
      WHERE "code" IN ('vi', 'en')
    `);
  }
}
