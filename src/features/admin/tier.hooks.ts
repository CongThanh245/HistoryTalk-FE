// src/features/admin/tier.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  adminTierService,
  type AdminTier,
  type CreateTierPayload,
  type UpdateTierPayload,
} from "@/services/admin.tier.service";

// Re-export types for consumers
export type { AdminTier, CreateTierPayload, UpdateTierPayload };

const TIER_KEYS = {
  all: ["admin", "tiers"] as const,
  byId: (id: string) => ["admin", "tier", id] as const,
};

/** Get all tiers */
export function useAdminTiers() {
  return useQuery({
    queryKey: TIER_KEYS.all,
    queryFn: adminTierService.listTiers,
    staleTime: 1000 * 60, // 1 minute
  });
}

/** Create a new tier */
export function useAdminCreateTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTierPayload) => adminTierService.createTier(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TIER_KEYS.all });
      toast.success("Tạo gói dịch vụ thành công");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string } | null;
      toast.error(error?.response?.data?.message ?? error?.message ?? "Tạo gói thất bại");
    },
  });
}

/** Update an existing tier */
export function useAdminUpdateTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTierPayload }) =>
      adminTierService.updateTier(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: TIER_KEYS.all });
      qc.invalidateQueries({ queryKey: TIER_KEYS.byId(id) });
      toast.success("Cập nhật gói dịch vụ thành công");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string } | null;
      toast.error(error?.response?.data?.message ?? error?.message ?? "Cập nhật gói thất bại");
    },
  });
}

/** Delete a tier */
export function useAdminDeleteTier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminTierService.deleteTier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TIER_KEYS.all });
      toast.success("Đã xóa gói dịch vụ");
    },
    onError: (err: unknown) => {
      const error = err as { response?: { data?: { message?: string } }; message?: string } | null;
      toast.error(error?.response?.data?.message ?? error?.message ?? "Xóa gói thất bại");
    },
  });
}
