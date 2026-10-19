"use client";

import * as React from "react";
import { Archive, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, GRADE_OPTIONS, Panel, SectionHeading, formatNumber } from "@/components/saas/saas-ui";
import { academicYearLabel, currentAcademicYear } from "@/components/saas/class-form-dialog";
import { apiErrorMessage, useApiSchoolClassrooms } from "@/features/saas/hooks-api";
import { useRolloverAcademicYear, useUpdateTokenPolicy } from "@/features/saas/hooks-school-token";
import { DAILY_QUOTA_MIN, DEFAULT_DAILY_QUOTA } from "@/services/school-token.service";

const parseInt0 = (v: string) => Number(v.replace(/[.\s,]/g, ""));
const quotaError = (v: string) => {
  const n = parseInt0(v);
  return !v.trim() ? "Nhập số token" : !Number.isInteger(n) || n < DAILY_QUOTA_MIN ? `Tối thiểu ${formatNumber(DAILY_QUOTA_MIN)} token` : null;
};

/**
 * PUT /school-admin/token-policy: tokens one student may spend per day. The school default applies unless a class
 * (or every class of a grade) has its own limit. Limits reset at 00:00; unused tokens stay in the shared pool.
 */
export function DailyQuotaPolicyPanel({ currentDefault }: { currentDefault?: number }) {
  const update = useUpdateTokenPolicy();
  const year = currentAcademicYear();
  const classes = useApiSchoolClassrooms({ page: 0, size: 200, academicYear: year });

  const [schoolQuota, setSchoolQuota] = React.useState(String(currentDefault ?? DEFAULT_DAILY_QUOTA));
  const [syncedDefault, setSyncedDefault] = React.useState(currentDefault);
  if (currentDefault !== syncedDefault) {
    setSyncedDefault(currentDefault);
    if (currentDefault != null) setSchoolQuota(String(currentDefault));
  }
  const [target, setTarget] = React.useState<string>("GRADE:12");
  const [overrideQuota, setOverrideQuota] = React.useState("2000");
  const [touched, setTouched] = React.useState<"school" | "override" | null>(null);

  const classOptions = (classes.data?.items ?? []).map((c) => ({ value: `CLASS:${c.id}`, label: `Lớp ${c.className}` }));
  const targetOptions = [...GRADE_OPTIONS.map((g) => ({ value: `GRADE:${g}`, label: `Cả khối ${g}` })), ...classOptions];

  const saveSchool = () => {
    setTouched("school");
    if (quotaError(schoolQuota)) return;
    update.mutate(
      { defaultDailyStudentQuota: parseInt0(schoolQuota) },
      {
        onSuccess: () => toast.success(`Hạn mức mặc định: ${formatNumber(parseInt0(schoolQuota))} token / học sinh / ngày`),
        onError: (e) => toast.error(apiErrorMessage(e, "Không lưu được hạn mức. Vui lòng thử lại.")),
      },
    );
  };

  const saveOverride = () => {
    setTouched("override");
    if (quotaError(overrideQuota)) return;
    const [kind, id] = target.split(":");
    const label = targetOptions.find((o) => o.value === target)?.label ?? "";
    update.mutate(
      kind === "GRADE"
        ? { gradeLevel: Number(id), classroomDailyQuota: parseInt0(overrideQuota) }
        : { classroomId: id, classroomDailyQuota: parseInt0(overrideQuota) },
      {
        onSuccess: () => toast.success(`${label}: ${formatNumber(parseInt0(overrideQuota))} token / học sinh / ngày`),
        onError: (e) => toast.error(apiErrorMessage(e, "Không lưu được hạn mức. Vui lòng thử lại.")),
      },
    );
  };

  return (
    <Panel>
      <SectionHeading
        title="Hạn mức token mỗi ngày"
        description="Số token một học sinh được dùng cho trò chuyện AI mỗi ngày. Hết hạn mức chỉ khóa AI; quiz, tài liệu và bài tập vẫn dùng bình thường. Học sinh có thể xin thêm, giáo viên lớp hoặc quản trị trường duyệt."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Field
            label="Mặc định toàn trường"
            required
            htmlFor="quota-default"
            error={touched === "school" ? quotaError(schoolQuota) : null}
            hint="Áp dụng cho mọi lớp chưa có hạn mức riêng."
          >
            <div className="flex items-center gap-2">
              <StaffFormInput id="quota-default" inputMode="numeric" value={schoolQuota} onChange={(e) => setSchoolQuota(e.target.value)} />
              <span className="shrink-0 text-sm text-content-muted">token / ngày</span>
            </div>
          </Field>
          <button type="button" className="btn-crimson disabled:opacity-60" disabled={update.isPending} onClick={saveSchool}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />} Lưu mặc định
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Hạn mức riêng cho khối / lớp" hint={`Lớp năm học ${academicYearLabel(year)}. Ghi đè mức mặc định của trường.`}>
            <StaffFormSelect value={target} onValueChange={setTarget} options={targetOptions} className="w-full" />
          </Field>
          <Field label="Token / học sinh / ngày" required htmlFor="quota-override" error={touched === "override" ? quotaError(overrideQuota) : null}>
            <StaffFormInput id="quota-override" inputMode="numeric" value={overrideQuota} onChange={(e) => setOverrideQuota(e.target.value)} />
          </Field>
          <button type="button" className="btn-ink disabled:opacity-60" disabled={update.isPending} onClick={saveOverride}>
            Áp dụng
          </button>
        </div>
      </div>
    </Panel>
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
        onError: (e) => toast.error(apiErrorMessage(e, "Không chuyển giao được năm học. Vui lòng thử lại.")),
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
