import { RecentQuiz } from "@/components/home/recent-quiz";
import { SuggestedQuiz } from "@/components/home/suggested-quiz";
import { FeatureCards } from "@/components/home/feature-card";
import { WelcomeHeading } from "@/components/home/welcome-heading";
import { HistoricalContexts } from "@/components/home/historical-contexts";

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

          <HistoricalContexts />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Left: Feature cards */}
            <FeatureCards />

            {/* Right: Recent quiz & Suggestions */}
            <div className="flex flex-col gap-5">
              <RecentQuiz />
              <SuggestedQuiz />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}