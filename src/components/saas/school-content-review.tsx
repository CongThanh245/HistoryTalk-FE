"use client";

import * as React from "react";
import { BookOpen, CheckCircle2, EyeOff, HelpCircle, MapPin, RotateCcw, Send, Trash2, Undo2, User, Users } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StaffFormTextarea } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatDate, formatNumber } from "@/components/saas/saas-ui";
import { CONTENT_KIND_LABELS, CONTENT_STATUS_LABELS, contentTitle, type ReviewItem } from "@/features/saas/hooks-school";
import type { LocalContent, LocalContentKind, LocalContentStatus } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Badges ───────────────────────── */
const PILL = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] border px-2 py-0.5 text-[11px] font-bold";

const STATUS_CLASS: Record<LocalContentStatus, string> = {
  PENDING: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] text-[var(--status-warning)]",
  PUBLISHED: "border-[var(--status-success-border)] bg-[var(--status-success-bg)] text-[var(--status-success)]",
  INACTIVE: "border-[var(--border-strong)] bg-transparent text-[var(--text-tertiary)]",
  TRASH: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--accent-danger)]",
  DRAFT: "border-[var(--border-strong)] bg-[var(--status-neutral-bg)] text-[var(--text-secondary)]",
};

export function ContentStatusBadge({ status }: { status: LocalContentStatus }) {
  return <span className={cn(PILL, STATUS_CLASS[status])}>{CONTENT_STATUS_LABELS[status]}</span>;
}

const KIND_ICON: Record<LocalContentKind, typeof BookOpen> = { CONTEXT: BookOpen, CHARACTER: User, QUIZ: HelpCircle };

export function ContentKindLabel({ kind }: { kind: LocalContentKind }) {
  const Icon = KIND_ICON[kind];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-[var(--text-secondary)]">
      <Icon className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
      {CONTENT_KIND_LABELS[kind]}
    </span>
  );
}

/* ───────────────────────── Read-only preview ───────────────────────── */
const ERA_LABELS = { ANCIENT: "Cổ đại", MEDIEVAL: "Trung đại", MODERN: "Cận đại", CONTEMPORARY: "Hiện đại" } as const;
const LEVEL_LABELS = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as const;

function Meta({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-y border-[var(--border-default)] py-3 text-sm">
      {items.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt className="text-content-muted">{k}</dt>
          <dd className="min-w-0 break-words font-medium text-content-heading">{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{title}</h4>
      <div className="whitespace-pre-line text-sm leading-relaxed text-content-text">{children}</div>
    </div>
  );
}

export function ContentPreview({ content, linked }: { content: LocalContent; linked?: LocalContent }) {
  if (content.kind === "CONTEXT") {
    return (
      <div className="space-y-4">
        <Meta
          items={[
            ["Thời kỳ", ERA_LABELS[content.era]],
            ["Năm", <span key="y" className="tabular-nums">{content.year}</span>],
            ["Địa điểm", content.location],
            [
              "Tọa độ",
              content.latitude != null && content.longitude != null ? (
                <span key="c" className="inline-flex items-center gap-1 tabular-nums">
                  <MapPin className="h-3.5 w-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
                  {content.latitude.toFixed(4)}, {content.longitude.toFixed(4)}
                </span>
              ) : (
                "Chưa gắn tọa độ"
              ),
            ],
          ]}
        />
        <Block title="Tóm tắt">{content.summary}</Block>
        <Block title="Nội dung">{content.body}</Block>
      </div>
    );
  }

  if (content.kind === "CHARACTER") {
    const life =
      content.bornYear || content.deathYear ? `${content.bornYear ?? "?"} – ${content.deathYear ?? "?"}` : "Không rõ";
    return (
      <div className="space-y-4">
        <Meta
          items={[
            ["Danh xưng", content.title],
            ["Năm sinh – mất", <span key="l" className="tabular-nums">{life}</span>],
            [
              "Bối cảnh gắn kèm",
              linked ? (
                <span key="ctx" className="inline-flex flex-wrap items-center gap-2">
                  {contentTitle(linked)} <ContentStatusBadge status={linked.status} />
                </span>
              ) : (
                "Không có"
              ),
            ],
          ]}
        />
        <Block title="Tiểu sử">{content.biography}</Block>
        <Block title="Tính cách khi trò chuyện (persona AI)">{content.persona}</Block>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Meta
        items={[
          ["Mức độ", LEVEL_LABELS[content.level]],
          ["Thời gian", `${content.durationMinutes} phút`],
          ["Số câu", <span key="n" className="tabular-nums">{content.questions.length}</span>],
          ["Bối cảnh gắn kèm", linked ? contentTitle(linked) : "Không có"],
        ]}
      />
      <ol className="space-y-4">
        {content.questions.map((q, i) => (
          <li key={q.id} className="space-y-2 border-b border-[var(--border-default)] pb-4 last:border-b-0">
            <p className="text-sm font-semibold text-content-heading">
              <span className="tabular-nums">Câu {i + 1}.</span> {q.prompt}
            </p>
            <ul className="space-y-1">
              {q.options.map((opt, j) => {
                const correct = j === q.correctIndex;
                return (
                  <li
                    key={j}
                    className={cn(
                      "flex items-start gap-2 rounded-[2px] border px-3 py-1.5 text-sm",
                      correct
                        ? "border-[var(--status-success-border)] bg-[var(--status-success-bg)] font-semibold text-[var(--status-success)]"
                        : "border-[var(--border-default)] text-content-text",
                    )}
                  >
                    <span className="font-bold">{String.fromCharCode(65 + j)}.</span>
                    <span className="flex-1">{opt}</span>
                    {correct && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Đáp án đúng
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {q.explanation ? (
              <p className="text-xs text-content-muted">Giải thích: {q.explanation}</p>
            ) : (
              <p className="text-xs italic text-content-subtle">Chưa có giải thích.</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ───────────────────────── Actions ───────────────────────── */
export type ReviewAction = "PUBLISH" | "RETURN" | "DEACTIVATE" | "REPUBLISH" | "TRASH" | "RESTORE";

export function actionsFor(status: LocalContentStatus): ReviewAction[] {
  switch (status) {
    case "PENDING":
      return ["PUBLISH", "RETURN", "TRASH"];
    case "PUBLISHED":
      return ["DEACTIVATE", "TRASH"];
    case "INACTIVE":
      return ["REPUBLISH", "TRASH"];
    case "TRASH":
      return ["RESTORE"];
    default:
      return [];
  }
}

const ACTION_META: Record<ReviewAction, { label: string; icon: typeof Send; className: string }> = {
  PUBLISH: { label: "Xuất bản", icon: Send, className: "btn-crimson" },
  REPUBLISH: { label: "Xuất bản lại", icon: Send, className: "btn-crimson" },
  RETURN: { label: "Trả về chỉnh sửa", icon: Undo2, className: "btn-line" },
  DEACTIVATE: { label: "Ngừng hiển thị", icon: EyeOff, className: "btn-ink" },
  TRASH: { label: "Chuyển vào thùng rác", icon: Trash2, className: "btn-line text-[var(--accent-danger)]" },
  RESTORE: { label: "Khôi phục", icon: RotateCcw, className: "btn-ink" },
};

/* ───────────────────────── Review drawer ───────────────────────── */
export function SchoolContentReviewSheet({
  item,
  linked,
  onOpenChange,
  onAction,
}: {
  item: ReviewItem | null;
  linked?: LocalContent;
  onOpenChange: (open: boolean) => void;
  onAction: (action: ReviewAction, item: ReviewItem) => void;
}) {
  const c = item?.content;
  const actions = c ? actionsFor(c.status) : [];
  return (
    <Sheet open={!!item} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="staff-theme w-full gap-0 border-l border-[var(--text-primary)] bg-[var(--bg-surface)] p-0 text-content-text shadow-none sm:max-w-xl"
      >
        {item && c && (
          <>
            <SheetHeader className="space-y-2 border-b border-[var(--text-primary)] p-5 pr-12">
              <div className="flex flex-wrap items-center gap-2">
                <ContentKindLabel kind={c.kind} />
                <ContentStatusBadge status={c.status} />
              </div>
              <SheetTitle className="archive-title is-plain text-2xl leading-[1.25]">{item.title}</SheetTitle>
              <SheetDescription className="text-xs text-content-muted">
                {item.author?.fullName ?? "Giáo viên đã rời trường"} · cập nhật {formatDate(c.updatedAt)}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
              <div className="space-y-1 rounded-[2px] border border-[var(--border-strong)] p-3 text-sm">
                <p className="inline-flex items-center gap-2 font-semibold text-content-heading">
                  <Users className="h-4 w-4 text-[var(--men-lam)]" aria-hidden="true" />
                  {c.status === "PUBLISHED" ? "Đang hiển thị cho" : "Khi xuất bản sẽ hiển thị cho"}
                </p>
                <p className="text-content-text">
                  {item.classes.length
                    ? `${item.classes.map((x) => `Lớp ${x.name}`).join(", ")} · ${formatNumber(item.audience)} học sinh`
                    : "Chưa chọn lớp nào — không học sinh nào thấy nội dung này."}
                </p>
              </div>

              {c.reviewNote && (
                <div className="space-y-1 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-3 text-sm">
                  <p className="font-semibold text-[var(--status-warning)]">Ghi chú duyệt gần nhất</p>
                  <p className="text-content-text">{c.reviewNote}</p>
                </div>
              )}

              {c.status === "DRAFT" && (
                <p className="text-xs text-content-muted">
                  Bản nháp do giáo viên đang soạn — chỉ xem, giáo viên cần gửi duyệt trước khi bạn có thể xuất bản.
                </p>
              )}

              <ContentPreview content={c} linked={linked} />
            </div>

            {actions.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-[var(--text-primary)] p-4 sm:flex-row sm:flex-wrap">
                {actions.map((a) => {
                  const meta = ACTION_META[a];
                  const Icon = meta.icon;
                  return (
                    <button key={a} type="button" className={cn(meta.className, "w-full sm:w-auto")} onClick={() => onAction(a, item)}>
                      <Icon className="h-4 w-4" aria-hidden="true" /> {meta.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ───────────────────────── Required-note dialog ───────────────────────── */
export function SchoolReviewNoteDialog({
  open,
  title,
  description,
  confirmLabel,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setNote("");
          setError(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <DialogHeader>
          <DialogTitle className={DIALOG_TITLE_CLASS}>{title}</DialogTitle>
          <DialogDescription className="text-sm text-content-muted">{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const v = note.trim();
            if (v.length < 5) {
              setError("Nhập ghi chú ít nhất 5 ký tự để giáo viên biết cần sửa gì.");
              return;
            }
            onConfirm(v);
            setNote("");
            setError(null);
          }}
        >
          <Field label="Ghi chú cho giáo viên" required htmlFor="review-note" error={error}>
            <StaffFormTextarea
              id="review-note"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ví dụ: Bổ sung nguồn tư liệu cho đoạn thứ hai…"
              className="min-h-[120px]"
              autoFocus
            />
          </Field>
          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson">
              {confirmLabel}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
