"use client";

import * as React from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { academicYearLabel, currentAcademicYear } from "@/components/saas/class-form-dialog";
import { apiErrorMessage, useApiSchoolClassrooms, useUpdateApiClassroom } from "@/features/saas/hooks-api";
import { tokenApiErrorMessage, useRolloverAcademicYear, useUpdateTokenPolicy } from "@/features/saas/hooks-school-token";
import type { ApiClassroom } from "@/services/school.service";
import { DAILY_QUOTA_MIN, DEFAULT_DAILY_QUOTA, DEFAULT_TEACHER_QUOTA, TEACHER_QUOTA_MIN } from "@/services/school-token.service";
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
  // No API returns the teacher default yet (only the PUT response), so start from the backend default.
  const [teacherQuota, setTeacherQuota] = React.useState(DEFAULT_TEACHER_QUOTA);
  const studentQuota = currentDefault ?? DEFAULT_DAILY_QUOTA;

  const saveStudent = (n: number, done: () => void) =>
    update.mutate(
      { defaultDailyStudentQuota: n },
      {
        onSuccess: () => {
          done();
          toast.success(`Mặc định toàn trường: ${formatNumber(n)} token / học sinh / ngày`);
        },
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );

  const saveTeacher = (n: number, done: () => void) =>
    update.mutate(
      { defaultDailyTeacherQuota: n },
      {
        onSuccess: (school) => {
          setTeacherQuota(school.defaultDailyTeacherQuota ?? n);
          done();
          toast.success(`Hạn mức giáo viên: ${formatNumber(n)} token / ngày`);
        },
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );

  const saveGrade = (grade: number, n: number, done: () => void) =>
    update.mutate(
      { gradeLevel: grade, classroomDailyQuota: n },
      {
        onSuccess: () => {
          done();
          toast.success(`Cả khối ${grade}: ${formatNumber(n)} token / học sinh / ngày`);
        },
        onError: (e) => toast.error(policyErrorMessage(e)),
      },
    );

  const byGrade = React.useMemo(() => {
    const map = new Map<number, ApiClassroom[]>();
    for (const c of classes.data?.items ?? []) {
      const g = c.gradeLevel ?? 0;
      map.set(g, [...(map.get(g) ?? []), c]);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [classes.data]);

  return (
    <Panel>
      <SectionHeading
        title="Hạn mức token mỗi ngày"
        description="Số token được dùng cho trò chuyện AI mỗi ngày, làm mới lúc 00:00. Hết hạn mức chỉ khóa AI; quiz, tài liệu và bài tập vẫn dùng bình thường."
      />

      <div className="grid gap-3 md:grid-cols-2">
        <EditableQuota label="Mỗi học sinh" hint="Áp dụng cho mọi lớp, trừ lớp đặt mức riêng bên dưới." value={studentQuota} min={DAILY_QUOTA_MIN} saving={update.isPending} onSave={saveStudent} />
        <EditableQuota label="Mỗi giáo viên" hint="Gồm chat AI của giáo viên và phần giáo viên cấp thêm cho học sinh." value={teacherQuota} min={TEACHER_QUOTA_MIN} saving={update.isPending} onSave={saveTeacher} />
      </div>

      <div className="space-y-2">
        <p className="text-[13px] font-semibold text-[var(--text-tertiary)]">Theo lớp · năm học {academicYearLabel(year)}</p>
        {classes.isPending ? (
          <p className="text-sm text-content-muted">Đang tải lớp...</p>
        ) : classes.isError ? (
          <p className="text-sm text-[var(--accent-danger)]">{apiErrorMessage(classes.error, "Không tải được danh sách lớp.")}</p>
        ) : byGrade.length === 0 ? (
          <p className="text-sm text-content-muted">Chưa có lớp nào trong năm học này.</p>
        ) : (
          <div className="border-y border-border-card">
            {byGrade.map(([grade, rooms]) => (
              <div key={grade} className="border-b border-[var(--border-default)] last:border-b-0">
                <GradeHeader grade={grade} count={rooms.length} fallback={studentQuota} saving={update.isPending} onApply={saveGrade} />
                <ul className="divide-y divide-[var(--border-default)]">
                  {rooms.map((c) => (
                    <ClassQuotaRow key={c.id} room={c} schoolDefault={currentDefault} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

/** Mot gia tri han muc: hien so, bam "Sửa" moi hien o nhap. */
function EditableQuota({
  label,
  hint,
  value,
  min,
  saving,
  onSave,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  saving: boolean;
  onSave: (n: number, done: () => void) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const n = parseInt0(draft);
  const error = !draft.trim() ? "Nhập số token" : !Number.isInteger(n) || n < min ? `Tối thiểu ${formatNumber(min)} token` : null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-card px-4 py-3">
      <span className="text-[13px] font-semibold text-[var(--text-tertiary)]">{label}</span>
      {editing ? (
        <div className="flex flex-wrap items-center gap-2">
          <StaffFormInput
            aria-label={label}
            inputMode="numeric"
            autoFocus
            value={draft}
            aria-invalid={!!error}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 7))}
            onKeyDown={(e) => e.key === "Enter" && !error && onSave(n, () => setEditing(false))}
            className="w-32 tabular-nums"
          />
          <span className="text-sm text-content-muted">token / ngày</span>
          <button type="button" className="btn-crimson disabled:opacity-60" disabled={saving || !!error} onClick={() => onSave(n, () => setEditing(false))}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Lưu
          </button>
          <button type="button" className="btn-line" onClick={() => setEditing(false)}>
            Hủy
          </button>
          {error && <span className="w-full text-xs text-[var(--accent-danger)]">{error}</span>}
        </div>
      ) : (
        <div className="flex items-baseline justify-between gap-3">
          <span>
            <span className="text-3xl font-bold tabular-nums text-content-heading">{formatNumber(value)}</span>
            <span className="ml-1.5 text-sm text-content-muted">token / ngày</span>
          </span>
          <button
            type="button"
            className="archive-link"
            onClick={() => {
              setDraft(String(value));
              setEditing(true);
            }}
          >
            Sửa
          </button>
        </div>
      )}
      <span className="text-xs text-content-muted">{hint}</span>
    </div>
  );
}

/** Dong tieu de moi khoi trong bang theo lop, kem thao tac dat cung muc cho ca khoi. */
function GradeHeader({
  grade,
  count,
  fallback,
  saving,
  onApply,
}: {
  grade: number;
  count: number;
  fallback: number;
  saving: boolean;
  onApply: (grade: number, n: number, done: () => void) => void;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const error = editing ? quotaError(draft) : null;
  return (
    <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-elevated)] px-3 py-2">
      <span className="flex-1 text-sm font-bold text-content-heading">
        Khối {grade} <span className="font-normal text-content-muted">· {count} lớp</span>
      </span>
      {editing ? (
        <>
          <StaffFormInput
            aria-label={`Hạn mức cả khối ${grade}`}
            inputMode="numeric"
            autoFocus
            value={draft}
            aria-invalid={!!error}
            onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 7))}
            className="h-9 w-28 tabular-nums"
          />
          <span className="text-xs text-content-muted">token / ngày</span>
          <button type="button" className="btn-crimson min-h-0 py-1.5 text-xs disabled:opacity-60" disabled={saving || !!error} onClick={() => onApply(grade, parseInt0(draft), () => setEditing(false))}>
            Áp dụng cho {count} lớp
          </button>
          <button type="button" className="btn-line min-h-0 py-1.5 text-xs" onClick={() => setEditing(false)}>
            Hủy
          </button>
        </>
      ) : (
        <button
          type="button"
          className="archive-link text-xs"
          onClick={() => {
            setDraft(String(fallback));
            setEditing(true);
          }}
        >
          Đặt cho cả khối
        </button>
      )}
    </div>
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
    <li className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <span className="font-semibold text-content-heading">Lớp {room.className}</span>
        <span className="ml-2 text-xs text-content-muted">{formatNumber(room.studentCount ?? 0)} học sinh</span>
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
          <span className={cn("tabular-nums text-sm font-semibold", own ? "text-[var(--gold-leaf)]" : "text-content-heading")}>
            {effective ? `${formatNumber(effective)} / ngày` : "—"}
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
              Dùng mặc định
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
 * Viec moi nam lam mot lan, khong hoan tac duoc: chi la mot nut tren trang Lop hoc, mo hop thoai khi can.
 */
export function AcademicRolloverButton() {
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
        onSuccess: (r) => {
          setOpen(false);
          toast.success(`Đã kết thúc năm học ${academicYearLabel(r.completedAcademicYear)}`, {
            description: `${formatNumber(r.archivedClassroomsCount)} lớp được lưu trữ · ${formatNumber(r.deactivatedGraduatedStudentsCount)} học sinh khối 12 ngừng hoạt động`,
            duration: 10_000,
          });
        },
        onError: (e) => toast.error(tokenApiErrorMessage(e, "Không kết thúc được năm học. Vui lòng thử lại.")),
      },
    );

  return (
    <>
      <button type="button" className="archive-link text-xs text-content-muted" onClick={() => setOpen(true)}>
        <Archive className="h-3.5 w-3.5" aria-hidden="true" /> Kết thúc năm học…
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kết thúc năm học</DialogTitle>
            <DialogDescription>
              Các lớp của năm học được chọn chuyển sang lưu trữ. Học sinh giữ tài khoản và lịch sử học tập để xếp vào lớp mới. Không hoàn tác được.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Năm học đã kết thúc">
              <StaffFormSelect value={year} onValueChange={setYear} options={yearOptions} className="w-full" />
            </Field>
            <label htmlFor="rollover-graduate" className="flex cursor-pointer items-start gap-2 text-sm text-content-text">
              <Checkbox id="rollover-graduate" checked={graduate} onCheckedChange={(v) => setGraduate(!!v)} className="mt-0.5" />
              Khóa tài khoản học sinh khối 12 (đã tốt nghiệp)
            </label>
          </div>
          <DialogFooter>
            <button type="button" className="btn-line" onClick={() => setOpen(false)}>
              Hủy
            </button>
            <button type="button" className="btn-crimson disabled:opacity-60" disabled={rollover.isPending} onClick={run}>
              {rollover.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Kết thúc năm học {academicYearLabel(Number(year))}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
