"use client";

import { Clock, Coins, Phone, School as SchoolIcon, Video } from "lucide-react";
import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { TokenBar, formatNumber, useHydrated } from "@/components/saas/saas-ui";
import { ROLE_LABELS, type Role } from "@/constants/roles";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";
import { cn } from "@/lib/utils/cn";

/**
 * Profile "Hạn mức token" tab for Teacher / School Student: their tokens come from the school's daily quota
 * (Role Matrix row 20), so there is nothing to buy or upgrade here and no payment history.
 */
export function SchoolQuotaCard({ role }: { role: string | undefined }) {
  const hydrated = useHydrated();
  const entitlements = useEntitlements();
  const quota = useTodayQuota();

  if (!hydrated) return null;
  if (!quota || !entitlements.schoolName) {
    return <p className="text-sm text-content-muted">Không tìm thấy thông tin trường.</p>;
  }

  const features = [
    { label: "Gọi thoại", icon: Phone, enabled: entitlements.voiceCall },
    { label: "Video call 3D", icon: Video, enabled: entitlements.videoCall },
  ];
  const anyLocked = features.some((f) => !f.enabled);

  return (
    <div className="space-y-5">
      <MockDataNotice />
      <div className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--text-primary)] p-5">
          <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="archive-title is-plain text-[20px]">{entitlements.schoolName}</p>
            <p className="text-xs text-content-muted">
              Tài khoản {role ? ROLE_LABELS[role as Role] ?? role : ""} · Gói của trường: {entitlements.planLabel}
            </p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3">
            <Coins className="h-7 w-7 shrink-0 text-[var(--gold-leaf)]" aria-hidden="true" />
            <p className="text-base font-semibold text-content-heading">
              Hạn mức token do trường cấp: <span className="tabular-nums">{formatNumber(quota.baseQuota)}</span>/ngày
            </p>
          </div>
          <div className="space-y-1.5">
            <TokenBar used={quota.used} quota={quota.quota} className="h-3" />
            <p className="text-xs tabular-nums text-content-muted">
              Hạn mức hôm nay: đã dùng {formatNumber(quota.used)} / {formatNumber(quota.quota)} token
              {quota.bonus > 0 && ` (gồm +${formatNumber(quota.bonus)} từ nhiệm vụ hằng ngày)`}
            </p>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Tính năng trong gói của trường">
            {features.map(({ label, icon: Icon, enabled }) => (
              <li
                key={label}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs font-semibold",
                  enabled
                    ? "border-[color-mix(in_srgb,var(--jade)_45%,transparent)] text-[var(--jade)]"
                    : "border-[var(--border-strong)] text-content-muted",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}: {enabled ? "có trong gói" : "chưa có"}
              </li>
            ))}
          </ul>
          {anyLocked && <p className="text-xs text-content-muted">{entitlements.upgradeHint}</p>}
          <p className="inline-flex items-center gap-1.5 text-xs text-content-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Hạn mức reset mỗi ngày lúc 00:00. Cần thêm token, hãy liên hệ quản trị trường.
          </p>
        </div>
      </div>
    </div>
  );
}
