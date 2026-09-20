import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: `Chính sách bảo mật | ${legalConfig.appName}`,
  description: `Chính sách bảo mật và bảo vệ dữ liệu cá nhân của ${legalConfig.appName}.`,
};

const PrivacyPolicyPage = () => {
  return (
    <LegalDocument
      title="Chính sách bảo mật và bảo vệ dữ liệu cá nhân"
      updatedAt={legalConfig.updatedAt}
      description={`${legalConfig.companyName} tôn trọng quyền riêng tư và thực hiện các biện pháp phù hợp nhằm bảo vệ dữ liệu cá nhân của Người dùng.`}
    >
      <LegalSection title="1. Phạm vi áp dụng">
        <p>Chính sách này áp dụng đối với:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Website của nền tảng.</li>
          <li>Ứng dụng dành cho Khách hàng.</li>
          <li>Ứng dụng hoặc giao diện dành cho Kỹ thuật viên.</li>
          <li>Hệ thống quản trị.</li>
          <li>
            Các dịch vụ trực tuyến khác liên quan đến {legalConfig.appName}.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Dữ liệu cá nhân được thu thập">
        <h3 className="font-semibold text-slate-900">
          2.1. Thông tin tài khoản
        </h3>

        <ul className="list-disc space-y-2 pl-6">
          <li>Họ và tên.</li>
          <li>Số điện thoại.</li>
          <li>Email.</li>
          <li>Thông tin xác thực tài khoản.</li>
          <li>Vai trò và trạng thái tài khoản.</li>
        </ul>

        <p>
          Mật khẩu được lưu dưới dạng đã được xử lý bảo mật và không được lưu
          dưới dạng văn bản thuần túy.
        </p>

        <h3 className="pt-2 font-semibold text-slate-900">
          2.2. Hồ sơ Kỹ thuật viên
        </h3>

        <ul className="list-disc space-y-2 pl-6">
          <li>Ảnh đại diện.</li>
          <li>Thông tin giới thiệu.</li>
          <li>Kinh nghiệm.</li>
          <li>Dịch vụ cung cấp.</li>
          <li>Giá dịch vụ.</li>
          <li>Khu vực hoạt động.</li>
          <li>Lịch làm việc.</li>
          <li>Thông tin và tài liệu phục vụ xác minh.</li>
        </ul>

        <h3 className="pt-2 font-semibold text-slate-900">
          2.3. Thông tin Booking
        </h3>

        <ul className="list-disc space-y-2 pl-6">
          <li>Dịch vụ được lựa chọn.</li>
          <li>Thời gian và thời lượng.</li>
          <li>Kỹ thuật viên.</li>
          <li>Địa chỉ thực hiện dịch vụ.</li>
          <li>Tọa độ vị trí khi cần thiết.</li>
          <li>Ghi chú của Khách hàng.</li>
          <li>Giá dịch vụ.</li>
          <li>Trạng thái Booking.</li>
          <li>Các mốc thời gian thực hiện Booking.</li>
        </ul>

        <h3 className="pt-2 font-semibold text-slate-900">
          2.4. Dữ liệu kỹ thuật
        </h3>

        <ul className="list-disc space-y-2 pl-6">
          <li>Địa chỉ IP.</li>
          <li>Loại thiết bị.</li>
          <li>Hệ điều hành.</li>
          <li>Phiên bản ứng dụng.</li>
          <li>Thời điểm truy cập.</li>
          <li>Nhật ký hoạt động.</li>
          <li>Thông tin lỗi ứng dụng.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Dữ liệu vị trí">
        <p>
          Khi Người dùng cấp quyền, nền tảng có thể sử dụng dữ liệu vị trí để
          xác định khu vực, tìm Kỹ thuật viên phù hợp, kiểm tra phạm vi phục vụ,
          tính khoảng cách hoặc hỗ trợ việc thực hiện Booking.
        </p>

        <p>
          Người dùng có thể thu hồi quyền truy cập vị trí thông qua cài đặt của
          thiết bị. Một số chức năng có thể không hoạt động đầy đủ khi quyền vị
          trí bị tắt.
        </p>
      </LegalSection>

      <LegalSection title="4. Mục đích xử lý dữ liệu">
        <ul className="list-disc space-y-2 pl-6">
          <li>Tạo và quản lý tài khoản.</li>
          <li>Xác thực Người dùng.</li>
          <li>Kết nối Khách hàng với Kỹ thuật viên.</li>
          <li>Tạo và xử lý Booking.</li>
          <li>Tìm kiếm Kỹ thuật viên phù hợp.</li>
          <li>Quản lý lịch làm việc và lịch khả dụng.</li>
          <li>Hỗ trợ thực hiện dịch vụ.</li>
          <li>Giải quyết khiếu nại và tranh chấp.</li>
          <li>Phòng chống gian lận.</li>
          <li>Đảm bảo an toàn hệ thống.</li>
          <li>Phân tích và cải thiện chất lượng dịch vụ.</li>
          <li>Thực hiện nghĩa vụ pháp lý.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Chia sẻ dữ liệu">
        <p>
          {legalConfig.companyName} không bán dữ liệu cá nhân của Người dùng.
        </p>

        <p>Dữ liệu có thể được chia sẻ trong phạm vi cần thiết với:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Khách hàng hoặc Kỹ thuật viên tham gia cùng một Booking.</li>
          <li>Đơn vị cung cấp máy chủ và hạ tầng kỹ thuật.</li>
          <li>Đơn vị cung cấp bản đồ và định vị.</li>
          <li>Đơn vị cung cấp email, SMS hoặc thông báo.</li>
          <li>
            Đơn vị thanh toán khi chức năng thanh toán trực tuyến được triển
            khai.
          </li>
          <li>Cơ quan nhà nước có thẩm quyền theo quy định pháp luật.</li>
        </ul>
      </LegalSection>

      <LegalSection title="6. Thời gian lưu trữ">
        <p>
          Dữ liệu được lưu trữ trong thời gian cần thiết để duy trì tài khoản,
          thực hiện Booking, giải quyết khiếu nại, phòng chống gian lận, bảo vệ
          hệ thống và thực hiện các nghĩa vụ theo quy định pháp luật.
        </p>

        <p>
          Khi mục đích xử lý không còn, dữ liệu có thể được xóa, hủy hoặc ẩn
          danh theo quy trình phù hợp.
        </p>
      </LegalSection>

      <LegalSection title="7. Biện pháp bảo mật">
        <p>Nền tảng có thể áp dụng các biện pháp:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Mã hóa kết nối.</li>
          <li>Băm hoặc mã hóa thông tin xác thực.</li>
          <li>Phân quyền truy cập.</li>
          <li>Quản lý phiên đăng nhập.</li>
          <li>Ghi nhật ký hệ thống.</li>
          <li>Sao lưu dữ liệu.</li>
          <li>Giới hạn quyền truy cập nội bộ.</li>
          <li>Giám sát và xử lý sự cố bảo mật.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Quyền của Người dùng">
        <p>Trong phạm vi pháp luật áp dụng, Người dùng có thể có các quyền:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Được biết về hoạt động xử lý dữ liệu.</li>
          <li>Đồng ý hoặc không đồng ý trong trường hợp cần sự đồng ý.</li>
          <li>Truy cập dữ liệu cá nhân.</li>
          <li>Yêu cầu chỉnh sửa dữ liệu.</li>
          <li>Yêu cầu xóa dữ liệu khi đáp ứng điều kiện.</li>
          <li>Hạn chế xử lý dữ liệu.</li>
          <li>Phản đối xử lý dữ liệu trong trường hợp phù hợp.</li>
          <li>Rút lại sự đồng ý.</li>
          <li>Khiếu nại liên quan đến dữ liệu cá nhân.</li>
        </ul>
      </LegalSection>

      <LegalSection title="9. Thông tin trong ghi chú Booking">
        <p>
          Người dùng không nên cung cấp dữ liệu nhạy cảm hoặc thông tin không
          cần thiết trong phần ghi chú Booking.
        </p>

        <p>
          Nếu Khách hàng tự nguyện cung cấp thông tin về tình trạng cơ thể hoặc
          sức khỏe để Kỹ thuật viên thực hiện dịch vụ phù hợp, thông tin chỉ nên
          được cung cấp trong phạm vi thực sự cần thiết.
        </p>

        <p>
          Dịch vụ trên nền tảng không thay thế việc tư vấn, chẩn đoán hoặc điều
          trị y tế.
        </p>
      </LegalSection>

      <LegalSection title="10. Cookie và công nghệ tương tự">
        <p>Website có thể sử dụng cookie để:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Duy trì trạng thái đăng nhập.</li>
          <li>Ghi nhớ lựa chọn của Người dùng.</li>
          <li>Tăng cường bảo mật.</li>
          <li>Đo lường hiệu năng.</li>
          <li>Cải thiện trải nghiệm sử dụng.</li>
        </ul>
      </LegalSection>

      <LegalSection title="11. Thay đổi Chính sách">
        <p>
          Chính sách có thể được cập nhật khi pháp luật, chức năng hệ thống hoặc
          cách thức xử lý dữ liệu thay đổi.
        </p>

        <p>
          Phiên bản mới sẽ được công bố trên website hoặc ứng dụng của{" "}
          {legalConfig.appName}.
        </p>
      </LegalSection>

      <LegalSection title="12. Liên hệ về dữ liệu cá nhân">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p>
            <strong>Đơn vị:</strong> {legalConfig.companyName}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {legalConfig.address}
          </p>
          <p>
            <strong>Email:</strong> {legalConfig.privacyEmail}
          </p>
          <p>
            <strong>Hotline:</strong> {legalConfig.hotline}
          </p>
          <p>
            <strong>Website:</strong> {legalConfig.website}
          </p>
        </div>
      </LegalSection>
    </LegalDocument>
  );
};

export default PrivacyPolicyPage;
