import type { AuthTokens, User } from "./type";
import { AUTH_COOKIE_KEYS } from "@/constants/routes";
import { useAuthStore } from "@/store/auth.store";

const AUTH_STORAGE_KEY = "auth-storage";

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

  const expireCookie = (key: string, attributes = "") => {
    document.cookie = `${key}=; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT${attributes}`;
  };

  const paths = ["/", window.location.pathname || "/"];
  const host = window.location.hostname;
  const domains = ["", host, `.${host}`];

  for (const path of paths) {
    for (const domain of domains) {
      const domainAttr = domain ? `; domain=${domain}` : "";
      const attributes = `; path=${path}${domainAttr}; sameSite=lax`;
      expireCookie(AUTH_COOKIE_KEYS.TOKEN, attributes);
      expireCookie(AUTH_COOKIE_KEYS.ROLE, attributes);
    }
  }
}

export function resetClientAuth() {
  useAuthStore.getState().clearAuth();
  useAuthStore.persist.clearStorage();

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  clearAuthCookies();
}

export function syncAuthCookies(user: User | null, tokens: AuthTokens | null) {
  if (!user || !tokens?.accessToken) return false;

  persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);
  return true;
}
