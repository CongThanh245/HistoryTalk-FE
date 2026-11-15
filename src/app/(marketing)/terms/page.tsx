import { pageMetadata } from "@/lib/seo";
import { LegalPage, type LegalSection } from "@/components/marketing/legal-page";

export const metadata = pageMetadata(
  "/terms",
  "Điều khoản dịch vụ | HistoryTalk",
  "Điều khoản sử dụng nền tảng học lịch sử Việt Nam HistoryTalk: tài khoản, token, nội dung do AI tạo và trách nhiệm của người dùng.",
);

const SECTIONS: LegalSection[] = [
  {
    heading: "Phạm vi áp dụng",
    paragraphs: [
      "Điều khoản này áp dụng cho mọi người dùng HistoryTalk: người học cá nhân, học sinh và giáo viên dùng tài khoản do nhà trường cấp, quản trị viên trường và đội ngũ quản trị nội dung.",
      "Khi đăng ký hoặc đăng nhập, bạn xác nhận đã đọc và đồng ý với điều khoản này cùng Chính sách quyền riêng tư.",
    ],
  },
  {
    heading: "Tài khoản",
    paragraphs: [
      "Bạn chịu trách nhiệm giữ bí mật mật khẩu và mọi hoạt động diễn ra trên tài khoản của mình. Hãy đổi mật khẩu tạm ngay lần đăng nhập đầu tiên.",
      "Tài khoản học sinh do nhà trường tạo và quản lý; nhà trường có thể khóa, mở hoặc chuyển lớp tài khoản đó.",
    ],
  },
  {
    heading: "Token và gói dịch vụ",
    paragraphs: [
      "Một số tính năng (như trò chuyện với nhân vật lịch sử) dùng token. Token mua qua gói dịch vụ hoặc cấp theo hạn mức của nhà trường, không quy đổi thành tiền mặt.",
      "Giá và quyền lợi của từng gói được công bố tại trang Bảng giá ở thời điểm mua.",
    ],
  },
  {
    heading: "Nội dung do AI tạo",
    paragraphs: [
      "Câu trả lời của nhân vật lịch sử được tạo bởi trí tuệ nhân tạo dựa trên tư liệu đã kiểm duyệt, nhưng vẫn có thể chưa chính xác. Hãy đối chiếu với sách giáo khoa và tài liệu chính thống khi học tập, thi cử.",
    ],
  },
  {
    heading: "Quy tắc sử dụng",
    paragraphs: [
      "Không dùng HistoryTalk để đăng tải nội dung xuyên tạc lịch sử, xúc phạm, vi phạm pháp luật Việt Nam; không cố tình khai thác lỗi, truy cập trái phép hoặc làm gián đoạn hệ thống.",
      "HistoryTalk có thể tạm khóa tài khoản vi phạm.",
    ],
  },
  {
    heading: "Thay đổi điều khoản",
    paragraphs: [
      "Điều khoản có thể được cập nhật; ngày cập nhật ghi ở đầu trang. Tiếp tục sử dụng sau khi cập nhật nghĩa là bạn đồng ý với nội dung mới.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Điều khoản dịch vụ"
      updated="14/11/2026"
      intro="Các điều khoản dưới đây quy định cách bạn sử dụng nền tảng học lịch sử Việt Nam HistoryTalk."
      sections={SECTIONS}
    />
  );
}
