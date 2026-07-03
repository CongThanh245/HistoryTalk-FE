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

export const adminTierService = {
  /** Get all tiers */
  listTiers: async (): Promise<AdminTier[]> => {
    const res = await axiosClient.get(BASE);
    return (res.data.data ?? res.data) as AdminTier[];
  },

  /** Get tier by ID */
  getTierById: async (id: string): Promise<AdminTier> => {
    const res = await axiosClient.get(`${BASE}/${id}`);
    return (res.data.data ?? res.data) as AdminTier;
  },

  /** Create a new tier */
  createTier: async (payload: CreateTierPayload): Promise<AdminTier> => {
    const res = await axiosClient.post(BASE, payload);
    return (res.data.data ?? res.data) as AdminTier;
  },

  /** Update an existing tier */
  updateTier: async (id: string, payload: UpdateTierPayload): Promise<AdminTier> => {
    const res = await axiosClient.put(`${BASE}/${id}`, payload);
    return (res.data.data ?? res.data) as AdminTier;
  },

  /** Delete a tier */
  deleteTier: async (id: string): Promise<void> => {
    await axiosClient.delete(`${BASE}/${id}`);
  },
};
