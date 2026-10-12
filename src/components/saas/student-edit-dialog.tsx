"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput, StaffFormSelect } from "@/components/staff/staff-form";
import { AccountStatusBadge, DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, formatDate, formatNumber, isValidEmail } from "@/components/saas/saas-ui";
import { isLoosePhone } from "@/components/saas/teacher-edit-dialog";
import { apiErrorMessage, apiErrorStatus, useApiStudent, useStudentMutations } from "@/features/saas/hooks-api";
import type { ApiStudent, Gender } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

export const GENDER_LABELS: Record<Gender, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

/** Students imported without an email get `{userName}@saas.historytalk.vn`. */
export const isShadowEmail = (email: string | null | undefined) => !!email && /@saas\.historytalk\.vn$/i.test(email);

type Errors = Partial<Record<"fullName" | "email" | "phoneNumber" | "dob" | "gender", string>>;
type GenderValue = Gender | "NONE";
interface Form {
  fullName: string;
  email: string;
  phoneNumber: string;
  dob: string;
  gender: GenderValue;
}

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function validate(v: Form, original: ApiStudent | null): Errors {
  const e: Errors = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = "Nhập họ và tên";
  else if (name.length < 2 || name.length > 150) e.fullName = "Họ tên từ 2 đến 150 ký tự";
  if (!v.email.trim()) e.email = "Nhập email đăng nhập";
  else if (!isValidEmail(v.email)) e.email = "Email không hợp lệ";
  else if (v.email.trim().length > 100) e.email = "Email tối đa 100 ký tự";
  if (v.phoneNumber.trim() && !isLoosePhone(v.phoneNumber)) e.phoneNumber = "Số điện thoại không hợp lệ (tối đa 20 ký tự)";
  if (v.dob) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.dob) || Number.isNaN(new Date(v.dob).getTime())) e.dob = "Ngày sinh không hợp lệ";
    else if (v.dob >= todayIso()) e.dob = "Ngày sinh phải trước hôm nay";
  } else if (original?.dob) {
    // The backend ignores a null dob, so clearing would silently keep the old value.
    e.dob = "Không thể xóa ngày sinh đã có; hãy nhập ngày sinh";
  }
  return e;
}

function serverFieldErrors(error: unknown): Errors {
  if (typeof error !== "object" || error === null || !("response" in error)) return {};
  const data = (error as { response?: { data?: { errors?: Record<string, string>; data?: Record<string, string> } } }).response?.data;
  const errors = data?.errors ?? (data?.data && typeof data.data === "object" ? data.data : undefined);
  if (!errors) return {};
  const dob = errors.dob ? (/past/i.test(errors.dob) ? "Ngày sinh phải trước hôm nay" : errors.dob) : undefined;
  return { fullName: errors.fullName, email: errors.email, phoneNumber: errors.phoneNumber, dob, gender: errors.gender };
}

const toForm = (s: ApiStudent): Form => ({
  fullName: s.fullName,
  email: s.email ?? "",
  phoneNumber: s.phoneNumber ?? "",
  dob: s.dob ?? "",
  gender: s.gender ?? "NONE",
});

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{label}</dt>
      <dd className="break-all text-sm text-content-heading">{children}</dd>
    </div>
  );
}

/** View + edit a student (GET/PUT /school-admin/students/{id}). */
export function StudentEditDialog({ student, onOpenChange }: { student: ApiStudent | null; onOpenChange: (open: boolean) => void }) {
  const { update } = useStudentMutations();
  const open = !!student;
  const detail = useApiStudent(student?.uid, open);
  const s = detail.data ?? student;

  const [form, setForm] = React.useState<Form>({ fullName: "", email: "", phoneNumber: "", dob: "", gender: "NONE" });
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const [lastId, setLastId] = React.useState<string | null>(null);
  if ((student?.uid ?? null) !== lastId) {
    setLastId(student?.uid ?? null);
    if (student) {
      setForm(toForm(student));
      setTouched(false);
      setServerErrors({});
      setFormError(null);
      update.reset();
    }
  }

  const errors = validate(form, student);
  const shown: Errors = touched ? { ...serverErrors, ...errors } : serverErrors;
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerErrors((e) => ({ ...e, [key]: undefined }));
  };
  const emailChanged = !!student && form.email.trim().toLowerCase() !== (student.email ?? "").toLowerCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!student) return;
    setTouched(true);
    setFormError(null);
    if (Object.keys(errors).length) return;
    update.mutate(
      {
        id: student.uid,
        payload: {
          fullName: form.fullName.trim().replace(/\s+/g, " "),
          dob: form.dob || null,
          gender: form.gender === "NONE" ? null : form.gender,
          phoneNumber: form.phoneNumber.trim() ? form.phoneNumber.replace(/[\s.()-]/g, "") : null,
          email: form.email.trim().toLowerCase(),
        },
      },
      {
        onSuccess: (r) => {
          toast.success(`Đã cập nhật thông tin của ${r.fullName}`);
          onOpenChange(false);
        },
        onError: (error) => {
          const status = apiErrorStatus(error);
          if (status === 409) {
            setServerErrors({ email: "Email này đã được dùng cho một tài khoản khác" });
            return;
          }
          if (status === 404) {
            setFormError("Không tìm thấy học sinh này trong trường. Có thể tài khoản đã bị xóa.");
            return;
          }
          const fields = serverFieldErrors(error);
          if (Object.values(fields).some(Boolean)) setServerErrors(fields);
          else setFormError(apiErrorMessage(error, "Không cập nhật được thông tin học sinh. Vui lòng thử lại."));
        },
      },
    );
  }

  const genderOptions: { value: GenderValue; label: string }[] = [
    ...(student?.gender ? [] : [{ value: "NONE" as const, label: "Chưa cập nhật" }]),
    { value: "MALE", label: "Nam" },
    { value: "FEMALE", label: "Nữ" },
    { value: "OTHER", label: "Khác" },
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => !update.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-lg")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Thông tin học sinh</DialogTitle>
            <DialogDescription className="text-content-muted">Mã học sinh và tên tài khoản không đổi được.</DialogDescription>
          </DialogHeader>

          {s && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-[var(--border-strong)] py-3">
              <Info label="Mã học sinh">
                <span className="font-mono font-bold">{s.studentCode || "—"}</span>
              </Info>
              <Info label="Tên tài khoản">
                <span className="font-mono text-xs">{s.userName}</span>
              </Info>
              <Info label="Token trong ví">
                <span className="tabular-nums">{formatNumber(s.token ?? 0)}</span>
              </Info>
              <Info label="Trạng thái">
                <AccountStatusBadge status={s.active ? "ACTIVE" : "LOCKED"} />
              </Info>
              <Info label="Ngày tạo">{formatDate(s.createdAt)}</Info>
              <Info label="Cập nhật">{formatDate(s.updatedAt)}</Info>
            </dl>
          )}

          <Field label="Họ và tên" required error={shown.fullName} htmlFor="student-edit-fullName">
            <StaffFormInput
              id="student-edit-fullName"
              value={form.fullName}
              autoComplete="off"
              aria-invalid={!!shown.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngày sinh" error={shown.dob} htmlFor="student-edit-dob">
              <StaffFormInput
                id="student-edit-dob"
                type="date"
                value={form.dob}
                max={todayIso()}
                aria-invalid={!!shown.dob}
                onChange={(e) => set("dob", e.target.value)}
              />
            </Field>
            <Field label="Giới tính" error={shown.gender}>
              <StaffFormSelect<GenderValue> value={form.gender} onValueChange={(v) => set("gender", v)} options={genderOptions} className="w-full" />
            </Field>
          </div>
          <Field
            label="Email đăng nhập"
            required
            error={shown.email}
            hint={
              emailChanged
                ? "Học sinh sẽ đăng nhập bằng email mới; email cũ không dùng được nữa."
                : isShadowEmail(form.email)
                  ? "Email do hệ thống cấp vì học sinh chưa có email riêng. Có thể thay bằng email thật của học sinh."
                  : undefined
            }
            htmlFor="student-edit-email"
          >
            <StaffFormInput
              id="student-edit-email"
              type="email"
              value={form.email}
              autoComplete="off"
              aria-invalid={!!shown.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại" error={shown.phoneNumber} hint="Để trống để xóa số điện thoại." htmlFor="student-edit-phone">
            <StaffFormInput
              id="student-edit-phone"
              type="tel"
              inputMode="tel"
              value={form.phoneNumber}
              autoComplete="off"
              placeholder="0912 345 678"
              aria-invalid={!!shown.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
            />
          </Field>

          {formError && (
            <p role="alert" className="text-sm text-[var(--accent-danger)]">
              {formError}
            </p>
          )}

          <DialogFooter className="gap-2">
            <button type="button" className="btn-line" disabled={update.isPending} onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson disabled:opacity-50" disabled={update.isPending}>
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Lưu thay đổi
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
