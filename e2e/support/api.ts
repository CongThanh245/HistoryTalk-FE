import { API_URL } from "./env";

type Envelope<T> = { success: boolean; message?: string; data: T; errorCode?: string | null };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
    label: string,
  ) {
    super(`${label} → HTTP ${status}: ${JSON.stringify(body).slice(0, 400)}`);
  }
}

/** Minimal JSON client for the Java BE (no axios, no FE code). */
export async function api<T = unknown>(
  method: string,
  path: string,
  { token, body, form }: { token?: string; body?: unknown; form?: FormData } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const text = await res.text();
  let json: unknown = text;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* keep text */
  }
  if (!res.ok) throw new ApiError(res.status, json, `${method} ${path}`);
  return ((json as Envelope<T>)?.data ?? json) as T;
}

export interface LoginData {
  uid: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  mustChangePassword?: boolean;
}

export const login = (email: string, password: string) => api<LoginData>("POST", "/auth/login", { body: { email, password } });

/** Logs in, and when the account still has its one-time password, swaps it for `newPassword`. Returns a fresh token. */
export async function loginAndSettlePassword(email: string, password: string, newPassword: string): Promise<LoginData> {
  const first = await login(email, password);
  if (!first.mustChangePassword && password === newPassword) return first;
  if (first.mustChangePassword || password !== newPassword) {
    await api("PATCH", "/users/me/password", {
      token: first.accessToken,
      body: { currentPassword: password, newPassword, confirmPassword: newPassword },
    });
  }
  return login(email, newPassword);
}
