import type { AuthTokens, User } from "./type";
import { AUTH_COOKIE_KEYS } from "@/constants/routes";

export function getCookieMaxAge(expiresIn: number) {
  return expiresIn > 100000 ? Math.floor(expiresIn / 1000) : expiresIn;
}

export function persistAuthCookies(
  accessToken: string,
  role: User["role"],
  expiresIn: number,
) {
  if (typeof document === "undefined") return;

  const maxAge = getCookieMaxAge(expiresIn);

  document.cookie = `${AUTH_COOKIE_KEYS.TOKEN}=${accessToken}; path=/; max-age=${maxAge}; sameSite=lax`;
  document.cookie = `${AUTH_COOKIE_KEYS.ROLE}=${role}; path=/; max-age=${maxAge}; sameSite=lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE_KEYS.TOKEN}=; path=/; max-age=0; sameSite=lax`;
  document.cookie = `${AUTH_COOKIE_KEYS.ROLE}=; path=/; max-age=0; sameSite=lax`;
}

export function syncAuthCookies(user: User | null, tokens: AuthTokens | null) {
  if (!user || !tokens?.accessToken) return false;

  persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);
  return true;
}
