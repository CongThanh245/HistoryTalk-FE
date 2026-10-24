"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { QuizQuestionEditor, toQuestionPayload, type QuizQuestion } from "@/components/staff/quiz-question-editor";
import { QueryState } from "@/components/saas/local-content-ui";
import { Field, Panel, SaasShell } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { useLocalQuizMutations, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { LEVEL_LABELS } from "@/features/saas/hooks-teaching";
import type { StaffQuizLevel } from "@/services/staff.quiz.service";

const LEVEL_OPTIONS = (Object.keys(LEVEL_LABELS) as StaffQuizLevel[]).map((l) => ({ value: l, label: LEVEL_LABELS[l] }));

/**
 * Teacher: soan bo de moi cho mot boi canh cua truong. BE bat buoc >= 1 cau hoi khi tao
 * (POST /teacher/local-contents/contexts/{id}/quizzes), nen cau hoi duoc soan truoc va gui 1 lan,
 * giong luong Content Admin. `?returnTo=` (trang giao bai) de quay lai voi bo de vua tao duoc chon san.
 */
export default function NewLocalQuizPage() {
  return (
    <SaasShell variant="app" live title="Soạn bộ đề mới" description="Thêm câu trắc nghiệm, điền chỗ trống hoặc nối cặp. Bộ đề được tạo khi bạn lưu.">
      <React.Suspense fallback={null}>
        <NewQuiz />
      </React.Suspense>
    </SaasShell>
  );
}

function NewQuiz() {
  const role = useRole();
  const params = useSearchParams();
  const rawReturn = params.get("returnTo");
  // Chi chap nhan quay ve trang giao bai (tranh open redirect qua ?returnTo=).
  const returnTo = rawReturn?.startsWith(`${ROUTES.TEACHING.ASSIGNMENT_NEW}?`) ? rawReturn : null;
  const local = useTeacherLocalContent(role === "TEACHER");

  if (role !== "TEACHER") {
    return <EmptyState title="Dành cho giáo viên" description="Chỉ giáo viên soạn được bộ đề của trường." />;
  }
  return (
    <QueryState isLoading={local.isLoading} isError={local.isError} error={local.error} onRetry={() => void local.refetch()}>
      {local.contexts.length === 0 ? (
        <EmptyState
          title="Cần một bối cảnh của trường"
          description="Bộ đề của trường luôn gắn với một bối cảnh trong Kho tư liệu. Tạo bối cảnh trước rồi quay lại."
          action={
            <Link href={ROUTES.TEACHING.LOCAL_NEW("CONTEXT")} className="btn-crimson">
              <Plus className="h-4 w-4" aria-hidden="true" /> Tạo bối cảnh
            </Link>
          }
        />
      ) : (
        <Composer
          contexts={local.contexts.map((c) => ({ value: c.id, label: c.name }))}
          initialContextId={params.get("contextId")}
          returnTo={returnTo}
        />
      )}
    </QueryState>
  );
}

function Composer({
  contexts,
  initialContextId,
  returnTo,
}: {
  contexts: { value: string; label: string }[];
  initialContextId: string | null;
  returnTo: string | null;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const { create } = useLocalQuizMutations();
  const [title, setTitle] = React.useState("");
  const [contextId, setContextId] = React.useState(
    initialContextId && contexts.some((c) => c.value === initialContextId) ? initialContextId : contexts.length === 1 ? contexts[0].value : "",
  );
  const [level, setLevel] = React.useState<StaffQuizLevel>("MEDIUM");
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);

  const back = returnTo ?? ROUTES.TEACHING.LOCAL;
  const dirty = !!title.trim() || questions.length > 0 || formOpen;
  const blocker = !title.trim()
    ? "Nhập tên bộ đề."
    : !contextId
      ? "Chọn bối cảnh của trường."
      : formOpen
        ? "Lưu hoặc hủy câu hỏi đang soạn trước."
        : questions.length === 0
          ? "Thêm ít nhất 1 câu hỏi."
          : null;

  // Khong co buoc nhap: tao la xuat ban luon.
  const save = () => {
    if (blocker) return;
    create.mutate(
      { contextId, payload: { title: title.trim(), level, isPublished: true, questions: questions.map(toQuestionPayload) } },
      {
        onSuccess: (q) => {
          // Bo cache danh sach bo de: trang giao bai mount lai se tai moi (khong hien list cu roi moi nhay).
          qc.removeQueries({ queryKey: ["local-content", "quizzes"] });
          toast.success("Đã tạo bộ đề", { description: `${questions.length} câu hỏi, giao bài được ngay.` });
          if (returnTo) router.push(`${returnTo}&targetId=${encodeURIComponent(q.quizId)}`);
          else router.push(`${ROUTES.TEACHING.LOCAL_QUIZ(q.quizId)}${returnTo ? `?returnTo=${encodeURIComponent(`${returnTo}&targetId=${q.quizId}`)}` : ""}`);
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Không tạo được bộ đề.")),
      },
    );
  };

  return (
    <div className="space-y-6">
      <button type="button" className="archive-link" onClick={() => (dirty ? setLeaveOpen(true) : router.push(back))}>
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> {returnTo ? "Quay lại giao bài" : "Soạn tư liệu"}
      </button>

      <Panel>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_180px]">
          <Field label="Tên bộ đề" required htmlFor="nq-title">
            <StaffFormInput id="nq-title" value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Ôn tập Khởi nghĩa Hai Bà Trưng" />
          </Field>
          <Field label="Gắn với bối cảnh của trường" required>
            <StaffFormSelect value={contextId} onValueChange={setContextId} placeholder="Chọn bối cảnh" options={contexts} className="w-full" />
          </Field>
          <Field label="Mức độ">
            <StaffFormSelect value={level} onValueChange={setLevel} options={LEVEL_OPTIONS} className="w-full" />
          </Field>
        </div>
      </Panel>

      <Panel>
        <QuizQuestionEditor
          questions={questions}
          onChange={setQuestions}
          onImportError={(msg) => toast.error(msg)}
          onImportSuccess={(n) => toast.success(`Đã thêm ${n} câu hỏi.`)}
          onEditingChange={setFormOpen}
        />
      </Panel>

      {/* Thanh luu dinh o day trang: luon thay ly do chua luu duoc. */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-[var(--text-primary)] bg-[var(--bg-surface)] px-4 py-3 sm:mx-0 sm:flex-row sm:items-center sm:justify-between">
        <p className={blocker ? "text-sm text-[var(--status-warning)]" : "text-sm text-content-muted"}>
          {blocker ?? `${questions.length} câu hỏi · sẵn sàng lưu.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-crimson disabled:opacity-50" disabled={!!blocker || create.isPending} onClick={save}>
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            {returnTo ? "Tạo & dùng để giao" : "Tạo bộ đề"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        variant="danger"
        title="Bỏ bộ đề đang soạn?"
        description="Bộ đề chưa được lưu. Các câu hỏi bạn đã soạn sẽ mất."
        confirmLabel="Rời đi, bỏ bộ đề"
        onConfirm={() => router.push(back)}
      />
    </div>
  );
}
