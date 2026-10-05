"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowLeft, ArrowUp, CopyPlus, Lock, MessageSquareWarning, Plus, Save, Send, Trash2, Undo2, X } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Field, IconAction, Panel, SectionHeading, formatDate } from "@/components/saas/saas-ui";
import { ClassCheckboxList, LocalStatusBadge } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import {
  LEVEL_LABELS,
  LOCAL_ERA_OPTIONS,
  LOCAL_KIND_LABELS,
  formatYear,
  localTitle,
  type TeachingData,
} from "@/features/saas/hooks-teaching";
import { useSchoolData } from "@/features/saas/hooks";
import { useDemoSchoolId, useSaasStore } from "@/features/saas/store";
import type { LocalCharacter, LocalContent, LocalContentKind, LocalContext, LocalQuiz, LocalQuizQuestion } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Form state ───────────────────────── */

type Era = LocalContext["era"];
type Level = LocalQuiz["level"];

interface CtxForm {
  title: string;
  era: Era;
  year: string;
  location: string;
  summary: string;
  body: string;
  imageUrl: string;
  latitude: string;
  longitude: string;
}
interface ChrForm {
  name: string;
  title: string;
  bornYear: string;
  deathYear: string;
  biography: string;
  persona: string;
  contextId: string;
  imageUrl: string;
}
interface QuizForm {
  title: string;
  level: Level;
  contextId: string;
  durationMinutes: string;
  questions: LocalQuizQuestion[];
}
interface FormState {
  classIds: string[];
  ctx: CtxForm;
  chr: ChrForm;
  quiz: QuizForm;
}

const NONE = "__none__";
const str = (n: number | undefined | null) => (n == null ? "" : String(n));
const qid = () => `q-${Math.random().toString(36).slice(2, 8)}`;
const blankQuestion = (): LocalQuizQuestion => ({ id: qid(), prompt: "", options: ["", "", "", ""], correctIndex: 0, explanation: "" });

function initialForm(item: LocalContent | undefined, defaultClassIds: string[]): FormState {
  const ctx: CtxForm = { title: "", era: "MODERN", year: "", location: "", summary: "", body: "", imageUrl: "", latitude: "", longitude: "" };
  const chr: ChrForm = { name: "", title: "", bornYear: "", deathYear: "", biography: "", persona: "", contextId: NONE, imageUrl: "" };
  const quiz: QuizForm = { title: "", level: "MEDIUM", contextId: NONE, durationMinutes: "15", questions: [] };
  if (item?.kind === "CONTEXT")
    Object.assign(ctx, {
      title: item.title, era: item.era, year: str(item.year), location: item.location, summary: item.summary, body: item.body,
      imageUrl: item.imageUrl ?? "", latitude: str(item.latitude), longitude: str(item.longitude),
    });
  if (item?.kind === "CHARACTER")
    Object.assign(chr, {
      name: item.name, title: item.title, bornYear: str(item.bornYear), deathYear: str(item.deathYear), biography: item.biography,
      persona: item.persona, contextId: item.contextId ?? NONE, imageUrl: item.imageUrl ?? "",
    });
  if (item?.kind === "QUIZ")
    Object.assign(quiz, {
      title: item.title, level: item.level, contextId: item.contextId ?? NONE, durationMinutes: str(item.durationMinutes),
      questions: item.questions.map((q) => ({ ...q, options: [...q.options], explanation: q.explanation ?? "" })),
    });
  return { classIds: item ? [...item.classIds] : defaultClassIds, ctx, chr, quiz };
}

const optNum = (v: string) => (v.trim() === "" ? undefined : Number(v));
const isInt = (v: string) => /^-?\d+$/.test(v.trim());

type Errors = Record<string, string | null>;

function validate(kind: LocalContentKind, f: FormState, full: boolean): Errors {
  const e: Errors = {};
  const need = (key: string, v: string, msg: string) => {
    if (full && !v.trim()) e[key] = msg;
  };
  if (kind === "CONTEXT") {
    if (!f.ctx.title.trim()) e.title = "Nhập tên bối cảnh";
    if (full && !isInt(f.ctx.year)) e.year = "Nhập năm (số nguyên, âm = TCN)";
    else if (f.ctx.year.trim() && !isInt(f.ctx.year)) e.year = "Năm phải là số nguyên";
    need("location", f.ctx.location, "Nhập địa điểm");
    need("summary", f.ctx.summary, "Nhập tóm tắt");
    need("body", f.ctx.body, "Nhập nội dung");
    const lat = f.ctx.latitude.trim();
    const lng = f.ctx.longitude.trim();
    if (lat || lng) {
      if (!lat || !lng) e.coords = "Nhập đủ cả vĩ độ và kinh độ, hoặc để trống cả hai";
      else if (!(Math.abs(Number(lat)) <= 90)) e.coords = "Vĩ độ từ -90 đến 90";
      else if (!(Math.abs(Number(lng)) <= 180)) e.coords = "Kinh độ từ -180 đến 180";
    }
  }
  if (kind === "CHARACTER") {
    if (!f.chr.name.trim()) e.name = "Nhập tên nhân vật";
    need("chrTitle", f.chr.title, "Nhập danh hiệu / vai trò");
    need("biography", f.chr.biography, "Nhập tiểu sử");
    need("persona", f.chr.persona, "Mô tả tính cách để AI nhập vai");
    if (f.chr.bornYear.trim() && !isInt(f.chr.bornYear)) e.years = "Năm sinh phải là số nguyên";
    else if (f.chr.deathYear.trim() && !isInt(f.chr.deathYear)) e.years = "Năm mất phải là số nguyên";
    else if (f.chr.bornYear.trim() && f.chr.deathYear.trim() && Number(f.chr.deathYear) < Number(f.chr.bornYear)) e.years = "Năm mất phải sau năm sinh";
  }
  if (kind === "QUIZ") {
    if (!f.quiz.title.trim()) e.title = "Nhập tên bộ câu đố";
    const d = Number(f.quiz.durationMinutes);
    if (!(Number.isInteger(d) && d >= 1 && d <= 180)) e.duration = "Thời gian từ 1 đến 180 phút";
    if (full) {
      if (f.quiz.questions.length === 0) e.questions = "Thêm ít nhất một câu hỏi";
      f.quiz.questions.forEach((q, i) => {
        const filled = q.options.filter((o) => o.trim());
        if (!q.prompt.trim()) e[`q-${q.id}`] = `Câu ${i + 1}: nhập nội dung câu hỏi`;
        else if (filled.length !== q.options.length || q.options.length < 2) e[`q-${q.id}`] = `Câu ${i + 1}: điền đủ các phương án (2–6)`;
        else if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length)) e[`q-${q.id}`] = `Câu ${i + 1}: chọn đáp án đúng`;
      });
    }
  }
  if (full && f.classIds.length === 0) e.classes = "Chọn ít nhất một lớp được xem";
  return e;
}

function toPayload(kind: LocalContentKind, f: FormState) {
  const base = { classIds: f.classIds };
  if (kind === "CONTEXT") {
    const c = f.ctx;
    return {
      ...base, kind, title: c.title.trim(), era: c.era, year: Number(c.year) || 0, location: c.location.trim(), summary: c.summary.trim(),
      body: c.body.trim(), imageUrl: c.imageUrl.trim() || undefined, latitude: optNum(c.latitude), longitude: optNum(c.longitude),
    } satisfies Partial<LocalContext>;
  }
  if (kind === "CHARACTER") {
    const c = f.chr;
    return {
      ...base, kind, name: c.name.trim(), title: c.title.trim(), bornYear: optNum(c.bornYear), deathYear: optNum(c.deathYear),
      biography: c.biography.trim(), persona: c.persona.trim(), contextId: c.contextId === NONE ? undefined : c.contextId,
      imageUrl: c.imageUrl.trim() || undefined,
    } satisfies Partial<LocalCharacter>;
  }
  const q = f.quiz;
  return {
    ...base, kind, title: q.title.trim(), level: q.level, contextId: q.contextId === NONE ? undefined : q.contextId,
    durationMinutes: Number(q.durationMinutes) || 15,
    questions: q.questions.map((x) => ({ ...x, prompt: x.prompt.trim(), options: x.options.map((o) => o.trim()), explanation: x.explanation?.trim() || undefined })),
  } satisfies Partial<LocalQuiz>;
}

/* ───────────────────────── Editor ───────────────────────── */

const READONLY_NOTE: Record<string, string> = {
  PENDING: "Nội dung đang chờ quản trị trường duyệt nên không thể chỉnh sửa. Rút lại để sửa tiếp.",
  PUBLISHED: "Nội dung đã xuất bản cho học sinh. Tạo bản chỉnh sửa để soạn phiên bản mới và gửi duyệt lại.",
  INACTIVE: "Quản trị trường đã ngừng hiển thị nội dung này. Tạo bản chỉnh sửa để sửa theo góp ý và gửi duyệt lại.",
  TRASH: "Nội dung đã được chuyển vào thùng rác. Bạn có thể tạo bản chỉnh sửa từ nội dung này.",
};

/** Draft → Gửi duyệt → (School Admin) Xuất bản / Ngừng hiển thị. Teacher only sees the review status (row 13). */
export function LocalContentEditor({ kind, item, data }: { kind: LocalContentKind; item?: LocalContent; data: TeachingData }) {
  const router = useRouter();
  const schoolId = useDemoSchoolId();
  const { teacherById } = useSchoolData(schoolId);
  const createLocalContent = useSaasStore((s) => s.createLocalContent);
  const updateLocalContent = useSaasStore((s) => s.updateLocalContent);
  const setLocalContentStatus = useSaasStore((s) => s.setLocalContentStatus);
  const removeLocalContent = useSaasStore((s) => s.removeLocalContent);

  const [form, setForm] = React.useState<FormState>(() => initialForm(item, data.classes.length === 1 ? [data.classes[0].id] : []));
  const [touched, setTouched] = React.useState<"none" | "draft" | "full">("none");
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  // Re-sync when the stored item changes status (e.g. withdrawn) so the form reflects the saved copy.
  const syncKey = item ? `${item.id}:${item.status}` : "new";
  const [lastKey, setLastKey] = React.useState(syncKey);
  if (syncKey !== lastKey) {
    setLastKey(syncKey);
    setForm(initialForm(item, []));
    setTouched("none");
  }

  const isMine = !item || item.authorId === data.teacherId;
  const readOnly = !!item && (item.status !== "DRAFT" || !isMine);
  const errors = touched === "none" ? {} : validate(kind, form, touched === "full");
  const err = (k: string) => errors[k] ?? null;

  const contexts = data.localContent.filter((c): c is LocalContext => c.kind === "CONTEXT" && c.status !== "TRASH" && c.id !== item?.id);
  const contextOptions = [{ value: NONE, label: "Không liên kết" }, ...contexts.map((c) => ({ value: c.id, label: c.title }))];

  const patchCtx = (p: Partial<CtxForm>) => setForm((f) => ({ ...f, ctx: { ...f.ctx, ...p } }));
  const patchChr = (p: Partial<ChrForm>) => setForm((f) => ({ ...f, chr: { ...f.chr, ...p } }));
  const patchQuiz = (p: Partial<QuizForm>) => setForm((f) => ({ ...f, quiz: { ...f.quiz, ...p } }));

  const persist = (status: "DRAFT" | "PENDING") => {
    const level = status === "PENDING" ? "full" : "draft";
    setTouched(level);
    const v = validate(kind, form, level === "full");
    const firstError = Object.values(v).find(Boolean);
    if (firstError) {
      toast.error(firstError);
      return;
    }
    const payload = toPayload(kind, form);
    if (!item) {
      const created = createLocalContent({ ...payload, schoolId, authorId: data.teacherId, status } as Omit<LocalContent, "id" | "createdAt" | "updatedAt">);
      toast.success(status === "PENDING" ? "Đã gửi quản trị trường duyệt" : "Đã lưu nháp");
      router.replace(ROUTES.TEACHING.LOCAL_EDIT(created.id));
      return;
    }
    updateLocalContent(item.id, { ...payload, ...(status === "PENDING" ? { reviewNote: undefined } : {}) } as Partial<LocalContent>);
    if (status === "PENDING") setLocalContentStatus(item.id, "PENDING");
    toast.success(status === "PENDING" ? "Đã gửi quản trị trường duyệt" : "Đã lưu nháp");
  };

  const withdraw = () => {
    if (!item) return;
    setLocalContentStatus(item.id, "DRAFT");
    toast.success("Đã rút lại, nội dung trở về bản nháp");
  };

  const duplicate = () => {
    if (!item) return;
    // The store assigns a fresh id / timestamps, so spreading the original is safe.
    const copy: LocalContent = { ...item, reviewNote: undefined, authorId: data.teacherId, status: "DRAFT" };
    if (copy.kind === "CHARACTER") copy.name = `${copy.name} (bản chỉnh sửa)`;
    else copy.title = `${copy.title} (bản chỉnh sửa)`;
    if (copy.kind === "QUIZ") copy.questions = copy.questions.map((q) => ({ ...q, options: [...q.options] }));
    copy.classIds = copy.classIds.filter((id) => data.classById.has(id));
    const created = createLocalContent(copy);
    toast.success("Đã tạo bản nháp mới từ nội dung này");
    router.push(ROUTES.TEACHING.LOCAL_EDIT(created.id));
  };

  return (
    <div className="space-y-6">
      <Link href={ROUTES.TEACHING.LOCAL} className="archive-link">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Lịch sử địa phương
      </Link>

      {item && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <LocalStatusBadge status={item.status} />
          <span className="text-content-muted">
            {LOCAL_KIND_LABELS[kind]} · Tạo {formatDate(item.createdAt)} · Cập nhật {formatDate(item.updatedAt)}
            {!isMine && ` · Soạn bởi ${teacherById.get(item.authorId)?.fullName ?? "đồng nghiệp"}`}
          </span>
        </div>
      )}

      {item?.reviewNote && (
        <div role="note" className="flex items-start gap-3 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] p-4">
          <MessageSquareWarning className="mt-0.5 h-5 w-5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-bold text-content-heading">Góp ý của quản trị trường</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{item.reviewNote}</p>
          </div>
        </div>
      )}

      {readOnly && (
        <p className="flex items-start gap-2 text-sm text-content-muted">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {isMine ? READONLY_NOTE[item!.status] : "Nội dung do đồng nghiệp soạn, bạn chỉ có thể xem."}
        </p>
      )}

      <fieldset disabled={readOnly} className="space-y-6">
        <Panel>
          {kind === "CONTEXT" && <ContextFields f={form.ctx} patch={patchCtx} err={err} />}
          {kind === "CHARACTER" && <CharacterFields f={form.chr} patch={patchChr} err={err} contextOptions={contextOptions} readOnly={readOnly} />}
          {kind === "QUIZ" && <QuizMetaFields f={form.quiz} patch={patchQuiz} err={err} contextOptions={contextOptions} readOnly={readOnly} />}
        </Panel>

        {kind === "QUIZ" && (
          <QuestionBuilder questions={form.quiz.questions} onChange={(questions) => patchQuiz({ questions })} err={err} readOnly={readOnly} />
        )}

        <Panel>
          <Field label="Lớp được xem" required error={err("classes")} hint="Sau khi được duyệt, chỉ học sinh các lớp này nhìn thấy nội dung.">
            <ClassCheckboxList classes={data.classes} value={form.classIds} onChange={(classIds) => setForm((f) => ({ ...f, classIds }))} disabled={readOnly} />
          </Field>
        </Panel>
      </fieldset>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--text-primary)] pt-4">
        <div>
          {item?.status === "DRAFT" && isMine && (
            <button type="button" className="btn-line text-[var(--accent-danger)]" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Xóa bản nháp
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {(!item || (item.status === "DRAFT" && isMine)) && (
            <>
              <button type="button" className="btn-line" onClick={() => persist("DRAFT")}>
                <Save className="h-4 w-4" aria-hidden="true" /> Lưu nháp
              </button>
              <button type="button" className="btn-crimson" onClick={() => persist("PENDING")}>
                <Send className="h-4 w-4" aria-hidden="true" /> Gửi duyệt
              </button>
            </>
          )}
          {item?.status === "PENDING" && isMine && (
            <button type="button" className="btn-ink" onClick={withdraw}>
              <Undo2 className="h-4 w-4" aria-hidden="true" /> Rút lại
            </button>
          )}
          {item && item.status !== "DRAFT" && item.status !== "PENDING" && (
            <button type="button" className="btn-crimson" onClick={duplicate}>
              <CopyPlus className="h-4 w-4" aria-hidden="true" /> Tạo bản chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {item && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          variant="danger"
          title="Xóa bản nháp?"
          description={`“${localTitle(item)}” sẽ bị xóa vĩnh viễn.`}
          confirmLabel="Xóa"
          onConfirm={() => {
            removeLocalContent(item.id);
            toast.success("Đã xóa bản nháp");
            router.push(ROUTES.TEACHING.LOCAL);
          }}
        />
      )}
    </div>
  );
}

/* ───────────────────────── Field groups ───────────────────────── */

type ErrFn = (k: string) => string | null;

function ContextFields({ f, patch, err }: { f: CtxForm; patch: (p: Partial<CtxForm>) => void; err: ErrFn }) {
  const y = Number(f.year);
  return (
    <div className="space-y-4">
      <Field label="Tên bối cảnh" required error={err("title")}>
        <StaffFormInput value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder="VD: Khởi nghĩa Nam Kỳ 1940 tại Hóc Môn" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Thời kỳ" required>
          <StaffFormSelect value={f.era} onValueChange={(era) => patch({ era })} options={LOCAL_ERA_OPTIONS} className="w-full" />
        </Field>
        <Field label="Năm" required error={err("year")} hint={f.year.trim() && isInt(f.year) ? `Hiển thị: năm ${formatYear(y)}` : "Số âm là trước Công nguyên (TCN)"} htmlFor="ctx-year">
          <StaffFormInput id="ctx-year" type="number" value={f.year} onChange={(e) => patch({ year: e.target.value })} placeholder="1940" />
        </Field>
        <Field label="Địa điểm" required error={err("location")}>
          <StaffFormInput value={f.location} onChange={(e) => patch({ location: e.target.value })} placeholder="Hóc Môn, TP. Hồ Chí Minh" />
        </Field>
      </div>
      <Field label="Tóm tắt" required error={err("summary")}>
        <StaffFormTextarea value={f.summary} onChange={(e) => patch({ summary: e.target.value })} className="min-h-[80px]" />
      </Field>
      <Field label="Nội dung" required error={err("body")}>
        <StaffFormTextarea value={f.body} onChange={(e) => patch({ body: e.target.value })} className="min-h-[220px] resize-y" />
      </Field>
      <Field label="Ảnh minh họa (URL)">
        <StaffFormInput type="url" value={f.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="https://..." />
      </Field>
      <Field label="Vị trí trên bản đồ" error={err("coords")} hint="Không bắt buộc. Có tọa độ thì nội dung hiện trên lớp bản đồ của lớp.">
        <div className="grid gap-3 sm:grid-cols-2">
          <StaffFormInput type="number" step="any" aria-label="Vĩ độ" value={f.latitude} onChange={(e) => patch({ latitude: e.target.value })} placeholder="Vĩ độ, VD 10.8865" />
          <StaffFormInput type="number" step="any" aria-label="Kinh độ" value={f.longitude} onChange={(e) => patch({ longitude: e.target.value })} placeholder="Kinh độ, VD 106.5944" />
        </div>
      </Field>
    </div>
  );
}

function CharacterFields({
  f,
  patch,
  err,
  contextOptions,
  readOnly,
}: {
  f: ChrForm;
  patch: (p: Partial<ChrForm>) => void;
  err: ErrFn;
  contextOptions: { value: string; label: string }[];
  readOnly: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên nhân vật" required error={err("name")}>
          <StaffFormInput value={f.name} onChange={(e) => patch({ name: e.target.value })} placeholder="VD: Phan Văn Hớn" />
        </Field>
        <Field label="Danh hiệu / vai trò" required error={err("chrTitle")}>
          <StaffFormInput value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder="Thủ lĩnh khởi nghĩa Hóc Môn 1885" />
        </Field>
      </div>
      <Field label="Năm sinh – năm mất" error={err("years")} hint="Số âm là TCN. Để trống nếu không rõ.">
        <div className="grid grid-cols-2 gap-3">
          <StaffFormInput type="number" aria-label="Năm sinh" value={f.bornYear} onChange={(e) => patch({ bornYear: e.target.value })} placeholder="Năm sinh" />
          <StaffFormInput type="number" aria-label="Năm mất" value={f.deathYear} onChange={(e) => patch({ deathYear: e.target.value })} placeholder="Năm mất" />
        </div>
      </Field>
      <Field label="Tiểu sử" required error={err("biography")}>
        <StaffFormTextarea value={f.biography} onChange={(e) => patch({ biography: e.target.value })} className="min-h-[140px] resize-y" />
      </Field>
      <Field label="Tính cách / giọng nói khi trò chuyện với AI" required error={err("persona")} hint="AI dùng mô tả này để nhập vai nhân vật khi học sinh trò chuyện.">
        <StaffFormTextarea
          value={f.persona}
          onChange={(e) => patch({ persona: e.target.value })}
          className="min-h-[100px]"
          placeholder="VD: Nói giọng Nam Bộ mộc mạc, khảng khái; xưng 'tui' với học trò."
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bối cảnh địa phương liên quan">
          <StaffFormSelect value={f.contextId} onValueChange={(contextId) => patch({ contextId })} options={contextOptions} className="w-full" disabled={readOnly} />
        </Field>
        <Field label="Ảnh chân dung (URL)">
          <StaffFormInput type="url" value={f.imageUrl} onChange={(e) => patch({ imageUrl: e.target.value })} placeholder="https://..." />
        </Field>
      </div>
    </div>
  );
}

function QuizMetaFields({
  f,
  patch,
  err,
  contextOptions,
  readOnly,
}: {
  f: QuizForm;
  patch: (p: Partial<QuizForm>) => void;
  err: ErrFn;
  contextOptions: { value: string; label: string }[];
  readOnly: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Tên bộ câu đố" required error={err("title")}>
        <StaffFormInput value={f.title} onChange={(e) => patch({ title: e.target.value })} placeholder="VD: Lịch sử Sài Gòn – Gia Định" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Mức độ" required>
          <StaffFormSelect
            value={f.level}
            onValueChange={(level) => patch({ level })}
            options={(Object.keys(LEVEL_LABELS) as Level[]).map((l) => ({ value: l, label: LEVEL_LABELS[l] }))}
            className="w-full"
            disabled={readOnly}
          />
        </Field>
        <Field label="Thời gian (phút)" required error={err("duration")} htmlFor="quiz-duration">
          <StaffFormInput id="quiz-duration" type="number" min={1} value={f.durationMinutes} onChange={(e) => patch({ durationMinutes: e.target.value })} />
        </Field>
        <Field label="Bối cảnh liên quan">
          <StaffFormSelect value={f.contextId} onValueChange={(contextId) => patch({ contextId })} options={contextOptions} className="w-full" disabled={readOnly} />
        </Field>
      </div>
    </div>
  );
}

/* ───────────────────────── Question builder ───────────────────────── */

const LETTERS = ["A", "B", "C", "D", "E", "F"];

function QuestionBuilder({
  questions,
  onChange,
  err,
  readOnly,
}: {
  questions: LocalQuizQuestion[];
  onChange: (q: LocalQuizQuestion[]) => void;
  err: ErrFn;
  readOnly: boolean;
}) {
  const update = (i: number, patch: Partial<LocalQuizQuestion>) => onChange(questions.map((q, k) => (k === i ? { ...q, ...patch } : q)));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= questions.length) return;
    const next = [...questions];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <SectionHeading
        title={`Câu hỏi (${questions.length})`}
        description="Mỗi câu có 2–6 phương án và đúng một đáp án đúng."
        actions={
          !readOnly && (
            <button type="button" className="btn-ink" onClick={() => onChange([...questions, blankQuestion()])}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Thêm câu hỏi
            </button>
          )
        }
      />
      {err("questions") && <p className="text-sm text-[var(--accent-danger)]">{err("questions")}</p>}
      {questions.length === 0 && !err("questions") && <p className="text-sm text-content-muted">Chưa có câu hỏi nào.</p>}
      <ol className="space-y-4">
        {questions.map((q, i) => {
          const e = err(`q-${q.id}`);
          return (
            <li key={q.id}>
              <Panel className={cn("space-y-3", e && "border-[var(--accent-danger)]")}>
                <div className="flex items-center justify-between gap-2">
                  <p className="archive-title is-plain text-lg">Câu {i + 1}</p>
                  {!readOnly && (
                    <div className="flex items-center">
                      <IconAction label={`Đưa câu ${i + 1} lên`} onClick={() => move(i, -1)} disabled={i === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </IconAction>
                      <IconAction label={`Đưa câu ${i + 1} xuống`} onClick={() => move(i, 1)} disabled={i === questions.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </IconAction>
                      <IconAction label={`Xóa câu ${i + 1}`} tone="danger" onClick={() => onChange(questions.filter((_, k) => k !== i))}>
                        <Trash2 className="h-4 w-4" />
                      </IconAction>
                    </div>
                  )}
                </div>
                <StaffFormTextarea
                  aria-label={`Nội dung câu ${i + 1}`}
                  value={q.prompt}
                  onChange={(ev) => update(i, { prompt: ev.target.value })}
                  placeholder="Nội dung câu hỏi"
                  className="min-h-[64px]"
                />
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                    Phương án · chọn đáp án đúng
                  </legend>
                  {q.options.map((opt, k) => (
                    <div key={k} className="flex items-center gap-2">
                      <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-bold">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctIndex === k}
                          onChange={() => update(i, { correctIndex: k })}
                          className="h-4 w-4 accent-[var(--jade)]"
                          aria-label={`Phương án ${LETTERS[k]} là đáp án đúng`}
                        />
                        <span className={q.correctIndex === k ? "text-[var(--jade)]" : "text-content-muted"}>{LETTERS[k]}</span>
                      </label>
                      <StaffFormInput
                        aria-label={`Phương án ${LETTERS[k]}`}
                        value={opt}
                        onChange={(ev) => update(i, { options: q.options.map((o, m) => (m === k ? ev.target.value : o)) })}
                        className={cn("flex-1", q.correctIndex === k && "border-[var(--jade)]")}
                      />
                      {!readOnly && (
                        <IconAction
                          label={`Xóa phương án ${LETTERS[k]}`}
                          disabled={q.options.length <= 2}
                          onClick={() =>
                            update(i, {
                              options: q.options.filter((_, m) => m !== k),
                              correctIndex: q.correctIndex === k ? 0 : q.correctIndex > k ? q.correctIndex - 1 : q.correctIndex,
                            })
                          }
                        >
                          <X className="h-4 w-4" />
                        </IconAction>
                      )}
                    </div>
                  ))}
                  {!readOnly && q.options.length < 6 && (
                    <button type="button" className="archive-link" onClick={() => update(i, { options: [...q.options, ""] })}>
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Thêm phương án
                    </button>
                  )}
                </fieldset>
                <StaffFormInput
                  aria-label={`Giải thích câu ${i + 1}`}
                  value={q.explanation ?? ""}
                  onChange={(ev) => update(i, { explanation: ev.target.value })}
                  placeholder="Giải thích đáp án (không bắt buộc)"
                />
                {e && <p className="text-xs text-[var(--accent-danger)]">{e}</p>}
              </Panel>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
