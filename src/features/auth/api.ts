import { type AxiosRequestConfig } from "axios";
import { axiosClient } from "@/configs/axios.client";
import {
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
  ResetPasswordRequest,
} from "./type";

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type SkipAuthRefreshConfig = AxiosRequestConfig & {
  skipAuthRefresh: boolean;
};

type RawLoginData = {
  uid: string;
  userName: string;
  email: string;
  role: LoginResponse["user"]["role"];
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

function unwrapMessageResponse(
  res: { data: ApiEnvelope<MessageResponse | null> },
  fallbackMessage: string,
): MessageResponse {
  if (res.data.success === false) {
    throw new Error(res.data.message ?? fallbackMessage);
  }

  return res.data.data ?? { message: res.data.message ?? fallbackMessage };
}

function toLoginResponse(raw: RawLoginData): LoginResponse {
  return {
    user: {
      uid: raw.uid,
      userName: raw.userName,
      email: raw.email,
      role: raw.role,
    },
    tokens: {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken,
      tokenType: raw.tokenType,
      expiresIn: raw.expiresIn,
    },
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await axiosClient.post<ApiEnvelope<RawLoginData>>(
      "/auth/login",
      data,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Đăng nhập thất bại");
    }

    return toLoginResponse(res.data.data);
  },

  googleLogin: async (data: GoogleLoginRequest): Promise<LoginResponse> => {
    const res = await axiosClient.post<ApiEnvelope<RawLoginData>>(
      "/auth/google",
      data,
    );

    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message ?? "Đăng nhập Google thất bại");
    }

    return toLoginResponse(res.data.data);
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await axiosClient.post("/auth/register", data);
    return res.data.data;
  },

  forgotPassword: async (
    data: ForgotPasswordRequest,
  ): Promise<MessageResponse> => {
    const res = await axiosClient.post<ApiEnvelope<MessageResponse | null>>(
      "/auth/forgot-password",
      data,
    );
    return unwrapMessageResponse(res, "Không thể gửi email đặt lại mật khẩu");
  },

  resetPassword: async (
    data: ResetPasswordRequest,
  ): Promise<MessageResponse> => {
    const res = await axiosClient.post<ApiEnvelope<MessageResponse | null>>(
      "/auth/reset-password",
      data,
    );
    return unwrapMessageResponse(res, "Không thể đặt lại mật khẩu");
  },

  logout: async (): Promise<void> => {
    await axiosClient.post("/auth/logout");
  },

  refreshToken: async (
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> => {
    const res = await axiosClient.post(
      "/auth/refresh-token",
      { refreshToken },
      { skipAuthRefresh: true } as SkipAuthRefreshConfig,
    );
    return res.data.data;
  },

  registerStaff: async (data: {
    userName: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    roleName: "STAFF" | "ADMIN";
  }): Promise<void> => {
    const res = await axiosClient.post("/auth/register-staff", data);
    if (!res.data.success) {
      throw new Error(res.data.message ?? "Tạo tài khoản thất bại");
    }
  },
};
