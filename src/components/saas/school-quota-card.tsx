"use client";

import * as React from "react";
import Link from "next/link";
import { Coins, School as SchoolIcon } from "lucide-react";
import { TokenBar, formatDate, formatNumber, useHydrated } from "@/components/saas/saas-ui";
import { TokenBoostRequestDialog, usePendingBoostToday } from "@/components/saas/token-boost-request-dialog";
import { TokenBoostStatusBadge } from "@/components/saas/token-boost-ui";
import { ROLE_LABELS, type Role } from "@/constants/roles";
import { ROUTES } from "@/constants/routes";
import { useEntitlements } from "@/features/saas/entitlements";
import { useMyTokenBoosts } from "@/features/saas/hooks-school-token";
import { useTodayQuota } from "@/features/saas/quota-bonus";

/**
 * Profile "Hạn mức token" tab for Teacher / School Student. Sprint 7: every school spends from one shared pool;
 * a student may use up to the daily limit of their class (or the school default) plus what the teacher approved
 * today. Teachers' own chats are not counted against any limit.
 */
export function SchoolQuotaCard({ role }: { role: string | undefined }) {
  const hydrated = useHydrated();
  const entitlements = useEntitlements();
  const quota = useTodayQuota();
  const isStudent = role === "SCHOOL_STUDENT";
  const [boostOpen, setBoostOpen] = React.useState(false);
  const pending = usePendingBoostToday(isStudent);

  if (!hydrated) return null;

  return (
    <div className="space-y-5">
      <div className="rounded-sm border border-border-card bg-[var(--bg-surface)]">
        <div className="flex items-center gap-3 border-b border-[var(--border-default)] p-5">
          <SchoolIcon className="h-6 w-6 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
          <div className="min-w-0">
            <p className="archive-title is-plain text-[20px]">{entitlements.schoolName ?? "Tài khoản trường"}</p>
            <p className="text-xs text-content-muted">Tài khoản {role ? ROLE_LABELS[role as Role] ?? role : ""}</p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          {!isStudent ? (
            <div className="space-y-2 text-sm text-content-muted">
              <p>
                Giáo viên có hạn mức token riêng mỗi ngày, dùng chung cho trò chuyện AI và phần cấp thêm cho học sinh. Hết hạn mức thì gửi yêu cầu
                lên quản trị trường.
              </p>
              <p>
                Xem số dư, duyệt yêu cầu của học sinh và xin thêm hạn mức tại trang{" "}
                <Link href={ROUTES.TEACHING.TOKEN_REQUESTS} className="archive-link">
                  Yêu cầu token
                </Link>
                .
              </p>
            </div>
          ) : quota ? (
            <>
              <div className="flex items-center gap-3">
                <Coins className="h-7 w-7 shrink-0 text-[var(--gold-leaf)]" aria-hidden="true" />
                <p className="text-base font-semibold text-content-heading">
                  Còn dùng được hôm nay: <span className="tabular-nums">{formatNumber(quota.remaining)}</span> token
                </p>
              </div>
              <div className="space-y-1.5">
                <TokenBar used={quota.used} quota={quota.quota} className="h-3" />
                <p className="text-xs tabular-nums text-content-muted">
                  Đã dùng {formatNumber(quota.used)} / {formatNumber(quota.quota)} token hôm nay
                  {quota.bonus > 0 && ` (gồm ${formatNumber(quota.bonus)} token thầy cô duyệt thêm)`}
                </p>
              </div>
              <p className="text-xs text-content-muted">
                Hạn mức hằng ngày do nhà trường đặt và làm mới lúc 00:00. Khi hết hạn mức chỉ khóa trò chuyện AI; quiz, tài liệu và bài tập vẫn dùng
                bình thường.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="btn-crimson" onClick={() => setBoostOpen(true)} disabled={!!pending}>
                  Xin thêm token hôm nay
                </button>
                {pending && <span className="text-xs text-content-muted">Yêu cầu hôm nay đang chờ thầy cô duyệt.</span>}
              </div>
            </>
          ) : (
            <p className="text-sm text-content-muted">Đang tải thông tin token...</p>
          )}
        </div>
      </div>

      {isStudent && <MyBoostHistory />}
      {isStudent && <TokenBoostRequestDialog open={boostOpen} onOpenChange={setBoostOpen} />}
    </div>
  );
}

function MyBoostHistory() {
  const { data, isPending, isError } = useMyTokenBoosts();
  const rows = (data ?? []).slice(0, 10);
  return (
    <div className="rounded-sm border border-border-card bg-[var(--bg-surface)] p-5">
      <p className="mb-3 text-[13px] font-semibold text-[var(--text-tertiary)]">Yêu cầu xin thêm token</p>
      {isPending ? (
        <p className="text-sm text-content-muted">Đang tải...</p>
      ) : isError ? (
        <p className="text-sm text-[var(--accent-danger)]">Không tải được lịch sử yêu cầu.</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-content-muted">Bạn chưa gửi yêu cầu nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-default)]">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-content-heading">
                  {formatNumber(r.requestedTokens)} token · {formatDate(r.requestDate)}
                  {r.status === "APPROVED" && r.approvedTokens != null && r.approvedTokens !== r.requestedTokens && (
                    <span className="font-normal text-content-muted"> · duyệt {formatNumber(r.approvedTokens)}</span>
                  )}
                </p>
                <p className="line-clamp-2 text-xs text-content-muted">{r.reason}</p>
                {r.reviewNote && (
                  <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                    {r.reviewedByName ?? "Thầy cô"}: {r.reviewNote}
                  </p>
                )}
              </div>
              <TokenBoostStatusBadge status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
