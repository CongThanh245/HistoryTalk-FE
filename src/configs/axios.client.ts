import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/store/auth.store";
import { useSessionStore } from "@/store/session.store";
import { persistAuthCookies } from "@/features/auth/auth-cookies";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;
const BASE_PATH = process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1";

type RetryConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  skipAuth?: boolean;
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
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token as string);
    }
  });

  failedQueue = [];
};

// Refresh access token dùng chung cho axios interceptor lẫn các request fetch() thô (vd: SSE stream)
// không đi qua axiosClient nên không tự động được interceptor bên dưới xử lý 401.
export const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  const refreshToken = useAuthStore.getState().tokens?.refreshToken;
  if (!refreshToken) {
    // Không có refresh token nghĩa là user chưa đăng nhập hoặc vừa logout —
    // đây không phải trường hợp "phiên hết hạn" nên không hiện SessionExpiredDialog.
    throw new Error("No refresh token");
  }

  isRefreshing = true;

  try {
    const { data } = await axiosClient.post(
      "/auth/refresh-token",
      { refreshToken },
      { skipAuthRefresh: true } as RetryConfig,
    );

    if (!data.success) throw new Error("Refresh failed");

    const newAccessToken = data.data.accessToken;

    useAuthStore.getState().setTokens({
      accessToken: newAccessToken,
      refreshToken: data.data.refreshToken,
      tokenType: data.data.tokenType,
      expiresIn: data.data.expiresIn,
    });

    const role = useAuthStore.getState().user?.role;
    if (role) {
      persistAuthCookies(newAccessToken, role, data.data.expiresIn);
    }

    processQueue(null, newAccessToken);
    return newAccessToken;
  } catch (refreshError) {
    processQueue(refreshError, null);

    // Không logout/redirect ngay — chỉ báo cho người dùng biết phiên đã hết hạn,
    // việc clear auth + chuyển trang login được thực hiện khi người dùng bấm xác nhận
    // ở SessionExpiredDialog (xem src/components/session-expired-dialog.tsx).
    useSessionStore.getState().showExpired();

    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

// Gắn token vào mỗi request
axiosClient.interceptors.request.use(
  (config) => {
    const authConfig = config as RetryConfig;
    const token = useAuthStore.getState().tokens?.accessToken;

    if (!authConfig.skipAuth && token) {
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
      const newAccessToken = await refreshAccessToken();
      original.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(original);
    } catch {
      return Promise.reject(error);
    }
  },
);
