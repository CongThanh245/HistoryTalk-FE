"use client";

import * as React from "react";
import { FileCheck2, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CredentialExportActions, OneTimeWarning } from "@/components/saas/accounts-credentials";
import { todayStamp } from "@/components/saas/accounts-utils";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, formatNumber } from "@/components/saas/saas-ui";
import { cn } from "@/lib/utils/cn";
import { ImportAccountsTable, ImportErrorsTable, ImportSummary } from "./import-result";
import { studentCredentials, useImportSession, type ImportSession } from "./import-session";

const describe = (s: ImportSession) =>
  `File ${s.fileName} · ${new Date(s.importedAt).toLocaleString("vi-VN")} · ${formatNumber(s.defaultInitialToken)} token mỗi học sinh`;

/**
 * Notice for the last import of this tab (credentials live in memory only) with buttons to reopen the full result
 * (credentials, CSV, print sheet) or drop it from the session. Renders nothing when there is no import.
 */
export function LastImportBar({ schoolName }: { schoolName?: string }) {
  const last = useImportSession((s) => s.last);
  const clear = useImportSession((s) => s.clear);
  const [open, setOpen] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

  if (!last) return null;
  const created = last.result.successfulAccounts.length;
  const failed = last.result.failureCount + last.skippedRows;

  return (
    <>
      <section
        aria-label="Kết quả nhập gần nhất"
        className="flex flex-col gap-3 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-3">
          <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-bold text-content-heading">
              Kết quả nhập gần nhất: {created} tài khoản đã tạo{failed ? `, ${failed} dòng lỗi` : ""}
            </p>
            <p className="break-words text-xs text-content-muted">
              {describe(last)}. Mật khẩu tạm chỉ còn trong phiên này; tải lại trang sẽ mất.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" className="btn-ink w-full sm:w-auto" onClick={() => setOpen(true)}>
            Xem kết quả, in phiếu
          </button>
          <button type="button" className="archive-link" onClick={() => setConfirmClear(true)}>
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Xóa khỏi phiên
          </button>
        </div>
      </section>

      <LastImportDialog session={last} open={open} onOpenChange={setOpen} schoolName={schoolName} />

      <ConfirmDialog
        open={confirmClear}
        onOpenChange={setConfirmClear}
        title="Xóa kết quả nhập khỏi phiên?"
        description="Mật khẩu tạm sẽ không xem lại được nữa. Tài khoản học sinh vẫn còn trên máy chủ."
        confirmLabel="Xóa khỏi phiên"
        variant="warning"
        onConfirm={() => {
          clear();
          setConfirmClear(false);
        }}
      />
    </>
  );
}

function LastImportDialog({
  session,
  open,
  onOpenChange,
  schoolName,
}: {
  session: ImportSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName?: string;
}) {
  const r = session.result;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-4xl")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>Kết quả nhập gần nhất</DialogTitle>
          <DialogDescription className="break-words text-content-muted">{describe(session)}</DialogDescription>
        </DialogHeader>

        <div className="min-w-0 space-y-5">
          <ImportSummary session={session} />

          {r.successfulAccounts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-content-heading">Tài khoản đã tạo</h3>
              <OneTimeWarning>
                <b className="text-content-heading">Mật khẩu tạm chỉ còn trong phiên này.</b> Tải danh sách hoặc in phiếu tài khoản trước khi tải lại
                trang. Học sinh đăng nhập bằng email và phải đổi mật khẩu ở lần đầu.
              </OneTimeWarning>
              <CredentialExportActions
                records={studentCredentials(r.successfulAccounts)}
                fileName={`tai-khoan-hoc-sinh-${todayStamp()}.csv`}
                sheetTitle="Phiếu tài khoản học sinh"
                schoolName={schoolName}
              />
              <ImportAccountsTable accounts={r.successfulAccounts} maxHeight="max-h-[40dvh]" />
            </div>
          )}

          {r.errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-content-heading">Dòng bị máy chủ từ chối ({r.errors.length})</h3>
              <ImportErrorsTable errors={r.errors} session={session} />
            </div>
          )}
          {session.skippedRows > 0 && (
            <p className="text-xs text-content-muted">{session.skippedRows} dòng lỗi đã được bỏ qua ở bước kiểm tra trước khi gửi.</p>
          )}
        </div>

        <DialogFooter>
          <button type="button" className="btn-line w-full sm:w-auto" onClick={() => onOpenChange(false)}>
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
