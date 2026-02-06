// lib/axios.client.ts
// CHỈ DÙNG TRÊN BROWSER (Client Components, useEffect, event handlers)

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

type RetryConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  skipAuthRefresh?: boolean;
};

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token || "");
  });
  refreshQueue = [];
};

// Helper functions cho token management
const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");
const setTokens = (access: string, refresh: string) => {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
};
const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

// Request interceptor: Gắn token vào header
axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Xử lý refresh token
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    // Không xử lý nếu:
    // - Không có config
    // - Request đánh dấu skip
    // - Không phải lỗi 401
    if (
      !originalRequest ||
      originalRequest.skipAuthRefresh ||
      error.response?.status !== 401
    ) {
      return Promise.reject(error);
    }

    // Giới hạn retry để tránh vòng lặp vô hạn
    originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
    if (originalRequest._retryCount > 3) {
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Nếu đang refresh, cho vào queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axiosClient(originalRequest);
      });
    }

    // Bắt đầu refresh token
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const { data } = await axiosClient.post<{
        accessToken: string;
        refreshToken: string;
      }>(
        "/auth/refresh-token",
        { refreshToken },
        { skipAuthRefresh: true } as any
      );

      setTokens(data.accessToken, data.refreshToken);
      processQueue(null, data.accessToken);

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);