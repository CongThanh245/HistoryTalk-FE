import { RecentQuiz } from "@/components/home/recent-quiz";
import { SuggestedQuiz } from "@/components/home/suggested-quiz";
import { HomeBanner } from "@/components/home/home-banner";
import { HistoricalContexts } from "@/components/home/historical-contexts";
import { LearningDashboard } from "@/components/home/learning-dashboard";
import { DrumDivider } from "@/components/decor/DrumDivider";
import { LacBirdFlight } from "@/components/decor/LacBird";

export const metadata = {
  title: "Trang chủ | HistoryTalk",
  description: "Khám phá lịch sử Việt Nam qua trò chuyện với nhân vật lịch sử",
};

export default function HomePage() {
  return (
    <div className="relative space-y-8 lg:space-y-12 py-6 lg:py-10 pb-10 md:pb-14">
      <LacBirdFlight className="top-0 z-10" />

      {/* Hero Banner with Quick Navigation */}
      <HomeBanner />

      {/* Hoạt động của bạn — chỉ hiển thị khi đã đăng nhập */}
      <div className="reveal-in">
        <LearningDashboard />
      </div>

      <DrumDivider />

      {/* Khám phá bối cảnh lịch sử */}
      <div className="reveal-in">
        <HistoricalContexts />
      </div>

      <DrumDivider />

      {/* Quizzes Section */}
      <div className="reveal-in grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">
        <RecentQuiz />
        <SuggestedQuiz />
      </div>
    </div>
  );
}
