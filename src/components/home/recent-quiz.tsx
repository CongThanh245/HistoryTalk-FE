"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TimerIcon, ArrowRight, Trophy } from "@phosphor-icons/react";
import { homeService, type RecentQuizItem } from "@/services/home.service";
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
          <div className="h-3 w-36 rounded" style={{ background: "var(--card-light-border)" }} />
          <div className="h-2.5 w-24 rounded" style={{ background: "var(--card-light-border)" }} />
        </div>
      </div>
      <div className="h-5 w-10 rounded-full" style={{ background: "var(--card-light-border)" }} />
    </div>
  );
}

// ── Score badge ───────────────────────────────────────────
function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 85 ? "var(--accent-teal)"
    : score >= 70 ? "var(--gold-on-light)"
    : "var(--burning-flame)";

  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${color}18`, color }}
    >
      {score}%
    </span>
  );
}

// ── Row ───────────────────────────────────────────────────
function RecentQuizRow({ item }: { item: RecentQuizItem }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors duration-150"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(160,120,40,0.10)" }}
        >
          <Trophy className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
        </div>
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--content-text)" }}>
            {item.title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
            {item.questions} câu · {item.time}
          </p>
        </div>
      </div>
      <ScoreBadge score={item.score} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export function RecentQuiz() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.home.recentQuiz,
    queryFn: homeService.getRecentQuiz,
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TimerIcon className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
            Lần thi gần đây
          </h2>
        </div>
        <Link
          href="/quiz"
          className="flex items-center gap-1 text-xs"
          style={{ color: "var(--gold-on-light)" }}
        >
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
          : data?.map((item, i) => <RecentQuizRow key={i} item={item} />)
        }
      </div>
    </section>
  );
}