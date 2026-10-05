"use client";

import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gamificationService } from "@/services/gamification.service";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";

/**
 * "Chuỗi ngày học": the streak only grows through POST /users/me/daily-check-in. The web calls it after the
 * first learning activity of the day (sending a chat message, submitting a quiz, opening a historical
 * context) — not on login — so the streak counts study days.
 */

/** Roles the backend accepts on /users/me/daily-check-in (school roles are not enabled there yet). */
const CHECK_IN_ROLES = new Set(["CUSTOMER", "CONTENT_ADMIN", "SYSTEM_ADMIN"]);

let inFlight: Promise<void> | null = null;

const localDateKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const storageKey = (uid: string) => `historytalk:study-check-in:${uid}:${localDateKey()}`;

function alreadyDoneToday(uid: string) {
  try {
    return localStorage.getItem(storageKey(uid)) === "1";
  } catch {
    return false;
  }
}

function markDoneToday(uid: string) {
  try {
    localStorage.setItem(storageKey(uid), "1");
  } catch {
    // Storage unavailable: the backend still answers alreadyCheckedInToday on the next call.
  }
}

/** Fire-and-forget: safe to call after every learning action; it checks in at most once per day. */
export function recordStudyActivity(queryClient: QueryClient) {
  const { user, isAuthenticated, updateUser } = useAuthStore.getState();
  if (!isAuthenticated || !user || !CHECK_IN_ROLES.has(user.role)) return;
  if (alreadyDoneToday(user.uid) || inFlight) return;

  inFlight = gamificationService
    .dailyCheckIn()
    .then((result) => {
      markDoneToday(user.uid);
      if (!result.alreadyCheckedInToday) {
        toast.success(`Chuỗi ${result.streakCount} ngày học`, {
          description: result.rewardTokens > 0 ? `+${result.rewardTokens.toLocaleString("vi-VN")} token thưởng điểm danh hôm nay` : undefined,
        });
        updateUser({ token: result.tokenBalance });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.gamification.today });
      queryClient.invalidateQueries({ queryKey: ["gamification", "study-days"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
    })
    .catch((error) => {
      // Never block the learning action because of the streak.
      console.warn("Daily check-in failed", error);
    })
    .finally(() => {
      inFlight = null;
    });
}
