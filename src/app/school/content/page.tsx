"use client";

import * as React from "react";
import { Send } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SaasShell, SearchInput, formatDate, normalizeText } from "@/components/saas/saas-ui";
import {
  ContentKindLabel,
  ContentStatusBadge,
  SchoolContentReviewSheet,
  SchoolReviewNoteDialog,
  type ReviewAction,
} from "@/components/saas/school-content-review";
import { CONTENT_KIND_LABELS, useSchoolContentReview, type ReviewItem } from "@/features/saas/hooks-school";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import type { LocalContentKind, LocalContentStatus } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/** School Admin: review the local history content teachers author (Role Matrix row 13). */
export default function SchoolContentPage() {
  return (
    <SaasShell
      title="Duyệt nội dung địa phương"
      description="Giáo viên soạn bối cảnh, nhân vật và câu đố lịch sử địa phương; quản trị trường quyết định xuất bản, ngừng hiển thị hoặc trả về chỉnh sửa."
    >
      <ContentReview />
    </SaasShell>
  );
}

const TABS: { status: LocalContentStatus; label: string }[] = [
  { status: "PENDING", label: "Chờ duyệt" },
  { status: "PUBLISHED", label: "Đã xuất bản" },
  { status: "INACTIVE", label: "Ngừng hiển thị" },
  { status: "DRAFT", label: "Nháp của giáo viên" },
  { status: "TRASH", label: "Thùng rác" },
];

const EMPTY: Record<LocalContentStatus, string> = {
  PENDING: "Không có nội dung nào đang chờ duyệt.",
  PUBLISHED: "Chưa có nội dung nào được xuất bản.",
  INACTIVE: "Không có nội dung nào đang ngừng hiển thị.",
  DRAFT: "Giáo viên chưa có bản nháp nào.",
  TRASH: "Thùng rác trống.",
};

type NoteRequest = { action: "RETURN" | "DEACTIVATE"; item: ReviewItem };

function ContentReview() {
  const schoolId = useDemoSchoolId();
  const { items, counts, byId, teachers, classes } = useSchoolContentReview(schoolId);
  const setStatus = useSaasStore((s) => s.setLocalContentStatus);

  const [tab, setTab] = React.useState<LocalContentStatus>("PENDING");
  const [kind, setKind] = React.useState<"ALL" | LocalContentKind>("ALL");
  const [author, setAuthor] = React.useState("ALL");
  const [classId, setClassId] = React.useState("ALL");
  const [search, setSearch] = React.useState("");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState<Set<string>>(new Set());
  const [noteRequest, setNoteRequest] = React.useState<NoteRequest | null>(null);
  const [trashing, setTrashing] = React.useState<ReviewItem | null>(null);

  const filtered = items.filter(
    (it) =>
      it.content.status === tab &&
      (kind === "ALL" || it.content.kind === kind) &&
      (author === "ALL" || it.content.authorId === author) &&
      (classId === "ALL" || it.content.classIds.includes(classId)) &&
      (!search || normalizeText(it.title).includes(normalizeText(search))),
  );
  const selectable = tab === "PENDING";
  const visibleChecked = filtered.filter((it) => checked.has(it.content.id));
  const allChecked = filtered.length > 0 && visibleChecked.length === filtered.length;

  const selected = selectedId ? items.find((it) => it.content.id === selectedId) ?? null : null;
  const linkedId = selected && selected.content.kind !== "CONTEXT" ? selected.content.contextId : undefined;
  const linked = linkedId ? byId.get(linkedId) : undefined;

  const audienceText = (it: ReviewItem) =>
    it.classes.length ? it.classes.map((c) => c.name).join(", ") : "chưa chọn lớp";

  const changeTab = (next: LocalContentStatus) => {
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

  const handleAction = (action: ReviewAction, it: ReviewItem) => {
    const id = it.content.id;
    switch (action) {
      case "PUBLISH":
      case "REPUBLISH":
        setStatus(id, "PUBLISHED", "");
        toast.success(`Đã xuất bản “${it.title}”`, { description: `Hiển thị cho lớp ${audienceText(it)}.` });
        break;
      case "RETURN":
      case "DEACTIVATE":
        setNoteRequest({ action, item: it });
        break;
      case "TRASH":
        setTrashing(it);
        break;
      case "RESTORE":
        setStatus(id, "DRAFT");
        toast.success(`Đã khôi phục “${it.title}” về bản nháp của giáo viên`);
        break;
    }
  };

  const bulkPublish = () => {
    for (const it of visibleChecked) setStatus(it.content.id, "PUBLISHED", "");
    toast.success(`Đã xuất bản ${visibleChecked.length} nội dung`);
    setChecked(new Set());
  };

  const teacherOptions = [{ value: "ALL", label: "Tất cả giáo viên" }, ...teachers.map((t) => ({ value: t.id, label: t.fullName }))];
  const classOptions = [{ value: "ALL", label: "Tất cả lớp" }, ...classes.map((c) => ({ value: c.id, label: `Lớp ${c.name}` }))];
  const kindOptions: { value: "ALL" | LocalContentKind; label: string }[] = [
    { value: "ALL", label: "Tất cả loại" },
    ...(Object.keys(CONTENT_KIND_LABELS) as LocalContentKind[]).map((k) => ({ value: k, label: CONTENT_KIND_LABELS[k] })),
  ];

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Trạng thái nội dung" className="flex overflow-x-auto border-b border-[var(--text-primary)]">
        {TABS.map((t) => {
          const active = t.status === tab;
          return (
            <button
              key={t.status}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => changeTab(t.status)}
              className={cn(
                "-mb-px inline-flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] font-bold uppercase tracking-[0.06em] transition-colors",
                active
                  ? "border-[var(--accent-gold)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
              )}
            >
              {t.label}
              <span
                className={cn(
                  "rounded-[2px] px-1.5 text-[11px] tabular-nums",
                  t.status === "PENDING" && counts.PENDING > 0
                    ? "bg-[var(--status-warning)] text-white"
                    : "bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
                )}
              >
                {counts[t.status]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tiêu đề, tên nhân vật..." />
        <StaffFormSelect value={kind} onValueChange={setKind} options={kindOptions} className="w-full sm:w-40" />
        <StaffFormSelect value={author} onValueChange={setAuthor} options={teacherOptions} className="w-full sm:w-52" />
        <StaffFormSelect value={classId} onValueChange={setClassId} options={classOptions} className="w-full sm:w-40" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-content-muted">
          {filtered.length} nội dung
          {tab === "DRAFT" && " · chỉ xem, giáo viên chưa gửi duyệt"}
          {tab === "TRASH" && " · khôi phục sẽ trả nội dung về bản nháp của giáo viên"}
        </p>
        {selectable && (
          <button type="button" className="btn-crimson w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" disabled={!visibleChecked.length} onClick={bulkPublish}>
            <Send className="h-4 w-4" aria-hidden="true" /> Xuất bản các mục đã chọn
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
                      onCheckedChange={(v) => setChecked(v ? new Set(filtered.map((it) => it.content.id)) : new Set())}
                    />
                  </TableHead>
                )}
                {["Loại", "Tiêu đề", "Giáo viên soạn", "Lớp được xem", "Cập nhật", "Trạng thái"].map((h) => (
                  <TableHead key={h} className="px-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((it) => {
                const c = it.content;
                return (
                  <TableRow
                    key={c.id}
                    className={cn(
                      "cursor-pointer border-b border-[var(--border-default)] last:border-b-0 hover:bg-[var(--status-neutral-bg)]!",
                      selectedId === c.id && "bg-[var(--status-neutral-bg)]",
                    )}
                    onClick={() => setSelectedId(c.id)}
                  >
                    {selectable && (
                      <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          aria-label={`Chọn ${it.title}`}
                          checked={checked.has(c.id)}
                          onCheckedChange={(v) => toggle(c.id, !!v)}
                        />
                      </TableCell>
                    )}
                    <TableCell className="px-4">
                      <ContentKindLabel kind={c.kind} />
                    </TableCell>
                    <TableCell className="max-w-[320px] px-4">
                      <button
                        type="button"
                        className="block w-full truncate text-left font-semibold text-content-heading hover:text-[var(--accent-gold)]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(c.id);
                        }}
                      >
                        {it.title}
                      </button>
                      {c.reviewNote && <p className="truncate text-xs text-content-muted">Ghi chú: {c.reviewNote}</p>}
                    </TableCell>
                    <TableCell className="px-4">{it.author?.fullName ?? "—"}</TableCell>
                    <TableCell className="px-4">
                      {it.classes.length ? it.classes.map((x) => x.name).join(", ") : <span className="text-content-muted">Chưa chọn</span>}
                    </TableCell>
                    <TableCell className="px-4 tabular-nums">{formatDate(c.updatedAt)}</TableCell>
                    <TableCell className="px-4">
                      <ContentStatusBadge status={c.status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <SchoolContentReviewSheet
        item={selected}
        linked={linked}
        onOpenChange={(o) => !o && setSelectedId(null)}
        onAction={handleAction}
      />

      <SchoolReviewNoteDialog
        open={!!noteRequest}
        onOpenChange={(o) => !o && setNoteRequest(null)}
        title={noteRequest?.action === "RETURN" ? "Trả về chỉnh sửa" : "Ngừng hiển thị nội dung"}
        description={
          noteRequest?.action === "RETURN"
            ? `“${noteRequest?.item.title ?? ""}” sẽ trở về bản nháp của giáo viên kèm ghi chú của bạn.`
            : `Học sinh lớp ${noteRequest ? audienceText(noteRequest.item) : ""} sẽ không còn thấy nội dung này. Ghi rõ lý do để giáo viên chỉnh sửa.`
        }
        confirmLabel={noteRequest?.action === "RETURN" ? "Trả về" : "Ngừng hiển thị"}
        onConfirm={(note) => {
          if (!noteRequest) return;
          const { action, item } = noteRequest;
          setStatus(item.content.id, action === "RETURN" ? "DRAFT" : "INACTIVE", note);
          toast.success(action === "RETURN" ? `Đã trả “${item.title}” về cho giáo viên` : `Đã ngừng hiển thị “${item.title}”`);
          setNoteRequest(null);
        }}
      />

      <ConfirmDialog
        open={!!trashing}
        onOpenChange={(o) => !o && setTrashing(null)}
        title="Chuyển vào thùng rác?"
        description={`“${trashing?.title ?? ""}” sẽ bị ẩn khỏi mọi lớp. Bạn có thể khôi phục từ thẻ Thùng rác (về bản nháp).`}
        confirmLabel="Chuyển vào thùng rác"
        variant="danger"
        onConfirm={() => {
          if (!trashing) return;
          setStatus(trashing.content.id, "TRASH");
          toast.success(`Đã chuyển “${trashing.title}” vào thùng rác`);
          setTrashing(null);
        }}
      />
    </div>
  );
}
