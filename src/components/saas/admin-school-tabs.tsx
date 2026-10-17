"use client";

import * as React from "react";
import { Check, X } from "lucide-react";

import { Panel, SectionHeading, TokenBar, formatNumber } from "@/components/saas/saas-ui";
import { formatDateTime, schoolPool } from "@/features/saas/admin-schools";
import type { ApiSchool } from "@/services/school.service";

/* ───────────────────────── Thông tin ───────────────────────── */
function InfoItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1 border-b border-[var(--border-default)] pb-3">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</dt>
      <dd className="text-sm text-content-heading">{children}</dd>
    </div>
  );
}

const Missing = () => <span className="text-content-muted">Chưa cập nhật</span>;

/** School record as returned by `GET /admin/schools/{id}`. */
export function SchoolInfoTab({ school }: { school: ApiSchool }) {
  return (
    <div className="space-y-6">
      <SchoolTokenPoolCard school={school} />
      <Panel>
        <SectionHeading title="Thông tin liên hệ" />
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Địa chỉ">{school.address || <Missing />}</InfoItem>
          <InfoItem label="Email liên hệ">
            <a href={`mailto:${school.contactEmail}`} className="break-all hover:text-[var(--accent-gold)]">
              {school.contactEmail}
            </a>
          </InfoItem>
          <InfoItem label="Điện thoại liên hệ">{school.contactPhone ? <span className="tabular-nums">{school.contactPhone}</span> : <Missing />}</InfoItem>
          <InfoItem label="Cam kết nội dung giáo viên">
            {school.localHistoryPolicyAccepted ? (
              <span className="inline-flex items-center gap-1.5 text-[var(--status-success)]">
                <Check className="h-4 w-4" aria-hidden="true" /> Đã đồng ý
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[var(--accent-danger)]">
                <X className="h-4 w-4" aria-hidden="true" /> Chưa đồng ý
              </span>
            )}
          </InfoItem>
          <InfoItem label="Ngày tạo">
            <span className="tabular-nums">{formatDateTime(school.createdAt)}</span>
          </InfoItem>
        </dl>
      </Panel>
    </div>
  );
}

/* ───────────────────────── Quỹ token ───────────────────────── */
function PoolFigure({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
      <p className="font-display text-2xl font-extrabold leading-[1.25] tabular-nums text-content-heading">{formatNumber(value)}</p>
      {hint && <p className="text-xs text-content-muted">{hint}</p>}
    </div>
  );
}

/** Monthly token pool: total from the package, how much the School Admin already handed out, what is left. */
export function SchoolTokenPoolCard({ school }: { school: ApiSchool }) {
  const pool = schoolPool(school);
  return (
    <Panel>
      <SectionHeading title="Quỹ token" description="Trường nhận token theo gói; quản trị trường cấp lại cho từng học sinh khi tạo tài khoản." />
      <div className="grid gap-6 sm:grid-cols-3">
        <PoolFigure label="Tổng quỹ" value={pool.total} hint="token mỗi tháng theo gói" />
        <PoolFigure label="Đã cấp cho học sinh" value={pool.allocated} hint={`${pool.percent}% tổng quỹ`} />
        <PoolFigure label="Còn lại" value={pool.unallocated} hint="có thể cấp thêm cho học sinh" />
      </div>
      <TokenBar used={pool.allocated} quota={pool.total} />
    </Panel>
  );
}
