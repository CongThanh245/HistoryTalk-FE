"use client";

import { useAuthStore } from "@/store/auth.store";
import { hasPlusAccess, hasProAccess } from "@/services/user.service";
import { useStudentDashboard } from "@/features/dashboard/hooks";
import { useApiTeacherClassrooms } from "./hooks-api";
import type { School } from "./types";

/**
 * One source of truth for "what this account may do" across the shared learning app.
 * B2C customers get features from their personal tier (Free / Plus / Pro) and a personal token wallet;
 * school accounts (Teacher, School Student) get tokens allocated by the school.
 * Screens ask this hook instead of checking roles or tiers themselves.
 *
 * BE chua co API goi / quyen tinh nang cho tai khoan truong (khong co Enterprise 1-3 gating, khong co
 * han muc theo ngay): ten truong lay tu /student/dashboard (hoc sinh) hoac /teacher/classrooms (giao vien),
 * goi thoai / video khong bi chan vi BE khong chan.
 */

export type EntitlementMode = "B2C" | "B2B" | "STAFF";

/** Premium features unlocked by each school package (Role Matrix row 20: Enterprise 1, 2, 3). */
export const SCHOOL_PLAN_FEATURES: Record<School["plan"], { voiceCall: boolean; videoCall: boolean }> = {
  ENTERPRISE_1: { voiceCall: false, videoCall: false },
  ENTERPRISE_2: { voiceCall: true, videoCall: false },
  ENTERPRISE_3: { voiceCall: true, videoCall: true },
};

/** Quest rewards for school students add to today's quota instead of a personal wallet (temporary policy). */
export const SCHOOL_QUEST_BONUS_RATIO = 0.1;

export interface Entitlements {
  mode: EntitlementMode;
  /** Buy / upgrade plans, top up tokens, see pricing & payment history (row 26). */
  canPurchase: boolean;
  /** Upgrade ads / prompts. */
  showUpsell: boolean;
  tokenSource: "PERSONAL" | "SCHOOL" | "UNLIMITED";
  /** BE khong co han muc theo ngay — luon undefined. */
  dailyQuota?: number;
  usedToday?: number;
  voiceCall: boolean;
  videoCall: boolean;
  /** What claiming a finished daily quest gives. */
  questReward: "TOKENS" | "QUOTA_BONUS";
  /** Short label for the plan shown in profile / badges: "Pro", "Enterprise 2 · THPT Lê Hồng Phong". */
  planLabel: string;
  /** Who to contact instead of "Nâng cấp" for school accounts. */
  upgradeHint: string;
  schoolName?: string;
}

export function useEntitlements(): Entitlements {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const student = useStudentDashboard(role === "SCHOOL_STUDENT");
  const teacherClasses = useApiTeacherClassrooms({ page: 0, size: 1 }, role === "TEACHER");
  const schoolName =
    role === "SCHOOL_STUDENT" ? student.data?.schoolName : teacherClasses.data?.items[0]?.schoolName;

  if (role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN" || role === "SCHOOL_ADMIN") {
    return {
      mode: "STAFF", canPurchase: false, showUpsell: false, tokenSource: "UNLIMITED",
      voiceCall: true, videoCall: true, questReward: "TOKENS", planLabel: "Quản trị", upgradeHint: "",
    };
  }

  if (role === "TEACHER" || role === "SCHOOL_STUDENT") {
    const isTeacher = role === "TEACHER";
    return {
      mode: "B2B",
      canPurchase: false,
      showUpsell: false,
      tokenSource: "SCHOOL",
      dailyQuota: undefined,
      voiceCall: true,
      videoCall: true,
      questReward: "QUOTA_BONUS",
      planLabel: schoolName ? `Tài khoản trường · ${schoolName}` : "Tài khoản trường",
      upgradeHint: isTeacher
        ? "Tính năng này thuộc gói cao hơn của trường. Liên hệ quản trị nhà trường để mở."
        : "Tính năng này chưa có trong gói của trường. Hỏi thầy cô hoặc nhà trường nhé.",
      schoolName,
    };
  }

  // Customer (or signed out): personal tier and wallet.
  const access = user ? { tierId: user.tierId ?? null, tierTitle: user.tierTitle ?? null } : null;
  return {
    mode: "B2C",
    canPurchase: true,
    showUpsell: true,
    tokenSource: "PERSONAL",
    voiceCall: !!access && hasPlusAccess(access),
    videoCall: !!access && hasProAccess(access),
    questReward: "TOKENS",
    planLabel: user?.tierTitle ?? "Free",
    upgradeHint: "Nâng cấp gói để dùng tính năng này.",
  };
}
