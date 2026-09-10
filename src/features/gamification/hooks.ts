import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { gamificationService } from "@/services/gamification.service";
import { queryKeys } from "@/shared/query-key";
import { useAuthStore } from "@/store/auth.store";

function getErrorMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }
  return fallback;
}

// ── useGamificationToday ────────────────────────────────────────────────────
/** Streak & nhiệm vụ hôm nay từ /gamification/today */
export function useGamificationToday() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.gamification.today,
    queryFn: () => gamificationService.getToday(),
    enabled: isAuthenticated,
    staleTime: 1000 * 30, // Cache 30 giây — tiến độ có thể vừa được ghi nhận ở tab/trang khác
    refetchOnWindowFocus: true,
  });
}

// ── useClaimQuest ────────────────────────────────────────────────────────────
/** Nhận thưởng token cho một nhiệm vụ đã hoàn thành (POST /gamification/claim) */
export function useClaimQuest() {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);

  return useMutation({
    mutationFn: (questId: string) => gamificationService.claim(questId),
    onSuccess: (result) => {
      updateUser({ token: result.tokenBalance });
      qc.invalidateQueries({ queryKey: queryKeys.gamification.today });
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.me });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Không thể nhận thưởng. Vui lòng thử lại."));
    },
  });
}
