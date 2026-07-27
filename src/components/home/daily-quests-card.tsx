"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  MessageCircle,
  Check,
  CheckCircle2,
  Coins,
  Flame,
  Loader2,
  Trophy,
} from "lucide-react";
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
  { icon: typeof MessageCircle; color: string; bg: string; route: string }
> = {
  CHAT: { icon: MessageCircle, color: "var(--quest-chat)", bg: "var(--quest-chat-bg)", route: "/characters" },
  QUIZ: { icon: Trophy, color: "var(--quest-quiz)", bg: "var(--quest-quiz-bg)", route: "/quiz" },
  READ_CONTEXT: { icon: BookOpen, color: "var(--quest-read)", bg: "var(--quest-read-bg)", route: "/events" },
};

const WEEKDAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const STREAK_GREEN = "#16A34A";

function DailyQuestsSkeleton() {
  return (
    <div className="rounded-2xl border p-4 animate-pulse bg-card-light-bg border-card-light-border">
      <div className="h-5 w-40 rounded mb-4 bg-card-light-border" />
      <div className="flex justify-between mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-7 h-7 rounded-full bg-card-light-border" />
        ))}
      </div>
      <div className="h-16 rounded-xl mb-2 bg-card-light-border" />
      <div className="h-16 rounded-xl mb-2 bg-card-light-border" />
      <div className="h-16 rounded-xl bg-card-light-border" />
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
    <section className="rounded-3xl border p-5 md:p-6 bg-card-light-bg border-card-light-border shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* ── Khối streak ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Flame
            className="w-4 h-4"
            fill={data.studiedToday ? "currentColor" : "none"}
            style={{ color: "var(--streak-text)" }}
          />
          <h3 className="text-sm font-bold text-content-heading">
            Chuỗi ngày học
          </h3>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-content-heading">
            {data.streakCount}
          </span>
          <span className="text-xs font-semibold text-content-muted">
            ngày
          </span>
        </div>
      </div>

      {/* 7 chấm tuần T2 → CN */}
      <div className="flex justify-between mb-3 px-0.5">
        {data.week.map((d, i) => (
          <div key={d.date} className="flex flex-col items-center gap-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center ${
                d.studied
                  ? "bg-[#16A34A]"
                  : d.isToday
                    ? "bg-[var(--streak-bg)] border-[1.5px] border-[var(--streak-border)]"
                    : "bg-card-light-border"
              }`}
            >
              {d.studied ? <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} /> : null}
            </div>
            <span
              className={`text-[10px] font-semibold ${
                d.studied
                  ? "text-[#16A34A]"
                  : d.isToday
                    ? "text-[var(--streak-text)]"
                    : "text-content-muted"
              }`}
            >
              {WEEKDAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>

      {/* Kỷ lục + tổng ngày học */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="text-[11px] text-content-muted">
            Chuỗi dài nhất
          </p>
          <p className="text-sm font-bold mt-0.5 text-content-heading">
            {data.longestStreak} ngày
          </p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[11px] text-content-muted">
            Tổng ngày học
          </p>
          <p className="text-sm font-bold mt-0.5 text-content-heading">
            {data.totalStudyDays}
          </p>
        </div>
      </div>

      <div className="h-px my-3.5 bg-card-light-border" />

      {/* ── Nhiệm vụ hôm nay ── */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-content-heading">
          Nhiệm vụ hôm nay
        </h3>
        <span className="text-[11px] text-content-muted">
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
              className={`w-full flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-left transition-opacity bg-bg-surface border-card-light-border ${
                tappable ? "cursor-pointer" : "cursor-default"
              } ${q.claimed ? "opacity-75" : "opacity-100"}`}
            >
              {/* Icon màu theo loại nhiệm vụ */}
              <div
                className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center shrink-0"
                style={{ background: meta.bg }}
              >
                {q.completed ? (
                  <CheckCircle2 className="w-[18px] h-[18px] text-[#16A34A]" fill="currentColor" stroke="white" />
                ) : (
                  <Icon className="w-4 h-4" style={{ color: meta.color }} strokeWidth={2.5} />
                )}
              </div>

              {/* Tên + progress bar */}
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className={`text-[13px] font-semibold truncate ${
                    q.claimed ? "text-content-muted line-through" : "text-content-text"
                  }`}
                >
                  {q.title}
                </p>
                <div className="h-[5px] rounded-full overflow-hidden bg-card-light-border">
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
                  <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0 bg-[rgba(34,197,94,0.12)] text-[#16A34A]">
                    +{q.rewardTokens} 🎉
                  </span>
                ) : (
                  <span className="text-[11px] font-bold shrink-0 text-[#16A34A]">
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
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 shrink-0 min-w-[64px] justify-center cursor-pointer bg-[var(--streak-text)]"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <>
                      <Coins className="w-3 h-3 text-white" fill="currentColor" />
                      <span className="text-[12px] font-extrabold text-white">
                        +{q.rewardTokens}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-content-muted" />
                    <span className="text-[11px] font-bold text-content-muted">
                      {q.rewardTokens}
                    </span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-content-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
