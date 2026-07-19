"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpenIcon,
  CaretRightIcon,
  ChatCircleIcon,
  CheckIcon,
  CheckCircleIcon,
  CoinsIcon,
  FlameIcon,
  SpinnerIcon,
  TrophyIcon,
} from "@phosphor-icons/react";
import { useAuthStore } from "@/store/auth.store";
import { useClaimQuest, useGamificationToday } from "@/features/gamification/hooks";
import type { DailyQuest, QuestType } from "@/services/gamification.service";

/**
 * Thẻ "Hôm nay" trên trang chủ web — đối chiếu 1:1 với DailyQuestsCard trên mobile:
 * - Streak (chuỗi ngày học) + 7 chấm tuần + kỷ lục/tổng ngày học.
 * - Danh sách nhiệm vụ hôm nay: icon màu riêng theo loại, progress bar, bấm vào
 *   nhiệm vụ chưa xong sẽ điều hướng tới trang tương ứng; xong thì hiện nút nhận
 *   token; nhận rồi thì gạch tên + "Đã nhận".
 */

const QUEST_META: Record<
  QuestType,
  { icon: typeof ChatCircleIcon; color: string; bg: string; route: string }
> = {
  CHAT: { icon: ChatCircleIcon, color: "#B45309", bg: "rgba(180,83,9,0.12)", route: "/characters" },
  QUIZ: { icon: TrophyIcon, color: "#6D28D9", bg: "rgba(109,40,217,0.10)", route: "/quiz" },
  READ_CONTEXT: { icon: BookOpenIcon, color: "#0F766E", bg: "rgba(15,118,110,0.10)", route: "/events" },
};

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const STREAK_GREEN = "#16A34A";

function DailyQuestsSkeleton() {
  return (
    <div
      className="rounded-2xl border p-4 animate-pulse"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="h-5 w-40 rounded mb-4" style={{ background: "var(--card-light-border)" }} />
      <div className="flex justify-between mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-7 h-7 rounded-full" style={{ background: "var(--card-light-border)" }} />
        ))}
      </div>
      <div className="h-16 rounded-xl mb-2" style={{ background: "var(--card-light-border)" }} />
      <div className="h-16 rounded-xl mb-2" style={{ background: "var(--card-light-border)" }} />
      <div className="h-16 rounded-xl" style={{ background: "var(--card-light-border)" }} />
    </div>
  );
}

export function DailyQuestsCard() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError } = useGamificationToday();
  const { mutateAsync: claim, isPending: claiming } = useClaimQuest();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);

  useEffect(() => {
    if (!justClaimed) return;
    const t = setTimeout(() => setJustClaimed(null), 2500);
    return () => clearTimeout(t);
  }, [justClaimed]);

  if (!isAuthenticated) return null;
  if (isLoading) return <DailyQuestsSkeleton />;
  if (isError || !data) return null;

  async function handleClaim(quest: DailyQuest) {
    if (claiming) return;
    setClaimingId(quest.id);
    try {
      await claim(quest.id);
      setJustClaimed(quest.id);
    } catch {
      // Lỗi (đã nhận rồi / chưa xong) — invalidate của hook sẽ tự đồng bộ lại UI
    } finally {
      setClaimingId(null);
    }
  }

  const doneCount = data.quests.filter((q) => q.completed).length;

  return (
    <section
      className="rounded-2xl border p-4 md:p-5"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      {/* ── Khối streak ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <FlameIcon
            className="w-4 h-4"
            weight={data.studiedToday ? "fill" : "regular"}
            style={{ color: "var(--streak-text)" }}
          />
          <h3 className="text-sm font-bold" style={{ color: "var(--content-heading)" }}>
            Chuỗi ngày học
          </h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black" style={{ color: "var(--content-heading)" }}>
            {data.streakCount}
          </span>
          <span className="text-xs font-semibold" style={{ color: "var(--content-muted)" }}>
            ngày
          </span>
        </div>
      </div>

      {/* 7 chấm tuần T2 → CN */}
      <div className="flex justify-between mb-3 px-0.5">
        {data.week.map((d, i) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: d.studied
                  ? STREAK_GREEN
                  : d.isToday
                    ? "var(--streak-bg)"
                    : "var(--card-light-border)",
                border: d.isToday && !d.studied ? `1.5px solid var(--streak-border)` : undefined,
              }}
            >
              {d.studied ? <CheckIcon className="w-3.5 h-3.5" weight="bold" style={{ color: "#fff" }} /> : null}
            </div>
            <span
              className="text-[10px] font-semibold"
              style={{
                color: d.studied
                  ? STREAK_GREEN
                  : d.isToday
                    ? "var(--streak-text)"
                    : "var(--content-muted)",
              }}
            >
              {WEEKDAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Kỷ lục + tổng ngày học */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px]" style={{ color: "var(--content-muted)" }}>
            Chuỗi dài nhất
          </p>
          <p className="text-sm font-bold mt-0.5" style={{ color: "var(--content-heading)" }}>
            {data.longestStreak} ngày
          </p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[11px]" style={{ color: "var(--content-muted)" }}>
            Tổng ngày học
          </p>
          <p className="text-sm font-bold mt-0.5" style={{ color: "var(--content-heading)" }}>
            {data.totalStudyDays}
          </p>
        </div>
      </div>

      <div className="h-px my-3.5" style={{ background: "var(--card-light-border)" }} />

      {/* ── Nhiệm vụ hôm nay ── */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold" style={{ color: "var(--content-heading)" }}>
          Nhiệm vụ hôm nay
        </h3>
        <span className="text-[11px]" style={{ color: "var(--content-muted)" }}>
          {doneCount}/{data.quests.length} hoàn thành
        </span>
      </div>

      <div className="space-y-2">
        {data.quests.map((q) => {
          const meta = QUEST_META[q.type] ?? QUEST_META.CHAT;
          const Icon = meta.icon;
          const busy = claimingId === q.id;
          const celebrated = justClaimed === q.id;
          const tappable = !q.completed;

          return (
            <div
              key={q.id}
              role={tappable ? "button" : undefined}
              tabIndex={tappable ? 0 : undefined}
              onClick={tappable ? () => router.push(meta.route) : undefined}
              onKeyDown={
                tappable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(meta.route);
                      }
                    }
                  : undefined
              }
              className="w-full flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-opacity"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--card-light-border)",
                cursor: tappable ? "pointer" : "default",
                opacity: q.claimed ? 0.75 : 1,
              }}
            >
              {/* Icon màu theo loại nhiệm vụ */}
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: meta.bg }}
              >
                {q.completed ? (
                  <CheckCircleIcon className="w-[18px] h-[18px]" weight="fill" style={{ color: STREAK_GREEN }} />
                ) : (
                  <Icon className="w-4 h-4" weight="bold" style={{ color: meta.color }} />
                )}
              </div>

              {/* Tên + progress bar */}
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className="text-[13px] font-semibold truncate"
                  style={{
                    color: q.claimed ? "var(--content-muted)" : "var(--content-text)",
                    textDecoration: q.claimed ? "line-through" : undefined,
                  }}
                >
                  {q.title}
                </p>
                <div className="h-[5px] rounded-full overflow-hidden" style={{ background: "var(--card-light-border)" }}>
                  <div
                    className="h-full rounded-full transition-[width]"
                    style={{
                      background: q.completed ? STREAK_GREEN : meta.color,
                      width: `${Math.min(100, Math.round((q.progress / q.target) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Bên phải: thưởng / nút nhận / đã nhận / mũi tên */}
              {q.claimed ? (
                celebrated ? (
                  <span
                    className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ background: "rgba(34,197,94,0.12)", color: STREAK_GREEN }}
                  >
                    +{q.rewardTokens} 🎉
                  </span>
                ) : (
                  <span className="text-[11px] font-bold shrink-0" style={{ color: STREAK_GREEN }}>
                    Đã nhận
                  </span>
                )
              ) : q.completed ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleClaim(q);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      void handleClaim(q);
                    }
                  }}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 shrink-0 min-w-[64px] justify-center cursor-pointer"
                  style={{ background: "var(--streak-text)" }}
                >
                  {busy ? (
                    <SpinnerIcon className="w-3.5 h-3.5 animate-spin" style={{ color: "#fff" }} />
                  ) : (
                    <>
                      <CoinsIcon className="w-3 h-3" weight="fill" style={{ color: "#fff" }} />
                      <span className="text-[12px] font-extrabold" style={{ color: "#fff" }}>
                        +{q.rewardTokens}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-0.5">
                    <CoinsIcon className="w-3 h-3" style={{ color: "var(--content-muted)" }} />
                    <span className="text-[11px] font-bold" style={{ color: "var(--content-muted)" }}>
                      {q.rewardTokens}
                    </span>
                  </span>
                  <CaretRightIcon className="w-3.5 h-3.5" style={{ color: "var(--content-muted)" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
