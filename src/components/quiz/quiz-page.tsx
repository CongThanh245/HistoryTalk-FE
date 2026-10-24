"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { History, ListChecks, Search } from "lucide-react";
import { useQuizSets, useMyQuizResults } from "@/features/quiz/hooks";
import { useEvents } from "@/features/events/hooks";
import { useAuthStore } from "@/store/auth.store";
import { type QuizEra, type QuizResult } from "@/services/quiz.service";
import { cn } from "@/lib/utils/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectEmpty,
  SelectSearch,
  SelectTrigger,
  SelectValue,
  useSelectSearch,
} from "@/components/ui/select";
import { QuizStatsBar } from "./quiz-stats-bar";
import { QuizRecentResults } from "./quiz-recent-result";
import { QuizHistoryView } from "./quiz-history-view";
import { QuizCard } from "./quiz-card";

type EraFilter = "ALL" | Exclude<QuizEra, "ALL">;
type QuizView = "list" | "history";
const ALL_CONTEXTS = "ALL";

const ERA_FILTERS: { label: string; value: EraFilter }[] = [
  { label: "Tất cả", value: "ALL" },
  { label: "Cổ đại", value: "ANCIENT" },
  { label: "Trung đại", value: "MEDIEVAL" },
  { label: "Cận đại", value: "MODERN" },
  { label: "Hiện đại", value: "CONTEMPORARY" },
];

export function QuizPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [search, setSearch] = useState("");
  const [selectedEra, setSelectedEra] = useState<EraFilter>("ALL");
  const contextSearch = useSelectSearch();
  const contextIdParam = searchParams.get("contextId");
  const [selectedContext, setSelectedContext] = useState<string>(
    contextIdParam ?? ALL_CONTEXTS,
  );
  const activeView: QuizView =
    searchParams.get("view") === "history" ? "history" : "list";

  // Den tu banner "Kiem tra kien thuc" o trang chi tiet boi canh — ap lai
  // filter nay moi khi param doi, ke ca khi trang quiz da duoc mount san.
  useEffect(() => {
    if (contextIdParam) setSelectedContext(contextIdParam);
  }, [contextIdParam]);

  const { data: quizData, isLoading: quizzesLoading } = useQuizSets();
  const allQuizzes = useMemo(() => quizData?.content ?? [], [quizData?.content]);

  // Danh sach "tran danh" (boi canh lich su) suy ra tu chinh cac quiz da tai,
  // khong can goi them API rieng.
  const contextFilterOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const q of allQuizzes) {
      if (q.contextId && q.contextTitle && !seen.has(q.contextId)) {
        seen.set(q.contextId, q.contextTitle);
      }
    }
    return Array.from(seen.entries())
      .sort(([, a], [, b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));
  }, [allQuizzes]);

  // Quizzes have no cover of their own: reuse the historical context's image (same query the events page caches).
  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const contextImages = useMemo(() => {
    const map = new Map<string, string | null | undefined>();
    for (const event of eventsData?.content ?? []) map.set(event.id, event.imageUrl);
    return map;
  }, [eventsData?.content]);

  const { data: resultsData, isLoading: resultsLoading } = useMyQuizResults(
    { page: 0, size: 50 },
    isAuthenticated,
  );
  const results: QuizResult[] = useMemo(
    () => resultsData?.content ?? [],
    [resultsData?.content],
  );

  const filteredQuizzes = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return allQuizzes.filter((q) => {
      const matchSearch =
        !keyword ||
        q.title.toLowerCase().includes(keyword) ||
        q.contextTitle?.toLowerCase().includes(keyword);
      const matchEra = selectedEra === "ALL" || q.era === selectedEra;
      const matchContext =
        selectedContext === ALL_CONTEXTS || q.contextId === selectedContext;
      return matchSearch && matchEra && matchContext;
    });
  }, [allQuizzes, search, selectedEra, selectedContext]);

  const avgScore = useMemo(() => {
    if (!results.length) return 0;
    const totalScore = results.reduce((acc, r) => acc + r.score, 0);
    const totalQuestions = results.reduce((acc, r) => acc + r.totalQuestions, 0);
    const averageScore = Number((totalScore / results.length).toFixed(1));
    const averageTotal = Number((totalQuestions / results.length).toFixed(1));
    return `${averageScore}/${averageTotal}`;
  }, [results]);

  const completedCount = resultsData?.totalElements ?? results.length;
  // Until the learner has submitted something, the stats strip and history column are just zeros and an empty box.
  const hasHistory = isAuthenticated && (resultsLoading || completedCount > 0);

  const handleStartQuiz = (quizId: string) => {
    router.push(`/quiz/${quizId}`);
  };

  const handleViewChange = (view: QuizView) => {
    router.push(view === "history" ? "/quiz?view=history" : "/quiz");
  };

  return (
    <main className="min-h-screen bg-[var(--bg-content)]">
      <div className="mx-auto max-w-7xl">
        <section className="archive-heading mb-4 flex-col items-stretch md:mb-5 md:flex-row md:items-end">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between w-full">
            <div className="max-w-2xl min-w-0">
              <h1 className="archive-title">
                Câu đố lịch sử
              </h1>
              <p className="line-clamp-2">
                Chọn một bộ đề, làm nhanh theo bối cảnh lịch sử và xem lại đáp án ngay sau khi nộp bài.
              </p>
            </div>

            <div role="group" aria-label="Chế độ xem" className="inline-flex w-fit shrink-0 gap-0.5 rounded-lg bg-[var(--status-neutral-bg)] p-0.5">
              {[
                { label: "Danh sách đề", value: "list" as const, icon: ListChecks },
                { label: "Lịch sử làm bài", value: "history" as const, icon: History },
              ].map((item) => {
                const Icon = item.icon;
                const active = activeView === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => handleViewChange(item.value)}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-md px-3.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
                      active
                        ? "bg-[var(--bg-surface)] font-semibold text-content-heading shadow-[var(--shadow-soft)]"
                        : "font-medium text-[var(--text-secondary)] hover:text-content-heading",
                    )}
                  >
                    <Icon size={16} aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {hasHistory && (
          <QuizStatsBar
            totalQuizzes={quizData?.totalElements ?? 0}
            completedCount={completedCount}
            averageScore={avgScore}
          />
        )}

        {activeView === "history" ? (
          <QuizHistoryView
            results={results}
            isLoading={resultsLoading}
            onRetake={handleStartQuiz}
          />
        ) : (
          <div className={cn("grid grid-cols-[minmax(0,1fr)] gap-4 md:gap-5", hasHistory && "lg:grid-cols-[minmax(0,1fr)_300px]")}>
            <section className="min-w-0">
              <div className="mb-4 flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 transition-colors focus-within:border-[var(--accent-gold)] focus-within:ring-2 focus-within:ring-[var(--accent-gold)]/20 sm:max-w-[360px]">
                    <Search size={16} className="shrink-0 text-content-muted" aria-hidden="true" />
                    <span className="sr-only">Tìm bộ đề</span>
                    <input
                      type="search"
                      placeholder="Tìm bộ đề hoặc trận đánh..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none text-content-heading placeholder:text-content-subtle"
                    />
                  </label>

                  {contextFilterOptions.length > 0 && (
                    <Select
                      value={selectedContext}
                      onValueChange={setSelectedContext}
                      onOpenChange={contextSearch.onOpenChange}
                    >
                      <SelectTrigger size="sm" className="h-10 w-full rounded-lg text-sm sm:w-auto sm:min-w-[200px]">
                        <SelectValue placeholder="Trận đánh" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {contextFilterOptions.length > 7 && (
                          <SelectSearch value={contextSearch.search} onChange={contextSearch.setSearch} placeholder="Tìm trận đánh..." />
                        )}
                        {(!contextSearch.query || selectedContext === ALL_CONTEXTS) && (
                          <SelectItem value={ALL_CONTEXTS}>Tất cả trận đánh</SelectItem>
                        )}
                        {!contextFilterOptions.some((c) => contextSearch.matches(c.label)) && <SelectEmpty />}
                        {contextFilterOptions.filter((c) => c.value === selectedContext || contextSearch.matches(c.label)).map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div role="group" aria-label="Lọc theo thời kỳ" className="flex flex-wrap items-center gap-2">
                    {ERA_FILTERS.map((f) => {
                      const active = selectedEra === f.value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setSelectedEra(f.value)}
                          className={cn(
                            "inline-flex h-8 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
                            active
                              ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                              : "border-[var(--border-default)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-content-heading",
                          )}
                        >
                          {f.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-sm tabular-nums text-content-muted" aria-live="polite">
                    {filteredQuizzes.length} bộ đề
                  </p>
                </div>
              </div>

              {quizzesLoading ? (
                <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4", hasHistory ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4")} aria-busy="true" aria-label="Đang tải bộ đề">
                  {Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="overflow-hidden rounded-xl border border-border-card bg-[var(--bg-surface)]">
                      <div className="aspect-[16/9] animate-pulse bg-[var(--bg-deep)]" />
                      <div className="space-y-2 p-4">
                        <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--bg-deep)]" />
                        <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--bg-deep)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredQuizzes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-16 text-center">
                  <p className="text-base font-semibold text-content-heading">
                    Không tìm thấy bộ đề
                  </p>
                  <p className="mt-1 text-sm text-content-muted">
                    Thử đổi bộ lọc hoặc từ khóa tìm kiếm.
                  </p>
                </div>
              ) : (
                <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4", hasHistory ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4")}>
                  {filteredQuizzes.map((quiz, index) => {
                    const featured = index === 0 && filteredQuizzes.length > 2;
                    return (
                      <div
                        key={quiz.quizId}
                        className={cn("animate-[quiz-card-in_260ms_ease-out_both]", featured && "sm:col-span-2")}
                        style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                      >
                        <QuizCard
                          quiz={quiz}
                          onStart={handleStartQuiz}
                          featured={featured}
                          imageUrl={quiz.contextId ? contextImages.get(quiz.contextId) : undefined}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {hasHistory && (
              <aside className="lg:sticky lg:top-6 lg:self-start">
                <QuizRecentResults
                  results={results.slice(0, 10)}
                  isLoading={resultsLoading}
                  onViewAll={() => handleViewChange("history")}
                />
              </aside>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes quiz-card-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}
