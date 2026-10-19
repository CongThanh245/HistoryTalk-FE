"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StaffFormInput, StaffFormSelect, StaffFormTextarea } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field } from "@/components/saas/saas-ui";
import {
  apiErrorMessage,
  apiErrorStatus,
  useApiTeachers,
  useCreateApiClassroom,
  useUpdateApiClassroom,
} from "@/features/saas/hooks-api";
import type { ApiClassroom, ClassroomStatus, UpdateClassroomPayload } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

const NO_TEACHER = "__none__";
export const CLASS_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const CLASSROOM_STATUS_LABELS: Record<ClassroomStatus, string> = {
  ACTIVE: "Đang hoạt động",
  INACTIVE: "Tạm ngưng",
  ARCHIVED: "Đã lưu trữ",
};

/** Vietnamese school year starts in August/September: Oct 2026 → 2026 (2026–2027). */
export function currentAcademicYear(now = new Date()) {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

export const academicYearLabel = (year: number) => `${year}–${year + 1}`;

interface FormState {
  className: string;
  gradeLevel: string;
  academicYear: string;
  teacherId: string;
  description: string;
  /** Daily token limit per student; "" = school default. */
  dailyTokenQuota: string;
  status: ClassroomStatus;
}

type Errors = Partial<Record<"className" | "academicYear" | "description" | "teacherId" | "dailyTokenQuota", string>>;

/** Leading grade in a class name, e.g. 11 for "11A1". */
const gradeInName = (name: string) => {
  const m = name.trim().match(/^(\d{1,2})/);
  return m ? Number(m[1]) : null;
};

const fromClassroom = (c: ApiClassroom | null): FormState =>
  c
    ? {
        className: c.className,
        gradeLevel: String(c.gradeLevel ?? 10),
        academicYear: String(c.academicYear),
        teacherId: c.teacher?.uid ?? NO_TEACHER,
        description: c.description ?? "",
        dailyTokenQuota: c.dailyTokenQuota ? String(c.dailyTokenQuota) : "",
        status: (["ACTIVE", "INACTIVE", "ARCHIVED"] as const).includes(c.status) ? c.status : "ACTIVE",
      }
    : {
        className: "",
        gradeLevel: "10",
        academicYear: String(currentAcademicYear()),
        teacherId: NO_TEACHER,
        description: "",
        dailyTokenQuota: "",
        status: "ACTIVE",
      };

/**
 * Create / edit a classroom (POST /classrooms, PUT /classrooms/{id}). One teacher in charge per class, picked from the
 * school's teacher accounts. The backend ignores `teacherId: null`, so an assigned teacher can be changed but not removed.
 */
export function ClassFormDialog({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ApiClassroom | null;
  onSaved?: (room: ApiClassroom) => void;
}) {
  const create = useCreateApiClassroom();
  const update = useUpdateApiClassroom();
  const teachers = useApiTeachers({ page: 0, size: 100, sortBy: "fullName", sortDirection: "asc" }, open);
  const pending = create.isPending || update.isPending;

  const [form, setForm] = React.useState<FormState>(() => fromClassroom(editing));
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  // Reset each time the dialog opens.
  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm(fromClassroom(editing));
      setTouched(false);
      setServerErrors({});
      setFormError(null);
    }
  }

  const name = form.className.trim();
  const year = Number(form.academicYear);
  const errors: Errors = {};
  if (!name) errors.className = "Nhập tên lớp";
  else if (name.length > 100) errors.className = "Tên lớp tối đa 100 ký tự";
  if (!/^\d{4}$/.test(form.academicYear.trim()) || year < 2020 || year > 2100) errors.academicYear = "Năm bắt đầu năm học, ví dụ 2026";
  if (form.description.length > 500) errors.description = "Mô tả tối đa 500 ký tự";
  const quota = form.dailyTokenQuota.trim() === "" ? null : Number(form.dailyTokenQuota);
  if (quota !== null && (!Number.isInteger(quota) || quota < 100)) errors.dailyTokenQuota = "Tối thiểu 100 token, hoặc để trống";
  const nameGrade = gradeInName(name);
  const gradeMismatch = nameGrade !== null && CLASS_GRADES.includes(nameGrade) && nameGrade !== Number(form.gradeLevel);
  const shown: Errors = touched ? { ...serverErrors, ...errors } : serverErrors;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerErrors((s) => ({ ...s, [key]: undefined }));
  };

  const currentTeacher = editing?.teacher ?? null;
  const teacherOptions = React.useMemo(() => {
    const list = (teachers.data?.items ?? [])
      .filter((t) => t.active || t.uid === currentTeacher?.uid)
      .map((t) => ({ value: t.uid, label: `${t.fullName} · ${t.email}${t.active ? "" : " (đã khóa)"}` }));
    if (currentTeacher && !list.some((o) => o.value === currentTeacher.uid)) {
      list.unshift({ value: currentTeacher.uid, label: currentTeacher.fullName });
    }
    return currentTeacher ? list : [{ value: NO_TEACHER, label: "Chưa phân công" }, ...list];
  }, [teachers.data, currentTeacher]);

  function onError(error: unknown) {
    if (apiErrorStatus(error) === 409) {
      setServerErrors({ className: apiErrorMessage(error, "Tên lớp đã tồn tại trong năm học này") });
      return;
    }
    const fields = (error as { response?: { data?: { errors?: Record<string, string> } } })?.response?.data?.errors;
    if (fields && Object.keys(fields).length) {
      setServerErrors({
        className: fields.className,
        academicYear: fields.academicYear,
        description: fields.description,
        teacherId: fields.teacherId,
        dailyTokenQuota: fields.dailyTokenQuota,
      });
      return;
    }
    setFormError(apiErrorMessage(error, "Không lưu được lớp học. Vui lòng thử lại."));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (Object.keys(errors).length) return;
    const teacherId = form.teacherId === NO_TEACHER ? undefined : form.teacherId;
    const base = {
      className: name,
      gradeLevel: Number(form.gradeLevel),
      academicYear: year,
      description: form.description.trim(),
    };
    const done = (room: ApiClassroom) => {
      onOpenChange(false);
      onSaved?.(room);
    };
    if (editing) {
      const payload: UpdateClassroomPayload = { ...base, status: form.status };
      if (teacherId && teacherId !== editing.teacher?.uid) payload.teacherId = teacherId;
      // Only send the limit when it changed: the API echoes the school default for classes without their own,
      // so re-sending it would pin that default on the class. Emptying the field sends 0 = school default.
      if ((quota ?? 0) !== (editing.dailyTokenQuota ?? 0)) payload.dailyTokenQuota = quota ?? 0;
      update.mutate({ id: editing.id, payload }, { onSuccess: done, onError });
    } else {
      create.mutate(
        { ...base, description: base.description || undefined, teacherId, dailyTokenQuota: quota ?? undefined },
        { onSuccess: done, onError },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !pending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <form onSubmit={save} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>{editing ? `Sửa lớp ${editing.className}` : "Tạo lớp mới"}</DialogTitle>
            <DialogDescription className="text-content-muted">
              {editing ? "Mã lớp giữ nguyên khi đổi thông tin." : "Mã lớp (ví dụ CVA-10A1-2026) được hệ thống tạo tự động."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Tên lớp"
              required
              error={shown.className}
              hint={gradeMismatch && !shown.className ? `Tên lớp gợi ý khối ${nameGrade}, đang chọn khối ${form.gradeLevel}` : undefined}
              htmlFor="class-name"
            >
              <StaffFormInput
                id="class-name"
                value={form.className}
                placeholder="VD: 10A3"
                aria-invalid={!!shown.className}
                onChange={(e) => set("className", e.target.value)}
              />
            </Field>
            <Field label="Khối" required>
              <StaffFormSelect
                value={form.gradeLevel}
                onValueChange={(v) => set("gradeLevel", v)}
                options={CLASS_GRADES.map((g) => ({ value: String(g), label: `Khối ${g}` }))}
                className="w-full"
              />
            </Field>
            <Field
              label="Năm học"
              required
              error={shown.academicYear}
              hint={/^\d{4}$/.test(form.academicYear) ? academicYearLabel(year) : undefined}
              htmlFor="class-year"
            >
              <StaffFormInput
                id="class-year"
                inputMode="numeric"
                value={form.academicYear}
                aria-invalid={!!shown.academicYear}
                onChange={(e) => set("academicYear", e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </Field>
          </div>

          <Field
            label="Giáo viên phụ trách"
            error={shown.teacherId}
            hint={
              teachers.isError
                ? "Không tải được danh sách giáo viên."
                : currentTeacher
                  ? "Có thể chuyển sang giáo viên khác; máy chủ chưa hỗ trợ bỏ phân công."
                  : "Giáo viên được chọn sẽ thấy lớp trong mục “Lớp của tôi”."
            }
          >
            <StaffFormSelect
              value={form.teacherId}
              onValueChange={(v) => set("teacherId", v)}
              options={teachers.isPending ? [{ value: form.teacherId, label: "Đang tải giáo viên…" }] : teacherOptions}
              disabled={teachers.isPending}
              className="w-full"
            />
          </Field>

          {editing && (
            <Field label="Trạng thái">
              <StaffFormSelect
                value={form.status}
                onValueChange={(v) => set("status", v)}
                options={(Object.keys(CLASSROOM_STATUS_LABELS) as ClassroomStatus[]).map((s) => ({ value: s, label: CLASSROOM_STATUS_LABELS[s] }))}
                className="w-full"
              />
            </Field>
          )}

          <Field
            label="Hạn mức token AI / học sinh / ngày"
            error={shown.dailyTokenQuota}
            hint="Để trống để dùng mức mặc định của trường (cài ở trang Hạn mức token)."
            htmlFor="class-quota"
          >
            <StaffFormInput
              id="class-quota"
              inputMode="numeric"
              value={form.dailyTokenQuota}
              placeholder="Mặc định của trường"
              aria-invalid={!!shown.dailyTokenQuota}
              onChange={(e) => set("dailyTokenQuota", e.target.value.replace(/\D/g, "").slice(0, 7))}
            />
          </Field>

          <Field label="Mô tả" error={shown.description} hint={`${form.description.length}/500`} htmlFor="class-description">
            <StaffFormTextarea
              id="class-description"
              rows={3}
              value={form.description}
              placeholder="Ghi chú cho lớp (không bắt buộc)"
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" disabled={pending} onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson disabled:opacity-50" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editing ? "Lưu thay đổi" : "Tạo lớp"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
