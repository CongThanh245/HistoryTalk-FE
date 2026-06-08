import type { AuthTokens, User } from "./type";

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

  document.cookie = `auth-token=${accessToken}; path=/; max-age=${maxAge}; sameSite=lax`;
  document.cookie = `auth-role=${role}; path=/; max-age=${maxAge}; sameSite=lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;

  document.cookie = "auth-token=; path=/; max-age=0; sameSite=lax";
  document.cookie = "auth-role=; path=/; max-age=0; sameSite=lax";
}

export function syncAuthCookies(user: User | null, tokens: AuthTokens | null) {
  if (!user || !tokens?.accessToken) return false;

  persistAuthCookies(tokens.accessToken, user.role, tokens.expiresIn);
  return true;
}
