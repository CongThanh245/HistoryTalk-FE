import AuthForm from "@/components/auth/AuthForm";

export const metadata = {
  title: "Đăng nhập | HistoryTalk",
  description: "Đăng nhập vào HistoryTalk để khám phá lịch sử qua cuộc trò chuyện",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
