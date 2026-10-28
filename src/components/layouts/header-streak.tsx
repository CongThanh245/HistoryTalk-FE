"use client";

import { useEffect, useRef } from "react";
import { Flame } from "lucide-react";
import { Popover } from "radix-ui";
import { useAuthStore } from "@/store/auth.store";
import { useGamificationToday } from "@/features/gamification/hooks";
import { useEntitlements } from "@/features/saas/entitlements";
import { DailyQuestsCard } from "@/components/home/daily-quests-card";
import { cn } from "@/lib/utils/cn";
import { Role } from "@/constants/roles";
import { celebrate } from "@/lib/celebrate";

const CELEBRATED_KEY = "ht-streak-celebrated";
const MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

/** Streak + today's quests as a header chip; the full card opens in a popover from any page. */
export function HeaderStreak() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  // Streaks and quests are for learners only: staff, school admins and teachers don't study here.
  const role = useAuthStore((s) => s.user?.role);
  const isLearner = role === Role.CUSTOMER || role === Role.SCHOOL_STUDENT;
  // Gamification is customer-only — school accounts get a 403, so hide it like the card does.
  const isSchoolAccount = useEntitlements().mode === "B2B";
  const { data } = useGamificationToday({ enabled: !isSchoolAccount && isLearner });
  const chipRef = useRef<HTMLButtonElement>(null);

  // The first time today's study is recorded, the chip bursts and the companion cheers (once per day).
  useEffect(() => {
    if (!data?.studiedToday || !data.date) return;
    const stamp = `${data.date}:${data.streakCount ?? 0}`;
    try {
      if (localStorage.getItem(CELEBRATED_KEY) === stamp) return;
      localStorage.setItem(CELEBRATED_KEY, stamp);
    } catch {
      return;
    }
    const count = data.streakCount ?? 0;
    const milestone = MILESTONES.includes(count);
    celebrate({
      text: milestone ? `Cột mốc ${count} ngày liên tiếp! Bạn thật bền bỉ 🏆` : `Chuỗi ${count} ngày! Giữ lửa tiếp nhé 🔥`,
      confetti: milestone,
    });
    const chip = chipRef.current;
    if (!chip) return;
    chip.classList.remove("streak-burst");
    void chip.offsetWidth;
    chip.classList.add("streak-burst");
  }, [data?.studiedToday, data?.date, data?.streakCount]);

  if (!isAuthenticated || isSchoolAccount || !isLearner || !data) return null;

  const quests = Array.isArray(data.quests) ? data.quests : [];
  const doneCount = quests.filter((q) => q.completed).length;
  const streakCount = data.streakCount ?? 0;

  return (
    <Popover.Root>
      <Popover.Trigger
        ref={chipRef}
        data-coin-target
        aria-label={`Chuỗi ${streakCount} ngày, ${doneCount}/${quests.length} nhiệm vụ hôm nay`}
        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-[var(--border-default)] px-3 text-sm font-semibold text-header-text transition-colors hover:bg-[var(--sidebar-hover-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)] data-[state=open]:bg-[var(--sidebar-hover-bg)]"
      >
        <span className={cn("inline-flex items-center gap-1 tabular-nums", data.studiedToday ? "text-[var(--accent-gold)]" : "text-header-text-muted")}>
          <Flame size={16} fill={data.studiedToday ? "currentColor" : "none"} aria-hidden="true" />
          {streakCount}
        </span>
        {quests.length > 0 && (
          <span className="hidden border-l border-[var(--border-default)] pl-2 tabular-nums text-header-text-muted sm:inline">
            {doneCount}/{quests.length} nhiệm vụ
          </span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          // The study calendar opens as a dialog outside this popover — don't let that close it.
          onInteractOutside={(e) => {
            if ((e.target as HTMLElement | null)?.closest?.("[role='dialog']")) e.preventDefault();
          }}
          className="z-50 max-h-[calc(100dvh-80px)] w-[min(400px,calc(100vw-24px))] overflow-y-auto rounded-lg shadow-[var(--shadow-strong)] outline-none animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        >
          <DailyQuestsCard compact />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
