import type { User } from "./type";

/**
 * Name to show for a user: full name first, login name as fallback.
 * School accounts get generated login names (e.g. "tl-ahi-01_hs_hs001"), so never show userName when fullName exists.
 */
export function displayName(user: Pick<User, "userName" | "fullName"> | null | undefined, fallback = "—"): string {
  return user?.fullName?.trim() || user?.userName || fallback;
}
