import { axiosClient } from "@/configs/axios.client";

// ── Types ─────────────────────────────────────────────────

export interface PaymentTier {
  tierId: string;
  title: string;
  amount: number;
  noMonth: number;
  limitedToken: number;
  isActive: boolean;
}

export interface CheckoutRequest {
  tierId: string;
}

export interface CheckoutResponse {
  orderId: string;
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  amount: number;
  status: string;
  expiredAt: string;
}

export interface PaymentHistoryItem {
  orderId: string;
  orderCode: number;
  tierId: string;
  tierTitle: string;
  amount: number;
  status: string;
  paymentLinkId: string;
  createdAt: string;
  paidAt: string | null;
  expiredAt: string;
}

// ── Service ──────────────────────────────────────────────

export const paymentService = {
  getTiers: async (): Promise<PaymentTier[]> => {
    const res = await axiosClient.get("/payments/tiers");
    return res.data.data;
  },

  checkout: async (tierId: string): Promise<CheckoutResponse> => {
    const res = await axiosClient.post("/payments/checkout", { tierId });
    return res.data.data;
  },

  getHistory: async (): Promise<PaymentHistoryItem[]> => {
    const res = await axiosClient.get("/payments/history");
    return res.data.data;
  },
};
