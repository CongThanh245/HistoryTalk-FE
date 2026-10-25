"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  MessageCircle,
  CheckCircle2,
  Coins,
  Flame,
  Loader2,
  Trophy,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useClaimQuest, useGamificationToday } from "@/features/gamification/hooks";
import type { DailyQuest, QuestType } from "@/services/gamification.service";
import { useEntitlements } from "@/features/saas/entitlements";
import { StudyCalendar } from "./study-calendar";
import { celebrate, flyCoins } from "@/lib/celebrate";

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
const STREAK_GREEN = "var(--jade)";
const EMPTY_WEEK = WEEKDAY_LABELS.map((_, i) => ({
  date: `empty-${i}`,
  weekday: i,
  studied: false,
  isToday: false,
}));

/**
 * School accounts: the gamification API may reject the role (403). Show a mock day so the card still works;
 * rewards then go to today's quota (see quota-bonus.ts). Swap for the real API once it accepts school roles.
 */

function DailyQuestsSkeleton() {
  return (
    <div className="home-quest-ledger home-quest-skeleton p-4 animate-pulse">
      <div className="h-5 w-40 rounded mb-4 bg-card-light-border" />
      <div className="flex justify-between mb-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="w-7 h-7 bg-card-light-border" />
        ))}
      </div>
      <div className="h-14 mb-2 bg-card-light-border" />
      <div className="h-14 mb-2 bg-card-light-border" />
      <div className="h-14 bg-card-light-border" />
    </div>
  );
}

/** `compact` = the header popover version (smaller streak band). */
export function DailyQuestsCard({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const entitlements = useEntitlements();
  // BE chi mo /gamification cho CUSTOMER va admin — tai khoan truong (TEACHER, SCHOOL_STUDENT) bi 403 nen an the.
  const isSchoolAccount = entitlements.mode === "B2B";
  const { data, isLoading, isError } = useGamificationToday({ enabled: !isSchoolAccount });
  const { mutateAsync: claim, isPending: claiming } = useClaimQuest();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [justClaimed, setJustClaimed] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!justClaimed) return;
    const t = setTimeout(() => setJustClaimed(null), 2500);
    return () => clearTimeout(t);
  }, [justClaimed]);

  if (!isAuthenticated || isSchoolAccount) return null;
  if (isLoading) return <DailyQuestsSkeleton />;
  if (isError || !data) return null;

  async function handleClaim(quest: DailyQuest, from: Element) {
    if (claiming) return;
    setClaimingId(quest.id);
    try {
      await claim(quest.id);
      setJustClaimed(quest.id);
      void flyCoins(from);
      const allClaimed = quests.every((q) => q.id === quest.id || q.claimed);
      celebrate({
        text: allClaimed ? `Xong hết nhiệm vụ hôm nay! +${quest.rewardTokens} token 🎉` : `+${quest.rewardTokens} token! Làm tốt lắm 💰`,
        confetti: allClaimed,
      });
    } catch {
      // Lỗi (đã nhận rồi / chưa xong) — invalidate của hook sẽ tự đồng bộ lại UI
    } finally {
      setClaimingId(null);
    }
  }

  const quests = Array.isArray(data.quests) ? data.quests : [];
  const week = Array.isArray(data.week) && data.week.length > 0 ? data.week : EMPTY_WEEK;
  const doneCount = quests.filter((q) => q.completed).length;
  const streakCount = data.streakCount ?? 0;
  const streakMessage = data.studiedToday
    ? "Tuyệt! Bạn đã giữ lửa hôm nay."
    : streakCount > 0
      ? `Học hôm nay để giữ chuỗi ${streakCount} ngày.`
      : "Bắt đầu chuỗi ngày học đầu tiên hôm nay.";
  // "2026-10-05" → "5"; placeholder days fall back to the weekday label.
  const dayNumber = (date: string, i: number) => {
    const day = Number(date.slice(8, 10));
    return Number.isFinite(day) && day > 0 ? String(day) : WEEKDAY_LABELS[i];
  };

  return (
    <section className={`home-quest-ledger ${compact ? "is-compact" : ""}`} aria-label="Chuỗi ngày học và nhiệm vụ hôm nay">
      <div className="home-quest-ledger-inner">
      {/* ── Khối streak ── */}
      <button type="button" onClick={() => setCalendarOpen(true)} aria-haspopup="dialog" className="home-quest-hero focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--accent-gold)]">
        <span className={`home-quest-flame ${data.studiedToday ? "is-lit" : ""}`}>
          <Flame size={30} fill={data.studiedToday ? "currentColor" : "none"} aria-hidden="true" />
        </span>
        <span className="home-quest-hero-text min-w-0">
          <h2>Chuỗi ngày học</h2>
          <p>{streakMessage}</p>
        </span>
        <span className="home-quest-count">
          <strong>{streakCount}</strong><span>ngày</span>
          <CalendarDays size={18} className="ml-2 self-center" aria-hidden="true" />
        </span>
      </button>

      <div className="home-quest-body">
      <div className="home-quest-week" aria-label="Tiến độ học trong tuần">
        {week.map((d, i) => (
          <div key={d.date} className="home-quest-day">
            <span className="home-quest-day-label">{d.isToday ? "Hôm nay" : WEEKDAY_LABELS[i]}</span>
            <span className={`home-quest-day-tile ${d.studied ? "is-studied" : ""} ${d.isToday ? "is-today" : ""}`} aria-label={`${WEEKDAY_LABELS[i]}: ${d.studied ? "đã học" : d.isToday ? "hôm nay, chưa học" : "chưa học"}`}>
              {d.studied ? <Flame size={18} fill="currentColor" aria-hidden="true" /> : dayNumber(d.date, i)}
            </span>
          </div>
        ))}
      </div>

      <StudyCalendar today={data.date} open={calendarOpen} onOpenChange={setCalendarOpen} />

      <div className="home-quest-ledger-stats">
        <div>
          <span>Chuỗi dài nhất</span>
          <strong>{data.longestStreak ?? 0} ngày</strong>
        </div>
        <div>
          <span>Tổng ngày học</span>
          <strong>{data.totalStudyDays ?? 0}</strong>
        </div>
      </div>

      {/* ── Nhiệm vụ hôm nay ── */}
      <div className="home-quest-ledger-subhead">
        <h3>Nhiệm vụ hôm nay</h3>
        <span className="home-quest-done">
          <span className="home-quest-done-bar" aria-hidden="true">
            {quests.map((q) => <span key={q.id} className={q.completed ? "is-done" : ""} />)}
          </span>
          {doneCount}/{quests.length} hoàn thành
        </span>
      </div>

      <div className="home-quest-list">
        {quests.map((q) => {
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
              className={`home-quest-item w-full flex items-center gap-2.5 text-left ${
                tappable ? "cursor-pointer" : "cursor-default"
              } ${q.claimed ? "is-claimed" : ""}`}
            >
              {/* Icon màu theo loại nhiệm vụ */}
              <div
                className="home-quest-item-icon flex items-center justify-center shrink-0"
                style={{ background: q.completed ? "var(--jade)" : meta.color }}
              >
                {q.completed ? (
                  <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                ) : (
                  <Icon className="w-[18px] h-[18px]" strokeWidth={2.5} />
                )}
              </div>

              {/* Tên + progress bar */}
              <div className="flex-1 min-w-0 space-y-1">
                <p
                  className={`home-quest-item-title ${q.claimed ? "line-through" : ""}`}
                >
                  {q.title}
                </p>
                <div className="home-quest-progress-row">
                  <div className="home-quest-progress">
                    <div
                      className="h-full transition-[width] duration-500"
                      style={{
                        background: q.completed ? STREAK_GREEN : meta.color,
                        width: `${Math.min(100, Math.round((q.progress / Math.max(q.target, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="home-quest-progress-text">{Math.min(q.progress, q.target)}/{q.target}</span>
                </div>
              </div>

              {/* Bên phải: thưởng / nút nhận / đã nhận / mũi tên */}
              {q.claimed ? (
                celebrated ? (
                  <span className="home-quest-reward is-claimed">
                    +{q.rewardTokens}
                  </span>
                ) : (
                  <span className="home-quest-reward is-claimed">
                    Đã nhận
                  </span>
                )
              ) : q.completed ? (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleClaim(q, e.currentTarget);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.stopPropagation();
                      e.preventDefault();
                      void handleClaim(q, e.currentTarget);
                    }
                  }}
                  aria-label={undefined}
                  className="home-quest-reward is-ready flex items-center gap-1 shrink-0 justify-center cursor-pointer"
                >
                  {busy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : (
                    <>
                      <Coins className="w-3 h-3 text-white" fill="currentColor" />
                      <span className="text-[12px] font-extrabold text-white whitespace-nowrap">
                        +{q.rewardTokens}
                      </span>
                    </>
                  )}
                </span>
              ) : (
                <div className="home-quest-reward flex items-center gap-1.5 shrink-0">
                  <span className="flex items-center gap-0.5">
                    <Coins className="w-3 h-3 text-content-muted" />
                    <span className="text-[11px] font-bold text-content-muted whitespace-nowrap">
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
      </div>
      </div>
    </section>
  );
}
