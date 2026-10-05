"use client";

import { Trophy } from "lucide-react";
import { ArchiveHeading } from "@/components/commons/archive-heading";
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
    <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 animate-pulse rounded-[2px] border bg-[var(--bg-surface)] border-[var(--text-primary)]">
      <div className="w-10 h-8 bg-card-light-border" />
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
    <div className="flex flex-col gap-2 sm:gap-3 p-3 sm:p-4 rounded-[2px] border bg-[var(--bg-surface)] border-[var(--text-primary)]">
      {/* Score + icon */}
      <div className="flex items-start justify-between pb-2 border-b border-[var(--border-default)]">
        <span className="font-display text-3xl sm:text-4xl font-extrabold leading-none" style={{ color }}>
          {item.percentage}%
        </span>
        <Trophy className="w-4 h-4 text-content-muted" aria-hidden="true" />
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
      <ArchiveHeading
        label="Khảo thí"
        title="Lần thi gần đây"
        description={totalQuizzesAttempted ? `Bạn đã làm ${totalQuizzesAttempted} bài, điểm TB ${averageScorePercentage}%` : undefined}
        action={{ href: "/quiz", text: "Xem tất cả" }}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 gap-3">
        {isAuthenticated && isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : results.map((item) => <RecentQuizCard key={item.sessionId} item={item} />)}
      </div>
    </section>
  );
}
