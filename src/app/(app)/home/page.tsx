/**
 * src/app/(app)/home/page.tsx
 *
 * Server Component — không có "use client"
 * Các child component tự khai báo "use client" và dùng useQuery riêng
 */

import { FeatureCards } from "@/components/home/feature-card";
import { GreetingSection } from "@/components/home/greeting-section";
import { RecentQuiz } from "@/components/home/recent-quiz";
import { SuggestedQuiz } from "@/components/home/suggested-quiz";


export default function HomePage() {
  return (
    <div className="space-y-10 pb-10">
      <GreetingSection />
      <FeatureCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentQuiz />
        <SuggestedQuiz />
      </div>
    </div>
  );
}