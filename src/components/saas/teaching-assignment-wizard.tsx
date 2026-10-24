"use client";

import * as React from "react";
import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Eye, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { Field, Panel, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import {
  ASSIGNMENT_TYPES,
  ASSIGNMENT_TYPE_META,
  formatDuration,
  fromDateTimeInput,
  isPastDeadline,
} from "@/components/saas/teacher-class-assignments";
import { TargetPreviewDrawer, yearText, type PreviewTarget } from "@/components/saas/teaching-target-preview";
import { ROUTES } from "@/constants/routes";
import { useCharacters } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import { useQuizSets } from "@/features/quiz/hooks";
import { localKeys, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { localQuizService } from "@/services/local-quiz.service";
import { isHidden, type LocalItem } from "@/services/local-content.service";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { useCreateAssignment } from "@/features/saas/hooks-assignment-api";
import type { AssignmentType } from "@/services/assignment.service";
import type { ApiClassroom } from "@/services/school.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils/cn";

/**
 * Form "Giao bài tập" tren API that (POST /teacher/assignments).
 * Moi lan giao = 1 lop + 1 noi dung (boi canh / nhan vat / quiz) + han nop + yeu cau toi thieu.
 */

type Target = PreviewTarget;

/** Mac dinh cua BE khi bo trong minRequirement (TeacherAssignmentServiceImpl). */
const DEFAULT_MIN: Record<AssignmentType, number | null> = {
  AI_CHAT_ROLEPLAY: 5,
  CONTEXT_READING: 180,
  QUIZ_TEST: null,
};

const LEVEL_LABELS = { EASY: "Dễ", MEDIUM: "Trung bình", HARD: "Khó" } as const;

const defaultDeadline = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  d.setHours(23, 59, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function AssignmentWizard({
  classes,
  initialClassId,
  initialType,
  initialSource,
  initialTargetId,
}: {
  classes: ApiClassroom[];
  initialClassId?: string | null;
  initialType?: AssignmentType | null;
  initialSource?: TargetSource | null;
  /** Bo de vua soan xong (quay lai tu trinh soan) se duoc chon san. */
  initialTargetId?: string | null;
}) {
  const router = useRouter();
  const create = useCreateAssignment();

  const [classId, setClassId] = React.useState(
    initialClassId && classes.some((c) => c.id === initialClassId) ? initialClassId : classes.length === 1 ? classes[0].id : "",
  );
  const [type, setType] = React.useState<AssignmentType | null>(initialType ?? null);
  const [source, setSource] = React.useState<TargetSource>(initialSource ?? "mine");
  const [target, setTarget] = React.useState<Target | null>(null);
  const [previewing, setPreviewing] = React.useState(false);
  // Trang soan bo de them &targetId= khi quay lai.
  const returnTo = `${ROUTES.TEACHING.ASSIGNMENT_NEW}?${new URLSearchParams({ ...(classId && { classId }), type: "QUIZ_TEST", source: "mine" })}`;
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [deadline, setDeadline] = React.useState(defaultDeadline);
  const [minRequirement, setMinRequirement] = React.useState("");
  const [touched, setTouched] = React.useState(false);

  const chooseTarget = (t: Target) => {
    const prefix = type === "CONTEXT_READING" ? "Đọc: " : type === "AI_CHAT_ROLEPLAY" ? "Trò chuyện với " : "Kiểm tra: ";
    const autoPrevious = target ? `${prefix}${target.title}` : "";
    if (!title.trim() || title === autoPrevious) setTitle(`${prefix}${t.title}`.slice(0, 255));
    setTarget(t);
  };

  const deadlineValue = fromDateTimeInput(deadline);
  const min = minRequirement.trim() === "" ? null : Number(minRequirement);
  const errors = {
    classId: classId ? null : "Chọn lớp",
    type: type ? null : "Chọn loại bài",
    target: target ? null : "Chọn nội dung để giao",
    title: title.trim().length < 3 ? "Tên bài từ 3 đến 255 ký tự" : title.trim().length > 255 ? "Tên bài tối đa 255 ký tự" : null,
    deadline: !deadlineValue ? "Chọn hạn nộp" : isPastDeadline(deadlineValue) ? "Hạn nộp phải ở tương lai" : null,
    minRequirement: type !== "QUIZ_TEST" && min !== null && !(Number.isInteger(min) && min > 0) ? "Nhập số nguyên lớn hơn 0" : null,
  };
  const firstError = Object.values(errors).find(Boolean) ?? null;

  const submit = () => {
    setTouched(true);
    if (firstError || !type || !target) return;
    create.mutate(
      {
        classId,
        title: title.trim(),
        description: description.trim() || undefined,
        assignmentType: type,
        targetId: target.id,
        deadline: deadlineValue,
        minRequirement: type !== "QUIZ_TEST" && min !== null ? min : undefined,
      },
      {
        onSuccess: (created) => {
          toast.success(`Đã giao bài cho lớp ${created.className ?? classes.find((c) => c.id === classId)?.className ?? ""}`, {
            description: `${created.totalStudents} học sinh được giao bài.`,
          });
          router.push(ROUTES.TEACHING.ASSIGNMENT_DETAIL(created.assignmentId));
        },
        onError: (err) => toast.error(apiErrorMessage(err, "Không giao được bài tập.")),
      },
    );
  };

  const show = (e: string | null) => (touched ? e : null);

  return (
    <div className="space-y-6">
      <Panel>
        <h2 className="archive-title is-plain text-xl">1. Lớp & loại bài</h2>
        <Field label="Giao cho lớp" required error={show(errors.classId)}>
          <StaffFormSelect
            value={classId}
            onValueChange={setClassId}
            placeholder="Chọn lớp"
            options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.className} · ${c.studentCount} học sinh` }))}
            className="w-full sm:w-[320px]"
          />
        </Field>
        <Field label="Loại bài tập" required error={show(errors.type)}>
          <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Loại bài tập">
            {ASSIGNMENT_TYPES.map((t) => {
              const meta = ASSIGNMENT_TYPE_META[t];
              const Icon = meta.icon;
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    if (type !== t) {
                      setTarget(null);
                      setMinRequirement("");
                    }
                    setType(t);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-sm border p-4 text-left transition-colors",
                    active ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-[var(--accent-gold)]" : meta.color)} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-content-heading">{meta.label}</span>
                    <span className="block text-sm text-content-muted">{meta.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Field>
      </Panel>

      {type && (
        <Panel>
          <h2 className="archive-title is-plain text-xl">2. Nội dung: {ASSIGNMENT_TYPE_META[type].target.toLowerCase()}</h2>
          {target && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span>
                Đã chọn: <span className="font-semibold text-[var(--accent-gold)]">{target.title}</span>
              </span>
              {target.preview && (
                <button type="button" className="archive-link" onClick={() => setPreviewing(true)}>
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Xem chi tiết
                </button>
              )}
            </p>
          )}
          <TargetPreviewDrawer target={previewing ? target : null} onClose={() => setPreviewing(false)} selected />
          <TargetPicker
            type={type}
            source={source}
            onSourceChange={setSource}
            selected={target}
            onSelect={chooseTarget}
            returnTo={returnTo}
            preselectId={initialTargetId}
          />
          {show(errors.target) && <p className="text-[11px] text-[var(--accent-danger)]">{errors.target}</p>}
        </Panel>
      )}

      {type && (
        <Panel>
          <h2 className="archive-title is-plain text-xl">3. Thông tin bài</h2>
          <Field label="Tên bài tập" required error={show(errors.title)} hint="3–255 ký tự.">
            <StaffFormInput value={title} maxLength={255} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Mô tả / lời dặn cho học sinh">
            <StaffFormTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="VD: Đọc kỹ bối cảnh và chuẩn bị câu hỏi thảo luận."
              className="min-h-[100px]"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Hạn nộp" required error={show(errors.deadline)} hint="Phải ở tương lai. Học sinh nộp sau hạn sẽ bị tính nộp muộn." htmlFor="as-due">
              <StaffFormInput id="as-due" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </Field>
            {type === "AI_CHAT_ROLEPLAY" && (
              <Field
                label="Số tin nhắn tối thiểu"
                error={show(errors.minRequirement)}
                hint={`Để trống = ${DEFAULT_MIN.AI_CHAT_ROLEPLAY} tin nhắn (mặc định của hệ thống).`}
                htmlFor="as-min"
              >
                <StaffFormInput id="as-min" type="number" min={1} step={1} value={minRequirement} onChange={(e) => setMinRequirement(e.target.value)} placeholder={String(DEFAULT_MIN.AI_CHAT_ROLEPLAY)} />
              </Field>
            )}
            {type === "CONTEXT_READING" && (
              <Field
                label="Thời gian đọc tối thiểu (giây)"
                error={show(errors.minRequirement)}
                hint={
                  min && min > 0
                    ? `= ${formatDuration(min)}`
                    : `Để trống = ${DEFAULT_MIN.CONTEXT_READING} giây (${formatDuration(DEFAULT_MIN.CONTEXT_READING)}, mặc định của hệ thống).`
                }
                htmlFor="as-min"
              >
                <StaffFormInput id="as-min" type="number" min={1} step={1} value={minRequirement} onChange={(e) => setMinRequirement(e.target.value)} placeholder={String(DEFAULT_MIN.CONTEXT_READING)} />
              </Field>
            )}
          </div>
          {type === "QUIZ_TEST" && <p className="text-xs text-content-muted">Bài kiểm tra được hệ thống tự chấm theo thang 10, không có yêu cầu tối thiểu.</p>}
        </Panel>
      )}

      {touched && firstError && <p className="text-sm text-[var(--accent-danger)]">{firstError}</p>}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="btn-line">
          Hủy
        </Link>
        <button type="button" className="btn-crimson" onClick={submit} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
          Giao bài
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Target pickers ───────────────────────── */

/** mine = tu soan; school = giao vien khac chia se toan truong; library = HistoryTalk. "school" cu tren URL van hop le. */
export type TargetSource = "mine" | "school" | "library";

const SOURCE_TABS: { value: TargetSource; label: string; hint: string }[] = [
  { value: "mine", label: "Chỉ mình tôi", hint: "Nội dung bạn tự soạn trong Soạn tư liệu." },
  { value: "school", label: "Trường của tôi", hint: "Do giáo viên khác trong trường soạn và chia sẻ toàn trường. Bạn giao được nhưng không sửa được." },
  { value: "library", label: "HistoryTalk", hint: "Nội dung có sẵn do HistoryTalk biên soạn." },
];

/** Ba nguon noi dung tach rieng: cua toi, cua giao vien khac trong truong, thu vien HistoryTalk. */
function SourceTabs({ value, onChange }: { value: TargetSource; onChange: (v: TargetSource) => void }) {
  return (
    <div className="space-y-1.5">
      <div role="tablist" aria-label="Nguồn nội dung" className="flex flex-wrap rounded-sm border border-border-card sm:inline-flex">
        {SOURCE_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={value === t.value}
            onClick={() => onChange(t.value)}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-semibold transition-colors sm:flex-none",
              value === t.value ? "bg-[var(--text-primary)] text-[var(--bg-surface)]" : "text-content-heading hover:bg-[var(--status-neutral-bg)]",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-content-muted">{SOURCE_TABS.find((t) => t.value === value)?.hint}</p>
    </div>
  );
}

function TargetList({ options, selected, onSelect }: { options: Target[]; selected: Target | null; onSelect: (t: Target) => void }) {
  const [search, setSearch] = React.useState("");
  const [previewing, setPreviewing] = React.useState<Target | null>(null);
  const q = normalizeText(search);
  const shown = q ? options.filter((o) => normalizeText(`${o.title} ${o.meta ?? ""}`).includes(q)) : options;
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, năm, địa điểm..." className="sm:w-[340px]" />
        <p className="text-xs text-content-muted">{q ? `${shown.length} / ${options.length} kết quả` : `${options.length} nội dung`}</p>
      </div>
      <ul role="radiogroup" aria-label="Nội dung" className="max-h-96 divide-y divide-[var(--border-default)] overflow-y-auto rounded-sm border border-[var(--border-strong)]">
        {shown.length === 0 && <li className="p-3 text-sm text-content-muted">Không tìm thấy nội dung phù hợp.</li>}
        {shown.map((o) => {
          const active = selected?.id === o.id;
          return (
            <li key={o.id} className={cn("flex items-center", active ? "bg-[var(--accent-gold-active-bg)]" : "hover:bg-[var(--status-neutral-bg)]")}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(o)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-sm"
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]" : "border-border-card",
                  )}
                  aria-hidden="true"
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-content-heading">{o.title}</span>
                  {o.meta && <span className="block truncate text-xs text-content-muted">{o.meta}</span>}
                </span>
              </button>
              {o.preview && (
                <button
                  type="button"
                  onClick={() => setPreviewing(o)}
                  className="mr-2 inline-flex shrink-0 items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs font-semibold text-content-heading hover:bg-[var(--bg-main)] hover:text-[var(--accent-gold)]"
                  aria-label={`Xem chi tiết ${o.title}`}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Xem
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <TargetPreviewDrawer
        target={previewing}
        onClose={() => setPreviewing(null)}
        selected={Boolean(previewing && selected?.id === previewing.id)}
        onSelect={previewing ? () => onSelect(previewing) : undefined}
      />
    </div>
  );
}

type PickerProps = { selected: Target | null; onSelect: (t: Target) => void };

function ApiState({ loading, error, children }: { loading: boolean; error: unknown; children: React.ReactNode }) {
  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-content-muted">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" /> Đang tải nội dung...
      </p>
    );
  if (error) return <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(error, "Không tải được nội dung. Thử lại sau.")}</p>;
  return <>{children}</>;
}

/** Empty state chung cho noi dung cua truong: noi ro can lam gi va dan toi Kho tu lieu. */
function SchoolEmpty({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-content-heading">{title}</p>
        <p className="mt-1 text-sm text-content-muted">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** BE chi cho giao noi dung cua truong khi da xuat ban (TeacherAssignmentServiceImpl). */
const usableLocal = (item: LocalItem) => item.isPublished && !isHidden(item);

/** Noi dung cua truong do chinh giao vien dang dang nhap soan? */
function useIsMine() {
  const user = useAuthStore((s) => s.user);
  return React.useCallback(
    (createdBy: string | { uid?: string; userName?: string } | null | undefined) => {
      if (!user || !createdBy) return false;
      if (typeof createdBy === "string") return createdBy === user.uid || createdBy === user.userName;
      return createdBy.uid === user.uid;
    },
    [user],
  );
}

export function TargetPicker({
  type,
  source,
  onSourceChange,
  selected,
  onSelect,
  returnTo,
  preselectId,
}: PickerProps & {
  type: AssignmentType;
  source: TargetSource;
  onSourceChange: (s: TargetSource) => void;
  /** URL cua trang giao bai, de trinh soan bo de quay lai dung cho. */
  returnTo: string;
  /** ?targetId= khi quay lai tu trinh soan bo de. */
  preselectId?: string | null;
}) {
  const owner = source === "mine" ? "mine" : "others";
  return (
    <div className="space-y-4">
      <SourceTabs value={source} onChange={onSourceChange} />
      {source !== "library" ? (
        type === "QUIZ_TEST" ? (
          <SchoolQuizPicker key={owner} owner={owner} selected={selected} onSelect={onSelect} returnTo={returnTo} preselectId={preselectId} />
        ) : (
          <SchoolItemPicker key={owner} owner={owner} kind={type === "CONTEXT_READING" ? "CONTEXT" : "CHARACTER"} selected={selected} onSelect={onSelect} />
        )
      ) : type === "CONTEXT_READING" ? (
        <ContextPicker selected={selected} onSelect={onSelect} />
      ) : type === "AI_CHAT_ROLEPLAY" ? (
        <CharacterPicker selected={selected} onSelect={onSelect} />
      ) : (
        <QuizPicker selected={selected} onSelect={onSelect} />
      )}
    </div>
  );
}

type Owner = "mine" | "others";

/** Boi canh / nhan vat cua truong (GET /teacher/local-contents/...), chi ban da xuat ban. */
function SchoolItemPicker({ kind, owner, selected, onSelect }: PickerProps & { kind: "CONTEXT" | "CHARACTER"; owner: Owner }) {
  const local = useTeacherLocalContent();
  const isMine = useIsMine();
  const all = (kind === "CONTEXT" ? local.contexts : local.characters).filter((item) => isMine(item.createdBy) === (owner === "mine"));
  const usable = all.filter(usableLocal);
  const drafts = all.length - usable.length;
  const noun = kind === "CONTEXT" ? "bối cảnh" : "nhân vật";
  const options: Target[] = usable.map((item) => ({
    id: item.id,
    title: item.name,
    meta: (kind === "CONTEXT"
      ? [yearText(item.year, item.isBC), item.location]
      : [item.title]
    )
      .concat(owner === "others" ? [item.createdBy?.fullName || item.createdBy?.userName] : [])
      .filter(Boolean)
      .join(" · "),
    preview: { kind: "local", item },
  }));

  return (
    <ApiState loading={local.isLoading} error={local.isError ? local.error : null}>
      {options.length === 0 ? (
        owner === "mine" ? (
          <SchoolEmpty
            title={`Bạn chưa có ${noun} nào đã xuất bản`}
            description={
              drafts > 0
                ? `Có ${drafts} ${noun} đang là nháp hoặc bị ẩn. Xuất bản trong Kho tư liệu để giao cho lớp.`
                : `Soạn ${noun} trong Kho tư liệu, hoặc chọn ở tab Giáo viên trong trường / Thư viện HistoryTalk.`
            }
            action={
              <Link href={ROUTES.TEACHING.LOCAL_NEW(kind)} className="btn-line" target="_blank">
                <Plus className="h-4 w-4" aria-hidden="true" /> Soạn {noun} mới
              </Link>
            }
          />
        ) : (
          <SchoolEmpty
            title={`Chưa có giáo viên nào chia sẻ ${noun}`}
            description={`Khi giáo viên khác trong trường xuất bản ${noun} ở phạm vi toàn trường, ${noun} sẽ hiện ở đây.`}
          />
        )
      ) : (
        <div className="space-y-2">
          <TargetList options={options} selected={selected} onSelect={onSelect} />
          {owner === "mine" && drafts > 0 && <p className="text-xs text-content-muted">{drafts} {noun} nháp / bị ẩn không hiện ở đây.</p>}
        </div>
      )}
    </ApiState>
  );
}

/**
 * Bo de cua truong: moi bo de gan voi mot boi canh cua truong
 * (POST /teacher/local-contents/contexts/{contextId}/quizzes). Ban nhap cua minh hien rieng de soan tiep.
 */
function SchoolQuizPicker({
  owner,
  selected,
  onSelect,
  returnTo,
  preselectId,
}: PickerProps & { owner: Owner; returnTo: string; preselectId?: string | null }) {
  const local = useTeacherLocalContent();
  const isMine = useIsMine();
  const results = useQueries({
    queries: local.contexts.map((c) => ({
      queryKey: localKeys.contextQuizzes(c.id),
      queryFn: () => localQuizService.listForContext(c.id),
    })),
  });
  const loading = local.isLoading || results.some((r) => r.isLoading);
  const quizzes = results.flatMap((r) => r.data?.items ?? []).filter((z) => isMine(z.createdBy) === (owner === "mine"));
  const published = quizzes.filter((z) => z.isPublished);
  const drafts = owner === "mine" ? quizzes.filter((z) => !z.isPublished) : [];
  const options: Target[] = published.map((z) => ({
    id: z.quizId,
    title: z.title,
    meta: [LEVEL_LABELS[z.level], `${z.questions.length} câu`, z.contextTitle].filter(Boolean).join(" · "),
    preview: { kind: "localQuiz", quiz: z },
  }));

  // Quay lai tu trinh soan bo de: tu chon bo de vua soan.
  const preselected = React.useRef(false);
  React.useEffect(() => {
    if (preselected.current || !preselectId || selected) return;
    const hit = options.find((o) => o.id === preselectId);
    if (hit) {
      preselected.current = true;
      onSelect(hit);
    }
  }, [options, preselectId, selected, onSelect]);

  return (
    <ApiState loading={loading} error={local.isError ? local.error : null}>
      <div className="space-y-4">
        {owner === "mine" && <NewQuizForm contexts={local.contexts} returnTo={returnTo} />}
        {options.length > 0 ? (
          <TargetList options={options} selected={selected} onSelect={onSelect} />
        ) : owner === "mine" ? (
          local.contexts.length > 0 && <p className="text-sm text-content-muted">Bạn chưa có bộ đề nào đã xuất bản.</p>
        ) : (
          <SchoolEmpty
            title="Chưa có giáo viên nào chia sẻ bộ đề"
            description="Bộ đề giáo viên khác trong trường xuất bản sẽ hiện ở đây."
          />
        )}
        {drafts.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-content-subtle">Bản nháp — xuất bản để giao được</p>
            <ul className="divide-y divide-[var(--border-default)] rounded-sm border border-dashed border-[var(--border-strong)]">
              {drafts.map((z) => (
                <li key={z.quizId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-content-heading">{z.title}</span>
                    <span className="block text-xs text-content-muted">
                      {z.questions.length} câu · {z.contextTitle}
                    </span>
                  </span>
                  <Link href={`${ROUTES.TEACHING.LOCAL_QUIZ(z.quizId)}?returnTo=${encodeURIComponent(`${returnTo}&targetId=${z.quizId}`)}`} className="archive-link shrink-0">
                    Soạn tiếp <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ApiState>
  );
}

/** Soan bo de moi o trang rieng (cau hoi soan truoc, BE bat buoc >= 1 cau), xong quay lai day. */
function NewQuizForm({ contexts, returnTo }: { contexts: LocalItem[]; returnTo: string }) {
  if (contexts.length === 0) {
    return (
      <SchoolEmpty
        title="Cần một bối cảnh của trường để soạn bộ đề"
        description="Bộ đề của trường luôn gắn với một bối cảnh trong Kho tư liệu. Tạo bối cảnh trước, hoặc chọn bộ đề có sẵn ở tab HistoryTalk."
        action={
          <Link href={ROUTES.TEACHING.LOCAL_NEW("CONTEXT")} className="btn-line" target="_blank">
            <Plus className="h-4 w-4" aria-hidden="true" /> Tạo bối cảnh
          </Link>
        }
      />
    );
  }
  return (
    <Link href={ROUTES.TEACHING.LOCAL_QUIZ_NEW({ returnTo })} className="btn-ink">
      <Plus className="h-4 w-4" aria-hidden="true" /> Soạn bộ đề mới
    </Link>
  );
}

/** GET /historical-contexts */
function ContextPicker({ selected, onSelect }: PickerProps) {
  const q = useEvents({ page: 1, limit: 100 });
  const options: Target[] = (q.data?.content ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    meta: [e.yearLabel ?? (e.year ? (e.year < 0 ? `${-e.year} TCN` : String(e.year)) : null), e.location].filter(Boolean).join(" · "),
    preview: { kind: "event", id: e.id },
  }));
  return (
    <ApiState loading={q.isLoading} error={q.isError ? q.error : null}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}

/** GET /characters */
function CharacterPicker({ selected, onSelect }: PickerProps) {
  const q = useCharacters({ page: 1, limit: 100 });
  const options: Target[] = (q.data?.content ?? []).map((c) => ({ id: c.id, title: c.name, meta: c.title, preview: { kind: "character", id: c.id } }));
  return (
    <ApiState loading={q.isLoading} error={q.isError ? q.error : null}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}

/** GET /quizzes — bo de HistoryTalk (Content Admin soan). */
function QuizPicker({ selected, onSelect }: PickerProps) {
  const q = useQuizSets();
  const options: Target[] = (q.data?.content ?? []).map((z) => ({
    id: z.quizId,
    title: z.title,
    meta: [LEVEL_LABELS[z.level], z.contextTitle].filter(Boolean).join(" · "),
    preview: { kind: "quiz", quiz: z },
  }));
  return (
    <ApiState loading={q.isLoading} error={q.isError ? q.error : null}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}
