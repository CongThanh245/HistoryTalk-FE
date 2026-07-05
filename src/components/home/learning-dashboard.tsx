"use client";

import { ChartBarIcon, CoinsIcon, SparkleIcon, TrophyIcon } from "@phosphor-icons/react";
import { useMyDashboard } from "@/features/dashboard/hooks";
import { useAuthStore } from "@/store/auth.store";
import { mapEraLabel } from "@/constants/eras";
import type { DashboardTopCharacter } from "@/services/dashboard.service";

// ── Skeleton ──────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 animate-pulse">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl border h-56"
          style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
        />
      ))}
    </div>
  );
}

const numberFormat = (value: number) => value.toLocaleString("vi-VN");

// Thứ tự thời gian cố định — quyết định độ đậm nhạt của dải màu (ordinal ramp),
// không phụ thuộc vào thứ tự xuất hiện trong dữ liệu trả về.
const ERA_ORDER = ["ANCIENT", "MEDIEVAL", "MODERN", "CONTEMPORARY"];
const ERA_RAMP_STEPS = [42, 61, 80, 100];

function eraColor(era: string): string {
  const idx = ERA_ORDER.indexOf(era.toUpperCase());
  const pct = ERA_RAMP_STEPS[idx] ?? 100;
  return `color-mix(in srgb, var(--gold-on-light) ${pct}%, var(--card-light-border))`;
}

// ── Score meter (radial) ────────────────────────────────────
function ScoreMeter({ percentage, totalQuizzes }: { percentage: number; totalQuizzes: number }) {
  const color =
    percentage >= 70
      ? "var(--status-success)"
      : percentage >= 40
        ? "var(--status-warning)"
        : "var(--accent-danger)";
  const label = percentage >= 70 ? "Tốt" : percentage >= 40 ? "Khá" : "Cần cố gắng";

  return (
    <div className="flex items-center gap-4 mb-4">
      <div
        className="relative shrink-0 rounded-full"
        style={{
          width: 84,
          height: 84,
          background: `conic-gradient(${color} ${percentage * 3.6}deg, var(--card-light-border) 0deg)`,
        }}
      >
        <div
          className="absolute inset-2.25 rounded-full flex items-center justify-center"
          style={{ background: "var(--card-light-bg)" }}
        >
          <span className="text-lg font-bold" style={{ color: "var(--content-text)" }}>
            {percentage}%
          </span>
        </div>
      </div>
      <div>
        <span
          className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}
        >
          {label}
        </span>
        <p className="text-xs mt-1.5" style={{ color: "var(--content-muted)" }}>
          Điểm trung bình · {totalQuizzes} bài đã làm
        </p>
      </div>
    </div>
  );
}

// ── Segmented part-to-whole bar ─────────────────────────────
function SegmentBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((sum, s) => sum + s.value, 0) || 1;

  return (
    <div>
      <div className="flex h-2.5 w-full rounded-full overflow-hidden gap-0.5" style={{ background: "var(--card-light-bg)" }}>
        {shown.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {shown.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
            <span className="text-[11px]" style={{ color: "var(--content-muted)" }}>
              {s.label}{" "}
              <span className="font-semibold" style={{ color: "var(--content-text)" }}>
                {numberFormat(s.value)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ranked bar list ──────────────────────────────────────────
function RankedBars({ items }: { items: DashboardTopCharacter[] }) {
  const max = Math.max(1, ...items.map((c) => c.messageCount));

  return (
    <div className="space-y-2.5">
      {items.map((character, i) => (
        <div key={character.characterId} className="flex items-center gap-2.5">
          <span
            className="w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-micro font-bold"
            style={{
              background: i === 0 ? "var(--gold-on-light)" : "var(--card-light-border)",
              color: i === 0 ? "var(--text-inverse)" : "var(--content-muted)",
            }}
          >
            {i + 1}
          </span>
          <span className="text-xs w-20 shrink-0 truncate" style={{ color: "var(--content-text)" }}>
            {character.name}
          </span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--card-light-border)" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(character.messageCount / max) * 100}%`, background: "var(--gold-on-light)" }}
            />
          </div>
          <span className="text-[11px] w-8 text-right shrink-0" style={{ color: "var(--content-muted)" }}>
            {character.messageCount}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export function LearningDashboard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading } = useMyDashboard();

  if (!isAuthenticated) return null;
  if (isLoading || !data) return <DashboardSkeleton />;

  const { learning, aiUsage } = data;
  const hasQuizData = learning.totalQuizzesAttempted > 0;
  const eraEntries = Object.entries(learning.eraDistribution).sort(
    ([a], [b]) => ERA_ORDER.indexOf(a.toUpperCase()) - ERA_ORDER.indexOf(b.toUpperCase()),
  );
  const hasLearningCard = hasQuizData || eraEntries.length > 0;
  const hasTokenUsage = aiUsage.totalTokensUsed > 0;
  const hasTopCharacters = aiUsage.topCharacters.length > 0;

  if (!hasLearningCard && !hasTokenUsage && !hasTopCharacters && aiUsage.currentBalance === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <ChartBarIcon className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
        <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
          Hoạt động của bạn
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8 items-start">
        {/* Learning card */}
        {hasLearningCard && (
          <div
            className="rounded-2xl border p-4 md:p-5"
            style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                Kết quả học tập
              </h3>
            </div>

            {hasQuizData && (
              <ScoreMeter percentage={learning.averageScorePercentage} totalQuizzes={learning.totalQuizzesAttempted} />
            )}

            {eraEntries.length > 0 && (
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "var(--content-muted)" }}>
                  Phân bố theo thời kỳ
                </p>
                <SegmentBar
                  segments={eraEntries.map(([era, count]) => ({
                    label: mapEraLabel(era),
                    value: count,
                    color: eraColor(era),
                  }))}
                />
              </div>
            )}
          </div>
        )}

        {/* AI usage card */}
        <div
          className={`rounded-2xl border p-4 md:p-5 ${!hasLearningCard ? "lg:col-span-2" : ""}`}
          style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SparkleIcon className="w-4 h-4" style={{ color: "var(--accent-teal)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
                Token đã sử dụng
              </h3>
            </div>
            {aiUsage.tier && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: "rgba(160,120,40,0.10)", color: "var(--gold-on-light)" }}
              >
                {aiUsage.tier}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <CoinsIcon className="w-5 h-5 shrink-0" style={{ color: "var(--gold-on-light)" }} />
            <div>
              <p className="text-base font-bold" style={{ color: "var(--content-text)" }}>
                {numberFormat(aiUsage.currentBalance)}
              </p>
              <p className="text-[11px]" style={{ color: "var(--content-muted)" }}>
                Token còn lại
              </p>
            </div>
          </div>

          {hasTokenUsage && (
            <div className="mb-4">
              <p className="text-xs font-medium mb-2" style={{ color: "var(--content-muted)" }}>
                Prompt / Completion
              </p>
              <SegmentBar
                segments={[
                  {
                    label: "Prompt",
                    value: aiUsage.promptTokens,
                    color: "color-mix(in srgb, var(--gold-on-light) 55%, var(--card-light-border))",
                  },
                  { label: "Completion", value: aiUsage.completionTokens, color: "var(--gold-on-light)" },
                ]}
              />
            </div>
          )}

          {hasTopCharacters && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: "var(--content-muted)" }}>
                Nhân vật trò chuyện nhiều nhất
              </p>
              <RankedBars items={aiUsage.topCharacters.slice(0, 3)} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
