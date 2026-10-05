"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Check, ClipboardCheck, Loader2, MessagesSquare } from "lucide-react";
import { toast } from "sonner";

import { StaffFormInput, StaffFormTextarea } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Panel, SearchInput, normalizeText } from "@/components/saas/saas-ui";
import { AssignmentTypeBadge, ClassCheckboxList, SegmentedFilter } from "@/components/saas/teaching-ui";
import { ROUTES } from "@/constants/routes";
import { useCharacters } from "@/features/characters/hooks";
import { useEvents } from "@/features/events/hooks";
import { useQuizSets } from "@/features/quiz/hooks";
import {
  ASSIGNMENT_TYPE_HINTS,
  ASSIGNMENT_TYPE_LABELS,
  DAY_MS,
  KIND_FOR_TYPE,
  LEVEL_LABELS,
  LOCAL_KIND_LABELS,
  TODAY,
  formatDateTime,
  formatYear,
  fromDatetimeLocal,
  localTitle,
  toDatetimeLocal,
  type TeachingData,
} from "@/features/saas/hooks-teaching";
import { useSaasStore } from "@/features/saas/store";
import type { AssignmentSource, AssignmentType } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

interface Target {
  source: AssignmentSource;
  id: string;
  title: string;
  meta?: string;
}

interface Details {
  title: string;
  instructions: string;
  openAt: string;
  dueAt: string;
  minMessages: string;
  maxScore: string;
  graded: boolean;
  allowLate: boolean;
}

const STEPS = ["Lớp", "Loại bài", "Nội dung", "Thông tin", "Xác nhận"] as const;
const TYPES: AssignmentType[] = ["EVENT", "CHAT", "TEST"];
const TYPE_ICON = { EVENT: BookOpenText, CHAT: MessagesSquare, TEST: ClipboardCheck } as const;

const defaultDue = () => {
  const d = new Date(TODAY.getTime() + 7 * DAY_MS);
  d.setHours(23, 59, 0, 0);
  return toDatetimeLocal(d);
};

/** Five-step "Giao bài tập" flow (Role Matrix row 16). One assignment is created per chosen class. */
export function AssignmentWizard({
  data,
  initialClassId,
  initialType,
}: {
  data: TeachingData;
  initialClassId?: string | null;
  initialType?: AssignmentType | null;
}) {
  const router = useRouter();
  const createAssignment = useSaasStore((s) => s.createAssignment);

  const [step, setStep] = React.useState(0);
  const [classIds, setClassIds] = React.useState<string[]>(initialClassId && data.classById.has(initialClassId) ? [initialClassId] : []);
  const [type, setType] = React.useState<AssignmentType | null>(initialType ?? null);
  const [source, setSource] = React.useState<AssignmentSource>("LOCAL");
  const [target, setTarget] = React.useState<Target | null>(null);
  const [details, setDetails] = React.useState<Details>(() => ({
    title: "",
    instructions: "",
    openAt: toDatetimeLocal(TODAY),
    dueAt: defaultDue(),
    minMessages: "5",
    maxScore: "10",
    graded: true,
    allowLate: false,
  }));
  const [touched, setTouched] = React.useState(false);

  const localOptions = React.useMemo(() => {
    if (!type) return [];
    const kind = KIND_FOR_TYPE[type];
    return data.localContent.filter(
      (c) => c.kind === kind && c.status === "PUBLISHED" && classIds.length > 0 && classIds.every((id) => c.classIds.includes(id)),
    );
  }, [data.localContent, type, classIds]);

  const chooseTarget = (t: Target) => {
    setTarget(t);
    setDetails((d) => {
      const prefix = type === "EVENT" ? "Đọc: " : type === "CHAT" ? "Trò chuyện với " : "Kiểm tra: ";
      const autoPrevious = target ? `${prefix}${target.title}` : "";
      return !d.title.trim() || d.title === autoPrevious ? { ...d, title: `${prefix}${t.title}` } : d;
    });
  };

  // ── Validation per step ──
  const openIso = fromDatetimeLocal(details.openAt);
  const dueIso = fromDatetimeLocal(details.dueAt);
  const detailErrors = {
    title: details.title.trim() ? null : "Nhập tên bài tập",
    openAt: openIso ? null : "Chọn thời điểm mở",
    dueAt: !dueIso ? "Chọn hạn nộp" : openIso && dueIso <= openIso ? "Hạn nộp phải sau thời điểm mở" : null,
    minMessages: type === "CHAT" && !(Number(details.minMessages) >= 1 && Number.isInteger(Number(details.minMessages))) ? "Tối thiểu 1 tin nhắn" : null,
    maxScore: type === "TEST" && !(Number(details.maxScore) > 0 && Number(details.maxScore) <= 100) ? "Điểm tối đa từ 1 đến 100" : null,
  };
  const stepError = [
    classIds.length ? null : "Chọn ít nhất một lớp.",
    type ? null : "Chọn loại bài tập.",
    target ? null : "Chọn nội dung để giao.",
    Object.values(detailErrors).find(Boolean) ?? null,
    null,
  ][step];

  const next = () => {
    setTouched(true);
    if (stepError) return;
    setTouched(false);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    setTouched(false);
    setStep((s) => Math.max(0, s - 1));
  };

  const submit = () => {
    if (!type || !target || !openIso || !dueIso) return;
    const created = classIds.map((classId) =>
      createAssignment({
        classId,
        teacherId: data.teacherId,
        type,
        source: target.source,
        targetId: target.id,
        targetTitle: target.title,
        title: details.title.trim(),
        instructions: details.instructions.trim(),
        openAt: openIso,
        dueAt: dueIso,
        minMessages: type === "CHAT" ? Number(details.minMessages) : undefined,
        maxScore: type === "TEST" ? Number(details.maxScore) : undefined,
        graded: type === "TEST" ? details.graded : undefined,
        allowLate: details.allowLate,
      }),
    );
    const names = classIds.map((id) => data.classById.get(id)?.name).join(", ");
    toast.success(created.length > 1 ? `Đã giao bài cho ${created.length} lớp: ${names}` : `Đã giao bài cho lớp ${names}`);
    router.push(created.length === 1 ? ROUTES.TEACHING.ASSIGNMENT_DETAIL(created[0].id) : ROUTES.TEACHING.ASSIGNMENTS);
  };

  return (
    <div className="space-y-6">
      <Link href={ROUTES.TEACHING.ASSIGNMENTS} className="archive-link">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Bài tập đã giao
      </Link>

      <ol className="grid grid-cols-5 border-y border-[var(--text-primary)]" aria-label="Các bước giao bài">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex flex-col items-center gap-1 px-1 py-2 text-center text-[11px] font-bold sm:flex-row sm:justify-center sm:gap-2 sm:text-xs",
              i === step ? "text-[var(--accent-gold)]" : i < step ? "text-[var(--text-primary)]" : "text-content-subtle",
            )}
          >
            <span
              className={cn(
                "grid h-6 w-6 shrink-0 place-items-center rounded-[2px] border text-[11px] tabular-nums",
                i === step
                  ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-white"
                  : i < step
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                    : "border-[var(--border-strong)]",
              )}
            >
              {i < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span className="hidden min-[420px]:inline">{label}</span>
          </li>
        ))}
      </ol>

      <Panel>
        {step === 0 && (
          <Field label="Giao cho lớp" required hint="Chọn nhiều lớp để tạo một bài riêng cho mỗi lớp (theo dõi tiến độ riêng).">
            <ClassCheckboxList
              classes={data.classes}
              value={classIds}
              onChange={(ids) => {
                setClassIds(ids);
                if (target?.source === "LOCAL") setTarget(null);
              }}
            />
          </Field>
        )}

        {step === 1 && (
          <div className="space-y-2" role="radiogroup" aria-label="Loại bài tập">
            {TYPES.map((t) => {
              const Icon = TYPE_ICON[t];
              const active = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    if (type !== t) setTarget(null);
                    setType(t);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-[2px] border p-4 text-left transition-colors",
                    active ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
                  )}
                >
                  <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", active ? "text-[var(--accent-gold)]" : "text-[var(--text-secondary)]")} aria-hidden="true" />
                  <span>
                    <span className="block font-semibold text-content-heading">{ASSIGNMENT_TYPE_LABELS[t]}</span>
                    <span className="block text-sm text-content-muted">{ASSIGNMENT_TYPE_HINTS[t]}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && type && (
          <div className="space-y-4">
            <SegmentedFilter
              label="Nguồn nội dung"
              value={source}
              onChange={setSource}
              options={[
                { value: "LOCAL", label: "Lịch sử địa phương" },
                { value: "GLOBAL", label: "Kho nội dung chung" },
              ]}
            />
            {target && (
              <p className="text-sm">
                Đã chọn: <span className="font-semibold text-[var(--accent-gold)]">{target.title}</span>{" "}
                <span className="text-content-muted">({target.source === "LOCAL" ? "địa phương" : "kho chung"})</span>
              </p>
            )}
            {source === "LOCAL" ? (
              localOptions.length === 0 ? (
                <p className="rounded-[2px] border border-dashed border-[var(--border-strong)] p-4 text-sm text-content-muted">
                  Chưa có {LOCAL_KIND_LABELS[KIND_FOR_TYPE[type]].toLowerCase()} địa phương nào đã xuất bản và hiển thị cho
                  {classIds.length > 1 ? " tất cả các lớp đã chọn" : " lớp đã chọn"}.{" "}
                  <Link href={ROUTES.TEACHING.LOCAL_NEW(KIND_FOR_TYPE[type])} className="archive-link">
                    Soạn mới
                  </Link>
                </p>
              ) : (
                <TargetList
                  options={localOptions.map((c) => ({
                    source: "LOCAL" as const,
                    id: c.id,
                    title: localTitle(c),
                    meta:
                      c.kind === "CONTEXT"
                        ? `${c.location} · ${formatYear(c.year)}`
                        : c.kind === "CHARACTER"
                          ? c.title
                          : `${c.questions.length} câu · ${c.durationMinutes} phút · ${LEVEL_LABELS[c.level]}`,
                  }))}
                  selected={target}
                  onSelect={chooseTarget}
                />
              )
            ) : (
              <GlobalTargets type={type} selected={target} onSelect={chooseTarget} />
            )}
          </div>
        )}

        {step === 3 && type && (
          <div className="space-y-4">
            <Field label="Tên bài tập" required error={touched ? detailErrors.title : null}>
              <StaffFormInput value={details.title} onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))} />
            </Field>
            <Field label="Hướng dẫn cho học sinh">
              <StaffFormTextarea
                value={details.instructions}
                onChange={(e) => setDetails((d) => ({ ...d, instructions: e.target.value }))}
                placeholder="VD: Đọc kỹ bối cảnh và ghi lại 3 ý chính."
                className="min-h-[100px]"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mở từ" required error={touched ? detailErrors.openAt : null} htmlFor="as-open">
                <StaffFormInput id="as-open" type="datetime-local" value={details.openAt} onChange={(e) => setDetails((d) => ({ ...d, openAt: e.target.value }))} />
              </Field>
              <Field label="Hạn nộp" required error={touched ? detailErrors.dueAt : null} htmlFor="as-due">
                <StaffFormInput id="as-due" type="datetime-local" value={details.dueAt} onChange={(e) => setDetails((d) => ({ ...d, dueAt: e.target.value }))} />
              </Field>
            </div>
            {type === "CHAT" && (
              <Field label="Số tin nhắn tối thiểu" required error={touched ? detailErrors.minMessages : null} htmlFor="as-min" className="sm:max-w-[240px]">
                <StaffFormInput id="as-min" type="number" min={1} value={details.minMessages} onChange={(e) => setDetails((d) => ({ ...d, minMessages: e.target.value }))} />
              </Field>
            )}
            {type === "TEST" && (
              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <Field label="Điểm tối đa" required error={touched ? detailErrors.maxScore : null} htmlFor="as-max">
                  <StaffFormInput id="as-max" type="number" min={1} step="0.5" value={details.maxScore} onChange={(e) => setDetails((d) => ({ ...d, maxScore: e.target.value }))} />
                </Field>
                <label className="flex h-10 cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={details.graded} onCheckedChange={(v) => setDetails((d) => ({ ...d, graded: v === true }))} />
                  Tính vào sổ điểm
                </label>
              </div>
            )}
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox checked={details.allowLate} onCheckedChange={(v) => setDetails((d) => ({ ...d, allowLate: v === true }))} />
              Cho phép nộp muộn
            </label>
          </div>
        )}

        {step === 4 && type && target && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-[160px_1fr]">
            <dt className="text-content-muted">Lớp</dt>
            <dd className="font-semibold">{classIds.map((id) => `Lớp ${data.classById.get(id)?.name}`).join(", ")}</dd>
            <dt className="text-content-muted">Loại bài</dt>
            <dd>
              <AssignmentTypeBadge type={type} />
            </dd>
            <dt className="text-content-muted">Nội dung</dt>
            <dd>
              {target.title} <span className="text-content-muted">({target.source === "LOCAL" ? "lịch sử địa phương" : "kho chung"})</span>
            </dd>
            <dt className="text-content-muted">Tên bài</dt>
            <dd className="font-semibold">{details.title}</dd>
            {details.instructions.trim() && (
              <>
                <dt className="text-content-muted">Hướng dẫn</dt>
                <dd className="whitespace-pre-line">{details.instructions}</dd>
              </>
            )}
            <dt className="text-content-muted">Thời gian</dt>
            <dd>
              {formatDateTime(openIso)} → <span className="font-semibold">{formatDateTime(dueIso)}</span>
            </dd>
            {type === "CHAT" && (
              <>
                <dt className="text-content-muted">Yêu cầu</dt>
                <dd>Tối thiểu {details.minMessages} tin nhắn</dd>
              </>
            )}
            {type === "TEST" && (
              <>
                <dt className="text-content-muted">Chấm điểm</dt>
                <dd>
                  Thang {details.maxScore} · {details.graded ? "tính vào sổ điểm" : "không tính điểm"}
                </dd>
              </>
            )}
            <dt className="text-content-muted">Nộp muộn</dt>
            <dd>{details.allowLate ? "Cho phép" : "Không cho phép"}</dd>
          </dl>
        )}

        {touched && stepError && step !== 3 && <p className="text-sm text-[var(--accent-danger)]">{stepError}</p>}
      </Panel>

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" className="btn-line" onClick={back} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Quay lại
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn-ink" onClick={next}>
            Tiếp tục <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" className="btn-crimson" onClick={submit}>
            <Check className="h-4 w-4" aria-hidden="true" /> Giao bài {classIds.length > 1 ? `cho ${classIds.length} lớp` : ""}
          </button>
        )}
      </div>
    </div>
  );
}

function TargetList({ options, selected, onSelect }: { options: Target[]; selected: Target | null; onSelect: (t: Target) => void }) {
  const [search, setSearch] = React.useState("");
  const q = normalizeText(search);
  const shown = q ? options.filter((o) => normalizeText(`${o.title} ${o.meta ?? ""}`).includes(q)) : options;
  return (
    <div className="space-y-3">
      {options.length > 6 && <SearchInput value={search} onChange={setSearch} placeholder="Tìm nội dung..." />}
      <ul role="radiogroup" aria-label="Nội dung" className="max-h-80 divide-y divide-[var(--border-default)] overflow-y-auto rounded-[2px] border border-[var(--border-strong)]">
        {shown.length === 0 && <li className="p-3 text-sm text-content-muted">Không tìm thấy nội dung phù hợp.</li>}
        {shown.map((o) => {
          const active = selected?.id === o.id && selected.source === o.source;
          return (
            <li key={`${o.source}-${o.id}`}>
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onSelect(o)}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm",
                  active ? "bg-[var(--accent-gold-active-bg)]" : "hover:bg-[var(--status-neutral-bg)]",
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full border",
                    active ? "border-[var(--accent-gold)] bg-[var(--accent-gold)]" : "border-[var(--text-primary)]",
                  )}
                  aria-hidden="true"
                >
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-content-heading">{o.title}</span>
                  {o.meta && <span className="block truncate text-xs text-content-muted">{o.meta}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Shared (global) content from the real API; mounted only when that source is chosen. */
function GlobalTargets({ type, selected, onSelect }: { type: AssignmentType; selected: Target | null; onSelect: (t: Target) => void }) {
  if (type === "EVENT") return <GlobalEvents selected={selected} onSelect={onSelect} />;
  if (type === "CHAT") return <GlobalCharacters selected={selected} onSelect={onSelect} />;
  return <GlobalQuizzes selected={selected} onSelect={onSelect} />;
}

type PickerProps = { selected: Target | null; onSelect: (t: Target) => void };

function ApiState({ loading, error, children }: { loading: boolean; error: boolean; children: React.ReactNode }) {
  if (loading)
    return (
      <p className="flex items-center gap-2 text-sm text-content-muted">
        <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-gold)]" aria-hidden="true" /> Đang tải kho nội dung...
      </p>
    );
  if (error) return <p className="text-sm text-[var(--accent-danger)]">Không tải được kho nội dung chung. Thử lại sau hoặc chọn nội dung địa phương.</p>;
  return <>{children}</>;
}

function GlobalEvents({ selected, onSelect }: PickerProps) {
  const q = useEvents({ page: 1, limit: 100 });
  const options = (q.data?.content ?? []).map((e) => ({
    source: "GLOBAL" as const,
    id: e.id,
    title: e.title,
    meta: [e.yearLabel ?? formatYear(e.year), e.location].filter(Boolean).join(" · "),
  }));
  return (
    <ApiState loading={q.isLoading} error={q.isError}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}

function GlobalCharacters({ selected, onSelect }: PickerProps) {
  const q = useCharacters({ page: 1, limit: 100 });
  const options = (q.data?.content ?? []).map((c) => ({ source: "GLOBAL" as const, id: c.id, title: c.name, meta: c.title }));
  return (
    <ApiState loading={q.isLoading} error={q.isError}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}

function GlobalQuizzes({ selected, onSelect }: PickerProps) {
  const q = useQuizSets();
  const options = (q.data?.content ?? []).map((z) => ({
    source: "GLOBAL" as const,
    id: z.quizId,
    title: z.title,
    meta: [LEVEL_LABELS[z.level], z.contextTitle].filter(Boolean).join(" · "),
  }));
  return (
    <ApiState loading={q.isLoading} error={q.isError}>
      <TargetList options={options} selected={selected} onSelect={onSelect} />
    </ApiState>
  );
}
