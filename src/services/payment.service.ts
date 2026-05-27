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

export interface PayosReturnRequest {
  code: string;
  id: string;
  cancel: boolean;
  status: string;
  orderCode: number;
}

export interface PayosReturnResponse {
  orderCode: number;
  resolvedStatus: string;
  message: string;
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
  userId?: string;
  userName?: string;
  userEmail?: string;
}

export interface PaymentHistoryPage {
  content: PaymentHistoryItem[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
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

  getHistory: async (params?: { status?: string; userId?: string; page?: number; size?: number }): Promise<PaymentHistoryPage> => {
    const res = await axiosClient.get("/payments/history", { params });
    return res.data.data;
  },

  notifyReturn: async (payload: PayosReturnRequest): Promise<PayosReturnResponse> => {
    const res = await axiosClient.post("/payments/payos/return", payload);
    return res.data.data;
  },

  /** Customer view their own payment history (array response, no pagination) */
  getMyHistory: async (): Promise<PaymentHistoryItem[]> => {
    const res = await axiosClient.get("/payments/me");
    return res.data.data ?? [];
  },
};
