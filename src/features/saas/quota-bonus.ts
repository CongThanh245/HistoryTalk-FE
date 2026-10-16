"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/store/auth.store";
import { useStudentDashboard } from "@/features/dashboard/hooks";
import { SCHOOL_QUEST_BONUS_RATIO } from "./entitlements";

/**
 * Mock store for daily-quest rewards of school accounts. Claiming a finished quest adds
 * SCHOOL_QUEST_BONUS_RATIO × dailyQuota to today's quota instead of a personal wallet.
 * Records are kept per user per local date, so tomorrow starts clean. Swap for an API later.
 */

export interface QuotaBonusDay {
  questIds: string[];
  bonus: number;
}

interface QuotaBonusState {
  /** key: `${userId}:${YYYY-MM-DD}` (local date). */
  days: Record<string, QuotaBonusDay>;
  claim: (userId: string, questId: string, amount: number) => boolean;
}

const EMPTY_DAY: QuotaBonusDay = { questIds: [], bonus: 0 };

export function localDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const dayKey = (userId: string) => `${userId}:${localDateKey()}`;

export const useQuotaBonusStore = create<QuotaBonusState>()(
  persist(
    (set, get) => ({
      days: {},
      claim: (userId, questId, amount) => {
        const key = dayKey(userId);
        const current = get().days[key] ?? EMPTY_DAY;
        if (current.questIds.includes(questId)) return false;
        const today = `:${localDateKey()}`;
        // Keep only today's records; older days no longer matter.
        const kept = Object.fromEntries(Object.entries(get().days).filter(([k]) => k.endsWith(today)));
        set({
          days: {
            ...kept,
            [key]: { questIds: [...current.questIds, questId], bonus: current.bonus + amount },
          },
        });
        return true;
      },
    }),
    { name: "ht-saas-quota-bonus" },
  ),
);

/** Today's quest bonus for the signed-in user. */
export function useTodayQuotaBonus(): QuotaBonusDay {
  const uid = useAuthStore((s) => s.user?.uid);
  return useQuotaBonusStore((s) => (uid ? s.days[dayKey(uid)] : undefined) ?? EMPTY_DAY);
}

/** Bonus a school account gets for one finished daily quest. */
export function questQuotaBonus(dailyQuota: number | undefined): number {
  return Math.round(SCHOOL_QUEST_BONUS_RATIO * (dailyQuota ?? 0));
}

export interface TodayQuota {
  /** Token dang co + token da dung hom nay (BE khong co han muc theo ngay). */
  quota: number;
  baseQuota: number;
  bonus: number;
  used: number;
  remaining: number;
}

/**
 * Token cua hoc sinh truong tu GET /student/dashboard (currentTokens, tokensUsedToday).
 * Giao vien: BE khong co API token -> null. Customer / staff: null.
 */
export function useTodayQuota(): TodayQuota | null {
  const role = useAuthStore((s) => s.user?.role);
  const { data } = useStudentDashboard(role === "SCHOOL_STUDENT");

  if (role !== "SCHOOL_STUDENT" || !data) return null;
  const used = Math.max(data.tokensUsedToday, 0);
  const remaining = Math.max(data.currentTokens, 0);
  const quota = used + remaining;
  return { quota, baseQuota: quota, bonus: 0, used, remaining };
}
