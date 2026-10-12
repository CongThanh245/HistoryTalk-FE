"use client";

import * as React from "react";
import { CheckCircle2, Coins, Eye, EyeOff, Wallet, XCircle } from "lucide-react";

import { formatNumber } from "@/components/saas/saas-ui";
import { STUDENT_IMPORT_FIELDS } from "@/features/saas/student-import";
import type { ImportedStudentAccount, StudentImportError } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";
import { originalLine, tokensAllocated, type ImportSession } from "./import-session";

const FIELD_LABELS: Record<string, string> = Object.fromEntries(STUDENT_IMPORT_FIELDS.map((f) => [f.column, f.label]));

/** Backend messages are English; translate the known ones. */
const MESSAGE_VI: [RegExp, string][] = [
  [/full name must not be blank/i, "Thiếu họ và tên"],
  [/date of birth format is invalid/i, "Ngày sinh không hợp lệ (cần yyyy-mm-dd)"],
  [/student code must contain only/i, "Mã học sinh chỉ gồm chữ không dấu, số, - và _ (2–30 ký tự)"],
  [/duplicate student code within the file/i, "Trùng mã học sinh trong file"],
  [/student code already exists in this school/i, "Mã học sinh đã tồn tại trong trường"],
  [/duplicate email within the file/i, "Trùng email trong file"],
  [/email already in use/i, "Email đã được dùng trong hệ thống"],
];
export const translateImportMessage = (m: string) => MESSAGE_VI.find(([re]) => re.test(m))?.[1] ?? m;

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Coins; label: string; value: number; tone?: "ok" | "bad" }) {
  return (
    <div className="flex items-start gap-3 rounded-[2px] border border-[var(--border-strong)] p-3">
      <Icon
        className={cn(
          "mt-0.5 h-5 w-5 shrink-0",
          tone === "ok" ? "text-[var(--status-success)]" : tone === "bad" ? "text-[var(--accent-danger)]" : "text-[var(--accent-gold)]",
        )}
        aria-hidden="true"
      />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</p>
        <p className="font-display text-xl font-extrabold tabular-nums text-content-heading">{formatNumber(value)}</p>
      </div>
    </div>
  );
}

export function ImportSummary({ session }: { session: ImportSession }) {
  const r = session.result;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={CheckCircle2} label="Tạo thành công" value={r.successCount} tone="ok" />
      <Stat icon={XCircle} label="Dòng lỗi" value={r.failureCount + session.skippedRows} tone={r.failureCount + session.skippedRows ? "bad" : undefined} />
      <Stat icon={Coins} label="Token đã cấp" value={tokensAllocated(r)} />
      <Stat icon={Wallet} label="Quỹ token còn lại" value={r.remainingSchoolTokens} />
    </div>
  );
}

const TH = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]";

export function ImportErrorsTable({ errors, session }: { errors: StudentImportError[]; session: Pick<ImportSession, "sentLines"> }) {
  if (!errors.length) return null;
  return (
    <div className="max-h-[40dvh] overflow-auto border-y border-[var(--text-primary)]">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="sr-only">Các dòng bị máy chủ từ chối</caption>
        <thead>
          <tr className="border-b border-[var(--border-strong)]">
            <th className={TH}>Dòng</th>
            <th className={TH}>Mã HS</th>
            <th className={TH}>Cột</th>
            <th className={TH}>Lỗi</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((e, i) => (
            <tr key={`${e.rowNumber}-${e.field}-${i}`} className="border-b border-[var(--border-default)] last:border-b-0">
              <td className="px-3 py-2 tabular-nums">{originalLine(session, e.rowNumber)}</td>
              <td className="px-3 py-2 font-mono text-xs">{e.studentCode || "—"}</td>
              <td className="px-3 py-2 text-xs">{e.field ? (FIELD_LABELS[e.field] ?? e.field) : "—"}</td>
              <td className="px-3 py-2 text-[var(--accent-danger)]">{translateImportMessage(e.message)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ImportAccountsTable({ accounts, maxHeight = "max-h-[50dvh]" }: { accounts: ImportedStudentAccount[]; maxHeight?: string }) {
  const [reveal, setReveal] = React.useState(false);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-content-muted">{accounts.length} tài khoản</p>
        <button type="button" className="archive-link" onClick={() => setReveal((v) => !v)} aria-pressed={reveal}>
          {reveal ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
          {reveal ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        </button>
      </div>
      <div className={cn("overflow-auto border-y border-[var(--text-primary)]", maxHeight)}>
        <table className="w-full min-w-[720px] text-sm">
          <caption className="sr-only">Tài khoản học sinh đã tạo</caption>
          <thead>
            <tr className="border-b border-[var(--border-strong)]">
              <th className={TH}>Học sinh</th>
              <th className={TH}>Email đăng nhập</th>
              <th className={TH}>Tên tài khoản</th>
              <th className={TH}>Mật khẩu tạm</th>
              <th className={cn(TH, "text-right")}>Token</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.uid} className="border-b border-[var(--border-default)] last:border-b-0">
                <td className="px-3 py-2">
                  <p className="font-medium text-content-heading">{a.fullName}</p>
                  <p className="font-mono text-xs text-content-muted">{a.studentCode}</p>
                </td>
                <td className="break-all px-3 py-2 font-mono text-xs">{a.email}</td>
                <td className="break-all px-3 py-2 font-mono text-xs text-content-muted">{a.userName}</td>
                <td className="px-3 py-2 font-mono text-xs font-bold">{reveal ? a.initialPassword : "••••••••••"}</td>
                <td className="px-3 py-2 text-right text-xs tabular-nums">{formatNumber(a.allocatedToken ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
