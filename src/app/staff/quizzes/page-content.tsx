"use client";

import * as React from "react";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import {
  ClipboardList, Trash2, ArrowLeft,
  Gamepad2, Eye, EyeOff, RotateCcw,
  ChevronLeft, ChevronRight, Upload,
  Search, Plus, Library, MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  DifficultyBadge, EraBadge,
  type DifficultyKey, type EraKey,
} from "@/components/staff/staff-badge";
import {
  QuizQuestionEditor,
  fromStaffQuestion,
  toQuestionPayload,
  type QuizQuestion,
} from "@/components/staff/quiz-question-editor";
import { QuestionBankView } from "@/components/staff/question-bank-view";
import { QUESTION_TYPE_LABELS } from "@/features/quiz/question-data";

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
} from "@/features/staff/quiz/hooks";
import {
  useTrashList,
  useTrashRestore,
  useTrashPermanentDelete,
} from "@/features/trash/hooks";
import { useEvents } from "@/features/events/hooks";
import { staffQuizService, type StaffQuizSet } from "@/services/staff.quiz.service";
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
  const [view, setView] = React.useState<"list" | "editor" | "bank">("list");
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
  const [questionFormOpen, setQuestionFormOpen] = React.useState(false);
  const [draftSnapshot, setDraftSnapshot] = React.useState("");
  const [leaveConfirmOpen, setLeaveConfirmOpen] = React.useState(false);

  // ── CSV Import ─────────────────────────────────────────────
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const importCsv = useImportQuizzesFromCsv();

  // ── API hooks ─────────────────────────────────────────────
  const params = React.useMemo(() => ({
    ...(search.trim() && { search: search.trim() }),
    ...(filterLevel && { level: filterLevel }),
    page,
    size: 20,
  }), [search, filterLevel, page]);

  const { data, isLoading, isError, refetch: refetchQuizzes } = useStaffQuizzes(params);
  const createQuiz = useCreateStaffQuiz();
  const updateQuiz = useUpdateStaffQuiz();
  const softDeleteQuiz = useSoftDeleteStaffQuiz();

  const { data: trashItems = [], isLoading: isTrashLoading, refetch: refetchTrash } = useTrashList("quizzes");
  const restoreQuiz = useTrashRestore("quizzes");
  const permanentDeleteQuiz = useTrashPermanentDelete("quizzes");

  // Load toàn bộ contexts để chọn trong dropdown
  const { data: contextsData } = useEvents({ page: 1, limit: 200 });

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

  // BE (StaffQuizController) chua doc `level` nen van loc them o FE; khi BE ho tro, param da gui san.
  const filteredItems = filterLevel ? allItems.filter((q) => q.level === filterLevel) : allItems;

  const totalPages = data?.totalPages ?? 1;

  // ── Handlers ──────────────────────────────────────────────
  const openCreate = () => {
    setOriginalQuiz(null);
    const next = emptyDraft();
    setDraft(next);
    setDraftSnapshot(JSON.stringify(next));
    setEditorMode("create");
    setView("editor");
  };

  // Sidebar "Tạo → Bộ đề" links to ?create=1: open the editor once, then drop the flag so a refresh shows the list.
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const wantsCreate = searchParams.get("create") === "1";
  React.useEffect(() => {
    if (!wantsCreate) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- opening the editor is the response to the URL flag, once
    openCreate();
    router.replace(pathname, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per ?create=1 navigation
  }, [wantsCreate]);

  const openEdit = (q: StaffQuizSet) => {
    setOriginalQuiz(q);
    const next: QuizDraft = {
      quizId: q.quizId,
      title: q.title,
      contextId: q.contextId,
      level: q.level,
      questions: q.questions.map(fromStaffQuestion),
    };
    setDraft(next);
    setDraftSnapshot(JSON.stringify(next));
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
          questions: draft.questions.map(toQuestionPayload),
        },
        {
          onSuccess: () => {
            toast.success(`Đã tạo bộ đề "${title}" với ${draft.questions.length} câu hỏi.`);
            refetchQuizzes();
            setView("list");
          },
          onError: (error) => {
            toast.error(getApiErrorMessage(error, "Tạo bộ đề thất bại. Vui lòng thử lại."));
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
            promises.push(staffQuizService.addQuestion(quizId, toQuestionPayload(q)));
          } else {
            const originalQ = originalQuestions.find((oq) => oq.questionId === q.questionId);
            if (originalQ) {
              // So sanh qua payload chuan hoa de bat ca thay doi loai cau hoi / questionData.
              const payload = toQuestionPayload(q);
              const hasChanged =
                JSON.stringify(payload) !== JSON.stringify(toQuestionPayload(fromStaffQuestion(originalQ)));

              if (hasChanged) {
                promises.push(staffQuizService.updateQuestion(quizId, q.questionId, payload));
              }
            }
          }
        });

        if (promises.length > 0) {
          await Promise.all(promises);
        }
        toast.success(`Đã cập nhật bộ đề "${title}".`);
        queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.all });
        queryClient.invalidateQueries({ queryKey: queryKeys.staffQuizzes.detail(quizId) });
        refetchQuizzes();
        setView("list");
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Cập nhật bộ đề thất bại. Vui lòng thử lại."));
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleSoftDelete = () => {
    if (!deleteTarget) return;
    softDeleteQuiz.mutate(deleteTarget.quizId, {
      onSuccess: () => {
        toast.success(`Đã chuyển bộ đề "${deleteTarget.title}" vào thùng rác.`);
        refetchQuizzes();
        refetchTrash();
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(getApiErrorMessage(error, "Xóa bộ đề thất bại. Vui lòng thử lại."));
      },
    });
  };

  const handleRestore = () => {
    if (!restoreTarget) return;
    restoreQuiz.mutate([restoreTarget.id], {
      onSuccess: () => {
        toast.success(`Đã khôi phục bộ đề "${restoreTarget.title}".`);
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
        toast.success(`Đã xóa vĩnh viễn bộ đề "${permanentDeleteTarget.title}".`);
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
              ? `Đã xuất bản bộ đề "${publishTarget.title}" cho người dùng.`
              : `Đã ẩn bộ đề "${publishTarget.title}" khỏi người dùng.`,
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
      header: "Bộ đề",
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
          {(() => {
            const types = new Set(r.original.questions.map((q) => q.questionType));
            return types.size > 1 ? (
              <p className="text-[11px] text-content-subtle">
                {[...types].map((t) => QUESTION_TYPE_LABELS[t]).join(" · ")}
              </p>
            ) : null;
          })()}
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
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
              isPublished
                ? "bg-[var(--status-success-bg)] text-[var(--status-success)] border-[var(--status-success-border)]"
                : "bg-[var(--status-neutral-bg)] text-[var(--text-tertiary)] border-[var(--border-strong)]"
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
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row: r }) => (
        <div className="flex min-w-[140px] items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-8 rounded-sm px-3 text-xs font-semibold hover:bg-[var(--status-neutral-bg)] hover:text-content-heading border-card-light-border text-content-heading"
            onClick={() => openEdit(r.original)}
          >
            Chỉnh sửa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                aria-label={`Thao tác khác cho ${r.original.title}`}
                className="h-8 rounded-sm px-2 hover:bg-[var(--status-neutral-bg)] hover:text-content-heading border-card-light-border text-content-heading"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setPublishTarget(r.original)}>
                {r.original.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
  ],
    [],
  );

  type TrashRow = (typeof trashItems)[number];
  const trashColumns = React.useMemo<ColumnDef<TrashRow>[]>(() => [
    {
      accessorKey: "title",
      header: "Bộ đề",
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
            type="button" variant="ghost" size="icon-sm" className="rounded-sm text-accent-blue"
            title="Khôi phục"
            onClick={() => setRestoreTarget({ id: r.original.id, title: r.original.title })}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon-sm" className="rounded-sm text-accent-danger"
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
          onClick={() => { setFilterLevel(opt.value); setPage(0); }}
          className={cn(
            "px-3 h-8 rounded-sm text-xs font-semibold border transition-all",
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
    const isDirty = JSON.stringify(draft) !== draftSnapshot;
    const canSave =
      !!(draft.title.trim()) &&
      !questionFormOpen &&
      !createQuiz.isPending &&
      !updateQuiz.isPending &&
      !isSaving;
    const saveHint = !draft.title.trim()
      ? "Nhập tiêu đề để lưu."
      : questionFormOpen
        ? "Lưu hoặc hủy câu hỏi đang soạn trước."
        : draft.questions.length === 0
          ? "Bộ đề chưa có câu hỏi nào."
          : null;
    // Roi editor khi con thay doi chua luu thi hoi lai, tranh mat cong soan.
    const leaveEditor = () => {
      if (isDirty || questionFormOpen) setLeaveConfirmOpen(true);
      else setView("list");
    };

    return (
      <StaffShell
        title={editorMode === "create" ? "Tạo bộ đề mới" : "Chỉnh sửa bộ đề"}
        label="Bộ đề"
        description={
          editorMode === "create"
            ? "Điền thông tin bên trái, rồi thêm câu trắc nghiệm, điền chỗ trống hoặc nối cặp ở bên phải."
            : `Đang chỉnh sửa: ${draft.title}`
        }
        icon={ClipboardList}
        accent="var(--accent-blue)"
      >
        <button
          type="button"
          onClick={leaveEditor}
          className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity text-content-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </button>

        <div className="grid gap-6 items-start lg:grid-cols-[340px_1fr]">
          {/* ── Metadata panel ── */}
          <div className="rounded-xl border p-6 space-y-4 lg:sticky lg:top-24 bg-[var(--bg-surface)] border-border-card">
            <h2 className="text-sm font-semibold text-content-subtle">
              Thông tin bộ đề
            </h2>

            <Field label="Tiêu đề *">
              <Input
                value={draft.title}
                onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))}
                placeholder="VD: Chiến thắng Bạch Đằng 938"
              />
            </Field>

            <Field label="Bối cảnh lịch sử liên kết">
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
            </Field>

            <Field label="Độ khó">
              <div className="flex gap-2">
                {LEVEL_OPTIONS.map((opt) => {
                  const isActive = draft.level === opt.value;
                  const activeClasses: Record<string, string> = {
                    EASY: "bg-accent-teal/10 border-accent-teal text-accent-teal",
                    MEDIUM: "bg-[var(--accent-gold-active-bg)] border-accent-gold text-accent-gold",
                    HARD: "bg-[var(--status-danger-bg)] border-accent-danger text-accent-danger",
                  };
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft((s) => ({ ...s, level: opt.value }))}
                      className={cn(
                        "flex-1 h-9 rounded-sm border text-sm font-semibold transition-all",
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
                className="flex-1 font-semibold border-0 bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)]"
                disabled={!canSave}
                onClick={handleSave}
              >
                {createQuiz.isPending || updateQuiz.isPending || isSaving
                  ? "Đang lưu..."
                  : editorMode === "create" ? "Tạo bộ đề" : "Lưu thay đổi"}
              </Button>
              <Button type="button" variant="outline" onClick={leaveEditor}
                className="border-card-light-border bg-transparent text-content-text">
                Hủy
              </Button>
            </div>
            {saveHint ? (
              <p className="text-xs text-[var(--status-warning)]">{saveHint}</p>
            ) : (
              isDirty && <p className="text-xs text-content-muted">Có thay đổi chưa lưu.</p>
            )}
          </div>

          {/* ── Question panel ── */}
          <div className="rounded-xl border p-6 bg-[var(--bg-surface)] border-border-card">
            <QuizQuestionEditor
              questions={draft.questions}
              onChange={(qs) => setDraft((s) => ({ ...s, questions: qs }))}
              onImportError={(msg) => toast.error(msg)}
              onImportSuccess={(n) => toast.success(`Đã thêm ${n} câu hỏi.`)}
              onEditingChange={setQuestionFormOpen}
            />
          </div>
        </div>

        <ConfirmDialog
          open={leaveConfirmOpen}
          onOpenChange={setLeaveConfirmOpen}
          title="Bỏ thay đổi chưa lưu?"
          description="Các thay đổi trong bộ đề này (kể cả câu hỏi đang soạn dở) sẽ mất nếu bạn rời đi."
          confirmLabel="Rời đi, bỏ thay đổi"
          variant="danger"
          onConfirm={() => { setLeaveConfirmOpen(false); setQuestionFormOpen(false); setView("list"); }}
        />
      </StaffShell>
    );
  }

  // ═══ REPORTS VIEW ════════════════════════════════════════════════════════
  if (view === "bank") {
    return <QuestionBankView onBack={() => setView("list")} />;
  }

  // ═══ LIST VIEW ═══════════════════════════════════════════════════════════
  const totalItems = data?.totalElements ?? 0;
  const totalPlays = allItems.reduce((a, x) => a + x.playCount, 0);
  const totalQues = allItems.reduce((a, x) => a + x.questions.length, 0);

  return (
    <StaffShell
      title="Quản lý bộ đề"
      label="Nội dung"
      description="Mỗi bộ đề gồm câu trắc nghiệm, điền chỗ trống hoặc nối cặp, gắn với một bối cảnh lịch sử."
      icon={ClipboardList}
      accent="var(--accent-blue)"
    >
      <section className="rounded-xl border p-6 space-y-5 bg-[var(--bg-surface)] border-border-card">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: filterLevel ? "Bộ đề (theo bộ lọc)" : "Tổng bộ đề", value: totalItems, icon: ClipboardList, color: "var(--accent-blue)" },
            { label: totalPages > 1 ? "Câu hỏi (trang này)" : "Tổng câu hỏi", value: totalQues, icon: ClipboardList, color: "var(--accent-teal)" },
            { label: totalPages > 1 ? "Lần làm (trang này)" : "Tổng lần làm", value: totalPlays.toLocaleString(), icon: Gamepad2, color: "var(--accent-blue)" },
          ] as const).map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-sm border px-4 py-3 flex items-center gap-3 border-border-card bg-[var(--bg-surface)]"
              >
                <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${s.color} 10%, transparent)` }}>
                  <Icon className="w-4 h-4" style={{ color: s.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold leading-none tabular-nums text-content-heading">{s.value}</p>
                  <p className="text-xs mt-0.5 text-content-muted">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-content-heading">
              {showTrash ? "Thùng rác bộ đề" : "Danh sách bộ đề"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-40" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm bộ đề..."
                className="pl-9 h-9 rounded-sm border-0 bg-[var(--status-neutral-bg)] placeholder:text-[11px]"
              />
            </div>
            {showTrash && (
              <Button
                variant="outline"
                className="h-9 rounded-sm px-4 font-semibold border-accent-danger text-accent-danger bg-[var(--status-danger-bg)]"
                onClick={() => setShowTrash(false)}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Danh sách
              </Button>
            )}
            {!showTrash && (
              <Button
                variant="outline"
                className="h-9 rounded-sm px-4 font-semibold border-card-light-border text-content-heading"
                onClick={() => setView("bank")}
              >
                <Library className="h-3.5 w-3.5 mr-1.5" />
                Ngân hàng câu hỏi
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      aria-label="Thao tác khác"
                      className="h-9 rounded-sm px-3 font-semibold gap-1.5 border-card-light-border text-content-heading"
                      disabled={importCsv.isPending}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      {importCsv.isPending && <span className="text-xs">Đang nhập...</span>}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4" /> Nhập bộ đề từ CSV
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowTrash(true)}>
                      <Trash2 className="h-4 w-4" /> Thùng rác {trashItems.length > 0 && `(${trashItems.length})`}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  className="h-9 rounded-sm px-4 font-semibold gap-1.5 bg-[var(--accent-gold)] text-white hover:bg-[var(--accent-bronze)]"
                  onClick={openCreate}
                >
                  <Plus className="h-4 w-4" /> Tạo bộ đề
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
                emptyMessage="Không tìm thấy bộ đề phù hợp."
                isLoading={isLoading}
              />
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-content-subtle">
                    Trang {page + 1} / {totalPages} · {totalItems} bộ đề
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost" size="icon-sm" className="rounded-sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon-sm" className="rounded-sm"
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
                  Hiển thị {filteredItems.length} / {totalItems} bộ đề
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(o) => !o && setPublishTarget(null)}
        title={publishTarget?.isPublished ? "Ngừng xuất bản bộ đề?" : "Xuất bản bộ đề?"}
        description={
          publishTarget?.isPublished
            ? `Bộ đề "${publishTarget?.title}" sẽ không hiển thị cho người dùng nữa.`
            : `Bộ đề "${publishTarget?.title}" sẽ hiển thị cho người dùng.`
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
        description={`Bộ đề "${deleteTarget?.title}" sẽ được chuyển vào thùng rác.`}
        isPending={softDeleteQuiz.isPending}
        confirmLabel="Chuyển vào thùng rác"
        variant="danger"
        onConfirm={handleSoftDelete}
      />

      <ConfirmDialog
        open={!!restoreTarget}
        onOpenChange={(o) => !o && setRestoreTarget(null)}
        title="Khôi phục bộ đề?"
        description={`Bộ đề "${restoreTarget?.title}" sẽ được khôi phục.`}
        isPending={restoreQuiz.isPending}
        confirmLabel="Khôi phục"
        variant="warning"
        onConfirm={handleRestore}
      />

      <ConfirmDialog
        open={!!permanentDeleteTarget}
        onOpenChange={(o) => !o && setPermanentDeleteTarget(null)}
        title="Xóa vĩnh viễn?"
        description={`Hành động này không thể hoàn tác. Bộ đề "${permanentDeleteTarget?.title}" sẽ bị xóa hoàn toàn.`}
        isPending={permanentDeleteQuiz.isPending}
        confirmLabel="Xóa vĩnh viễn"
        variant="danger"
        onConfirm={handlePermanentDelete}
      />
    </StaffShell>
  );
}
