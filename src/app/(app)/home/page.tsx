import { RecentQuiz } from "@/components/home/recent-quiz";
import { SuggestedQuiz } from "@/components/home/suggested-quiz";
import { HomeBanner } from "@/components/home/home-banner";
import { HistoricalContexts } from "@/components/home/historical-contexts";
import { LearningDashboard } from "@/components/home/learning-dashboard";

export const metadata = {
  title: "Trang chủ | HistoryTalk",
  description: "Khám phá lịch sử Việt Nam qua trò chuyện với nhân vật lịch sử",
};

export default function HomePage() {
  return (
    <div className="px-3 py-4 md:px-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-5 md:space-y-8 pb-8 md:pb-10">
        {/* Hero Banner with Quick Navigation */}
        <HomeBanner />

        {/* Hoạt động của bạn — chỉ hiển thị khi đã đăng nhập */}
        <LearningDashboard />

        {/* Khám phá bối cảnh lịch sử */}
        <HistoricalContexts />

        {/* Quizzes Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">
          <RecentQuiz />
          <SuggestedQuiz />
        </div>
      </div>
    </div>
  );
}
