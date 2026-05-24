"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardTextIcon, PencilIcon, TrashIcon, ArrowLeftIcon,
  GameControllerIcon, EyeIcon, EyeSlashIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  DifficultyBadge, EraBadge,
  type DifficultyKey, type EraKey,
} from "@/components/staff/staff-badge";
import { QuizQuestionEditor, type QuizQuestion } from "@/components/staff/quiz-question-editor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  useStaffQuizzes,
  useCreateStaffQuiz,
  useUpdateStaffQuiz,
  useSoftDeleteStaffQuiz,
  usePermanentDeleteStaffQuiz,
  useToggleStaffQuizActive,
} from "@/features/staff/quiz/hooks";
import { useEvents } from "@/features/events/hooks";
import type { StaffQuizSet } from "@/services/staff.quiz.service";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Draft cho editor — align với POST /staff/quizzes */
interface QuizDraft {
  quizId?: string;          // chỉ có khi edit
  title: string;
  contextId: string;
  level: "EASY" | "MEDIUM" | "HARD";
  questions: QuizQuestion[];
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS: { value: "EASY" | "MEDIUM" | "HARD"; label: string }[] = [
  { value: "EASY", label: "Dễ" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HARD", label: "Khó" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyDraft = (): QuizDraft => ({
  title: "",
  contextId: "",
  level: "MEDIUM",
  questions: [],
});

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold" style={{ color: "var(--content-subtle)" }}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function FormattedDate({ date }: { date: string }) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return <span>—</span>;
  return (
    <span className="text-xs" style={{ color: "var(--content-muted)" }}>
      {d.toLocaleDateString("vi-VN")}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffQuizzesPage() {
  // ── Filter state ──────────────────────────────────────────
  const [search, setSearch] = React.useState("");
  const [filterLevel, setFilterLevel] = React.useState<"" | "EASY" | "MEDIUM" | "HARD">("");
  const [page] = React.useState(0);

  // ── View / editor state ───────────────────────────────────
  const [view, setView] = React.useState<"list" | "editor">("list");
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<QuizDraft>(emptyDraft());
  const [deleteTarget, setDeleteTarget] = React.useState<StaffQuizSet | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<StaffQuizSet | null>(null);
  const [publishTarget, setPublishTarget] = React.useState<StaffQuizSet | null>(null);
  const [contextSearch, setContextSearch] = React.useState("");

  // ── API hooks ─────────────────────────────────────────────
  const params = React.useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    page,
    size: 20,
  }), [search, page]);

  const { data, isLoading, isError } = useStaffQuizzes(params);
  const createQuiz = useCreateStaffQuiz();
  const updateQuiz = useUpdateStaffQuiz();
  const softDeleteQuiz = useSoftDeleteStaffQuiz();
  const permanentDeleteQuiz = usePermanentDeleteStaffQuiz();
  const toggleActiveQuiz = useToggleStaffQuizActive();

  // Load toàn bộ contexts để chọn trong dropdown
  const { data: contextsData } = useEvents({ page: 1, limit: 200 });

  const allItems = data?.content ?? [];
  const activeItems = allItems.filter((q) => !q.deletedAt);
  const trashedItems = allItems.filter((q) => !!q.deletedAt);
  const items = showTrash ? trashedItems : activeItems;

  // Filter theo level nếu có
  const filteredItems = filterLevel
    ? items.filter((q) => q.level === filterLevel)
    : items;

  // ── Handlers ──────────────────────────────────────────────
  const openCreate = () => {
    setDraft(emptyDraft());
    setEditorMode("create");
    setView("editor");
  };

  const openEdit = (q: StaffQuizSet) => {
    setDraft({
      quizId: q.quizId,
      title: q.title,
      contextId: q.contextId,
      level: q.level,
      questions: q.questions.map((qq) => {
        const opts = [...qq.options];
        while (opts.length < 4) opts.push("");
        return {
          questionId: qq.questionId,
          orderIndex: 0,
          content: qq.content,
          options: opts.slice(0, 4) as [string, string, string, string],
          correctAnswer: (Math.min(qq.correctAnswer, 3)) as 0 | 1 | 2 | 3,
          explanation: qq.explanation ?? "",
        };
      }),
    });
    setEditorMode("edit");
    setView("editor");
  };

  const handleSave = () => {
    const title = draft.title.trim();
    if (!title) return;

    if (editorMode === "create") {
      createQuiz.mutate(
        {
          title,
          contextId: draft.contextId.trim(),
          level: draft.level,
          questions: draft.questions.map((q) => ({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
        },
        {
          onSuccess: () => {
            toast.success(`Đã tạo quiz "${title}" với ${draft.questions.length} câu hỏi.`);
            setView("list");
          },
          onError: () => {
            toast.error("Tạo quiz thất bại. Vui lòng thử lại.");
          },
        },
      );
    } else {
      if (!draft.quizId) return;
      updateQuiz.mutate(
        {
          quizId: draft.quizId,
          payload: {
            title,
            contextId: draft.contextId,
            level: draft.level,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Đã cập nhật quiz "${title}".`);
            setView("list");
          },
          onError: () => {
            toast.error("Cập nhật quiz thất bại. Vui lòng thử lại.");
          },
        },
      );
    }
  };

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDeleteQuiz.mutate(deleteTarget.quizId, {
      onSuccess: () => {
        toast.success(`Đã chuyển quiz "${deleteTarget.title}" vào thùng rác.`);
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error("Xóa quiz thất bại. Vui lòng thử lại.");
      },
    });
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteTarget) return;
    permanentDeleteQuiz.mutate(permanentDeleteTarget.quizId, {
      onSuccess: () => {
        toast.success(`Đã xóa vĩnh viễn quiz "${permanentDeleteTarget.title}".`);
        setPermanentDeleteTarget(null);
      },
      onError: () => {
        toast.error("Xóa vĩnh viễn thất bại.");
      },
    });
  };

  const handleToggleActive = () => {
    if (!publishTarget) return;
    const nextActive = !publishTarget.isActive;
    toggleActiveQuiz.mutate(publishTarget.quizId, {
      onSuccess: () => {
        toast.success(
          nextActive
            ? `Đã publish quiz "${publishTarget.title}".`
            : `Đã ẩn quiz "${publishTarget.title}" khỏi người dùng.`,
        );
        setPublishTarget(null);
      },
      onError: () => {
        toast.error("Cập nhật trạng thái hiển thị thất bại. Vui lòng thử lại.");
      },
    });
  };

  // ── Columns ───────────────────────────────────────────────
  const columns = React.useMemo<ColumnDef<StaffQuizSet>[]>(() => [
    {
      accessorKey: "title",
      header: "Bài quiz",
      cell: ({ row: r }) => (
        <div className="min-w-[240px]">
          <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
            {r.original.title}
          </p>
          {r.original.contextTitle && (
            <p className="text-xs mt-0.5 truncate max-w-[260px]" style={{ color: "var(--content-muted)" }}>
              {r.original.contextTitle}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "meta",
      header: "Phân loại",
      cell: ({ row: r }) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <DifficultyBadge value={r.original.level as DifficultyKey} />
          <EraBadge value={r.original.era as EraKey} />
        </div>
      ),
    },
    {
      id: "stats",
      header: "Thống kê",
      cell: ({ row: r }) => (
        <div>
          <p className="text-xs" style={{ color: "var(--content-text)" }}>
            {r.original.questions.length} câu hỏi
          </p>
          <p className="text-xs" style={{ color: "var(--content-muted)" }}>
            {r.original.playCount.toLocaleString()} lượt chơi
          </p>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Hiển thị",
      cell: ({ row: r }) => {
        const isPublished = r.original.isActive !== false;
        const StatusIcon = isPublished ? EyeIcon : EyeSlashIcon;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: isPublished ? "rgba(34,197,94,0.1)" : "rgba(234,179,8,0.1)",
              color: isPublished ? "rgb(22,163,74)" : "rgb(161,98,7)",
              border: `1px solid ${isPublished ? "rgba(34,197,94,0.2)" : "rgba(234,179,8,0.2)"}`,
            }}
          >
            <StatusIcon className="h-3 w-3" />
            {isPublished ? "Đang publish" : "Đang ẩn"}
          </span>
        );
      },
    },
    {
      accessorKey: "updatedDate",
      header: "Cập nhật",
      cell: ({ row: r }) => (
        r.original.updatedDate ? <FormattedDate date={r.original.updatedDate} /> : <span>—</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Thao tác</div>,
      cell: ({ row: r }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-full"
            title={r.original.isActive !== false ? "Ẩn khỏi người dùng" : "Publish cho người dùng"}
            onClick={() => setPublishTarget(r.original)}
            style={{ color: r.original.isActive !== false ? "rgb(22,163,74)" : "rgb(161,98,7)" }}
          >
            {r.original.isActive !== false ? (
              <EyeIcon className="h-4 w-4" />
            ) : (
              <EyeSlashIcon className="h-4 w-4" />
            )}
          </Button>
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-full"
            onClick={() => openEdit(r.original)}
            style={{ color: "var(--header-text-muted)" }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-full"
            onClick={() => setDeleteTarget(r.original)}
            style={{ color: "var(--accent-danger)" }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ],
    [],
  );

  const trashColumns = React.useMemo<ColumnDef<StaffQuizSet>[]>(() => [
    {
      accessorKey: "title",
      header: "Bài quiz",
      cell: ({ row: r }) => (
        <div className="min-w-[240px] opacity-60">
          <p className="text-sm font-semibold" style={{ color: "var(--content-heading)" }}>
            {r.original.title}
          </p>
          {r.original.contextTitle && (
            <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
              {r.original.contextTitle}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Đã xóa lúc",
      cell: ({ row: r }) => {
        const date = r.original.deletedAt ? new Date(r.original.deletedAt) : null;
        return (
          <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
            {date && !isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Thao tác</div>,
      cell: ({ row: r }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-full"
            title="Xóa vĩnh viễn"
            onClick={() => setPermanentDeleteTarget(r.original)}
            style={{ color: "var(--accent-danger)" }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ], []);

  // ── Filter chips (level) ───────────────────────────────────
  const filterChips = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {([
        { value: "", label: "Tất cả" },
        { value: "EASY", label: "Dễ" },
        { value: "MEDIUM", label: "Trung bình" },
        { value: "HARD", label: "Khó" },
      ] as const).map((opt) => (
        <button
          key={opt.value || "all"} type="button"
          onClick={() => setFilterLevel(opt.value)}
          className="px-3 h-8 rounded-lg text-xs font-semibold border transition-all"
          style={
            filterLevel === opt.value
              ? { background: "var(--accent-gold-active-bg)", borderColor: "var(--accent-gold)", color: "var(--content-heading)" }
              : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  // ═══ EDITOR VIEW ══════════════════════════════════════════════════════════
  if (view === "editor") {
    const canSave =
      !!(draft.title.trim()) &&
      !createQuiz.isPending &&
      !updateQuiz.isPending;

    return (
      <StaffShell
        title={editorMode === "create" ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}
        description={editorMode === "create" ? "Điền thông tin và thêm câu hỏi." : `Đang chỉnh sửa: ${draft.title}`}
        icon={ClipboardTextIcon}
        accent="var(--accent-blue)"
      >
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ color: "var(--content-muted)" }}
        >
          <ArrowLeftIcon className="h-4 w-4" /> Quay lại danh sách
        </button>

        <div className="grid grid-cols-[360px_1fr] gap-6 items-start">
          {/* ── Metadata panel ── */}
          <div
            className="rounded-2xl border p-6 space-y-4 sticky top-6"
            style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--content-subtle)" }}>
              Thông tin bộ quiz
            </h2>

            <Field label="Tiêu đề *">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="VD: Chiến thắng Bạch Đằng — Bài kiểm tra"
              />
            </Field>

            <Field label="Sự kiện lịch sử (Context)">
              {(() => {
                const allContexts = contextsData?.content ?? [];
                const q = contextSearch.trim().toLowerCase();
                const filtered = q
                  ? allContexts.filter(
                    (c) =>
                      c.title.toLowerCase().includes(q) ||
                      c.id.toLowerCase().includes(q),
                  )
                  : allContexts;
                const selected = allContexts.find((c) => c.id === draft.contextId);
                return (
                  <Select
                    value={draft.contextId}
                    onValueChange={(v) => setDraft((s) => ({ ...s, contextId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn sự kiện liên kết...">
                        {selected ? (
                          <span className="truncate">{selected.title}</span>
                        ) : (
                          <span style={{ color: "var(--content-subtle)" }}>Chọn sự kiện liên kết...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <div className="px-2 pb-1 pt-1 sticky top-0 z-10" style={{ background: "var(--popover)" }}>
                        <Input
                          placeholder="Tìm sự kiện..."
                          value={contextSearch}
                          onChange={(e) => setContextSearch(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filtered.length === 0 && (
                        <p className="text-xs px-2 py-3 text-center" style={{ color: "var(--content-muted)" }}>
                          Không tìm thấy sự kiện
                        </p>
                      )}
                      {filtered.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-medium">{c.title}</span>
                          {c.year ? (
                            <span className="ml-1.5 text-xs" style={{ color: "var(--content-muted)" }}>
                              ({c.year > 0 ? c.year : `${Math.abs(c.year)} TCN`})
                            </span>
                          ) : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()}
              {draft.contextId && (
                <p className="text-[10px] mt-1" style={{ color: "var(--content-subtle)" }}>
                  ID: {draft.contextId}
                </p>
              )}
            </Field>

            <Field label="Độ khó">
              <div className="flex gap-2">
                {LEVEL_OPTIONS.map((opt) => {
                  const colors: Record<string, { active: string; activeBg: string; activeBorder: string }> = {
                    EASY: { active: "var(--accent-teal)", activeBg: "rgba(47,111,115,0.12)", activeBorder: "var(--accent-teal)" },
                    MEDIUM: { active: "var(--accent-gold)", activeBg: "rgba(201,162,77,0.12)", activeBorder: "var(--accent-gold)" },
                    HARD: { active: "var(--accent-danger)", activeBg: "rgba(184,50,42,0.10)", activeBorder: "var(--accent-danger)" },
                  };
                  const c = colors[opt.value];
                  const isActive = draft.level === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, level: opt.value }))}
                      className="flex-1 h-9 rounded-lg border text-sm font-semibold transition-all"
                      style={
                        isActive
                          ? { background: c.activeBg, borderColor: c.activeBorder, color: c.active }
                          : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 font-semibold border-0"
                disabled={!canSave}
                onClick={handleSave}
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                {createQuiz.isPending || updateQuiz.isPending
                  ? "Đang lưu..."
                  : editorMode === "create" ? "Tạo Quiz" : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setView("list")}
                style={{ borderColor: "var(--card-light-border)", background: "transparent", color: "var(--content-text)" }}>
                Hủy
              </Button>
            </div>
          </div>

          {/* ── Question panel ── */}
          <div
            className="rounded-2xl border p-6"
            style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
          >
            <div
              className="flex items-center gap-4 mb-5 pb-4 border-b"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--content-muted)" }}>
                <ClipboardTextIcon className="h-4 w-4" />
                <span>{draft.questions.length} câu hỏi</span>
              </div>
            </div>
            <QuizQuestionEditor
              questions={draft.questions}
              onChange={(qs) => setDraft((s) => ({ ...s, questions: qs }))}
              onImportError={(msg) => toast.error(msg)}
              onImportSuccess={(n) => toast.success(`Đã import ${n} câu hỏi.`)}
            />
          </div>
        </div>
      </StaffShell>
    );
  }

  // ═══ LIST VIEW ═══════════════════════════════════════════════════════════
  const totalItems = data?.totalElements ?? 0;
  const totalPlays = items.reduce((a, x) => a + x.playCount, 0);
  const totalQues = items.reduce((a, x) => a + x.questions.length, 0);

  return (
    <StaffShell
      title="Quản lý câu đố"
      description="Quản lý bộ câu hỏi lịch sử theo độ khó và thời đại."
      icon={ClipboardTextIcon}
      accent="var(--accent-blue)"
    >
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
      >
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Tổng bộ quiz", value: totalItems, icon: ClipboardTextIcon, color: "var(--accent-blue)" },
            { label: "Tổng câu hỏi", value: totalQues, icon: ClipboardTextIcon, color: "var(--accent-teal)" },
            { label: "Tổng lượt chơi", value: totalPlays.toLocaleString(), icon: GameControllerIcon, color: "var(--accent-blue)" },
          ] as const).map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl border px-4 py-3 flex items-center gap-3"
                style={{ borderColor: "var(--card-light-border)", background: "rgba(27,38,50,0.04)" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none" style={{ color: "var(--content-heading)" }}>{s.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold" style={{ color: "var(--content-heading)" }}>
              {showTrash ? "Thùng rác Quiz" : "Danh sách Quiz"}
            </h2>
            <div className="h-4 w-px bg-gray-200" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-lg px-2 text-xs font-semibold gap-1.5"
              onClick={() => setShowTrash(!showTrash)}
              style={{
                color: showTrash ? "var(--accent-blue)" : "var(--content-muted)",
                background: showTrash ? "rgba(59,130,246,0.08)" : "transparent",
              }}
            >
              {showTrash ? (
                <><ArrowLeftIcon className="h-3.5 w-3.5" /> Quay lại</>
              ) : (
                <><TrashIcon className="h-3.5 w-3.5" /> Thùng rác {trashedItems.length > 0 && `(${trashedItems.length})`}</>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[280px]">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bộ quiz..."
                className="pl-9 h-9 rounded-xl border-0 bg-black/[0.03] placeholder:text-[11px]"
              />
            </div>
            {!showTrash && (
              <Button
                size="sm"
                className="h-9 rounded-xl px-4 font-semibold gap-1.5 shadow-sm shadow-blue-500/20"
                onClick={openCreate}
                style={{ background: "var(--accent-blue)", color: "#fff" }}
              >
                <PlusIcon className="h-4 w-4" /> Tạo Quiz
              </Button>
            )}
          </div>
        </div>

        {!showTrash && (
          <div className="pb-2">
            {filterChips}
          </div>
        )}

        <div className="space-y-2">
          {isError && (
            <p className="text-sm text-center py-6" style={{ color: "var(--accent-danger)" }}>
              Không thể tải danh sách quiz. Vui lòng thử lại.
            </p>
          )}
          <StaffDataTable
            columns={showTrash ? trashColumns : columns}
            data={filteredItems}
            emptyMessage={showTrash ? "Thùng rác trống." : "Không tìm thấy quiz phù hợp."}
            isLoading={isLoading}
          />
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            Hiển thị {filteredItems.length} / {totalItems} bộ quiz
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(o) => !o && setPublishTarget(null)}
        title={publishTarget?.isActive !== false ? "Ẩn quiz khỏi người dùng?" : "Publish quiz cho người dùng?"}
        description={
          publishTarget?.isActive !== false
            ? `Quiz "${publishTarget?.title}" sẽ không hiển thị cho người dùng nữa.`
            : `Quiz "${publishTarget?.title}" sẽ hiển thị cho người dùng.`
        }
        isPending={toggleActiveQuiz.isPending}
        confirmLabel={publishTarget?.isActive !== false ? "Ẩn quiz" : "Publish quiz"}
        variant="warning"
        onConfirm={handleToggleActive}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Chuyển vào thùng rác?"
        description={`Quiz "${deleteTarget?.title}" sẽ được chuyển vào thùng rác.`}
        isPending={softDeleteQuiz.isPending}
        confirmLabel="Chuyển vào thùng rác"
        variant="danger"
        onConfirm={handleSoftDelete}
      />

      <ConfirmDialog
        open={!!permanentDeleteTarget}
        onOpenChange={(o) => !o && setPermanentDeleteTarget(null)}
        title="Xóa vĩnh viễn?"
        description={`Hành động này không thể hoàn tác. Quiz "${permanentDeleteTarget?.title}" sẽ bị xóa hoàn toàn.`}
        isPending={permanentDeleteQuiz.isPending}
        confirmLabel="Xóa vĩnh viễn"
        variant="danger"
        onConfirm={handlePermanentDelete}
      />
    </StaffShell>
  );
}
