/**
 * src/app/(app)/home/page.tsx
 * Server Component
 *
 * Layout:
 * ┌─────────────────────┬──────────────────────────────────┐
 * │  Feature Cards      │  [Fact Card] │ [Mini Game]       │
 * │  (2×2 grid + nav)   │   (đứng)     │  (random game)    │
 * └─────────────────────┴──────────────────────────────────┘
 * ┌──────────────────────────────────────────────────────────┐
 * │  Recent Quiz  │  Suggested Quiz                         │
 * └──────────────────────────────────────────────────────────┘
 */

import { RecentQuiz } from "@/components/home/recent-quiz";
import { SuggestedQuiz } from "@/components/home/suggested-quiz";
import { FeatureCards } from "@/components/home/feature-card";
import { HomeRightPanel } from "@/components/home/home-right-panel";
import { WelcomeHeading } from "@/components/home/welcome-heading";

export default function HomePage() {
  return (
    <div className="px-6 py-8">
      <div className="container space-y-8 pb-10">
        {/* ── Main section ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div
              className="h-10 w-1 rounded-full"
              style={{ background: "var(--accent-gold)" }}
            />
            <WelcomeHeading />
            <div
              className="flex-1 h-px"
              style={{ background: "var(--card-light-border)" }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Left: Feature cards 2×2 với pagination */}
            <FeatureCards />

            {/* Right: Fact card đứng + Mini game gộp chung */}
            <HomeRightPanel />
          </div>
        </section>

        {/* ── Recent + Suggested quiz ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentQuiz />
          <SuggestedQuiz />
        </div>
      </div>
    </div>
  );
}
