// src/services/admin.tier.service.ts
import { axiosClient } from "@/configs/axios.client";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminTier {
  tierId: string;
  title: string;
  amount: number;
  noMonth: number;
  limitedToken: number;
  isActive: boolean;
}

export interface CreateTierPayload {
  title: string;
  amount: number;
  noMonth: number;
  limitedToken: number;
  isActive: boolean;
}

export type UpdateTierPayload = Partial<CreateTierPayload>;

// ─── Service ─────────────────────────────────────────────────────────────────

const BASE = "/system-admin/tiers";

/** `/system-admin/tiers` returns the id as `id` (gamification TierResponse); older payloads used `tierId`. */
type RawTier = Omit<AdminTier, "tierId"> & { id?: string; tierId?: string };
const toTier = ({ id, tierId, ...rest }: RawTier): AdminTier => ({ ...rest, tierId: tierId ?? id ?? "" });

export const adminTierService = {
  /** Get all tiers */
  listTiers: async (): Promise<AdminTier[]> => {
    const res = await axiosClient.get(BASE);
    return ((res.data.data ?? res.data) as RawTier[]).map(toTier);
  },

  /** Get tier by ID */
  getTierById: async (id: string): Promise<AdminTier> => {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return toTier((res.data.data ?? res.data) as RawTier);
  },

  /** Create a new tier */
  createTier: async (payload: CreateTierPayload): Promise<AdminTier> => {
    const res = await axiosClient.post(BASE, payload);
    return toTier((res.data.data ?? res.data) as RawTier);
  },

  /** Update an existing tier */
  updateTier: async (id: string, payload: UpdateTierPayload): Promise<AdminTier> => {
    const res = await axiosClient.put(`${BASE}/${id}`, payload);
    return toTier((res.data.data ?? res.data) as RawTier);
  },

  /** Delete a tier */
  deleteTier: async (id: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/${id}`);
  },
};
