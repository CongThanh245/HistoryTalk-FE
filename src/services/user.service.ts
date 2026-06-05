import { axiosClient } from "@/configs/axios.client";

// ── Types ─────────────────────────────────────────────────

export type Gender = "MALE" | "FEMALE" | "OTHER";

export interface UserProfile {
  uid: string;
  userName: string;
  email: string;
  role: "CUSTOMER" | "CONTENT_ADMIN" | "SYSTEM_ADMIN";
  fullName: string | null;
  dob: string | null;
  gender: Gender | null;
  phoneNumber: string | null;
  address: string | null;
  avatarUrl: string | null;
  tierId: string | null;
  tierTitle: string | null;
  token: number;
  subscriptionEndTime: string | null;
  lastActiveDate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UpdateProfilePayload {
  userName?: string;
  fullName?: string;
  dob?: string;
  gender?: Gender;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export type SubscriptionPlan = "free" | "plus" | "pro";

export function getSubscriptionPlan(
  profile: Pick<UserProfile, "tierId" | "tierTitle"> | null | undefined,
): SubscriptionPlan {
  const tierId = profile?.tierId?.toLowerCase() ?? "";
  const tierTitle = profile?.tierTitle?.toLowerCase().trim() ?? "";
  const value = `${tierId} ${tierTitle}`;

  if (value.includes("pro")) return "pro";
  if (value.includes("plus")) return "plus";
  return "free";
}

export function hasPlusAccess(
  profile: Pick<UserProfile, "tierId" | "tierTitle"> | null | undefined,
): boolean {
  const plan = getSubscriptionPlan(profile);
  return plan === "plus" || plan === "pro";
}

export function hasProAccess(
  profile: Pick<UserProfile, "tierId" | "tierTitle"> | null | undefined,
): boolean {
  return getSubscriptionPlan(profile) === "pro";
}

/** Kiểm tra tài khoản đã là gói trả phí (Plus hoặc Pro). */
export function isPro(profile: UserProfile | null | undefined): boolean {
  return hasPlusAccess(profile);
}

// ── Service ──────────────────────────────────────────────

type ApiEnvelope<T> = {
  success: boolean;
  message?: string;
  data?: T;
};

export const userService = {
  /** GET /users/me — Lấy profile người dùng hiện tại */
  getProfile: async (): Promise<UserProfile> => {
    const res = await axiosClient.get<ApiEnvelope<UserProfile>>("/users/me");
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Không thể lấy thông tin người dùng");
    }
    return res.data.data;
  },

  /** PATCH /users/me — Cập nhật profile người dùng */
  updateProfile: async (payload: UpdateProfilePayload): Promise<UserProfile> => {
    const res = await axiosClient.patch<ApiEnvelope<UserProfile>>("/users/me", payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Cập nhật thất bại");
    }
    return res.data.data;
  },

  /** PATCH /users/me/password — Đổi mật khẩu */
  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    const res = await axiosClient.patch<ApiEnvelope<unknown>>("/users/me/password", payload);
    if (!res.data.success) {
      throw new Error(res.data.message ?? "Đổi mật khẩu thất bại");
    }
  },
};
