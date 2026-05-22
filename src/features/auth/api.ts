import { axiosClient } from "@/configs/axios.client";
import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from "./type";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await axiosClient.post("/auth/login", data);

    if (!res.data.success) {
      throw new Error(res.data.message ?? "Đăng nhập thất bại");
    }

    const raw = res.data.data;

    return {
      user: {
        uid: raw.uid,
        userName: raw.userName,
        email: raw.email,
        role: raw.role, // ← đổi userType → role
      },
      tokens: {
        accessToken: raw.accessToken,
        refreshToken: raw.refreshToken,
        tokenType: raw.tokenType,
        expiresIn: raw.expiresIn,
      },
    };
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const res = await axiosClient.post("/auth/register", data);
    return res.data.data;
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
      { skipAuthRefresh: true } as any,
    );
    return res.data.data;
  },

  registerStaff: async (data: {
    userName: string;
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    roleName: "CONTENT_ADMIN";
  }): Promise<void> => {
    const res = await axiosClient.post("/auth/register-staff", data);
    if (!res.data.success) {
      throw new Error(res.data.message ?? "Tạo tài khoản thất bại");
    }
  },
};
