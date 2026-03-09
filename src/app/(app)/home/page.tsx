/**
 * src/app/(app)/home/page.tsx
 * Server Component
 *
 * Layout:
 * ┌─────────────────────┬─────────────────────┐
 * │  Feature Cards      │  Fact Widget        │
 * │  (2×2 grid + nav)   │  Mini Game          │
 * └─────────────────────┴─────────────────────┘
 * ┌─────────────────────────────────────────────┐
 * │  Recent Quiz  │  Suggested Quiz             │
 * └─────────────────────────────────────────────┘
 */

import { RecentQuiz }      from "@/components/home/recent-quiz";
import { SuggestedQuiz }   from "@/components/home/suggested-quiz";
import { FactWidget }      from "@/components/home/fact-widget";
import { FeatureCards } from "@/components/home/feature-card";
import { HistoryMiniGame } from "@/components/home/mini-game";

export default function HomePage() {
  return (
    <div className="px-6 py-8">
      <div className="container space-y-8 pb-10">

        {/* ── Main section: Feature (left) + Fact+Game (right) ── */}
        <section>
          <div className="flex items-center gap-3 mb-5">
            <div className="h-4 w-1 rounded-full" style={{ background: "var(--accent-gold)" }} />
            <h2
              className="text-sm font-bold uppercase"
              style={{ color: "var(--content-heading)", letterSpacing: "0.1em" }}
            >
              Khám phá & Luyện tập
            </h2>
            <div className="flex-1 h-px" style={{ background: "var(--card-light-border)" }} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Left col: Feature cards 2×2 with pagination */}
            <FeatureCards />

            {/* Right col: Fact card (compact) stacked above Mini Game */}
            <div className="flex flex-col gap-5">
              <FactWidget />
              <HistoryMiniGame />
            </div>
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