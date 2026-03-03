// // lib/axios.server.ts
// // CHỈ DÙNG TRÊN SERVER - Next.js Server Components, API Routes, Server Actions

// import axios, { AxiosError, AxiosInstance } from "axios";
// import { cookies, headers } from "next/headers";

// // ============================================
// // CONFIGURATION
// // ============================================

// // Ưu tiên internal URL (nhanh hơn khi chạy trong Docker/K8s)
// const API_BASE_URL =
//   process.env.API_BASE_URL_INTERNAL || // http://backend-service:4000 (internal network)
//   process.env.NEXT_PUBLIC_API_BASE_URL || // http://localhost:4000 (dev)
//   "http://localhost:4000/api";

// const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
// const REQUEST_TIMEOUT = 30000; // 30s
// const MAX_RETRIES = 3;

// // ============================================
// // BASE INSTANCE - Không có authentication
// // ============================================
// export const axiosServer = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: REQUEST_TIMEOUT,
//   headers: {
//     "Content-Type": "application/json",
//     "User-Agent": "NextJS-Server",
//   },
// });

// // ============================================
// // RETRY LOGIC - Tự động retry khi network error
// // ============================================
// axiosServer.interceptors.response.use(
//   (response) => response,
//   async (error: AxiosError) => {
//     const config = error.config as any;

//     // Không retry nếu:
//     // - Không có config
//     // - Đã retry quá số lần cho phép
//     // - Lỗi 4xx (client error, không nên retry)
//     if (!config || config.__retryCount >= MAX_RETRIES) {
//       return Promise.reject(error);
//     }

//     const status = error.response?.status;
//     if (status && status >= 400 && status < 500 && status !== 429) {
//       return Promise.reject(error);
//     }

//     // Retry với exponential backoff
//     config.__retryCount = (config.__retryCount || 0) + 1;
//     const delay = Math.min(1000 * Math.pow(2, config.__retryCount), 10000);

//     await new Promise((resolve) => setTimeout(resolve, delay));
//     return axiosServer(config);
//   }
// );

// // ============================================
// // ERROR LOGGING - Log lỗi để debug
// // ============================================
// axiosServer.interceptors.response.use(
//   (response) => response,
//   (error: AxiosError) => {
//     if (process.env.NODE_ENV === "development") {
//       console.error("❌ Server API Error:", {
//         url: error.config?.url,
//         method: error.config?.method,
//         status: error.response?.status,
//         message: error.message,
//         data: error.response?.data,
//       });
//     }
//     return Promise.reject(error);
//   }
// );

// // ============================================
// // AUTHENTICATED INSTANCE - Tự động gắn token
// // ============================================
// export async function getAuthenticatedAxios(): Promise<AxiosInstance> {
//   const cookieStore = await cookies();
//   const token = cookieStore.get("token")?.value;

//   const instance = axios.create({
//     baseURL: API_BASE_URL,
//     timeout: REQUEST_TIMEOUT,
//     headers: {
//       "Content-Type": "application/json",
//       ...(token && { Authorization: `Bearer ${token}` }),
//     },
//   });

//   // Copy interceptors từ base instance
//   instance.interceptors.response = axiosServer.interceptors.response;

//   return instance;
// }

// // ============================================
// // INTERNAL INSTANCE - Dùng API key cho internal calls
// // ============================================
// export const axiosInternal = axios.create({
//   baseURL: API_BASE_URL,
//   timeout: REQUEST_TIMEOUT,
//   headers: {
//     "Content-Type": "application/json",
//     ...(INTERNAL_API_KEY && { "x-internal-api-key": INTERNAL_API_KEY }),
//   },
// });

// // Copy retry logic
// axiosInternal.interceptors.response = axiosServer.interceptors.response;

// // ============================================
// // SMART INSTANCE - Auto-detect best auth method
// // ============================================
// export async function getSmartAxios(): Promise<AxiosInstance> {
//   // Ưu tiên: Internal API Key > User Token > No Auth
//   if (INTERNAL_API_KEY) {
//     return axiosInternal;
//   }

//   try {
//     const cookieStore = await cookies();
//     const token = cookieStore.get("token")?.value;
//     if (token) {
//       return getAuthenticatedAxios();
//     }
//   } catch (error) {
//     // cookies() không available (ví dụ: trong middleware)
//     // Fallback to base instance
//   }

//   return axiosServer;
// }

// // ============================================
// // HELPER: Forward request headers
// // ============================================
// export async function getAxiosWithForwardedHeaders(): Promise<AxiosInstance> {
//   const headersList = await headers();
//   const cookieStore = await cookies();

//   // Forward các headers quan trọng
//   const forwardHeaders: Record<string, string> = {};

//   // Authorization
//   const token = cookieStore.get("token")?.value;
//   if (token) {
//     forwardHeaders.Authorization = `Bearer ${token}`;
//   }

//   // Request tracing
//   const requestId = headersList.get("x-request-id");
//   if (requestId) {
//     forwardHeaders["x-request-id"] = requestId;
//   }

//   // User info
//   const userAgent = headersList.get("user-agent");
//   if (userAgent) {
//     forwardHeaders["x-forwarded-user-agent"] = userAgent;
//   }

//   const clientIp = headersList.get("x-forwarded-for");
//   if (clientIp) {
//     forwardHeaders["x-forwarded-for"] = clientIp;
//   }

//   return axios.create({
//     baseURL: API_BASE_URL,
//     timeout: REQUEST_TIMEOUT,
//     headers: {
//       "Content-Type": "application/json",
//       ...forwardHeaders,
//     },
//   });
// }

// // ============================================
// // UTILITY: Check server health
// // ============================================
// export async function checkServerHealth(): Promise<boolean> {
//   try {
//     await axiosServer.get("/health", { timeout: 5000 });
//     return true;
//   } catch {
//     return false;
//   }
// }

// // ============================================
// // UTILITY: Batch requests
// // ============================================
// export async function batchRequests<T>(
//   requests: Array<() => Promise<T>>
// ): Promise<T[]> {
//   // Giới hạn concurrent requests
//   const BATCH_SIZE = 5;
//   const results: T[] = [];

//   for (let i = 0; i < requests.length; i += BATCH_SIZE) {
//     const batch = requests.slice(i, i + BATCH_SIZE);
//     const batchResults = await Promise.all(batch.map((fn) => fn()));
//     results.push(...batchResults);
//   }

//   return results;
// }