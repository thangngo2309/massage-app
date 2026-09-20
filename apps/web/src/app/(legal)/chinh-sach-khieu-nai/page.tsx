import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: `Chính sách quản lý khiếu nại | ${legalConfig.appName}`,
  description: `Quy trình tiếp nhận và giải quyết khiếu nại trên nền tảng ${legalConfig.appName}.`,
};

const ComplaintPolicyPage = () => {
  return (
    <LegalDocument
      title="Chính sách quản lý và giải quyết khiếu nại"
      updatedAt={legalConfig.updatedAt}
      description={`Chính sách quy định quy trình tiếp nhận, xác minh và giải quyết các phản ánh, khiếu nại và tranh chấp phát sinh trong quá trình sử dụng ${legalConfig.appName}.`}
    >
      <LegalSection title="1. Phạm vi áp dụng">
        <p>Chính sách áp dụng đối với khiếu nại liên quan đến:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Tài khoản Người dùng.</li>
          <li>Thông tin Kỹ thuật viên.</li>
          <li>Dịch vụ được cung cấp trên nền tảng.</li>
          <li>Giá dịch vụ.</li>
          <li>Booking.</li>
          <li>Xác nhận hoặc từ chối Booking.</li>
          <li>Kỹ thuật viên đến muộn hoặc không đến.</li>
          <li>Khách hàng không có mặt.</li>
          <li>Chất lượng dịch vụ.</li>
          <li>Hành vi của Khách hàng hoặc Kỹ thuật viên.</li>
          <li>Hủy Booking.</li>
          <li>Đánh giá và nhận xét.</li>
          <li>Dữ liệu cá nhân và bảo mật.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Nguyên tắc giải quyết">
        <ul className="list-disc space-y-2 pl-6">
          <li>Khách quan.</li>
          <li>Minh bạch.</li>
          <li>Tôn trọng quyền và lợi ích hợp pháp của các bên.</li>
          <li>Bảo mật thông tin.</li>
          <li>Dựa trên dữ liệu và chứng cứ.</li>
          <li>Ưu tiên thương lượng và hòa giải.</li>
          <li>Tuân thủ quy định pháp luật.</li>
        </ul>

        <p>
          Nền tảng không mặc nhiên xem phản ánh của bất kỳ bên nào là chính xác
          khi chưa có đủ thông tin để xác minh.
        </p>
      </LegalSection>

      <LegalSection title="3. Các trường hợp có thể gửi khiếu nại">
        <ul className="list-disc space-y-2 pl-6">
          <li>Không thể thực hiện Booking.</li>
          <li>Thông tin dịch vụ không đúng với nội dung công bố.</li>
          <li>Kỹ thuật viên không đến hoặc đến sai thời gian.</li>
          <li>Khách hàng không có mặt tại địa điểm đã đặt.</li>
          <li>Dịch vụ không được thực hiện như đã thống nhất.</li>
          <li>Tranh chấp về giá.</li>
          <li>Tranh chấp liên quan đến việc hủy Booking.</li>
          <li>Có dấu hiệu gian lận.</li>
          <li>Tài khoản có dấu hiệu bị truy cập trái phép.</li>
          <li>Dữ liệu cá nhân bị sử dụng không đúng mục đích.</li>
          <li>Đánh giá có nội dung sai sự thật hoặc vi phạm.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Kênh tiếp nhận khiếu nại">
        <p>Người dùng có thể gửi yêu cầu thông qua:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Chức năng hỗ trợ trên ứng dụng.</li>
          <li>Website của nền tảng.</li>
          <li>Email: {legalConfig.email}.</li>
          <li>Hotline: {legalConfig.hotline}.</li>
          <li>Các kênh chăm sóc khách hàng chính thức khác được công bố.</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Thông tin Người dùng cần cung cấp">
        <ul className="list-disc space-y-2 pl-6">
          <li>Họ và tên.</li>
          <li>Số điện thoại hoặc email.</li>
          <li>Mã Booking.</li>
          <li>Thời gian xảy ra sự việc.</li>
          <li>Nội dung khiếu nại.</li>
          <li>Yêu cầu giải quyết.</li>
          <li>Hình ảnh hoặc video nếu có.</li>
          <li>Nội dung trao đổi giữa các bên.</li>
          <li>Tài liệu hoặc chứng cứ liên quan.</li>
        </ul>

        <p>
          Người dùng chịu trách nhiệm về tính chính xác và trung thực của thông
          tin cung cấp.
        </p>
      </LegalSection>

      <LegalSection title="6. Quy trình giải quyết khiếu nại">
        <div>
          <h3 className="font-semibold text-slate-900">Bước 1. Tiếp nhận</h3>

          <p className="mt-2">
            Bộ phận hỗ trợ tiếp nhận và ghi nhận nội dung khiếu nại. Người dùng
            có thể được yêu cầu bổ sung thông tin nếu hồ sơ chưa đầy đủ.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">Bước 2. Xác minh</h3>

          <p className="mt-2">
            Nền tảng kiểm tra Booking, lịch sử trạng thái, thông tin tài khoản,
            dữ liệu hệ thống và các tài liệu có liên quan.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Bước 3. Liên hệ các bên
          </h3>

          <p className="mt-2">
            Nền tảng có thể liên hệ Khách hàng, Kỹ thuật viên hoặc bên liên quan
            để yêu cầu giải trình hoặc bổ sung chứng cứ.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Bước 4. Đề xuất phương án xử lý
          </h3>

          <p className="mt-2">
            Căn cứ kết quả xác minh, nền tảng có thể đưa ra phương án giải quyết
            phù hợp.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-slate-900">
            Bước 5. Thông báo kết quả
          </h3>

          <p className="mt-2">
            Kết quả xử lý được thông báo cho Người dùng qua ứng dụng, email,
            điện thoại hoặc kênh liên hệ phù hợp.
          </p>
        </div>
      </LegalSection>

      <LegalSection title="7. Biện pháp xử lý">
        <p>Tùy từng trường hợp, nền tảng có thể:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Giải thích hoặc hướng dẫn các bên.</li>
          <li>Điều chỉnh thông tin sai lệch.</li>
          <li>Hủy Booking.</li>
          <li>Điều chỉnh khoản phí khi có căn cứ phù hợp.</li>
          <li>Cảnh báo tài khoản.</li>
          <li>Hạn chế chức năng.</li>
          <li>Tạm khóa tài khoản.</li>
          <li>Chấm dứt tài khoản.</li>
          <li>Ẩn hoặc xóa nội dung vi phạm.</li>
          <li>Chuyển thông tin tới cơ quan có thẩm quyền khi cần thiết.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Thời gian xử lý">
        <p>
          Nền tảng cố gắng xác nhận việc tiếp nhận khiếu nại trong vòng{" "}
          <strong>03 ngày làm việc</strong> kể từ thời điểm nhận được thông tin
          cơ bản cần thiết.
        </p>

        <p>
          Đối với vụ việc thông thường, nền tảng cố gắng xử lý trong khoảng{" "}
          <strong>07 đến 15 ngày làm việc</strong> kể từ thời điểm nhận đủ thông
          tin.
        </p>

        <p>
          Các vụ việc phức tạp hoặc cần xác minh nhiều bên có thể cần thời gian
          lâu hơn.
        </p>
      </LegalSection>

      <LegalSection title="9. Khiếu nại về chất lượng dịch vụ">
        <p>
          Nền tảng có thể xem xét loại dịch vụ, nội dung đã công bố, thời gian
          thực hiện, phản hồi của Kỹ thuật viên, phản ánh của Khách hàng và các
          tài liệu có thể xác minh.
        </p>

        <p>
          Do chất lượng dịch vụ có thể bao gồm yếu tố cảm nhận cá nhân, việc xử
          lý sẽ dựa trên tổng hợp thông tin thay vì chỉ dựa vào phản ánh của một
          bên.
        </p>
      </LegalSection>

      <LegalSection title="10. Hành vi nghiêm trọng">
        <p>Nền tảng đặc biệt xem trọng phản ánh liên quan đến:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Quấy rối.</li>
          <li>Xâm phạm thân thể.</li>
          <li>Gạ gẫm.</li>
          <li>Đe dọa.</li>
          <li>Bạo lực.</li>
          <li>Trộm cắp.</li>
          <li>Gian lận.</li>
          <li>Ép buộc sử dụng dịch vụ khác.</li>
          <li>Yêu cầu thực hiện hành vi trái pháp luật.</li>
          <li>Hành vi mang tính chất mại dâm hoặc kích dục.</li>
        </ul>

        <p>
          Nền tảng có quyền tạm khóa tài khoản liên quan trong quá trình xác
          minh nếu sự việc có dấu hiệu nghiêm trọng.
        </p>

        <p>
          Khi có dấu hiệu tội phạm hoặc nguy cơ mất an toàn, Người dùng nên liên
          hệ trực tiếp với cơ quan chức năng có thẩm quyền.
        </p>
      </LegalSection>

      <LegalSection title="11. Khiếu nại liên quan đến thanh toán">
        <p>
          Khi chức năng thanh toán trực tuyến được triển khai, Người dùng cần
          cung cấp thông tin về Booking, số tiền, thời điểm giao dịch, phương
          thức thanh toán và trạng thái giao dịch để hỗ trợ đối soát.
        </p>

        <p>
          Thời gian hoàn tiền hoặc đối soát có thể phụ thuộc vào đơn vị trung
          gian thanh toán hoặc ngân hàng.
        </p>
      </LegalSection>

      <LegalSection title="12. Khiếu nại về dữ liệu cá nhân">
        <p>
          Người dùng có thể gửi khiếu nại nếu cho rằng dữ liệu bị sử dụng sai
          mục đích, bị tiết lộ trái phép hoặc các quyền liên quan đến dữ liệu cá
          nhân chưa được xử lý phù hợp.
        </p>
      </LegalSection>

      <LegalSection title="13. Nghĩa vụ hợp tác">
        <ul className="list-disc space-y-2 pl-6">
          <li>Cung cấp thông tin chính xác.</li>
          <li>Không làm giả chứng cứ.</li>
          <li>Không chỉnh sửa nội dung nhằm làm sai lệch sự việc.</li>
          <li>Hợp tác trong quá trình xác minh.</li>
          <li>Tôn trọng nhân viên hỗ trợ và các bên liên quan.</li>
        </ul>
      </LegalSection>

      <LegalSection title="14. Giải quyết tranh chấp ngoài nền tảng">
        <p>
          Nếu các bên không thống nhất với phương án hỗ trợ, các bên có quyền
          tiếp tục thương lượng, hòa giải, yêu cầu cơ quan bảo vệ người tiêu
          dùng, cơ quan nhà nước có thẩm quyền hoặc Tòa án giải quyết theo quy
          định pháp luật.
        </p>
      </LegalSection>

      <LegalSection title="15. Bảo mật thông tin khiếu nại">
        <p>
          Thông tin khiếu nại chỉ được sử dụng trong phạm vi cần thiết để xác
          minh sự việc, giải quyết tranh chấp, phòng chống gian lận, bảo vệ
          quyền lợi hợp pháp của các bên và thực hiện nghĩa vụ pháp lý.
        </p>
      </LegalSection>

      <LegalSection title="16. Thông tin liên hệ">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p>
            <strong>Đơn vị tiếp nhận:</strong> {legalConfig.companyName}
          </p>
          <p>
            <strong>Địa chỉ:</strong> {legalConfig.address}
          </p>
          <p>
            <strong>Email:</strong> {legalConfig.email}
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

export default ComplaintPolicyPage;
