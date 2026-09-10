"use client";

import Link from "next/link";
import { Timer, ArrowRight, Trophy } from "lucide-react";
import type { DashboardRecentQuiz } from "@/services/dashboard.service";
import { useMyDashboard } from "@/features/dashboard/hooks";
import { useAuthStore } from "@/store/auth.store";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// ── Skeleton ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border animate-pulse bg-card-light-bg border-card-light-border">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-card-light-border" />
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded bg-card-light-border" />
        <div className="h-2.5 w-1/2 rounded bg-card-light-border" />
      </div>
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────
function RecentQuizCard({ item }: { item: DashboardRecentQuiz }) {
  const color =
    item.percentage >= 85
      ? "var(--accent-teal)"
      : item.percentage >= 70
        ? "var(--gold-on-light)"
        : "var(--burning-flame)";

  return (
    <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-colors duration-150 cursor-pointer hover:opacity-80 bg-card-light-bg border-card-light-border">
      {/* Icon + score badge */}
      <div className="flex items-start justify-between">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-[rgba(160,120,40,0.10)]">
          <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gold-on-light" />
        </div>
        <span
          className="text-[11px] sm:text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {item.percentage}%
        </span>
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-medium leading-snug line-clamp-2 text-content-text">
          {item.quizTitle}
        </p>
        <p className="text-[11px] sm:text-xs mt-1 text-content-muted">
          {formatDate(item.completedAt)}
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export function RecentQuiz() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useMyDashboard();

  const results = data?.learning.recentQuizzes.slice(0, 4) ?? [];
  const { totalQuizzesAttempted, averageScorePercentage } = data?.learning ?? {};

  if (!isLoading && results.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3 md:mb-4">
        <div className="flex items-center gap-2">
          <Timer className="w-4 h-4 text-gold-on-light" />
          <div>
            <h2 className="font-title text-lg md:text-xl font-bold text-content-heading">
              Lần thi gần đây
            </h2>
            {!!totalQuizzesAttempted && (
              <p className="text-[11px] text-content-muted">
                Bạn đã làm {totalQuizzesAttempted} bài, điểm TB {averageScorePercentage}%
              </p>
            )}
          </div>
        </div>
        <Link
          href="/quiz"
          className="flex items-center gap-1 text-xs text-gold-on-light"
        >
          Xem tất cả <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {isAuthenticated && isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : results.map((item) => <RecentQuizCard key={item.sessionId} item={item} />)}
      </div>
    </section>
  );
}
