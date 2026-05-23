"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ClipboardTextIcon, PencilIcon, TrashIcon, ArrowLeftIcon,
  TimerIcon, GameControllerIcon,
} from "@phosphor-icons/react";
import { toast } from "sonner";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffSearchBar } from "@/components/staff/staff-search-bar";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EraBadge, GradeBadge, ERA_OPTIONS, type EraKey } from "@/components/staff/staff-badge";
import { QuizQuestionEditor, type QuizQuestion } from "@/components/staff/quiz-question-editor";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  useStaffQuizzes,
  useCreateStaffQuiz,
  useUpdateStaffQuiz,
  useSoftDeleteStaffQuiz,
  useRestoreStaffQuiz,
  usePermanentDeleteStaffQuiz,
} from "@/features/staff/quiz/hooks";
import { useEvents } from "@/features/events/hooks";
import type { StaffQuizSet, StaffQuizEra } from "@/services/staff.quiz.service";
import { ArrowCounterClockwiseIcon, MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Draft cho editor — chỉ các field mà POST /staff/quizzes chấp nhận */
interface QuizDraft {
  quizId?: string;           // chỉ có khi edit
  title: string;
  description: string;
  contextId: string;
  grade: 10 | 11 | 12 | null;
  chapterNumber: number;
  chapterTitle: string;
  era: StaffQuizEra;
  durationSeconds: number;
  questions: QuizQuestion[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyDraft = (): QuizDraft => ({
  title: "",
  description: "",
  contextId: "",
  grade: null,
  chapterNumber: 1,
  chapterTitle: "",
  era: "CONTEMPORARY",
  durationSeconds: 900,
  questions: [],
});

const fmtDuration = (s: number) => {
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} phút` : `${s}s`;
};

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffQuizzesPage() {
  // ── Filter state ──────────────────────────────────────────
  const [search, setSearch] = React.useState("");
  const [filterGrade, setFilterGrade] = React.useState<"" | "10" | "11" | "12">("");
  const [page] = React.useState(0);

  // ── View / editor state ───────────────────────────────────
  const [view, setView] = React.useState<"list" | "editor">("list");
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<QuizDraft>(emptyDraft());
  const [deleteTarget, setDeleteTarget] = React.useState<StaffQuizSet | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [restoreTarget, setRestoreTarget] = React.useState<StaffQuizSet | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<StaffQuizSet | null>(null);
  const [contextSearch, setContextSearch] = React.useState("");

  // ── API hooks ─────────────────────────────────────────────
  const params = React.useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    ...(filterGrade && { grade: Number(filterGrade) }),
    page,
    size: 20,
  }), [search, filterGrade, page]);

  const { data, isLoading, isError } = useStaffQuizzes(params);
  const createQuiz = useCreateStaffQuiz();
  const updateQuiz = useUpdateStaffQuiz();
  const softDeleteQuiz = useSoftDeleteStaffQuiz();
  const restoreQuiz = useRestoreStaffQuiz();
  const permanentDeleteQuiz = usePermanentDeleteStaffQuiz();
  // Load toàn bộ contexts để chọn trong dropdown (chỉ cần khi mở editor)
  const { data: contextsData } = useEvents({ page: 1, limit: 200 });

  const allItems = data?.content ?? [];
  const activeItems = allItems.filter((q) => !q.deletedAt);
  const trashedItems = allItems.filter((q) => !!q.deletedAt);
  const items = showTrash ? trashedItems : activeItems;

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
      description: q.description,
      contextId: q.contextId,
      grade: ([10, 11, 12].includes(q.grade) ? q.grade : null) as 10 | 11 | 12 | null,
      chapterNumber: q.chapterNumber,
      chapterTitle: q.chapterTitle,
      era: q.era,
      durationSeconds: q.durationSeconds,
      // Map StaffQuizQuestion → QuizQuestion (same shape)
      questions: q.questions.map((qq) => {
        // Pad options to exactly 4 elements to satisfy the [s,s,s,s] tuple type
        const opts = [...qq.options];
        while (opts.length < 4) opts.push("");
        return {
          questionId: qq.questionId,
          orderIndex: qq.orderIndex,
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
    const chapterTitle = draft.chapterTitle.trim();
    if (!title || !chapterTitle) return;

    if (editorMode === "create") {
      createQuiz.mutate(
        {
          title,
          description: draft.description.trim(),
          contextId: draft.contextId.trim(),
          grade: draft.grade ?? 0,
          chapterNumber: draft.chapterNumber,
          chapterTitle,
          era: draft.era,
          durationSeconds: draft.durationSeconds,
          questions: draft.questions.map((q, i) => ({
            content: q.content,
            options: q.options,
            correctAnswer: q.correctAnswer,
            orderIndex: q.orderIndex ?? i + 1,
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
      // Edit — gọi PUT /staff/quizzes/{quizId}
      if (!draft.quizId) return;
      updateQuiz.mutate(
        {
          quizId: draft.quizId,
          payload: {
            title,
            description: draft.description.trim(),
            contextId: draft.contextId,
            grade: draft.grade ?? 0,
            chapterNumber: draft.chapterNumber,
            chapterTitle,
            era: draft.era,
            durationSeconds: draft.durationSeconds,
          },
        },
        {
          onSuccess: () => {
            toast.success(`Đã cập nhật quiz "${title}".`);
            setView("list");
          },
          onError: () => {
            toast.error("Ấp nhật quiz thất bại. Vui lòng thử lại.");
          },
        },
      );
    }
  };

  // PATCH /staff/quizzes/{quizId}/soft-delete
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

  // PATCH /staff/quizzes/{quizId}/restore
  const handleRestore = () => {
    if (!restoreTarget) return;
    restoreQuiz.mutate(restoreTarget.quizId, {
      onSuccess: () => {
        toast.success(`Đã khôi phục quiz "${restoreTarget.title}".`);
        setRestoreTarget(null);
      },
      onError: () => {
        toast.error("Khôi phục quiz thất bại.");
      },
    });
  };

  // DELETE /staff/quizzes/{quizId}
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
          <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
            Bài {r.original.chapterNumber}: {r.original.chapterTitle}
          </p>
        </div>
      ),
    },
    {
      id: "meta",
      header: "Phân loại",
      cell: ({ row: r }) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {!!r.original.grade && <GradeBadge value={r.original.grade as 10 | 11 | 12} />}
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
            {r.original.questions.length} câu · {fmtDuration(r.original.durationSeconds)}
          </p>
          <p className="text-xs" style={{ color: "var(--content-muted)" }}>
            {r.original.playCount.toLocaleString()} lượt chơi
          </p>
        </div>
      ),
    },
    {
      accessorKey: "updatedDate",
      header: "Cập nhật",
      cell: ({ row: r }) => (
        r.original.updatedDate ? <FormattedDate date={r.original.updatedDate} /> : "—"
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Thao tác</div>,
      cell: ({ row: r }) => (
        <div className="flex items-center justify-end gap-1">
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
          <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
            Bài {r.original.chapterNumber}: {r.original.chapterTitle}
          </p>
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
            title="Khôi phục"
            onClick={() => setRestoreTarget(r.original)}
            style={{ color: "var(--accent-teal)" }}
          >
            <ArrowCounterClockwiseIcon className="h-4 w-4" />
          </Button>
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

  // ── Filter chips ──────────────────────────────────────────
  const filterChips = (
    <div className="flex items-center gap-1.5 flex-wrap">
      {(["", "10", "11", "12"] as const).map((g) => (
        <button
          key={g || "all"} type="button"
          onClick={() => setFilterGrade(g)}
          className="px-3 h-8 rounded-lg text-xs font-semibold border transition-all"
          style={
            filterGrade === g
              ? { background: "var(--accent-gold-active-bg)", borderColor: "var(--accent-gold)", color: "var(--content-heading)" }
              : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }
          }
        >
          {g ? `Lớp ${g}` : "Tất cả"}
        </button>
      ))}
    </div>
  );

  // ═══ EDITOR VIEW ══════════════════════════════════════════════════════════
  if (view === "editor") {
    const canSave =
      !!(draft.title.trim() && draft.chapterTitle.trim()) &&
      !createQuiz.isPending &&
      !updateQuiz.isPending;
    return (
      <StaffShell
        title={editorMode === "create" ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}
        description={editorMode === "create" ? "Điền metadata và thêm câu hỏi." : `Đang chỉnh sửa: ${draft.title}`}
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

        <div className="grid grid-cols-[380px_1fr] gap-6 items-start">
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
                placeholder="VD: Lịch sử 12 — Bài 1: Liên Hợp Quốc"
              />
            </Field>

            <Field label="Mô tả">
              <Textarea
                value={draft.description}
                onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))}
                placeholder="Mô tả ngắn về bộ quiz..."
                className="min-h-[60px] text-sm"
              />
            </Field>

            <Field label="Sự kiện lịch sử (Context)">
              {/* Filtered list từ API /historical-contexts */}
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
                      {/* Search box bên trong dropdown */}
                      <div className="px-2 pb-1 pt-1 sticky top-0 z-10" style={{ background: "var(--popover)" }}>
                        <Input
                          placeholder="Tìm sự kiện..."
                          value={contextSearch}
                          onChange={(e) => setContextSearch(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.stopPropagation()} // tránh Select bắt phím
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

            <div className="grid grid-cols-2 gap-3">
              <Field label="Lớp (tuỳ chọn)">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraft((s) => ({ ...s, grade: null }))}
                    className="flex-1 h-9 rounded-lg border text-sm font-semibold transition-all"
                    style={
                      draft.grade === null
                        ? { background: "rgba(100,100,100,0.15)", borderColor: "var(--content-muted)", color: "var(--content-text)" }
                        : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }
                    }
                  >
                    —
                  </button>
                  {([10, 11, 12] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, grade: g }))}
                      className="flex-1 h-9 rounded-lg border text-sm font-semibold transition-all"
                      style={
                        draft.grade === g
                          ? { background: "rgba(59,130,246,0.15)", borderColor: "var(--accent-blue)", color: "var(--accent-blue)" }
                          : { background: "transparent", borderColor: "var(--card-light-border)", color: "var(--content-muted)" }
                      }
                    >
                      {g}
                    </button>
                  ))}
                </div>
                {draft.grade === null && (
                  <p className="text-[10px] mt-1" style={{ color: "var(--content-subtle)" }}>
                    Không gắn lớp — dùng cho quiz ngoài chương trình.
                  </p>
                )}
              </Field>

              <Field label="Số bài (VD: Bài 3 → nhập 3)">
                <Input
                  type="number" min={1} max={99}
                  value={draft.chapterNumber}
                  onChange={(e) => setDraft((s) => ({ ...s, chapterNumber: Number(e.target.value) || 1 }))}
                  className="h-9"
                />
              </Field>
            </div>

            <Field label="Tên chủ đề *">
              <Input
                value={draft.chapterTitle}
                onChange={(e) => setDraft((s) => ({ ...s, chapterTitle: e.target.value }))}
                placeholder="VD: Liên Hợp Quốc"
              />
            </Field>

            <Field label="Thời đại lịch sử">
              <Select
                value={draft.era}
                onValueChange={(v) => setDraft((s) => ({ ...s, era: v as StaffQuizEra }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ERA_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={`Thời gian gợi ý (giây) — ${fmtDuration(draft.durationSeconds)}`}>
              <Input
                type="number" min={60} step={60}
                value={draft.durationSeconds}
                onChange={(e) => setDraft((s) => ({ ...s, durationSeconds: Number(e.target.value) || 600 }))}
                className="h-9"
              />
            </Field>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 font-semibold border-0"
                disabled={!canSave}
                onClick={handleSave}
                style={{ background: "#3b82f6", color: "#fff" }}
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
              <div className="flex items-center gap-1.5 text-sm" style={{ color: "var(--content-muted)" }}>
                <TimerIcon className="h-4 w-4" />
                <span>{fmtDuration(draft.durationSeconds)}</span>
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
      description="Quản lý bộ câu hỏi lịch sử theo lớp, bài và độ khó."
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

        <div className="pb-2">
          {filterChips}
        </div>

        <div className="space-y-2">
          {isError && (
            <p className="text-sm text-center py-6" style={{ color: "var(--accent-danger)" }}>
              Không thể tải danh sách quiz. Vui lòng thử lại.
            </p>
          )}
          <StaffDataTable
            columns={showTrash ? trashColumns : columns}
            data={items}
            emptyMessage={showTrash ? "Thùng rác trống." : "Không tìm thấy quiz phù hợp."}
            isLoading={isLoading}
          />
          <p className="text-xs" style={{ color: "var(--content-subtle)" }}>
            Hiển thị {items.length} / {totalItems} bộ quiz
          </p>
        </div>
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Chuyển vào thùng rác?"
        description={`Quiz "${deleteTarget?.title}" sẽ được chuyển vào thùng rác. Bạn có thể khôi phục sau.`}
        isPending={softDeleteQuiz.isPending}
        confirmLabel="Chuyển vào thùng rác"
        variant="danger"
        onConfirm={handleSoftDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title="Khôi phục quiz?"
        description={`Khôi phục quiz "${restoreTarget?.title}" về danh sách hoạt động.`}
        isPending={restoreQuiz.isPending}
        confirmLabel="Khôi phục"
        onConfirm={handleRestore}
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


function FormattedDate({ date }: { date: string }) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <span className="text-xs">—</span>;

  return (
    <span className="text-xs" style={{ color: "var(--content-muted)" }}>
      {new Date(date).toLocaleDateString("vi-VN")}
    </span>
  );
}
