"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { TimerIcon, ArrowRight, Trophy } from "@phosphor-icons/react";
import { quizService, type QuizResult } from "@/services/quiz.service";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";

// ── Skeleton ──────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl border animate-pulse"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      <div
        className="w-10 h-10 rounded-xl"
        style={{ background: "var(--card-light-border)" }}
      />
      <div className="space-y-2">
        <div
          className="h-3 w-3/4 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
        <div
          className="h-2.5 w-1/2 rounded"
          style={{ background: "var(--card-light-border)" }}
        />
      </div>
    </div>
  );
}
// ── Score badge ───────────────────────────────────────────
// ── Helper ────────────────────────────────────────────────
// ── Row ───────────────────────────────────────────────────
function RecentQuizCard({ item }: { item: QuizResult }) {
  const color =
    item.percentage >= 85
      ? "var(--accent-teal)"
      : item.percentage >= 70
        ? "var(--gold-on-light)"
        : "var(--burning-flame)";

  return (
    <div
      className="flex flex-col gap-3 p-4 rounded-2xl border transition-colors duration-150 cursor-pointer hover:opacity-80"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      {/* Icon + score badge */}
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(160,120,40,0.10)" }}
        >
          <Trophy
            className="w-5 h-5"
            style={{ color: "var(--gold-on-light)" }}
          />
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: `${color}18`, color }}
        >
          {item.percentage}%
        </span>
      </div>

      {/* Title + meta */}
      <div className="min-w-0">
        <p
          className="text-sm font-medium leading-snug line-clamp-2"
          style={{ color: "var(--content-text)" }}
        >
          {item.quizTitle}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--content-muted)" }}>
          {item.score}/{item.totalQuestions} câu
        </p>
      </div>
    </div>
  );
}
// ── Main component ────────────────────────────────────────
export function RecentQuiz() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.quizzes.myResults,
    queryFn: () => quizService.getMyResults({ page: 0, size: 3 }),
    enabled: isAuthenticated,
  });

  const results = data?.content ?? [];

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TimerIcon
            className="w-4 h-4"
            style={{ color: "var(--gold-on-light)" }}
          />
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--content-heading)" }}
          >
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {isAuthenticated && isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : results.length === 0 ? (
          <p
            className="col-span-full text-sm text-center py-4"
            style={{ color: "var(--content-muted)" }}
          >
            Chưa có lịch sử làm bài
          </p>
        ) : (
          results.map((item) => (
            <RecentQuizCard key={item.sessionId} item={item} />
          ))
        )}
      </div>
    </section>
  );
}



