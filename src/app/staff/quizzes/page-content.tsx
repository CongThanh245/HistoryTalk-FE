"use client";

import * as React from "react";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import {
  ClipboardList, Trash2, ArrowLeft,
  Gamepad2, Eye, EyeOff, RotateCcw,
  ChevronLeft, ChevronRight, Upload, Flag, CheckCircle,
  Search, Plus,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import {
  useStaffQuizzes,
  useCreateStaffQuiz,
  useUpdateStaffQuiz,
  useSoftDeleteStaffQuiz,
  useImportQuizzesFromCsv,
  useQuestionReports,
  useResolveQuestionReport,
} from "@/features/staff/quiz/hooks";
import {
  useTrashList,
  useTrashRestore,
  useTrashPermanentDelete,
} from "@/features/trash/hooks";
import { useEvents } from "@/features/events/hooks";
import { staffQuizService, type StaffQuizSet, type QuestionReport } from "@/services/staff.quiz.service";
import { getApiErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils/cn";

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

const publishStatusSorting: SortingFn<StaffQuizSet> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<boolean>(columnId) ? 1 : 0;
  const b = rowB.getValue<boolean>(columnId) ? 1 : 0;
  return a - b;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs font-semibold text-content-subtle">
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
    <span className="text-xs text-content-muted">
      {d.toLocaleDateString("vi-VN")}
    </span>
  );
}

function getCreatorName(value: StaffQuizSet["createdBy"]) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  return value.userName ?? value.uid ?? "—";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StaffQuizzesPage() {
  const queryClient = useQueryClient();

  // ── Filter state ──────────────────────────────────────────
  const [search, setSearch] = React.useState("");
  const [filterLevel, setFilterLevel] = React.useState<"" | "EASY" | "MEDIUM" | "HARD">("");
  const [page, setPage] = React.useState(0);

  // ── View / editor state ───────────────────────────────────
  const [view, setView] = React.useState<"list" | "editor" | "reports">("list");
  const [reportStatusFilter, setReportStatusFilter] = React.useState<"OPEN" | "RESOLVED" | "">("OPEN");
  const [reportPage, setReportPage] = React.useState(0);
  const [editorMode, setEditorMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<QuizDraft>(emptyDraft());
  const [originalQuiz, setOriginalQuiz] = React.useState<StaffQuizSet | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<StaffQuizSet | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [restoreTarget, setRestoreTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [publishTarget, setPublishTarget] = React.useState<StaffQuizSet | null>(null);
  const [publishedOverrides, setPublishedOverrides] = React.useState<Record<string, boolean>>({});
  const [contextSearch, setContextSearch] = React.useState("");

  // ── CSV Import ─────────────────────────────────────────────
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importCsv = useImportQuizzesFromCsv();

  // ── API hooks ─────────────────────────────────────────────
  const params = React.useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    page,
    size: 20,
  }), [search, page]);

  const { data, isLoading, isError, refetch: refetchQuizzes } = useStaffQuizzes(params);
  const createQuiz = useCreateStaffQuiz();
  const updateQuiz = useUpdateStaffQuiz();
  const softDeleteQuiz = useSoftDeleteStaffQuiz();

  const { data: trashItems = [], isLoading: isTrashLoading, refetch: refetchTrash } = useTrashList("quizzes");
  const restoreQuiz = useTrashRestore("quizzes");
  const permanentDeleteQuiz = useTrashPermanentDelete("quizzes");

  // Load toàn bộ contexts để chọn trong dropdown
  const { data: contextsData } = useEvents({ page: 1, limit: 200 });

  // ── Question reports ("Câu này có vấn đề?") ────────────────
  const reportParams = React.useMemo(() => ({
    ...(reportStatusFilter && { status: reportStatusFilter }),
    page: reportPage,
    size: 20,
  }), [reportStatusFilter, reportPage]);
  const { data: reportsData, isLoading: isReportsLoading, refetch: refetchReports } = useQuestionReports(reportParams);
  // Badge đếm số báo cáo chưa xử lý — luôn tải nhẹ (size:1) bất kể đang xem view nào.
  const { data: openReportsCount } = useQuestionReports({ status: "OPEN", page: 0, size: 1 });
  const resolveReport = useResolveQuestionReport();
  const [resolveTarget, setResolveTarget] = React.useState<QuestionReport | null>(null);

  const handleResolveReport = () => {
    if (!resolveTarget) return;
    resolveReport.mutate(resolveTarget.reportId, {
      onSuccess: () => {
        toast.success("Đã đánh dấu báo cáo là đã xử lý.");
        refetchReports();
        setResolveTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Cập nhật thất bại. Vui lòng thử lại."));
      },
    });
  };

  const allItems = React.useMemo(
    () =>
      (data?.content ?? []).filter((item) => !item.deletedAt).map((item) => {
        const overriddenPublished = publishedOverrides[item.quizId];
        return overriddenPublished === undefined
          ? item
          : { ...item, isPublished: overriddenPublished };
      }),
    [data?.content, publishedOverrides],
  );

  // Filter theo level nếu có (active list)
  const filteredItems = filterLevel
    ? allItems.filter((q) => q.level === filterLevel)
    : allItems;

  const totalPages = data?.totalPages ?? 1;

  // ── Handlers ──────────────────────────────────────────────
  const openCreate = () => {
    setOriginalQuiz(null);
    setDraft(emptyDraft());
    setEditorMode("create");
    setView("editor");
  };

  const openEdit = (q: StaffQuizSet) => {
    setOriginalQuiz(q);
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

  const handleSave = async () => {
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
            refetchQuizzes();
            setView("list");
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Tạo quiz thất bại. Vui lòng thử lại."));
          },
        },
      );
    } else {
      if (!draft.quizId || !originalQuiz) return;
      setIsSaving(true);
      try {
        const quizId = draft.quizId;
        const promises: Promise<any>[] = [];

        const isMetadataChanged =
          title !== originalQuiz.title ||
          draft.contextId !== originalQuiz.contextId ||
          draft.level !== originalQuiz.level;

        if (isMetadataChanged) {
          promises.push(
            staffQuizService.updateQuiz(quizId, {
              title,
              contextId: draft.contextId,
              level: draft.level,
            })
          );
        }

        const originalQuestions = originalQuiz.questions;
        const formQuestions = draft.questions;

        const deletedQuestions = originalQuestions.filter(
          (oq) => !formQuestions.some((fq) => fq.questionId === oq.questionId)
        );
        deletedQuestions.forEach((q) => {
          promises.push(staffQuizService.deleteQuestion(quizId, q.questionId));
        });

        formQuestions.forEach((q) => {
          const isNew = !originalQuestions.some((oq) => oq.questionId === q.questionId);

          if (isNew) {
            promises.push(
              staffQuizService.addQuestion(quizId, {
                content: q.content,
                options: q.options,
                correctAnswer: q.correctAnswer,
                explanation: q.explanation,
              })
            );
          } else {
            const originalQ = originalQuestions.find((oq) => oq.questionId === q.questionId);
            if (originalQ) {
              const hasChanged =
                originalQ.content !== q.content ||
                originalQ.correctAnswer !== q.correctAnswer ||
                originalQ.explanation !== q.explanation ||
                originalQ.options.length !== q.options.length ||
                originalQ.options.some((opt, idx) => opt !== q.options[idx]);

              if (hasChanged) {
                promises.push(
                  staffQuizService.updateQuestion(quizId, q.questionId, {
                    content: q.content,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation,
                  })
                );
              }
            }
          }
        });

        if (promises.length > 0) {
          await Promise.all(promises);
        }
        toast.success(`Đã cập nhật quiz "${title}" thành công.`);
        queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.detail(quizId) });
        refetchQuizzes();
        setView("list");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Cập nhật quiz thất bại. Vui lòng thử lại."));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDeleteQuiz.mutate(deleteTarget.quizId, {
      onSuccess: () => {
        toast.success(`Đã chuyển quiz "${deleteTarget.title}" vào thùng rác.`);
        refetchQuizzes();
        refetchTrash();
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Xóa quiz thất bại. Vui lòng thử lại."));
      },
    });
  };

  const handleRestore = () => {
    if (!restoreTarget) return;
    restoreQuiz.mutate([restoreTarget.id], {
      onSuccess: () => {
        toast.success(`Đã khôi phục quiz "${restoreTarget.title}".`);
        refetchQuizzes();
        refetchTrash();
        setRestoreTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Khôi phục thất bại. Vui lòng thử lại."));
      },
    });
  };

  const handlePermanentDelete = () => {
    if (!permanentDeleteTarget) return;
    permanentDeleteQuiz.mutate([permanentDeleteTarget.id], {
      onSuccess: () => {
        toast.success(`Đã xóa vĩnh viễn quiz "${permanentDeleteTarget.title}".`);
        refetchTrash();
        setPermanentDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Xóa vĩnh viễn thất bại."));
      },
    });
  };

  const handleToggleActive = () => {
    if (!publishTarget) return;
    const nextPublished = !publishTarget.isPublished;
    updateQuiz.mutate(
      {
        quizId: publishTarget.quizId,
        payload: { isPublished: nextPublished },
      },
      {
        onSuccess: () => {
          toast.success(
            nextPublished
              ? `Đã xuất bản quiz "${publishTarget.title}" hiển thị cho người dùng.`
              : `Đã ẩn quiz "${publishTarget.title}" khỏi người dùng.`,
          );
          setPublishedOverrides((prev) => ({
            ...prev,
            [publishTarget.quizId]: nextPublished,
          }));
          refetchQuizzes();
          setPublishTarget(null);
        },
        onError: (error) => {
          toast.error(getApiErrorMessage(error, "Cập nhật trạng thái hiển thị thất bại. Vui lòng thử lại."));
        },
      },
    );
  };

  // ── Columns ───────────────────────────────────────────────
  const columns = React.useMemo<ColumnDef<StaffQuizSet>[]>(() => [
    {
      accessorKey: "title",
      header: "Bài quiz",
      cell: ({ row: r }) => (
        <div className="min-w-[240px]">
          <p className="text-sm font-semibold text-content-heading">
            {r.original.title}
          </p>
          {r.original.contextTitle && (
            <p className="text-xs mt-0.5 truncate max-w-[260px] text-content-muted">
              {r.original.contextTitle}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "level",
      header: "Độ khó",
      cell: ({ row: r }) => (
        <DifficultyBadge value={r.original.level as DifficultyKey} />
      ),
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: r }) => (
        <div className="flex min-w-[210px] items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-md px-3 text-xs font-semibold hover:bg-black/[0.04] hover:text-content-heading border-card-light-border text-content-heading"
            onClick={() => openEdit(r.original)}
          >
            Chỉnh sửa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-8 rounded-md px-3 text-sm font-bold hover:bg-black/[0.04] hover:text-content-heading border-card-light-border text-content-heading"
              >
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPublishTarget(r.original)}>
                {r.original.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => setDeleteTarget(r.original)}>
                <Trash2 className="h-4 w-4" />
                Chuyển vào thùng rác
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      accessorKey: "era",
      header: "Thời kỳ",
      cell: ({ row: r }) => (
        <EraBadge value={r.original.era as EraKey} />
      ),
    },
    {
      id: "stats",
      header: "Thống kê",
      cell: ({ row: r }) => (
        <div>
          <p className="text-xs text-content-text">
            {r.original.questions.length} câu hỏi
          </p>
          <p className="text-xs text-content-muted">
            {r.original.playCount.toLocaleString()} lần làm
          </p>
        </div>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Hiển thị",
      sortDescFirst: false,
      sortingFn: publishStatusSorting,
      cell: ({ row: r }) => {
        const isPublished = r.original.isPublished === true;
        const StatusIcon = isPublished ? Eye : EyeOff;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              isPublished
                ? "bg-[rgba(34,197,94,0.1)] text-[rgb(22,163,74)] border-[rgba(34,197,94,0.2)]"
                : "bg-[rgba(234,179,8,0.1)] text-[rgb(161,98,7)] border-[rgba(234,179,8,0.2)]"
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {isPublished ? "Đã xuất bản" : "Chưa xuất bản"}
          </span>
        );
      },
    },
    {
      accessorKey: "updatedDate",
      header: "Cập nhật",
      cell: ({ row: r }) => (
        <div className="text-xs text-content-muted">
          <p>{r.original.updatedDate ? <FormattedDate date={r.original.updatedDate} /> : "—"}</p>
          <p className="mt-0.5 opacity-70">
            Tạo: {r.original.createdDate ? <FormattedDate date={r.original.createdDate} /> : "—"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Người tạo",
      cell: ({ row: r }) => (
        <span className="text-xs text-content-muted">
          {getCreatorName(r.original.createdBy)}
        </span>
      ),
    },
  ],
    [],
  );

  type TrashRow = (typeof trashItems)[number];
  const trashColumns = React.useMemo<ColumnDef<TrashRow>[]>(() => [
    {
      accessorKey: "title",
      header: "Bài quiz",
      cell: ({ row: r }) => (
        <div className="min-w-[240px] opacity-60">
          <p className="text-sm font-semibold text-content-heading">
            {r.original.title}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Đã xóa lúc",
      cell: ({ row: r }) => {
        const date = new Date(r.original.deletedAt);
        return (
          <span className="text-xs text-accent-danger">
            {!isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "—"}
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
            type="button" variant="ghost" size="icon-sm" className="rounded-full text-accent-blue"
            title="Khôi phục"
            onClick={() => setRestoreTarget({ id: r.original.id, title: r.original.title })}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-full text-accent-danger"
            title="Xóa vĩnh viễn"
            onClick={() => setPermanentDeleteTarget({ id: r.original.id, title: r.original.title })}
          >
            <Trash2 className="h-4 w-4" />
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
          className={cn(
            "px-3 h-8 rounded-lg text-xs font-semibold border transition-all",
            filterLevel === opt.value
              ? "bg-[var(--accent-gold-active-bg)] border-accent-gold text-content-heading"
              : "bg-transparent border-card-light-border text-content-muted"
          )}
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
      !updateQuiz.isPending &&
      !isSaving;

    return (
      <StaffShell
        title={editorMode === "create" ? "Tạo Quiz mới" : "Chỉnh sửa Quiz"}
        description={editorMode === "create" ? "Điền thông tin và thêm câu hỏi." : `Đang chỉnh sửa: ${draft.title}`}
        icon={ClipboardList}
        accent="var(--accent-blue)"
      >
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-content-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>

        <div className="grid grid-cols-[360px_1fr] gap-6 items-start">
          {/* ── Metadata panel ── */}
          <div className="rounded-2xl border p-6 space-y-4 sticky top-6 bg-card-light-bg border-card-light-border">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-content-subtle">
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
                          <span className="text-content-subtle">Chọn sự kiện liên kết...</span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <div className="px-2 pb-1 pt-1 sticky top-0 z-10 bg-[var(--popover)]">
                        <Input
                          placeholder="Tìm sự kiện..."
                          value={contextSearch}
                          onChange={(e) => setContextSearch(e.target.value)}
                          className="h-8 text-xs"
                          onKeyDown={(e) => e.stopPropagation()}
                        />
                      </div>
                      {filtered.length === 0 && (
                        <p className="text-xs px-2 py-3 text-center text-content-muted">
                          Không tìm thấy sự kiện
                        </p>
                      )}
                      {filtered.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-medium">{c.title}</span>
                          {c.year ? (
                            <span className="ml-1.5 text-xs text-content-muted">
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
                <p className="text-[10px] mt-1 text-content-subtle">
                  ID: {draft.contextId}
                </p>
              )}
            </Field>

            <Field label="Độ khó">
              <div className="flex gap-2">
                {LEVEL_OPTIONS.map((opt) => {
                  const isActive = draft.level === opt.value;
                  const activeClasses: Record<string, string> = {
                    EASY: "bg-[rgba(47,111,115,0.12)] border-accent-teal text-accent-teal",
                    MEDIUM: "bg-[rgba(201,162,77,0.12)] border-accent-gold text-accent-gold",
                    HARD: "bg-[rgba(184,50,42,0.10)] border-accent-danger text-accent-danger",
                  };
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, level: opt.value }))}
                      className={cn(
                        "flex-1 h-9 rounded-lg border text-sm font-semibold transition-all",
                        isActive
                          ? activeClasses[opt.value]
                          : "bg-transparent border-card-light-border text-content-muted"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {editorMode === "edit" && originalQuiz && (() => {
              const currentPublished = publishedOverrides[originalQuiz.quizId] ?? originalQuiz.isPublished;
              const StatusIcon = currentPublished ? EyeOff : Eye;
              return (
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full font-semibold gap-1.5 bg-transparent",
                    currentPublished
                      ? "border-accent-danger text-accent-danger"
                      : "border-[var(--accent-teal)] text-[var(--accent-teal)]"
                  )}
                  onClick={() => setPublishTarget({ ...originalQuiz, isPublished: currentPublished })}
                >
                  <StatusIcon className="h-4 w-4" />
                  {currentPublished ? "Ngừng xuất bản" : "Xuất bản"}
                </Button>
              );
            })()}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                className="flex-1 font-semibold border-0 bg-[var(--accent-blue)] text-white"
                disabled={!canSave}
                onClick={handleSave}
              >
                {createQuiz.isPending || updateQuiz.isPending || isSaving
                  ? "Đang lưu..."
                  : editorMode === "create" ? "Tạo Quiz" : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setView("list")}
                className="border-card-light-border bg-transparent text-content-text">
                Hủy
              </Button>
            </div>
          </div>

          {/* ── Question panel ── */}
          <div className="rounded-2xl border p-6 bg-card-light-bg border-card-light-border">
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-card-light-border">
              <div className="flex items-center gap-1.5 text-sm text-content-muted">
                <ClipboardList className="h-4 w-4" />
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

  // ═══ REPORTS VIEW ════════════════════════════════════════════════════════
  if (view === "reports") {
    const reportItems = reportsData?.content ?? [];
    const reportTotalPages = reportsData?.totalPages ?? 1;
    const reportTotalItems = reportsData?.totalElements ?? 0;

    const reportColumns: ColumnDef<QuestionReport>[] = [
      {
        accessorKey: "questionContent",
        header: "Câu hỏi",
        cell: ({ row: r }) => (
          <div className="min-w-[280px]">
            <p className="text-sm font-semibold line-clamp-2 text-content-heading">
              {r.original.questionContent || "(Câu hỏi đã bị xóa)"}
            </p>
            <p className="text-xs mt-0.5 truncate max-w-[280px] text-content-muted">
              {r.original.quizTitle}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "reason",
        header: "Mô tả vấn đề",
        cell: ({ row: r }) => (
          <p className={cn("text-sm max-w-[260px]", r.original.reason ? "text-content-text" : "text-content-subtle")}>
            {r.original.reason || "(Không có mô tả)"}
          </p>
        ),
      },
      {
        accessorKey: "reportedBy",
        header: "Người báo cáo",
        cell: ({ row: r }) => (
          <span className="text-xs text-content-muted">
            {r.original.reportedBy || "—"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Thời gian",
        cell: ({ row: r }) => <FormattedDate date={r.original.createdAt} />,
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row: r }) => {
          const isOpen = r.original.status === "OPEN";
          return (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                isOpen
                  ? "bg-[rgba(234,179,8,0.1)] text-[rgb(161,98,7)] border-[rgba(234,179,8,0.2)]"
                  : "bg-[rgba(34,197,94,0.1)] text-[rgb(22,163,74)] border-[rgba(34,197,94,0.2)]"
              )}
            >
              {isOpen ? "Chưa xử lý" : "Đã xử lý"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Thao tác",
        cell: ({ row: r }) =>
          r.original.status === "OPEN" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-md px-3 text-xs font-semibold gap-1.5 border-card-light-border text-content-heading"
              onClick={() => setResolveTarget(r.original)}
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Đánh dấu đã xử lý
            </Button>
          ) : null,
      },
    ];

    return (
      <StaffShell
        title="Báo cáo câu hỏi"
        description={'Danh sách câu hỏi bị người dùng báo cáo có vấn đề ("Câu này có vấn đề?").'}
        icon={Flag}
        accent="var(--accent-danger)"
      >
        <button
          type="button"
          onClick={() => setView("list")}
          className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-content-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách quiz
        </button>

        <section className="rounded-2xl border p-6 space-y-5 bg-card-light-bg border-card-light-border">
          <div className="flex items-center gap-1.5 flex-wrap">
            {([
              { value: "OPEN", label: "Chưa xử lý" },
              { value: "RESOLVED", label: "Đã xử lý" },
              { value: "", label: "Tất cả" },
            ] as const).map((opt) => (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => { setReportStatusFilter(opt.value); setReportPage(0); }}
                className={cn(
                  "px-3 h-8 rounded-lg text-xs font-semibold border transition-all",
                  reportStatusFilter === opt.value
                    ? "bg-[var(--accent-gold-active-bg)] border-accent-gold text-content-heading"
                    : "bg-transparent border-card-light-border text-content-muted"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <StaffDataTable
            columns={reportColumns}
            data={reportItems}
            emptyMessage="Không có báo cáo nào."
            isLoading={isReportsLoading}
          />

          {reportTotalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-content-subtle">
                Trang {reportPage + 1} / {reportTotalPages} · {reportTotalItems} báo cáo
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon-sm" className="rounded-lg"
                  disabled={reportPage === 0}
                  onClick={() => setReportPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost" size="icon-sm" className="rounded-lg"
                  disabled={reportPage + 1 >= reportTotalPages}
                  onClick={() => setReportPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </section>

        <ConfirmDialog
          open={!!resolveTarget}
          onOpenChange={(o) => !o && setResolveTarget(null)}
          title="Đánh dấu báo cáo đã xử lý?"
          description="Báo cáo này sẽ được chuyển sang trạng thái Đã xử lý."
          isPending={resolveReport.isPending}
          confirmLabel="Đánh dấu đã xử lý"
          variant="warning"
          onConfirm={handleResolveReport}
        />
      </StaffShell>
    );
  }

  // ═══ LIST VIEW ═══════════════════════════════════════════════════════════
  const totalItems = data?.totalElements ?? 0;
  const totalPlays = allItems.reduce((a, x) => a + x.playCount, 0);
  const totalQues = allItems.reduce((a, x) => a + x.questions.length, 0);

  return (
    <StaffShell
      title="Quản lý câu đố"
      description="Quản lý bộ câu hỏi lịch sử theo độ khó và thời đại."
      icon={ClipboardList}
      accent="var(--accent-blue)"
    >
      <section className="rounded-2xl border p-6 space-y-5 bg-card-light-bg border-card-light-border">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: "Tổng bộ quiz", value: totalItems, icon: ClipboardList, color: "var(--accent-blue)" },
            { label: "Tổng câu hỏi", value: totalQues, icon: ClipboardList, color: "var(--accent-teal)" },
            { label: "Tổng lần làm", value: totalPlays.toLocaleString(), icon: Gamepad2, color: "var(--accent-blue)" },
          ] as const).map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-xl border px-4 py-3 flex items-center gap-3 border-card-light-border bg-[rgba(27,38,50,0.04)]"
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}18` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-lg font-bold leading-none text-content-heading">{s.value}</p>
                  <p className="text-xs mt-0.5 text-content-muted">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-content-heading">
              {showTrash ? "Thùng rác Quiz" : "Danh sách Quiz"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bộ quiz..."
                className="pl-9 h-9 rounded-xl border-0 bg-black/[0.03] placeholder:text-[11px]"
              />
            </div>
            <Button
              variant="outline"
              className={cn(
                "h-9 rounded-xl px-4 font-semibold",
                showTrash
                  ? "border-accent-danger text-accent-danger bg-[rgba(239,68,68,0.08)]"
                  : "border-card-light-border text-content-heading bg-transparent"
              )}
              onClick={() => setShowTrash(!showTrash)}
            >
              {showTrash ? (
                <><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Danh sách</>
              ) : (
                <><Trash2 className="h-3.5 w-3.5 mr-1.5" /> Thùng rác {trashItems.length > 0 && `(${trashItems.length})`}</>
              )}
            </Button>
            {!showTrash && (
              <Button
                variant="outline"
                className="h-9 rounded-xl px-4 font-semibold border-card-light-border text-content-heading"
                onClick={() => setView("reports")}
              >
                <Flag className="h-3.5 w-3.5 mr-1.5" />
                Báo cáo câu hỏi {!!openReportsCount?.totalElements && `(${openReportsCount.totalElements})`}
              </Button>
            )}
            {!showTrash && (
              <>
                {/* Hidden file input for CSV import */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      importCsv.mutate(file, {
                        onSuccess: () => {
                          refetchQuizzes();
                        },
                      });
                    }
                    e.target.value = "";
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 rounded-xl px-4 font-semibold gap-1.5 border-card-light-border text-content-text"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importCsv.isPending}
                >
                  <Upload className="h-4 w-4" />
                  {importCsv.isPending ? "Đang import..." : "Import CSV"}
                </Button>
                <Button
                  size="sm"
                  className="h-9 rounded-xl px-4 font-semibold gap-1.5 shadow-sm shadow-blue-500/20 bg-[var(--accent-blue)] text-white"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" /> Tạo Quiz
                </Button>
              </>
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
            <p className="text-sm text-center py-6 text-accent-danger">
              Không thể tải danh sách quiz. Vui lòng thử lại.
            </p>
          )}
          {showTrash ? (
            <StaffDataTable
              columns={trashColumns}
              data={trashItems}
              emptyMessage="Thùng rác trống."
              isLoading={isTrashLoading}
            />
          ) : (
            <>
              <StaffDataTable
                columns={columns}
                data={filteredItems}
                emptyMessage="Không tìm thấy quiz phù hợp."
                isLoading={isLoading}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-content-subtle">
                    Trang {page + 1} / {totalPages} · {totalItems} bộ quiz
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon-sm" className="rounded-lg"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm" className="rounded-lg"
                      disabled={page + 1 >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              {totalPages <= 1 && (
                <p className="text-xs text-content-subtle">
                  Hiển thị {filteredItems.length} / {totalItems} bộ quiz
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(o) => !o && setPublishTarget(null)}
        title={publishTarget?.isPublished ? "Ngừng xuất bản quiz?" : "Xuất bản quiz?"}
        description={
          publishTarget?.isPublished
            ? `Quiz "${publishTarget?.title}" sẽ không hiển thị cho người dùng nữa.`
            : `Quiz "${publishTarget?.title}" sẽ hiển thị cho người dùng.`
        }
        isPending={updateQuiz.isPending}
        confirmLabel={publishTarget?.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
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
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title="Khôi phục quiz?"
        description={`Quiz "${restoreTarget?.title}" sẽ được khôi phục.`}
        isPending={restoreQuiz.isPending}
        confirmLabel="Khôi phục"
        variant="warning"
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
