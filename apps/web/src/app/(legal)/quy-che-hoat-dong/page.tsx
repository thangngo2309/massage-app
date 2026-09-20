import type { Metadata } from "next";

import { LegalDocument } from "@/components/legal/LegalDocument";
import { LegalSection } from "@/components/legal/LegalSection";
import { legalConfig } from "@/lib/legal-config";

export const metadata: Metadata = {
  title: `Quy chế hoạt động | ${legalConfig.appName}`,
  description: `Quy chế hoạt động của nền tảng ${legalConfig.appName}.`,
};

const OperatingRegulationsPage = () => {
  return (
    <LegalDocument
      title="Quy chế hoạt động"
      updatedAt={legalConfig.updatedAt}
      description={`Quy chế quy định nguyên tắc hoạt động, quyền và nghĩa vụ của các tổ chức, cá nhân khi sử dụng nền tảng ${legalConfig.appName}.`}
    >
      <div className="rounded-xl bg-slate-50 p-5 leading-7 text-slate-700">
        Bằng việc đăng ký tài khoản, truy cập hoặc sử dụng nền tảng{" "}
        <strong>{legalConfig.appName}</strong>, Người dùng xác nhận đã đọc, hiểu
        và đồng ý tuân thủ Quy chế này.
      </div>

      <LegalSection title="1. Nguyên tắc chung">
        <p>
          {legalConfig.appName} là nền tảng công nghệ trung gian hỗ trợ kết nối
          giữa Khách hàng có nhu cầu sử dụng dịch vụ massage, chăm sóc cơ thể
          hoặc các dịch vụ liên quan với Kỹ thuật viên hoặc đối tác cung cấp
          dịch vụ.
        </p>

        <p>
          Nền tảng cung cấp các công cụ hỗ trợ tìm kiếm dịch vụ, tìm kiếm Kỹ
          thuật viên, xem giá, lịch khả dụng, khu vực phục vụ, đặt lịch, quản lý
          Booking và đánh giá chất lượng dịch vụ.
        </p>

        <p>
          Trừ trường hợp có thỏa thuận khác bằng văn bản,{" "}
          {legalConfig.companyName} đóng vai trò cung cấp nền tảng công nghệ
          trung gian và không trực tiếp thực hiện dịch vụ massage cho Khách
          hàng.
        </p>
      </LegalSection>

      <LegalSection title="2. Giải thích thuật ngữ">
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong>Nền tảng:</strong> ứng dụng, website và hệ thống công nghệ
            mang thương hiệu {legalConfig.appName}.
          </li>

          <li>
            <strong>Khách hàng:</strong> cá nhân sử dụng nền tảng để tìm kiếm,
            đặt và sử dụng dịch vụ.
          </li>

          <li>
            <strong>Kỹ thuật viên:</strong> cá nhân hoặc đối tác đăng ký cung
            cấp dịch vụ thông qua nền tảng.
          </li>

          <li>
            <strong>Booking:</strong> yêu cầu đặt dịch vụ được Khách hàng tạo
            trên hệ thống.
          </li>

          <li>
            <strong>Dịch vụ:</strong> dịch vụ massage, chăm sóc cơ thể hoặc dịch
            vụ khác được công bố hợp pháp trên nền tảng.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Phạm vi hoạt động của nền tảng">
        <p>Nền tảng có thể cung cấp các chức năng:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Đăng ký, đăng nhập và quản lý tài khoản.</li>
          <li>Hiển thị danh mục dịch vụ.</li>
          <li>Hiển thị thông tin Kỹ thuật viên.</li>
          <li>Hiển thị giá và thời lượng dịch vụ.</li>
          <li>Tìm kiếm Kỹ thuật viên theo khu vực và thời gian.</li>
          <li>Quản lý lịch làm việc và lịch khả dụng.</li>
          <li>Tạo và quản lý Booking.</li>
          <li>Cập nhật trạng thái thực hiện dịch vụ.</li>
          <li>Đánh giá và nhận xét sau khi hoàn thành dịch vụ.</li>
          <li>Tiếp nhận phản ánh và khiếu nại.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Đăng ký tài khoản">
        <h3 className="font-semibold text-slate-900">
          4.1. Tài khoản Khách hàng
        </h3>

        <p>
          Khách hàng đăng ký tài khoản bằng các thông tin được yêu cầu như họ
          tên, số điện thoại, email, mật khẩu và các thông tin cần thiết khác.
        </p>

        <p>
          Khách hàng chịu trách nhiệm về tính chính xác của thông tin cung cấp
          và có trách nhiệm bảo mật thông tin đăng nhập.
        </p>

        <h3 className="pt-2 font-semibold text-slate-900">
          4.2. Tài khoản Kỹ thuật viên
        </h3>

        <p>
          Kỹ thuật viên có thể được yêu cầu cung cấp thông tin cá nhân, ảnh đại
          diện, hồ sơ chuyên môn, kinh nghiệm, khu vực cung cấp dịch vụ, danh
          sách dịch vụ và các tài liệu phục vụ việc xác minh.
        </p>

        <p>
          Việc tạo tài khoản thành công không đồng nghĩa với việc Kỹ thuật viên
          mặc nhiên được phép nhận Booking. Nền tảng có quyền yêu cầu hoàn thành
          quá trình xác minh trước khi kích hoạt chức năng nhận Booking.
        </p>
      </LegalSection>

      <LegalSection title="5. Quy trình đặt và thực hiện dịch vụ">
        <ol className="list-decimal space-y-2 pl-6">
          <li>Khách hàng đăng nhập vào nền tảng.</li>
          <li>Lựa chọn dịch vụ hoặc gói dịch vụ.</li>
          <li>Tìm kiếm hoặc lựa chọn Kỹ thuật viên.</li>
          <li>Xem thông tin Kỹ thuật viên, giá và thời lượng.</li>
          <li>Lựa chọn thời gian thực hiện.</li>
          <li>Cung cấp địa điểm thực hiện dịch vụ.</li>
          <li>Xác nhận tạo Booking.</li>
          <li>Kỹ thuật viên tiếp nhận Booking.</li>
          <li>Kỹ thuật viên xác nhận hoặc từ chối Booking.</li>
          <li>Kỹ thuật viên đến địa điểm đã thống nhất.</li>
          <li>Dịch vụ được thực hiện.</li>
          <li>Booking được cập nhật trạng thái hoàn thành.</li>
          <li>Khách hàng có thể đánh giá Kỹ thuật viên.</li>
        </ol>
      </LegalSection>

      <LegalSection title="6. Giá dịch vụ">
        <p>
          Giá dịch vụ được hiển thị cho Khách hàng trước khi xác nhận Booking.
        </p>

        <p>
          Giá có thể phụ thuộc vào loại dịch vụ, thời lượng, Kỹ thuật viên, khu
          vực cung cấp dịch vụ, lựa chọn bổ sung và các chương trình ưu đãi tại
          từng thời điểm.
        </p>

        <p>
          Kỹ thuật viên không được tự ý yêu cầu Khách hàng thanh toán thêm các
          khoản ngoài nội dung đã thống nhất nếu chưa được Khách hàng đồng ý.
        </p>
      </LegalSection>

      <LegalSection title="7. Hủy Booking">
        <p>
          Khách hàng hoặc Kỹ thuật viên có thể yêu cầu hủy Booking khi trạng
          thái Booking cho phép.
        </p>

        <p>
          Nền tảng có thể hạn chế việc hủy khi Kỹ thuật viên đã đến địa điểm
          hoặc dịch vụ đã bắt đầu thực hiện.
        </p>

        <p>
          Nếu có áp dụng phí hủy, mức phí và điều kiện áp dụng sẽ được thông báo
          trước khi Người dùng xác nhận yêu cầu hủy.
        </p>
      </LegalSection>

      <LegalSection title="8. Trách nhiệm của Kỹ thuật viên">
        <ul className="list-disc space-y-2 pl-6">
          <li>Cung cấp thông tin trung thực và chính xác.</li>
          <li>Đảm bảo điều kiện cung cấp dịch vụ theo quy định pháp luật.</li>
          <li>Thực hiện đúng dịch vụ Khách hàng đã đặt.</li>
          <li>Có mặt đúng thời gian đã xác nhận.</li>
          <li>Giữ thái độ lịch sự và chuyên nghiệp.</li>
          <li>Đảm bảo vệ sinh cá nhân và dụng cụ.</li>
          <li>Tôn trọng quyền riêng tư và tài sản của Khách hàng.</li>
          <li>
            Không sử dụng thông tin Khách hàng ngoài mục đích thực hiện dịch vụ.
          </li>
          <li>
            Không quấy rối, đe dọa, xâm phạm hoặc thực hiện hành vi trái pháp
            luật.
          </li>
        </ul>

        <p className="font-medium text-slate-900">
          Nghiêm cấm sử dụng nền tảng để chào mời hoặc cung cấp các dịch vụ mang
          tính chất mại dâm, kích dục hoặc hoạt động khác bị pháp luật cấm.
        </p>
      </LegalSection>

      <LegalSection title="9. Trách nhiệm của Khách hàng">
        <ul className="list-disc space-y-2 pl-6">
          <li>Cung cấp thông tin Booking chính xác.</li>
          <li>Cung cấp địa điểm thực hiện dịch vụ an toàn.</li>
          <li>Có mặt tại thời gian đã đặt.</li>
          <li>Thanh toán đầy đủ khoản tiền đã thỏa thuận.</li>
          <li>Tôn trọng Kỹ thuật viên.</li>
          <li>
            Không yêu cầu thực hiện dịch vụ ngoài phạm vi đã công bố hoặc hành
            vi trái pháp luật.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="10. Đánh giá và nhận xét">
        <p>
          Khách hàng có thể đánh giá Kỹ thuật viên sau khi Booking được hoàn
          thành.
        </p>

        <p>Nội dung đánh giá không được:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Bịa đặt thông tin.</li>
          <li>Xúc phạm danh dự, nhân phẩm người khác.</li>
          <li>Công khai dữ liệu cá nhân trái phép.</li>
          <li>Chứa nội dung quảng cáo không liên quan.</li>
          <li>Vi phạm pháp luật hoặc thuần phong mỹ tục.</li>
        </ul>

        <p>
          Nền tảng có quyền ẩn hoặc xóa nội dung vi phạm các nguyên tắc trên.
        </p>
      </LegalSection>

      <LegalSection title="11. Các hành vi bị nghiêm cấm">
        <ul className="list-disc space-y-2 pl-6">
          <li>Sử dụng thông tin giả mạo.</li>
          <li>Chiếm đoạt tài khoản người khác.</li>
          <li>Can thiệp trái phép vào hệ thống.</li>
          <li>Phát tán mã độc.</li>
          <li>Thu thập dữ liệu Người dùng trái phép.</li>
          <li>Gian lận Booking hoặc chương trình khuyến mại.</li>
          <li>Tạo giao dịch giả.</li>
          <li>Quấy rối hoặc xâm phạm người khác.</li>
          <li>Sử dụng nền tảng để thực hiện hành vi trái pháp luật.</li>
        </ul>
      </LegalSection>

      <LegalSection title="12. Tạm khóa hoặc chấm dứt tài khoản">
        <p>
          Nền tảng có quyền cảnh báo, hạn chế chức năng, tạm khóa hoặc chấm dứt
          tài khoản khi phát hiện hành vi vi phạm Quy chế, gian lận, gây mất an
          toàn cho Người dùng khác hoặc sử dụng nền tảng vào mục đích trái pháp
          luật.
        </p>
      </LegalSection>

      <LegalSection title="13. Quyền và trách nhiệm của đơn vị vận hành">
        <p>{legalConfig.companyName} có quyền:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Xây dựng và điều chỉnh quy trình vận hành.</li>
          <li>Kiểm tra và xác minh thông tin Người dùng.</li>
          <li>Xử lý tài khoản có dấu hiệu vi phạm.</li>
          <li>Lưu giữ lịch sử giao dịch theo quy định.</li>
          <li>
            Điều chỉnh chức năng của nền tảng để phù hợp với hoạt động thực tế.
          </li>
        </ul>

        <p>{legalConfig.companyName} có trách nhiệm:</p>

        <ul className="list-disc space-y-2 pl-6">
          <li>Bảo vệ thông tin Người dùng.</li>
          <li>Công bố rõ các điều kiện giao dịch.</li>
          <li>Tiếp nhận phản ánh và khiếu nại.</li>
          <li>Hỗ trợ giải quyết tranh chấp.</li>
          <li>
            Phối hợp với cơ quan nhà nước có thẩm quyền theo quy định pháp luật.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="14. Giải quyết tranh chấp">
        <p>
          Khi phát sinh tranh chấp, Khách hàng và Kỹ thuật viên được khuyến
          khích chủ động trao đổi để tìm phương án giải quyết.
        </p>

        <p>
          Nếu các bên không thể tự giải quyết, có thể gửi yêu cầu hỗ trợ tới nền
          tảng.
        </p>

        <p>
          Nền tảng có thể căn cứ vào thông tin Booking, lịch sử trạng thái,
          thông tin hệ thống, nội dung trao đổi, hình ảnh, tài liệu và các chứng
          cứ hợp pháp khác để hỗ trợ xử lý.
        </p>
      </LegalSection>

      <LegalSection title="15. Bảo vệ dữ liệu cá nhân">
        <p>
          Việc thu thập và xử lý dữ liệu cá nhân được thực hiện theo Chính sách
          bảo mật và bảo vệ dữ liệu cá nhân được công bố riêng trên nền tảng.
        </p>
      </LegalSection>

      <LegalSection title="16. Thay đổi Quy chế">
        <p>
          Nền tảng có thể sửa đổi Quy chế để phù hợp với thay đổi của pháp luật,
          mô hình hoạt động, chức năng sản phẩm hoặc yêu cầu bảo đảm an toàn hệ
          thống.
        </p>

        <p>
          Phiên bản mới sẽ được công bố trên ứng dụng hoặc website trước hoặc
          tại thời điểm có hiệu lực theo quy định áp dụng.
        </p>
      </LegalSection>

      <LegalSection title="17. Thông tin liên hệ">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p>
            <strong>Đơn vị vận hành:</strong> {legalConfig.companyName}
          </p>
          <p>
            <strong>Mã số doanh nghiệp:</strong> {legalConfig.businessCode}
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

export default OperatingRegulationsPage;
