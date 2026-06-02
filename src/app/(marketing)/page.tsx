import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroSection } from "@/components/marketing/section/hero-section";
import { FadeInSection } from "@/components/marketing/section/fade-in-section";

// Lazy load sections below the fold để giảm initial bundle size
const ProblemSection = dynamic(
  () => import("@/components/marketing/section/problem-section").then((m) => m.ProblemSection),
  { loading: () => <SectionSkeleton /> }
);

const SolutionSection = dynamic(
  () => import("@/components/marketing/section/solution-section").then((m) => m.SolutionSection),
  { loading: () => <SectionSkeleton /> }
);

const FeaturesSection = dynamic(
  () => import("@/components/marketing/section/features-section").then((m) => m.FeaturesSection),
  { loading: () => <SectionSkeleton /> }
);

const ImpactSection = dynamic(
  () => import("@/components/marketing/section/impact-section").then((m) => m.ImpactSection),
  { loading: () => <SectionSkeleton /> }
);

const ClosingSection = dynamic(
  () => import("@/components/marketing/section/closing-section").then((m) => m.ClosingSection),
  { loading: () => <SectionSkeleton /> }
);

// Simple skeleton loader cho sections
function SectionSkeleton() {
  return (
    <div className="w-full min-h-100 flex items-center justify-center">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="animate-pulse space-y-8">
          <div className="h-8 w-2/3 bg-(--bg-surface) rounded" />
          <div className="h-4 w-1/2 bg-(--bg-surface) rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-48 bg-(--bg-surface) rounded" />
            <div className="h-48 bg-(--bg-surface) rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  return (
    <div className="w-full">
      <HeroSection />
      <Suspense fallback={<SectionSkeleton />}>
        <FadeInSection>
          <ProblemSection />
        </FadeInSection>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FadeInSection>
          <SolutionSection />
        </FadeInSection>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FadeInSection>
          <FeaturesSection />
        </FadeInSection>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FadeInSection>
          <ImpactSection />
        </FadeInSection>
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FadeInSection>
          <ClosingSection />
        </FadeInSection>
      </Suspense>
    </div>
  );
}
