import { ClosingSection } from "@/components/marketing/section/closing-section";
import { FeaturesSection } from "@/components/marketing/section/features-section";
import { HeroSection } from "@/components/marketing/section/hero-section";
import { ImpactSection } from "@/components/marketing/section/impact-section";
import { ProblemSection } from "@/components/marketing/section/problem-section";
import { SolutionSection } from "@/components/marketing/section/solution-section";

export default function MarketingPage() {
  return (
    <div className="w-full">
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesSection />
      <ImpactSection />
      <ClosingSection />
    </div>
  );
}
