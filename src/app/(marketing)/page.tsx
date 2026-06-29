import dynamic from "next/dynamic";
import { Suspense } from "react";
import { HeroSection } from "@/components/marketing/section/hero-section";
import type { Character } from "@/services/character.service";
import { mapCharacter } from "@/services/character.service";
import { axiosServer } from "@/configs/axios.server";

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

// const ImpactSection = dynamic(
//   () => import("@/components/marketing/section/impact-section").then((m) => m.ImpactSection),
//   { loading: () => <SectionSkeleton /> }
// );

const ClosingSection = dynamic(
  () => import("@/components/marketing/section/closing-section").then((m) => m.ClosingSection),
  { loading: () => <SectionSkeleton /> }
);

const fallbackCharacters: Character[] = [
  {
    id: "fallback-le-loi",
    name: "Lê Lợi",
    title: "Lê Thái Tổ",
    era: "Trung đại",
    description: "Người lãnh đạo khởi nghĩa Lam Sơn, sáng lập triều Hậu Lê.",
    imageUrl: "/le_loi_2D.jpg",
    avatarUrl: "/le_loi_2D.jpg",
  },
  {
    id: "fallback-ngo-quyen",
    name: "Ngô Quyền",
    title: "Tiền Ngô Vương",
    era: "Tự chủ",
    description: "Vị tướng đại phá quân Nam Hán trên sông Bạch Đằng năm 938.",
    imageUrl: "/ngo_quyen_2D.jpg",
    avatarUrl: "/ngo_quyen_2D.jpg",
  },
  {
    id: "fallback-nguyen-trai",
    name: "Nguyễn Trãi",
    title: "Danh nhân văn hóa",
    era: "Trung đại",
    description: "Nhà tư tưởng, nhà chính trị và tác giả Bình Ngô đại cáo.",
    imageUrl: "/ngo-quyen-chan-dung.png",
    avatarUrl: "/ngo-quyen-chan-dung.png",
  },
  {
    id: "fallback-tran-hung-dao",
    name: "Trần Hưng Đạo",
    title: "Hưng Đạo Đại Vương",
    era: "Trung đại",
    description: "Vị thống soái gắn với ba lần kháng chiến chống Nguyên Mông.",
    imageUrl: "/card.jpg",
    avatarUrl: "/card.jpg",
  },
  {
    id: "fallback-quang-trung",
    name: "Quang Trung",
    title: "Hoàng đế Tây Sơn",
    era: "Cận đại",
    description: "Người chỉ huy chiến thắng Ngọc Hồi - Đống Đa mùa xuân 1789.",
    imageUrl: "/card.jpg",
    avatarUrl: "/card.jpg",
  },
  {
    id: "fallback-ba-trieu",
    name: "Bà Triệu",
    title: "Nữ anh hùng dân tộc",
    era: "Bắc thuộc",
    description: "Biểu tượng ý chí độc lập trong cuộc khởi nghĩa chống quân Ngô.",
    imageUrl: "/card.jpg",
    avatarUrl: "/card.jpg",
  },
];

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

async function fetchHeroCharacters(): Promise<Character[]> {
  try {
    const res = await axiosServer.get("/characters", {
      params: { limit: 6, isPublished: true },
    });
    const content = res.data?.data?.content;
    if (Array.isArray(content) && content.length > 0) {
      return content.map(mapCharacter);
    }
    return fallbackCharacters;
  } catch {
    return fallbackCharacters;
  }
}

export default async function MarketingPage() {
  const heroCharacters = await fetchHeroCharacters();

  return (
    <div data-marketing-scroll className="w-full">
      <HeroSection initialCharacters={heroCharacters} />
      <Suspense fallback={<SectionSkeleton />}>
        <ProblemSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SolutionSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        {/* <ImpactSection /> */}
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ClosingSection />
      </Suspense>
    </div>
  );
}
