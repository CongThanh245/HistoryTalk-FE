import { pageMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

export const metadata = pageMetadata(
  "/privacy",
  "Chính sách quyền riêng tư | HistoryTalk",
  "Cách HistoryTalk thu thập, sử dụng và bảo vệ dữ liệu cá nhân của người học, học sinh và giáo viên.",
);

const SECTIONS: LegalSection[] = [
  {
    heading: "Dữ liệu chúng tôi thu thập",
    paragraphs: [
      "Thông tin tài khoản: họ tên, email, ngày sinh, giới tính, số điện thoại (nếu có), mã học sinh và lớp do nhà trường cung cấp.",
      "Dữ liệu học tập: lịch sử trò chuyện với nhân vật, kết quả câu đố, bài tập, ghi chú trên bản đồ và tiến độ học tập.",
      "Dữ liệu kỹ thuật cần thiết để vận hành dịch vụ như thời điểm đăng nhập và thông tin thiết bị cơ bản.",
    ],
  },
  {
    heading: "Mục đích sử dụng",
    paragraphs: [
      "Cung cấp và cá nhân hóa trải nghiệm học, cho phép giáo viên theo dõi tiến độ của lớp, xử lý thanh toán gói dịch vụ và hỗ trợ khi bạn liên hệ.",
      "Nội dung trò chuyện được gửi tới dịch vụ AI để tạo câu trả lời; chúng tôi không bán dữ liệu cá nhân cho bên thứ ba.",
    ],
  },
  {
    heading: "Dữ liệu của học sinh",
    paragraphs: [
      "Với tài khoản do nhà trường cấp, nhà trường là bên quản lý dữ liệu học sinh. Giáo viên và quản trị viên trường chỉ xem được dữ liệu của học sinh thuộc trường, lớp mình phụ trách.",
    ],
  },
  {
    heading: "Lưu trữ và bảo mật",
    paragraphs: [
      "Mật khẩu được mã hóa một chiều; kết nối tới máy chủ dùng HTTPS. Dữ liệu được lưu trong thời gian tài khoản còn hoạt động hoặc theo yêu cầu của nhà trường.",
    ],
  },
  {
    heading: "Quyền của bạn",
    paragraphs: [
      "Bạn có thể xem và cập nhật thông tin cá nhân trong trang Hồ sơ. Học sinh cần sửa hoặc xóa dữ liệu vui lòng liên hệ nhà trường; người dùng cá nhân có thể liên hệ HistoryTalk để yêu cầu xóa tài khoản.",
    ],
  },
  {
    heading: "Thay đổi chính sách",
    paragraphs: [
      "Chính sách có thể được cập nhật; ngày cập nhật ghi ở đầu trang.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Chính sách quyền riêng tư"
      updated="14/11/2026"
      intro="HistoryTalk tôn trọng quyền riêng tư của người học. Chính sách này giải thích dữ liệu nào được thu thập và cách chúng tôi sử dụng, bảo vệ dữ liệu đó."
      sections={SECTIONS}
    />
  );
}
