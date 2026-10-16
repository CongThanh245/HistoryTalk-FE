"use client";

import { Coins, School as SchoolIcon } from "lucide-react";
import { TokenBar, formatNumber, useHydrated } from "@/components/saas/saas-ui";
import { ROLE_LABELS, type Role } from "@/constants/roles";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";

/**
 * Profile "Hạn mức token" tab for Teacher / School Student: tokens are allocated by the school,
 * so there is nothing to buy or upgrade here and no payment history.
 * Hoc sinh: GET /student/dashboard (currentTokens, tokensUsedToday). Giao vien: BE chua co API token.
 */
export function SchoolQuotaCard({ role }: { role: string | undefined }) {
  const hydrated = useHydrated();
  const entitlements = useEntitlements();
  const quota = useTodayQuota();

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--text-primary)] p-5">
          <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="archive-title is-plain text-[20px]">{entitlements.schoolName ?? "Tài khoản trường"}</p>
            <p className="text-xs text-content-muted">Tài khoản {role ? ROLE_LABELS[role as Role] ?? role : ""}</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          {quota ? (
            <>
              <div className="flex items-center gap-3">
                <Coins className="h-7 w-7 shrink-0 text-[var(--gold-leaf)]" aria-hidden="true" />
                <p className="text-base font-semibold text-content-heading">
                  Token còn lại: <span className="tabular-nums">{formatNumber(quota.remaining)}</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <TokenBar used={quota.used} quota={quota.quota} className="h-3" />
                <p className="text-xs tabular-nums text-content-muted">Đã dùng hôm nay: {formatNumber(quota.used)} token</p>
              </div>
              <p className="text-xs text-content-muted">Token do trường cấp. Cần thêm token, hãy liên hệ quản trị trường.</p>
            </>
          ) : (
            <p className="text-sm text-content-muted">
              {role === "TEACHER" ? "Chưa có dữ liệu token cho tài khoản giáo viên." : "Đang tải thông tin token..."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
