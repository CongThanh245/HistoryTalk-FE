"use client";

import * as React from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, GRADE_OPTIONS, Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { academicYearLabel, currentAcademicYear } from "@/components/saas/class-form-dialog";
import { apiErrorMessage, useApiSchoolClassrooms, useUpdateApiClassroom } from "@/features/saas/hooks-api";
import { tokenApiErrorMessage, useRolloverAcademicYear, useUpdateTokenPolicy } from "@/features/saas/hooks-school-token";
import type { ApiClassroom } from "@/services/school.service";
import { DAILY_QUOTA_MIN, DEFAULT_DAILY_QUOTA } from "@/services/school-token.service";
import { cn } from "@/lib/utils/cn";

const parseInt0 = (v: string) => Number(v.replace(/[.\s,]/g, ""));
const policyErrorMessage = (e: unknown) => tokenApiErrorMessage(e, "Không lưu được hạn mức. Vui lòng thử lại.");
const quotaError = (v: string) => {
  const n = parseInt0(v);
  return !v.trim() ? "Nhập số token" : !Number.isInteger(n) || n < DAILY_QUOTA_MIN ? `Tối thiểu ${formatNumber(DAILY_QUOTA_MIN)} token` : null;
};

/**
 * Daily AI token limit per student (Sprint 7). The school default (PUT /school-admin/token-policy) applies unless a
 * class has its own limit; a whole grade is set through the same endpoint, a single class through PUT /classrooms/{id}
 * (which also accepts 0 = back to the school default). Limits reset at 00:00; unused tokens stay in the shared pool.
 */
export function DailyQuotaPolicyPanel({ currentDefault }: { currentDefault?: number }) {
  const update = useUpdateTokenPolicy();
  const year = currentAcademicYear();
  const classes = useApiSchoolClassrooms({ page: 0, size: 200, academicYear: year, sort: "className,asc" });

  const [schoolQuota, setSchoolQuota] = React.useState(String(currentDefault ?? DEFAULT_DAILY_QUOTA));
  const [syncedDefault, setSyncedDefault] = React.useState(currentDefault);
  if (currentDefault !== syncedDefault) {
    setSyncedDefault(currentDefault);
    if (currentDefault != null) setSchoolQuota(String(currentDefault));
  }
  const [grade, setGrade] = React.useState("12");
  const [gradeQuota, setGradeQuota] = React.useState("2000");
  const [touched, setTouched] = React.useState<"school" | "grade" | null>(null);

  const schoolError = touched === "school" ? quotaError(schoolQuota) : null;
  const gradeError = touched === "grade" ? quotaError(gradeQuota) : null;
  const schoolDirty = currentDefault == null || parseInt0(schoolQuota) !== currentDefault;

  const saveSchool = () => {
    setTouched("school");
    if (quotaError(schoolQuota)) return;
    update.mutate(
      { defaultDailyStudentQuota: parseInt0(schoolQuota) },
      {
        onSuccess: () => toast.success(`Mặc định toàn trường: ${formatNumber(parseInt0(schoolQuota))} token / học sinh / ngày`),
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );
  };

  const saveGrade = () => {
    setTouched("grade");
    if (quotaError(gradeQuota)) return;
    update.mutate(
      { gradeLevel: Number(grade), classroomDailyQuota: parseInt0(gradeQuota) },
      {
        onSuccess: () => toast.success(`Cả khối ${grade}: ${formatNumber(parseInt0(gradeQuota))} token / học sinh / ngày`),
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );
  };

  return (
    <Panel>
      <SectionHeading
        title="Hạn mức token mỗi ngày"
        description="Số token một học sinh được dùng cho trò chuyện AI mỗi ngày, làm mới lúc 00:00. Hết hạn mức chỉ khóa AI; quiz, tài liệu và bài tập vẫn dùng bình thường."
      />

      <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
        <QuotaRow
          id="quota-default"
          label="Mặc định toàn trường"
          hint="Áp dụng cho mọi lớp chưa có hạn mức riêng."
          value={schoolQuota}
          onChange={setSchoolQuota}
          error={schoolError}
        >
          <button type="button" className="btn-crimson disabled:opacity-60" disabled={update.isPending || !schoolDirty} onClick={saveSchool}>
            Lưu
          </button>
        </QuotaRow>

        <QuotaRow
          id="quota-grade"
          label="Áp dụng cho cả khối"
          hint={`Đặt cùng hạn mức cho mọi lớp của khối, năm học ${academicYearLabel(year)}.`}
          value={gradeQuota}
          onChange={setGradeQuota}
          error={gradeError}
          lead={
            <StaffFormSelect
              value={grade}
              onValueChange={setGrade}
              options={GRADE_OPTIONS.map((g) => ({ value: String(g), label: `Khối ${g}` }))}
              className="w-28 shrink-0"
            />
          }
        >
          <button type="button" className="btn-ink disabled:opacity-60" disabled={update.isPending} onClick={saveGrade}>
            Áp dụng
          </button>
        </QuotaRow>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
          Theo lớp · năm học {academicYearLabel(year)}
        </p>
        {classes.isPending ? (
          <p className="text-sm text-content-muted">Đang tải lớp...</p>
        ) : classes.isError ? (
          <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(classes.error, "Không tải được danh sách lớp.")}</p>
        ) : (classes.data?.items.length ?? 0) === 0 ? (
          <p className="text-sm text-content-muted">Chưa có lớp nào trong năm học này.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-default)] border-y border-[var(--text-primary)]">
            {classes.data!.items.map((c) => (
              <ClassQuotaRow key={c.id} room={c} schoolDefault={currentDefault} />
            ))}
          </ul>
        )}
      </div>
    </Panel>
  );
}

function QuotaRow({
  id,
  label,
  hint,
  value,
  onChange,
  error,
  lead,
  children,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  error: string | null;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Field label={label} hint={error ? undefined : hint} error={error} htmlFor={id}>
      <div className="flex flex-wrap items-center gap-2">
        {lead}
        <StaffFormInput
          id={id}
          inputMode="numeric"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))}
          className="w-32 tabular-nums"
        />
        <span className="text-sm text-content-muted">token / ngày</span>
        {children}
      </div>
    </Field>
  );
}

/** One class: its current limit and an inline editor (PUT /classrooms/{id} { dailyTokenQuota }). */
function ClassQuotaRow({ room, schoolDefault }: { room: ApiClassroom; schoolDefault?: number }) {
  const update = useUpdateApiClassroom();
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState("");
  // The API echoes the school default for classes without their own limit, so equal values read as "default".
  const own = !!room.dailyTokenQuota && room.dailyTokenQuota !== schoolDefault;
  const effective = room.dailyTokenQuota || schoolDefault;
  const error = editing ? quotaError(value) : null;

  const save = (quota: number, message: string) =>
    update.mutate(
      { id: room.id, payload: { dailyTokenQuota: quota } },
      {
        onSuccess: () => {
          setEditing(false);
          toast.success(message);
        },
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );

  return (
    <li className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-content-heading">Lớp {room.className}</span>
        <span className="ml-2 text-xs text-content-muted">
          Khối {room.gradeLevel} · {formatNumber(room.studentCount ?? 0)} học sinh
        </span>
      </div>
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <StaffFormInput
            aria-label={`Hạn mức lớp ${room.className}`}
            inputMode="numeric"
            value={value}
            autoFocus
            aria-invalid={!!error}
            onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="w-28 tabular-nums"
          />
          <button
            type="button"
            className="btn-crimson disabled:opacity-60"
            disabled={update.isPending || !!error}
            onClick={() => save(parseInt0(value), `Lớp ${room.className}: ${formatNumber(parseInt0(value))} token / học sinh / ngày`)}
          >
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Lưu
          </button>
          <button type="button" className="btn-line" disabled={update.isPending} onClick={() => setEditing(false)}>
            Hủy
          </button>
          {error && <span className="w-full text-xs text-[var(--accent-danger)] sm:w-auto">{error}</span>}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-sm font-semibold text-content-heading">
            {effective ? `${formatNumber(effective)} / ngày` : "—"}
          </span>
          <span
            className={cn(
              "rounded-[2px] border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em]",
              own
                ? "border-[var(--gold-leaf)] text-[var(--gold-leaf)]"
                : "border-[var(--border-strong)] text-[var(--text-tertiary)]",
            )}
          >
            {own ? "Riêng" : "Mặc định"}
          </span>
          <button
            type="button"
            className="archive-link"
            onClick={() => {
              setValue(String(effective ?? DEFAULT_DAILY_QUOTA));
              setEditing(true);
            }}
          >
            Sửa
          </button>
          {own && (
            <button
              type="button"
              className="archive-link text-content-muted"
              disabled={update.isPending}
              onClick={() => save(0, `Lớp ${room.className} dùng lại mức mặc định của trường`)}
            >
              Về mặc định
            </button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * POST /school-admin/academic-year/rollover: archives the classes of the finished year, resets daily counters and
 * (optionally) deactivates grade-12 students so they can no longer sign in. Unused tokens stay in the pool.
 */
export function AcademicRolloverPanel() {
  const rollover = useRolloverAcademicYear();
  const thisYear = currentAcademicYear();
  const [year, setYear] = React.useState(String(thisYear - 1));
  const [graduate, setGraduate] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const yearOptions = [thisYear - 2, thisYear - 1, thisYear].map((y) => ({ value: String(y), label: `Năm học ${academicYearLabel(y)}` }));

  const run = () =>
    rollover.mutate(
      { completedAcademicYear: Number(year), deactivateGraduatedGrade12: graduate },
      {
        onSuccess: (r) =>
          toast.success(`Đã chuyển giao năm học ${academicYearLabel(r.completedAcademicYear)}`, {
            description: `${formatNumber(r.archivedClassroomsCount)} lớp được lưu trữ · ${formatNumber(r.deactivatedGraduatedStudentsCount)} học sinh khối 12 ngừng hoạt động · quỹ còn ${formatNumber(r.remainingSchoolTokenPool ?? 0)} token`,
            duration: 10_000,
          }),
        onError: (e) => toast.error(tokenApiErrorMessage(e, "Không chuyển giao được năm học. Vui lòng thử lại.")),
      },
    );

  return (
    <Panel>
      <SectionHeading
        title="Chuyển giao năm học"
        description="Làm khi kết thúc năm học: lớp của năm cũ chuyển sang lưu trữ (học sinh giữ tài khoản và lịch sử học tập để xếp vào lớp mới). Token chưa dùng vẫn nằm trong quỹ chung."
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="Năm học đã kết thúc" className="sm:w-64">
          <StaffFormSelect value={year} onValueChange={setYear} options={yearOptions} className="w-full" />
        </Field>
        <label htmlFor="rollover-graduate" className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-content-text">
          <Checkbox id="rollover-graduate" checked={graduate} onCheckedChange={(v) => setGraduate(!!v)} />
          Vô hiệu hóa tài khoản học sinh khối 12 (đã tốt nghiệp)
        </label>
      </div>
      <button type="button" className="btn-ink disabled:opacity-60" disabled={rollover.isPending} onClick={() => setOpen(true)}>
        {rollover.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Archive className="h-4 w-4" aria-hidden="true" />}
        Chuyển giao năm học
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        variant="danger"
        title={`Chuyển giao năm học ${academicYearLabel(Number(year))}?`}
        description={
          graduate
            ? "Mọi lớp của năm học này chuyển sang lưu trữ, và tài khoản học sinh khối 12 bị vô hiệu hóa vĩnh viễn (không đăng nhập được nữa). Không hoàn tác được."
            : "Mọi lớp của năm học này chuyển sang lưu trữ. Không hoàn tác được."
        }
        confirmLabel="Chuyển giao"
        onConfirm={() => {
          setOpen(false);
          run();
        }}
      />
    </Panel>
  );
}
