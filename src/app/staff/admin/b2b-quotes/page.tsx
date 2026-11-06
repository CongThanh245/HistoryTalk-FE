"use client";

import * as React from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Loader2, PhoneCall, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NoResults, TableEmpty, TablePagination, TableSkeleton } from "@/components/saas/accounts-table";
import { ErrorRetry, useDebouncedValue } from "@/components/saas/admin-school-shared";
import { Panel, SaasShell, SearchInput, formatNumber } from "@/components/saas/saas-ui";
import { CredentialsDialog } from "@/components/saas/accounts-credentials";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormTextarea } from "@/components/staff/staff-form";
import { codeSlug, formatDateTime } from "@/features/saas/admin-schools";
import { formatVnd } from "@/features/payment/tier-plans";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { todayStamp } from "@/components/saas/accounts-utils";
import { cn } from "@/lib/utils/cn";
import {
  B2B_PACKAGE_LABELS,
  B2B_QUOTE_STATUS_LABELS,
  b2bQuoteService,
  type B2bQuote,
  type B2bQuoteApproval,
  type B2bQuoteStatus,
} from "@/services/b2b-quote.service";

const PAGE_SIZES = [10, 20, 50];
const STATUS_FILTERS: (B2bQuoteStatus | "ALL")[] = ["ALL", "PENDING", "CONTACTED", "APPROVED", "REJECTED"];
const quotesKey = ["admin", "b2b-quotes"] as const;

const STATUS_STYLES: Record<B2bQuoteStatus, string> = {
  PENDING: "border-[var(--status-warning)] text-[var(--status-warning)]",
  CONTACTED: "border-[var(--accent-blue)] text-[var(--accent-blue)]",
  APPROVED: "border-[var(--status-success)] text-[var(--status-success)]",
  REJECTED: "border-[var(--border-strong)] text-[var(--text-muted)]",
};

function StatusPill({ status }: { status: B2bQuoteStatus }) {
  return (
    <span className={cn("inline-flex rounded-sm border px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]", STATUS_STYLES[status])}>
      {B2B_QUOTE_STATUS_LABELS[status]}
    </span>
  );
}

/** System Admin: school quote requests from the public pricing page; approving one creates the school. */
export default function AdminB2bQuotesPage() {
  return (
    <SaasShell
      live
      title="Yêu cầu báo giá trường học"
      description="Các trường gửi yêu cầu từ trang Bảng giá trường học. Liên hệ, thống nhất chiết khấu, rồi duyệt để tự tạo trường và tài khoản quản trị trường."
      fallback={<TableSkeleton rows={8} cols={7} />}
    >
      <QuotesContent />
    </SaasShell>
  );
}

function QuotesContent() {
  const [search, setSearch] = React.useState("");
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const [status, setStatus] = React.useState<B2bQuoteStatus | "ALL">("PENDING");
  const [page, setPage] = React.useState(0);
  const [size, setSize] = React.useState(10);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const [lastFilter, setLastFilter] = React.useState(`${debouncedSearch}|${status}`);
  if (`${debouncedSearch}|${status}` !== lastFilter) {
    setLastFilter(`${debouncedSearch}|${status}`);
    setPage(0);
  }

  const params = { status: status === "ALL" ? undefined : status, search: debouncedSearch, page: page + 1, size };
  const { data, isLoading, isError, error, refetch, isFetching, isPlaceholderData } = useQuery({
    queryKey: [...quotesKey, params],
    queryFn: () => b2bQuoteService.list(params),
    placeholderData: keepPreviousData,
  });
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const searching = debouncedSearch !== "";

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm mã báo giá, tên trường, email, số điện thoại..."
            className="lg:w-[380px]"
          />
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Lọc theo trạng thái">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "h-9 rounded-sm border px-3 text-xs font-semibold transition-colors",
                  status === s
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]",
                )}
              >
                {s === "ALL" ? "Tất cả" : B2B_QUOTE_STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {!isLoading && !isError && (
          <p className="flex items-center gap-2 text-sm text-content-muted" aria-live="polite">
            {formatNumber(total)} yêu cầu
            {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent-gold)]" aria-label="Đang cập nhật" />}
          </p>
        )}

        {isLoading ? (
          <TableSkeleton rows={size > 10 ? 10 : size} cols={7} />
        ) : isError ? (
          <ErrorRetry
            title="Không tải được danh sách báo giá"
            message={getApiErrorMessage(error, "Máy chủ không phản hồi. Kiểm tra kết nối rồi thử lại.")}
            onRetry={() => void refetch()}
            retrying={isFetching}
          />
        ) : (
          <div className="space-y-3">
            <div
              className={cn(
                "overflow-x-auto rounded-lg border border-border-card bg-[var(--bg-surface)] transition-opacity",
                isPlaceholderData && "opacity-60",
              )}
              aria-busy={isFetching}
            >
              <Table className="min-w-max">
                <caption className="sr-only">Yêu cầu báo giá trường học</caption>
                <TableHeader>
                  <TableRow className="border-b border-border-card">
                    {["Mã", "Trường", "Liên hệ", "Quy mô", "Tổng năm học", "Ngày gửi", "Trạng thái"].map((h) => (
                      <TableHead key={h} className="px-3 text-[13px] font-semibold text-[var(--text-tertiary)]">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="p-0">
                        {searching ? (
                          <NoResults onReset={() => setSearch("")} message={`Không có yêu cầu nào khớp “${debouncedSearch}”.`} />
                        ) : (
                          <TableEmpty
                            icon={FileText}
                            title="Chưa có yêu cầu nào"
                            description="Yêu cầu báo giá từ trang Bảng giá trường học sẽ hiện ở đây."
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((q) => (
                      <TableRow
                        key={q.id}
                        className="cursor-pointer"
                        tabIndex={0}
                        onClick={() => setOpenId(q.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setOpenId(q.id))}
                      >
                        <TableCell className="px-3 font-mono text-[13px] font-semibold">{q.quoteCode}</TableCell>
                        <TableCell className="px-3">
                          <p className="font-semibold text-[var(--text-primary)]">{q.schoolName}</p>
                          <p className="text-xs text-content-muted">{B2B_PACKAGE_LABELS[q.selectedPackage] ?? q.selectedPackage}</p>
                        </TableCell>
                        <TableCell className="px-3">
                          <p className="text-sm">{q.fullName}</p>
                          <p className="text-xs text-content-muted">{q.contactEmail}</p>
                        </TableCell>
                        <TableCell className="px-3 text-sm tabular-nums">
                          {formatNumber(q.numberOfStudents)} HS · {formatNumber(q.numberOfTeachers)} GV
                        </TableCell>
                        <TableCell className="px-3 text-sm font-semibold tabular-nums">
                          {formatVnd(q.finalPriceVnd)}
                          {q.discountPercent > 0 && <span className="ml-1 text-xs font-normal text-content-muted">(−{q.discountPercent}%)</span>}
                        </TableCell>
                        <TableCell className="px-3 text-sm text-content-muted">{formatDateTime(q.createdAt)}</TableCell>
                        <TableCell className="px-3">
                          <StatusPill status={q.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {total > 0 && (
              <TablePagination
                pageIndex={page}
                pageSize={size}
                total={total}
                pageSizeOptions={PAGE_SIZES}
                onPageChange={setPage}
                onPageSizeChange={(s) => {
                  setSize(s);
                  setPage(0);
                }}
              />
            )}
          </div>
        )}
      </Panel>

      <QuoteSheet quoteId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 border-b border-[var(--border-default)] py-2 text-sm">
      <dt className="text-content-muted">{label}</dt>
      <dd className="min-w-0 break-words text-[var(--text-primary)]">{children}</dd>
    </div>
  );
}

function QuoteSheet({ quoteId, onClose }: { quoteId: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: quote, isLoading, isError, error } = useQuery({
    queryKey: [...quotesKey, "detail", quoteId],
    queryFn: () => b2bQuoteService.get(quoteId!),
    enabled: !!quoteId,
  });

  const [discount, setDiscount] = React.useState("");
  const [note, setNote] = React.useState("");
  React.useEffect(() => {
    setDiscount(quote ? String(quote.discountPercent) : "");
    setNote(quote?.adminNote ?? "");
  }, [quote]);

  const [confirmApprove, setConfirmApprove] = React.useState(false);
  const [approval, setApproval] = React.useState<B2bQuoteApproval | null>(null);

  const refresh = (updated?: B2bQuote) => {
    if (updated) qc.setQueryData([...quotesKey, "detail", updated.id], updated);
    qc.invalidateQueries({ queryKey: quotesKey });
  };

  const discountNumber = Number(discount);
  const discountValid = discount.trim() !== "" && Number.isInteger(discountNumber) && discountNumber >= 0 && discountNumber <= 100;
  const updateStatus = useMutation({
    mutationFn: (status: "CONTACTED" | "REJECTED") =>
      b2bQuoteService.updateStatus(quoteId!, {
        status,
        ...(quote && discountValid && discountNumber !== quote.discountPercent ? { customDiscountPercent: discountNumber } : {}),
        adminNote: note.trim() || undefined,
      }),
    onSuccess: (updated, status) => {
      refresh(updated);
      toast.success(status === "REJECTED" ? "Đã từ chối báo giá" : "Đã lưu: đã liên hệ trường");
    },
    onError: (e) => toast.error(getApiErrorMessage(e, "Không cập nhật được báo giá")),
  });

  const approve = useMutation({
    mutationFn: () => b2bQuoteService.approve(quoteId!),
    onSuccess: (result) => {
      setConfirmApprove(false);
      refresh();
      setApproval(result);
    },
    onError: (e) => {
      setConfirmApprove(false);
      // 409: already approved, or the contact email is already an account.
      toast.error(getApiErrorMessage(e, "Không duyệt được báo giá"));
    },
  });

  const closed = quote?.status === "APPROVED" || quote?.status === "REJECTED";
  const busy = updateStatus.isPending || approve.isPending;

  return (
    <>
      <Sheet open={!!quoteId && !approval} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex flex-wrap items-center gap-2">
              {quote ? (
                <>
                  <span className="font-mono">{quote.quoteCode}</span> <StatusPill status={quote.status} />
                </>
              ) : (
                "Báo giá"
              )}
            </SheetTitle>
            <SheetDescription>{quote?.schoolName}</SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="flex justify-center p-10">
              <Loader2 className="h-5 w-5 animate-spin" aria-label="Đang tải" />
            </div>
          ) : isError || !quote ? (
            <p className="p-4 text-sm text-accent-danger">{getApiErrorMessage(error, "Không tải được báo giá.")}</p>
          ) : (
            <div className="space-y-6 px-4 pb-8">
              <dl>
                <Detail label="Người liên hệ">
                  {quote.fullName} · {quote.jobTitle}
                </Detail>
                <Detail label="Email">{quote.contactEmail}</Detail>
                <Detail label="Điện thoại">{quote.contactPhone}</Detail>
                <Detail label="Trường">
                  {quote.schoolName}
                  {quote.schoolCode && <span className="text-content-muted"> · {quote.schoolCode}</span>}
                </Detail>
                {quote.schoolAddress && <Detail label="Địa chỉ">{quote.schoolAddress}</Detail>}
                <Detail label="Gói">{B2B_PACKAGE_LABELS[quote.selectedPackage] ?? quote.selectedPackage}</Detail>
                <Detail label="Quy mô">
                  {formatNumber(quote.numberOfStudents)} học sinh · {formatNumber(quote.numberOfTeachers)} giáo viên
                </Detail>
                <Detail label="Quỹ token">{formatNumber(quote.totalTokenPool)} token/năm học</Detail>
                <Detail label="Tạm tính">{formatVnd(quote.subtotalVnd)}</Detail>
                <Detail label="Chiết khấu">
                  {quote.discountPercent}% (−{formatVnd(quote.discountAmountVnd)})
                  {quote.promoCode && <span className="text-content-muted"> · mã {quote.promoCode}</span>}
                </Detail>
                <Detail label="Tổng năm học">
                  <strong>{formatVnd(quote.finalPriceVnd)}</strong>
                </Detail>
                {quote.message && <Detail label="Ghi chú của trường">{quote.message}</Detail>}
                <Detail label="Ngày gửi">{formatDateTime(quote.createdAt)}</Detail>
                {quote.reviewedAt && <Detail label="Xử lý lần cuối">{formatDateTime(quote.reviewedAt)}</Detail>}
              </dl>

              {closed ? (
                quote.adminNote && (
                  <dl>
                    <Detail label="Ghi chú nội bộ">{quote.adminNote}</Detail>
                  </dl>
                )
              ) : (
                <div className="space-y-4 rounded-sm border border-border-card p-4">
                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">Chiết khấu thống nhất (%)</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="h-10 w-32 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-3 text-sm tabular-nums"
                      aria-invalid={!discountValid}
                    />
                    {!discountValid && <span className="text-xs text-accent-danger">Nhập số nguyên từ 0 đến 100.</span>}
                    <span className="text-xs text-content-muted">Giá năm học được tính lại khi lưu.</span>
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-[13px] font-semibold text-[var(--text-primary)]">Ghi chú nội bộ</span>
                    <StaffFormTextarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-20"
                      placeholder="VD: đã gọi Hiệu trưởng, thống nhất chiết khấu 15%."
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn-line inline-flex items-center gap-1.5"
                      disabled={busy || !discountValid}
                      onClick={() => updateStatus.mutate("CONTACTED")}
                    >
                      <PhoneCall className="h-4 w-4" aria-hidden="true" /> Lưu: đã liên hệ
                    </button>
                    <button
                      type="button"
                      className="btn-line inline-flex items-center gap-1.5 text-accent-danger"
                      disabled={busy}
                      onClick={() => updateStatus.mutate("REJECTED")}
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" /> Từ chối
                    </button>
                    <button
                      type="button"
                      className="btn-crimson inline-flex items-center gap-1.5"
                      disabled={busy}
                      onClick={() => setConfirmApprove(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Duyệt và tạo trường
                    </button>
                  </div>
                  <p className="text-xs text-content-muted">
                    Duyệt sẽ tạo trường đang hoạt động với quỹ {formatNumber(quote.totalTokenPool)} token và tài khoản quản trị trường
                    cho {quote.contactEmail}. Hãy lưu chiết khấu trước khi duyệt.
                  </p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmApprove}
        onOpenChange={(open) => !open && !approve.isPending && setConfirmApprove(false)}
        title="Duyệt báo giá và tạo trường?"
        description={
          quote
            ? `Hệ thống sẽ tạo ${quote.schoolName} cùng tài khoản quản trị trường cho ${quote.contactEmail}, với quỹ ${formatNumber(
                quote.totalTokenPool,
              )} token. Không hoàn tác được.`
            : ""
        }
        confirmLabel="Duyệt và tạo trường"
        isPending={approve.isPending}
        onConfirm={() => approve.mutate()}
      />

      {approval && (
        <CredentialsDialog
          open
          onOpenChange={(open) => {
            if (open) return;
            setApproval(null);
            onClose();
          }}
          title="Tài khoản quản trị trường"
          description={`${approval.school.name} đã được tạo. Gửi thông tin đăng nhập cho ${approval.schoolAdmin.fullName} qua kênh an toàn; mật khẩu chỉ hiện một lần.`}
          records={[
            {
              id: approval.schoolAdmin.uid,
              fullName: approval.schoolAdmin.fullName,
              login: approval.schoolAdmin.email,
              userName: approval.schoolAdmin.userName,
              password: approval.schoolAdmin.initialPassword,
              roleLabel: "Quản trị trường",
            },
          ]}
          printable={false}
          schoolName={approval.school.name}
          fileName={`quan-tri-${codeSlug(approval.school.schoolCode)}-${todayStamp()}.csv`}
        />
      )}
    </>
  );
}
