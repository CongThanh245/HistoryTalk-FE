"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, Star, ChevronRight } from "lucide-react";
import { homeService, type SuggestedQuizItem } from "@/services/home.service";
import { queryKeys } from "@/shared/query-key";

// ── Skeleton ──────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border animate-pulse"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg" style={{ background: "var(--card-light-border)" }} />
        <div className="space-y-2">
          <div className="h-3 w-40 rounded" style={{ background: "var(--card-light-border)" }} />
          <div className="h-2.5 w-28 rounded" style={{ background: "var(--card-light-border)" }} />
        </div>
      </div>
      <div className="h-5 w-14 rounded-full" style={{ background: "var(--card-light-border)" }} />
    </div>
  );
}

// ── Tag style helper ──────────────────────────────────────
function tagStyle(tag: string) {
  if (tag === "Mới")       return { color: "var(--accent-teal)",   bg: "rgba(47,111,115,0.12)"  };
  if (tag === "Thử thách") return { color: "var(--accent-danger)", bg: "rgba(184,50,42,0.10)"   };
  return                          { color: "var(--gold-on-light)", bg: "rgba(160,120,40,0.10)"  };
}

// ── Row ───────────────────────────────────────────────────
function SuggestedQuizRow({ item }: { item: SuggestedQuizItem }) {
  const { color, bg } = tagStyle(item.tag);

  return (
    <Link
      href="/quiz"
      className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 group"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,177,98,0.10)" }}
        >
          <Star className="w-4 h-4" style={{ color: "var(--burning-flame)" }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--content-text)" }}>
            {item.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
            {item.questions} câu · {item.difficulty}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: bg, color }}
        >
          {item.tag}
        </span>
        <ChevronRight
          className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "var(--gold-on-light)" }}
        />
      </div>
    </Link>
  );
}

// ── Main component ────────────────────────────────────────
export function SuggestedQuiz() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.home.suggestedQuiz,
    queryFn: homeService.getSuggestedQuiz,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4" style={{ color: "var(--burning-flame)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
            Gợi ý cho bạn
          </h2>
        </div>
        <Link
          href="/quiz"
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--gold-on-light)" }}
        >
          Xem thêm <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          : data?.map((item, i) => <SuggestedQuizRow key={i} item={item} />)
        }
      </div>
    </section>
  );
}