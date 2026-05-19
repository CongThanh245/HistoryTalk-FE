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

// Biến lưu trạng thái refresh token và hàng đợi request
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

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

    if (isRefreshing) {
      // Đưa vào hàng đợi nếu đang refresh token
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return axiosClient(original);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    original._retried = true;
    isRefreshing = true;

    try {
      const refreshToken = useAuthStore.getState().tokens?.refreshToken;
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axiosClient.post(
        "/auth/refresh-token",
        { refreshToken },
        { skipAuthRefresh: true } as any,
      );

      if (!data.success) throw new Error("Refresh failed");

      const newAccessToken = data.data.accessToken;

      useAuthStore.getState().setTokens({
        accessToken: newAccessToken,
        refreshToken: data.data.refreshToken,
        tokenType: data.data.tokenType,
        expiresIn: data.data.expiresIn,
      });

      if (typeof document !== "undefined") {
        document.cookie = `auth-token=${newAccessToken}; path=/; max-age=${data.data.expiresIn / 1000}`;
      }

      // Xử lý hàng đợi thành công
      processQueue(null, newAccessToken);

      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(original);
    } catch (refreshError) {
      // Báo lỗi cho hàng đợi
      processQueue(refreshError, null);
      
      useAuthStore.getState().clearAuth();
      if (typeof document !== "undefined") {
        document.cookie = "auth-token=; path=/; max-age=0";
        document.cookie = "auth-role=; path=/; max-age=0";
      }
      
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  },
);
