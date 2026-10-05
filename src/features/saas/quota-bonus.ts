"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useAuthStore } from "@/store/auth.store";
import { DEMO_STUDENT_ID } from "./mock-data";
import { SCHOOL_QUEST_BONUS_RATIO, useEntitlements } from "./entitlements";
import { useSaasStore } from "./store";

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
  /** School quota plus today's quest bonus. */
  quota: number;
  baseQuota: number;
  bonus: number;
  used: number;
  remaining: number;
}

/**
 * Today's quota for a school account (B2B). Students read the demo student's usage from the mock store;
 * teachers get a fixed mock share of their quota. Returns null for customers and staff.
 */
export function useTodayQuota(): TodayQuota | null {
  const entitlements = useEntitlements();
  const role = useAuthStore((s) => s.user?.role);
  const studentUsed = useSaasStore((s) => s.students.find((x) => x.id === DEMO_STUDENT_ID)?.tokensUsedToday);
  const { bonus } = useTodayQuotaBonus();

  if (entitlements.mode !== "B2B") return null;
  const baseQuota = entitlements.dailyQuota ?? 0;
  const quota = baseQuota + bonus;
  const rawUsed = role === "SCHOOL_STUDENT" ? studentUsed ?? 0 : Math.round(baseQuota * 0.28);
  const used = Math.min(Math.max(rawUsed, 0), quota);
  return { quota, baseQuota, bonus, used, remaining: Math.max(quota - used, 0) };
}
