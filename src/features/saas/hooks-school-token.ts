"use client";

// React Query hooks for Sprint 7 (src/services/school-token.service.ts): daily token boosts, the school's
// daily quota policy, academic-year rollover / student deactivation and the System Admin subscription actions.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  schoolTokenService,
  type AcademicYearRolloverPayload,
  type BoostListParams,
  type CreateTokenBoostPayload,
  type DeactivationReason,
  type RenewSubscriptionPayload,
  type ReviewTokenBoostPayload,
  type TopUpPayload,
  type UpdateTokenPolicyPayload,
} from "@/services/school-token.service";
import { apiErrorMessage, apiErrorStatus, saasKeys } from "@/features/saas/hooks-api";

/**
 * Error text for the Sprint 7 endpoints. A 404 here means the running backend predates them (Spring answers
 * "No static resource …"), so say that instead of showing the raw English message.
 */
export function tokenApiErrorMessage(error: unknown, fallback: string): string {
  if (apiErrorStatus(error) === 404 && /no static resource/i.test(apiErrorMessage(error, ""))) {
    return "Máy chủ chưa có chức năng này (backend đang chạy bản cũ). Vui lòng cập nhật và khởi động lại backend.";
  }
  return apiErrorMessage(error, fallback);
}

export const boostKeys = {
  all: ["school-token", "boosts"] as const,
  mine: ["school-token", "boosts", "mine"] as const,
  review: (params: BoostListParams) => ["school-token", "boosts", "review", params] as const,
};

/** Dashboards (daily limits, pools, pending counts) and the school token quota. */
function useRefreshDashboards() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: saasKeys.quota });
  };
}

// ─── Student ───────────────────────────────────────────────────────────────

export function useMyTokenBoosts(enabled = true) {
  return useQuery({ queryKey: boostKeys.mine, queryFn: schoolTokenService.listMyBoosts, enabled });
}

export function useRequestTokenBoost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTokenBoostPayload) => schoolTokenService.requestBoost(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: boostKeys.all }),
  });
}

// ─── Teacher / School Admin ────────────────────────────────────────────────

export function useTokenBoostsForReview(params: BoostListParams, enabled = true) {
  return useQuery({
    queryKey: boostKeys.review(params),
    queryFn: () => schoolTokenService.listBoosts(params),
    enabled,
  });
}

export function useReviewTokenBoost() {
  const qc = useQueryClient();
  const refreshDashboards = useRefreshDashboards();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ReviewTokenBoostPayload }) => schoolTokenService.reviewBoost(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boostKeys.all });
      refreshDashboards();
    },
  });
}

// ─── School Admin ──────────────────────────────────────────────────────────

export function useUpdateTokenPolicy() {
  const qc = useQueryClient();
  const refreshDashboards = useRefreshDashboards();
  return useMutation({
    mutationFn: (payload: UpdateTokenPolicyPayload) => schoolTokenService.updatePolicy(payload),
    onSuccess: () => {
      refreshDashboards();
      qc.invalidateQueries({ queryKey: ["saas", "classrooms"] });
    },
  });
}

export function useRolloverAcademicYear() {
  const qc = useQueryClient();
  const refreshDashboards = useRefreshDashboards();
  return useMutation({
    mutationFn: (payload: AcademicYearRolloverPayload) => schoolTokenService.rolloverYear(payload),
    onSuccess: () => {
      refreshDashboards();
      qc.invalidateQueries({ queryKey: ["saas"] });
    },
  });
}

export function useDeactivateStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, reason }: { uid: string; reason: DeactivationReason }) => schoolTokenService.deactivateStudent(uid, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saas", "students"] });
      qc.invalidateQueries({ queryKey: ["saas", "student"] });
    },
  });
}

// ─── System Admin ──────────────────────────────────────────────────────────

export function useSchoolSubscriptionActions(schoolId: string) {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: saasKeys.school(schoolId) });
    qc.invalidateQueries({ queryKey: ["saas", "schools"] });
  };
  return {
    renew: useMutation({
      mutationFn: (payload: RenewSubscriptionPayload) => schoolTokenService.renew(schoolId, payload),
      onSuccess: refresh,
    }),
    activate: useMutation({ mutationFn: () => schoolTokenService.activateYear(schoolId), onSuccess: refresh }),
    topUp: useMutation({
      mutationFn: (payload: TopUpPayload) => schoolTokenService.topUp(schoolId, payload),
      onSuccess: refresh,
    }),
  };
}
