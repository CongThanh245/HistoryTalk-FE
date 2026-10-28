import { HomeBanner } from "@/components/home/home-banner";
import { HistoricalContexts } from "@/components/home/historical-contexts";
import { LearningDashboard } from "@/components/home/learning-dashboard";

export const metadata = {
  title: "Trang chủ | HistoryTalk",
  description: "Khám phá lịch sử Việt Nam qua trò chuyện với nhân vật lịch sử",
};

export default function HomePage() {
  return (
    <div className="relative space-y-8 lg:space-y-10 py-6 lg:py-8 pb-10 md:pb-14">
      {/* Hero Banner with Quick Navigation */}
      <HomeBanner />

      {/* Tiếp tục hành trình — chỉ hiển thị khi đã đăng nhập và đã có hoạt động */}
      <div className="reveal-in">
        <LearningDashboard />
      </div>

      {/* Khám phá bối cảnh lịch sử */}
      <div className="reveal-in">
        <HistoricalContexts />
      </div>
    </div>
  );
}
