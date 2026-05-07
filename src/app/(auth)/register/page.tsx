import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Đăng ký | HistoryTalk",
  description: "Tạo tài khoản HistoryTalk miễn phí để bắt đầu khám phá lịch sử",
};

export default function RegisterPage() {
  return <AuthForm mode="register" />;
}