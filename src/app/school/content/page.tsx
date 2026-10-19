"use client";

import * as React from "react";
import { EyeOff, FileText, Send, ShieldAlert, Undo2, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import {
  LocalItemPreview,
  LocalReviewBadge,
  LocalScopeTag,
  QueryState,
  REVIEW_STATE_LABELS,
  ReviewNote,
  reviewState,
  type LocalReviewState,
} from "@/components/saas/local-content-ui";
import { ContentKindLabel } from "@/components/saas/school-content-review";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { LOCAL_SCOPE_LABEL, useSchoolLocalContent, useSchoolLocalDocuments, useSetLocalStatus } from "@/features/saas/hooks-local-content";
import { LOCAL_KIND_LABELS } from "@/features/saas/hooks-teaching";
import type { LocalItem, LocalKind, LocalScope, LocalStatus } from "@/services/local-content.service";
import { cn } from "@/lib/utils/cn";

/** School Admin: review the local history content teachers author (Role Matrix row 13, Sprint 6 API). */
export default function SchoolContentPage() {
  return (
    <SaasShell
      live
      title="Duyệt nội dung giáo viên"
      description="Giáo viên soạn bối cảnh và nhân vật lịch sử cho lớp hoặc toàn trường. Bạn duyệt trước khi học sinh của trường thấy, và có thể ẩn nội dung không phù hợp."
    >
      <ContentReview />
    </SaasShell>
  );
}

/** Drafts stay with the teacher until they submit them, so they are not listed here. */
type Tab = Exclude<LocalReviewState, "DRAFT">;
const TABS: Tab[] = ["PENDING", "PUBLISHED", "HIDDEN"];

const EMPTY: Record<Tab, string> = {
  PENDING: "Không có nội dung nào giáo viên gửi lên đang chờ duyệt.",
  PUBLISHED: "Chưa có nội dung nào được xuất bản.",
  HIDDEN: "Không có nội dung nào đang bị ẩn.",
};

type Action = "PUBLISH" | "HIDE" | "RETURN";

const ACTIONS: Record<Tab, Action[]> = {
  PENDING: ["PUBLISH", "RETURN"],
  PUBLISHED: ["HIDE"],
  HIDDEN: ["PUBLISH", "RETURN"],
};

const ACTION_META: Record<Action, { label: string; status: LocalStatus; icon: typeof Send; className: string; done: string }> = {
  PUBLISH: { label: "Duyệt & xuất bản", status: "ACTIVE", icon: Send, className: "btn-crimson", done: "Đã xuất bản" },
  HIDE: { label: "Ẩn với học sinh", status: "INACTIVE", icon: EyeOff, className: "btn-ink", done: "Đã ẩn" },
  RETURN: { label: "Trả lại giáo viên", status: "DRAFT", icon: Undo2, className: "btn-line", done: "Đã trả lại" },
};

/** Confirm dialog copy per action; the note is saved as `reviewNote` and shown to the teacher. */
const ACTION_DIALOG: Record<Action, { title: (name: string) => string; description?: string; notePlaceholder: string }> = {
  PUBLISH: {
    title: (name) => `Duyệt ${name}?`,
    notePlaceholder: "Ghi chú cho giáo viên (không bắt buộc)",
  },
  HIDE: {
    title: (name) => `Ẩn ${name} với học sinh?`,
    description: "Học sinh sẽ không còn thấy nội dung. Giáo viên có thể chỉnh sửa và gửi duyệt lại.",
    notePlaceholder: "Lý do ẩn (không bắt buộc)",
  },
  RETURN: {
    title: (name) => `Trả lại ${name}?`,
    description: "Nội dung trở về bản nháp để giáo viên chỉnh sửa rồi gửi duyệt lại.",
    notePlaceholder: "Cần chỉnh sửa gì? Giáo viên sẽ thấy ghi chú này.",
  },
};

const DISCLAIMER =
  "Bằng cách duyệt, nhà trường chịu toàn bộ trách nhiệm về tính xác thực của nội dung. HistoryTalk không chịu trách nhiệm với nội dung do giáo viên soạn.";

const ALL = "ALL";

function ContentReview() {
  const { items, truncated, isLoading, isError, error, refetch } = useSchoolLocalContent();
  const setStatus = useSetLocalStatus();

  const [tab, setTab] = React.useState<Tab>("PENDING");
  const [kind, setKind] = React.useState<LocalKind | typeof ALL>(ALL);
  const [scope, setScope] = React.useState<LocalScope | typeof ALL>(ALL);
  const [author, setAuthor] = React.useState(ALL);
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  /** Action waiting for confirmation (and an optional note). */
  const [pending, setPending] = React.useState<{ action: Action; targets: LocalItem[] } | null>(null);
  const [note, setNote] = React.useState("");

  const counts = Object.fromEntries(TABS.map((t) => [t, items.filter((it) => reviewState(it) === t).length])) as Record<Tab, number>;
  const q = normalizeText(search);
  const filtered = items
    .filter(
      (it) =>
        reviewState(it) === tab &&
        (kind === ALL || it.type === kind) &&
        (scope === ALL || it.contentScope === scope) &&
        (author === ALL || it.createdBy?.uid === author) &&
        (!q || normalizeText(it.name).includes(q)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  const selectable = tab === "PENDING";
  const visibleChecked = filtered.filter((it) => checked.has(it.id));
  const allChecked = filtered.length > 0 && visibleChecked.length === filtered.length;
  const selected = selectedId ? items.find((it) => it.id === selectedId) ?? null : null;

  const authors = [...new Map(items.filter((it) => it.createdBy).map((it) => [it.createdBy!.uid, it.createdBy!.fullName])).entries()];
  const authorOptions = [{ value: ALL, label: "Tất cả giáo viên" }, ...authors.map(([value, label]) => ({ value, label }))];
  const kindOptions: { value: LocalKind | typeof ALL; label: string }[] = [
    { value: ALL, label: "Tất cả loại" },
    { value: "CONTEXT", label: LOCAL_KIND_LABELS.CONTEXT },
    { value: "CHARACTER", label: LOCAL_KIND_LABELS.CHARACTER },
  ];
  const scopeOptions: { value: LocalScope | typeof ALL; label: string }[] = [
    { value: ALL, label: "Mọi phạm vi" },
    { value: "CLASS_ONLY", label: LOCAL_SCOPE_LABEL.CLASS_ONLY },
    { value: "SCHOOL_WIDE", label: LOCAL_SCOPE_LABEL.SCHOOL_WIDE },
  ];

  const changeTab = (next: Tab) => {
    setTab(next);
    setChecked(new Set());
  };

  const toggle = (id: string, on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const apply = async (action: Action, targets: LocalItem[], reviewNote?: string) => {
    const meta = ACTION_META[action];
    const results = await Promise.allSettled(
      targets.map((it) => setStatus.mutateAsync({ kind: it.type, id: it.id, payload: { status: meta.status, note: reviewNote } })),
    );
    const failed = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    const ok = targets.length - failed.length;
    if (ok) toast.success(targets.length === 1 ? `${meta.done} “${targets[0].name}”` : `${meta.done} ${ok} nội dung`);
    if (failed.length) toast.error(apiErrorMessage(failed[0].reason, `Không cập nhật được ${failed.length} nội dung.`));
    setChecked(new Set());
  };

  const ask = (action: Action, targets: LocalItem[]) => {
    setNote("");
    setPending({ action, targets });
  };
  const handleAction = (action: Action, it: LocalItem) => ask(action, [it]);
  const dialog = pending ? ACTION_DIALOG[pending.action] : null;
  const dialogName = pending ? (pending.targets.length > 1 ? `${pending.targets.length} nội dung` : `“${pending.targets[0]?.name ?? ""}”`) : "";

  return (
    <div className="space-y-5">
      {/* Tabs + filters share one solid panel so they stay readable over the page texture. */}
      <div className="rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)]">
        <div
          role="tablist"
          aria-label="Trạng thái nội dung"
          className="flex overflow-x-auto overflow-y-hidden px-2 shadow-[inset_0_-1px_0_var(--border-default)] [scrollbar-width:none]"
        >
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => changeTab(t)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors",
                  active
                    ? "border-[var(--accent-gold)] text-[var(--text-primary)]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
                )}
              >
                {REVIEW_STATE_LABELS[t]}
                <span
                  className={cn(
                    "rounded-[2px] px-1.5 text-[11px] tabular-nums",
                    t === "PENDING" && counts.PENDING > 0
                      ? "bg-[var(--status-warning)] text-white"
                      : "bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
                  )}
                >
                  {counts[t]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Tìm theo tên bối cảnh, nhân vật..."
            className="sm:w-auto sm:min-w-[260px] sm:flex-1"
          />
          <StaffFormSelect value={kind} onValueChange={setKind} options={kindOptions} className="w-full sm:w-40" />
          <StaffFormSelect value={scope} onValueChange={setScope} options={scopeOptions} className="w-full sm:w-44" />
          <StaffFormSelect value={author} onValueChange={setAuthor} options={authorOptions} className="w-full sm:w-52" />
        </div>
      </div>

      <QueryState isLoading={isLoading} isError={isError} error={error} onRetry={refetch}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-content-muted">
            {filtered.length} nội dung
            {truncated && " · đang hiển thị 100 mục mới nhất mỗi loại"}
          </p>
          {selectable && (
            <button
              type="button"
              className="btn-crimson w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              disabled={!visibleChecked.length || setStatus.isPending}
              onClick={() => ask("PUBLISH", visibleChecked)}
            >
              <Send className="h-4 w-4" aria-hidden="true" /> Duyệt các mục đã chọn
              {visibleChecked.length > 0 && <span className="tabular-nums">({visibleChecked.length})</span>}
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState title={EMPTY[tab]} description="Đổi bộ lọc hoặc chuyển sang thẻ khác." />
        ) : (
          <div className="overflow-x-auto rounded-[2px] border-y border-[var(--text-primary)] bg-[var(--bg-surface)]">
            <Table className="min-w-[860px]">
              <TableHeader>
                <TableRow className="border-b border-[var(--border-strong)] hover:bg-transparent">
                  {selectable && (
                    <TableHead className="w-10 px-4">
                      <Checkbox
                        aria-label="Chọn tất cả"
                        checked={allChecked}
                        onCheckedChange={(v) => setChecked(v ? new Set(filtered.map((it) => it.id)) : new Set())}
                      />
                    </TableHead>
                  )}
                  {["Loại", "Tên", "Giáo viên soạn", "Phạm vi", "Cập nhật", "Trạng thái"].map((h) => (
                    <TableHead key={h} className="px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow
                    key={it.id}
                    className={cn(
                      "cursor-pointer border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]!",
                      selectedId === it.id && "bg-[var(--status-neutral-bg)]",
                    )}
                    onClick={() => setSelectedId(it.id)}
                  >
                    {selectable && (
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox aria-label={`Chọn ${it.name}`} checked={checked.has(it.id)} onCheckedChange={(v) => toggle(it.id, !!v)} />
                      </TableCell>
                    )}
                    <TableCell className="px-4">
                      <ContentKindLabel kind={it.type} />
                    </TableCell>
                    <TableCell className="max-w-[320px] px-4">
                      <button
                        type="button"
                        className="block w-full truncate text-left font-semibold text-content-heading hover:text-[var(--accent-gold)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(it.id);
                        }}
                      >
                        {it.name}
                      </button>
                    </TableCell>
                    <TableCell className="px-4">{it.createdBy?.fullName ?? "—"}</TableCell>
                    <TableCell className="px-4">
                      <LocalScopeTag item={it} />
                    </TableCell>
                    <TableCell className="px-4 tabular-nums">{formatDate(it.updatedAt)}</TableCell>
                    <TableCell className="px-4">
                      <LocalReviewBadge item={it} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <ReviewSheet item={selected} busy={setStatus.isPending} onOpenChange={(o) => !o && setSelectedId(null)} onAction={handleAction} />

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
        variant={pending?.action === "PUBLISH" ? "primary" : "warning"}
        title={dialog ? dialog.title(dialogName) : ""}
        description={pending?.action === "PUBLISH" ? `Học sinh của trường sẽ thấy nội dung này. ${DISCLAIMER}` : dialog?.description}
        confirmLabel={pending ? ACTION_META[pending.action].label : undefined}
        onConfirm={() => {
          if (pending) void apply(pending.action, pending.targets, note.trim() || undefined);
          setPending(null);
        }}
      >
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-content-heading">Ghi chú cho giáo viên</span>
          <StaffFormTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={dialog?.notePlaceholder}
            maxLength={1000}
            className="min-h-[90px] resize-y"
          />
        </label>
      </ConfirmDialog>
    </div>
  );
}

function ReviewSheet({
  item,
  busy,
  onOpenChange,
  onAction,
}: {
  item: LocalItem | null;
  busy: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: Action, item: LocalItem) => void;
}) {
  const raw = item ? reviewState(item) : null;
  const state: Tab | null = raw === "DRAFT" ? null : raw;
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="staff-theme w-full gap-0 border-l border-[var(--text-primary)] bg-[var(--bg-surface)] p-0 text-content-text shadow-none sm:max-w-xl"
      >
        {item && state && (
          <>
            <SheetHeader className="space-y-2 border-b border-[var(--text-primary)] p-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <LocalScopeTag item={item} />
                <ContentKindLabel kind={item.type} />
                <LocalReviewBadge item={item} />
              </div>
              <SheetTitle className="archive-title is-plain text-2xl leading-[1.25]">{item.name}</SheetTitle>
              <SheetDescription className="text-xs text-content-muted">
                {item.createdBy?.fullName ?? "Giáo viên đã rời trường"} · cập nhật {formatDate(item.updatedAt)}
                {item.approvedBy && ` · duyệt bởi ${item.approvedBy.fullName}`}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-1 rounded-[2px] border border-[var(--border-strong)] p-3 text-sm">
                <p className="inline-flex items-center gap-2 font-semibold text-content-heading">
                  <Users className="h-4 w-4 text-[var(--men-lam)]" aria-hidden="true" />
                  {state === "PUBLISHED" ? "Đang hiển thị cho" : "Khi xuất bản sẽ hiển thị cho"}
                </p>
                <p className="text-content-text">
                  Học sinh của trường.{" "}
                  {item.contentScope === "SCHOOL_WIDE"
                    ? "Mọi giáo viên trong trường cũng xem được."
                    : "Chỉ giáo viên soạn dùng được nội dung này cho lớp của mình."}
                </p>
              </div>

              {state !== "PUBLISHED" && (
                <p className="flex items-start gap-2 text-xs text-content-muted">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
                  {DISCLAIMER}
                </p>
              )}

              <ReviewNote item={item} />

              <LocalItemPreview item={item} />

              <ReviewDocuments item={item} />
            </div>

            <div className="flex flex-col gap-2 border-t border-[var(--text-primary)] p-4 sm:flex-row sm:flex-wrap">
              {ACTIONS[state].map((a) => {
                const meta = ACTION_META[a];
                const Icon = meta.icon;
                return (
                  <button
                    key={a}
                    type="button"
                    disabled={busy}
                    className={cn(meta.className, "w-full disabled:opacity-60 sm:w-auto")}
                    onClick={() => onAction(a, item)}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" /> {meta.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Documents the teacher attached for the AI, so the admin can check sources before publishing. */
function ReviewDocuments({ item }: { item: LocalItem }) {
  const query = useSchoolLocalDocuments(item.type, item.id);
  const docs = query.data ?? [];
  return (
    <div className="space-y-2">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tài liệu đính kèm ({docs.length})</h4>
      {query.isLoading ? (
        <p className="text-sm text-content-muted">Đang tải tài liệu...</p>
      ) : query.isError ? (
        <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(query.error, "Không tải được tài liệu.")}</p>
      ) : docs.length === 0 ? (
        <p className="text-sm text-content-muted">Giáo viên chưa đính kèm tài liệu nào.</p>
      ) : (
        <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--border-strong)]">
          {docs.map((d) => (
            <li key={d.docId} className="flex items-start gap-3 py-2.5">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="font-semibold text-content-heading">{d.title}</p>
                <p className="line-clamp-3 whitespace-pre-line text-xs text-content-muted">{d.content}</p>
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="archive-link break-all text-xs">
                    {d.fileUrl}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
