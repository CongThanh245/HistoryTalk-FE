import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";

type RetryConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  skipAuthRefresh?: boolean;
};

export const axiosClient = axios.create({
  baseURL: `${BASE_URL}${BASE_PATH}`,
  timeout: 90000,
  headers: { "Content-Type": "application/json" },
});

// Gắn token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().tokens?.accessToken;

    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Xử lý 401 — refresh token hoặc redirect login
axiosClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;

    if (
      !original ||
      original.skipAuthRefresh ||
      error.response?.status !== 401 ||
      original._retried
    ) {
      return Promise.reject(error);
    }

    original._retried = true;

    try {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axiosClient.post(
        "/auth/refresh-token",
        { refreshToken },
        { skipAuthRefresh: true } as any,
      );

      if (!data.success) throw new Error("Refresh failed");

      useAuthStore.getState().setTokens({
        accessToken: data.data.accessToken,
        refreshToken: data.data.refreshToken,
        tokenType: data.data.tokenType,
        expiresIn: data.data.expiresIn,
      });

      original.headers.Authorization = `Bearer ${data.data.accessToken}`;
      return axiosClient(original);
    } catch {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
      return Promise.reject(error);
    }
  },
);
