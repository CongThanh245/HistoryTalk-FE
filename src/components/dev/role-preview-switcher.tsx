"use client";

import { useEffect, useState } from "react";
import { Eye, RotateCcw, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { persistAuthCookies } from "@/features/auth/auth-cookies";
import { getRoleHome, ROLE_LABELS, Role } from "@/constants/roles";
import type { User } from "@/features/auth/type";
import { cn } from "@/lib/utils/cn";

/**
 * Dev-only "Xem với vai trò…" switcher for demoing the school (SaaS) screens before the backend issues
 * SCHOOL_ADMIN / TEACHER / SCHOOL_STUDENT accounts. It swaps the role kept in the auth store + cookie
 * (so routing, sidebars and mock screens follow it) while keeping the real token, so API calls still
 * run with the real account's permissions. Enabled in development or with NEXT_PUBLIC_ROLE_PREVIEW=true.
 */
export const ROLE_PREVIEW_ENABLED =
  process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ROLE_PREVIEW === "true";

const ORIGINAL_ROLE_KEY = "historytalk:role-preview:original";

const ROLE_ORDER: User["role"][] = [
  Role.CUSTOMER,
  Role.SCHOOL_STUDENT,
  Role.TEACHER,
  Role.SCHOOL_ADMIN,
  Role.CONTENT_ADMIN,
  Role.SYSTEM_ADMIN,
];

function readOriginal(): User["role"] | null {
  try {
    return (localStorage.getItem(ORIGINAL_ROLE_KEY) as User["role"] | null) ?? null;
  } catch {
    return null;
  }
}

export function RolePreviewSwitcher() {
  const user = useAuthStore((s) => s.user);
  const tokens = useAuthStore((s) => s.tokens);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [open, setOpen] = useState(false);
  const [original, setOriginal] = useState<User["role"] | null>(null);

  useEffect(() => {
    setOriginal(readOriginal());
  }, []);

  if (!ROLE_PREVIEW_ENABLED) return null;

  const switchTo = (role: User["role"]) => {
    if (!user || !tokens) return;
    try {
      if (!readOriginal()) localStorage.setItem(ORIGINAL_ROLE_KEY, user.role);
      if (role === readOriginal()) localStorage.removeItem(ORIGINAL_ROLE_KEY);
    } catch {
      // Storage unavailable: the switch still works for this session.
    }
    updateUser({ role });
    persistAuthCookies(tokens.accessToken, role, tokens.expiresIn);
    // Full reload so the middleware sees the new cookie.
    window.location.href = getRoleHome(role);
  };

  const previewing = !!original && !!user && original !== user.role;

  return (
    <div className="fixed bottom-4 left-1/2 z-[2000] -translate-x-1/2 print:hidden">
      {open && (
        <div
          role="dialog"
          aria-label="Xem giao diện với vai trò khác"
          className="mb-2 w-[min(340px,calc(100vw-32px))] rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-soft)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-display text-lg font-bold leading-[1.2] text-[var(--text-primary)]">Xem với vai trò</p>
              <p className="mt-0.5 text-[11.5px] leading-snug text-[var(--text-tertiary)]">
                Chỉ có ở môi trường dev. Giao diện đổi theo vai trò; API vẫn dùng quyền của tài khoản thật.
              </p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Đóng" className="grid h-7 w-7 shrink-0 place-items-center rounded-[2px] text-[var(--text-secondary)] hover:bg-[var(--status-neutral-bg)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user || !tokens ? (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">Đăng nhập một tài khoản bất kỳ trước, rồi chọn vai trò để xem.</p>
          ) : (
            <ul className="mt-3 grid gap-1">
              {ROLE_ORDER.map((role) => {
                const active = user.role === role;
                return (
                  <li key={role}>
                    <button
                      type="button"
                      onClick={() => switchTo(role)}
                      disabled={active}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-[2px] border px-3 py-2 text-left text-sm transition-colors",
                        active
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] font-semibold text-white"
                          : "border-[var(--border-strong)] text-[var(--text-primary)] hover:border-[var(--text-primary)]",
                      )}
                    >
                      <span>{ROLE_LABELS[role]}</span>
                      <span className={cn("text-[11px] font-semibold tracking-[0.04em]", active ? "text-white/85" : "text-[var(--text-tertiary)]")}>
                        {role === original ? "Gốc · " : ""}{getRoleHome(role)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {previewing && original && (
            <button type="button" onClick={() => switchTo(original)} className="btn-line mt-3 w-full">
              <RotateCcw className="h-4 w-4" /> Về vai trò gốc ({ROLE_LABELS[original]})
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          "mx-auto flex items-center gap-2 rounded-[2px] border px-3 py-1.5 text-[12px] font-semibold shadow-[var(--shadow-soft)] transition-colors",
          previewing
            ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-white"
            : "border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]",
        )}
      >
        <Eye className="h-3.5 w-3.5" />
        {user ? `Vai trò: ${ROLE_LABELS[user.role as User["role"]] ?? user.role}` : "Xem với vai trò"}
        {previewing && <span className="text-[11px] font-medium opacity-85">(xem trước)</span>}
      </button>
    </div>
  );
}
