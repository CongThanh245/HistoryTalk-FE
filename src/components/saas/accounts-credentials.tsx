"use client";

import * as React from "react";
import { AlertTriangle, Copy, Download, Eye, EyeOff, Printer } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS } from "@/components/saas/saas-ui";
import {
  USER_NAME_LABEL,
  copyText,
  downloadCredentialsCsv,
  loginLabel,
  printCredentialSheet,
  todayStamp,
  type CredentialRecord,
} from "@/components/saas/accounts-utils";
import { cn } from "@/lib/utils/cn";

/** Yellow "shown once" warning used wherever temp passwords are revealed. */
export function OneTimeWarning({ className, children, printable = true }: { className?: string; children?: React.ReactNode; printable?: boolean }) {
  return (
    <p
      role="alert"
      className={cn(
        "flex items-start gap-2 rounded-sm border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]",
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
      <span>
        {children ?? (
          <>
            <b className="text-content-heading">Mật khẩu tạm chỉ hiển thị một lần.</b> Hãy sao chép, tải file{printable ? " hoặc in phiếu" : ""} trước khi đóng.
            Người dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.
          </>
        )}
      </span>
    </p>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void copyText(value, `Đã sao chép ${label.toLowerCase()}`)}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[var(--border-strong)] text-[var(--text-secondary)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--accent-gold)]"
      aria-label={`Sao chép ${label.toLowerCase()}`}
      title={`Sao chép ${label.toLowerCase()}`}
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function CredentialLine({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-semibold text-[var(--text-tertiary)]">{label}</p>
      <div className="flex items-center gap-2">
        <output className={cn("min-w-0 flex-1 truncate rounded-sm border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-content-heading", mono && "font-mono font-bold tracking-wide")}>
          {value}
        </output>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}

/** Cut-out cards preview of the printable "Phiếu tài khoản". */
export function CredentialCardGrid({ records, schoolName, className }: { records: CredentialRecord[]; schoolName?: string; className?: string }) {
  return (
    <ul className={cn("grid gap-0 sm:grid-cols-2", className)} aria-label="Phiếu tài khoản">
      {records.map((r) => (
        <li key={r.id} className="space-y-1.5 border border-dashed border-[var(--border-strong)] p-3">
          <p className="flex justify-between gap-2 text-xs font-semibold text-[var(--accent-gold)]">
            <span className="truncate">{schoolName ?? "HistoryTalk"}</span>
            <span>{r.roleLabel}</span>
          </p>
          <p className="text-sm font-bold leading-snug text-content-heading">{r.fullName}</p>
          {(r.studentCode || r.className) && (
            <p className="text-xs text-content-muted">
              {r.studentCode && <>Mã HS: <b className="text-content-text">{r.studentCode}</b></>}
              {r.studentCode && r.className && " · "}
              {r.className && <>Lớp: <b className="text-content-text">{r.className}</b></>}
            </p>
          )}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            <dt className="text-content-muted">{loginLabel(r)}</dt>
            <dd className="break-all font-mono font-bold">{r.login}</dd>
            {r.userName && (
              <>
                <dt className="text-content-muted">{USER_NAME_LABEL}</dt>
                <dd className="break-all font-mono">{r.userName}</dd>
              </>
            )}
            <dt className="text-content-muted">Mật khẩu tạm</dt>
            <dd className="font-mono font-bold">{r.password}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}

/** Download CSV + print sheet buttons for a list of credentials. */
export function CredentialExportActions({
  records,
  fileName,
  sheetTitle,
  schoolName,
  compact,
  printable = true,
  className,
}: {
  records: CredentialRecord[];
  fileName: string;
  sheetTitle: string;
  schoolName?: string;
  /** Two equal short buttons, for narrow dialogs. */
  compact?: boolean;
  /** Cut-out paper slips suit a class handing out many accounts; a single adult account just needs copy/CSV. */
  printable?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(compact ? cn("grid gap-2", printable && "grid-cols-2") : "flex flex-col gap-2 sm:flex-row sm:flex-wrap", className)}>
      <button
        type="button"
        className={cn("btn-line whitespace-nowrap", compact ? "w-full px-3" : "w-full sm:w-auto")}
        onClick={() => downloadCredentialsCsv(fileName, records)}
      >
        <Download className="h-4 w-4" aria-hidden="true" /> {compact ? "Tải CSV" : "Tải danh sách tài khoản (.csv)"}
      </button>
      {printable && (
        <button
          type="button"
          className={cn("btn-line whitespace-nowrap", compact ? "w-full px-3" : "w-full sm:w-auto")}
          onClick={() => printCredentialSheet({ title: sheetTitle, schoolName, records })}
        >
          <Printer className="h-4 w-4" aria-hidden="true" /> {compact ? "In phiếu" : "In phiếu tài khoản"}
        </button>
      )}
    </div>
  );
}

/**
 * One-time credentials dialog. Shown after creating an account with a temp password or resetting passwords.
 * Outside clicks are ignored so the passwords are not lost by accident; closing needs an explicit button.
 */
export function CredentialsDialog({
  open,
  onOpenChange,
  title = "Thông tin đăng nhập",
  description,
  records,
  schoolName,
  fileName,
  printable = true,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  records: CredentialRecord[];
  schoolName?: string;
  fileName?: string;
  /** false hides "In phiếu" (e.g. school admin accounts). */
  printable?: boolean;
}) {
  const [reveal, setReveal] = React.useState(false);
  const single = records.length === 1 ? records[0] : null;
  const csvName = fileName ?? `tai-khoan-${todayStamp()}.csv`;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setReveal(false);
        onOpenChange(o);
      }}
    >
      <DialogContent
        className={cn(DIALOG_CLASS, single ? "sm:max-w-md" : "sm:max-w-2xl")}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>{title}</DialogTitle>
          <DialogDescription className="text-content-muted">
            {description ??
              (single
                ? `Tài khoản của ${single.fullName} đã sẵn sàng. Gửi thông tin này cho người dùng qua kênh an toàn.`
                : `${records.length} tài khoản đã sẵn sàng.`)}
          </DialogDescription>
        </DialogHeader>

        <OneTimeWarning printable={printable} />

        {single ? (
          <div className="space-y-3">
            <CredentialLine label={loginLabel(single)} value={single.login} />
            <CredentialLine label="Mật khẩu tạm" value={single.password} mono />
            {single.userName && (
              <p className="text-xs leading-relaxed text-content-muted">
                {USER_NAME_LABEL}: <span className="break-all font-mono text-content-text">{single.userName}</span>. Dùng email ở trên để đăng nhập.
              </p>
            )}
            <button
              type="button"
              className="archive-link"
              onClick={() =>
                void copyText(
                  `${loginLabel(single)}: ${single.login}\nMật khẩu tạm: ${single.password}${single.userName ? `\n${USER_NAME_LABEL}: ${single.userName}` : ""}`,
                  "Đã sao chép thông tin đăng nhập",
                )
              }
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Sao chép tất cả
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-content-muted">{records.length} tài khoản</p>
              <button type="button" className="archive-link" onClick={() => setReveal((v) => !v)} aria-pressed={reveal}>
                {reveal ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                {reveal ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              </button>
            </div>
            <div className="max-h-[38dvh] overflow-auto border-y border-border-card">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-strong)] text-left text-[13px] font-semibold text-[var(--text-tertiary)]">
                    <th className="px-3 py-2 font-semibold">Họ và tên</th>
                    <th className="px-3 py-2 font-semibold">{records.some((r) => r.userName) ? "Email đăng nhập" : "Tên đăng nhập"}</th>
                    <th className="px-3 py-2 font-semibold">Mật khẩu tạm</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-default)] last:border-b-0">
                      <td className="px-3 py-2">
                        <span className="font-medium">{r.fullName}</span>
                        {r.className && <span className="text-xs text-content-muted"> · {r.className}</span>}
                      </td>
                      <td className="break-all px-3 py-2 font-mono text-xs">
                        {r.login}
                        {r.userName && <span className="block text-[11px] text-content-muted">{r.userName}</span>}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs font-bold">{reveal ? r.password : "••••••••••"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 border-t border-[var(--border-default)] pt-4 sm:flex-col sm:justify-start">
          <CredentialExportActions records={records} fileName={csvName} sheetTitle={title} schoolName={schoolName} printable={printable} compact />
          <button type="button" className="btn-crimson w-full whitespace-nowrap" onClick={() => onOpenChange(false)}>
            Đã lưu, đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
