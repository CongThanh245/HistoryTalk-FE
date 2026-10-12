"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, isValidEmail } from "@/components/saas/saas-ui";
import { apiErrorMessage, apiErrorStatus, useTeacherMutations } from "@/features/saas/hooks-api";
import type { ApiTeacher } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

type Errors = Partial<Record<"fullName" | "email" | "phoneNumber", string>>;

/** Phone: optional, ≤ 20 characters (backend limit), digits with spaces / dots / dashes / parentheses and an optional leading +. */
export const isLoosePhone = (v: string) => v.trim().length <= 20 && /^\+?[\d\s.()-]{6,}$/.test(v.trim());

function validate(v: { fullName: string; email: string; phoneNumber: string }): Errors {
  const e: Errors = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = "Nhập họ và tên";
  else if (name.length < 2 || name.length > 150) e.fullName = "Họ tên từ 2 đến 150 ký tự";
  if (!v.email.trim()) e.email = "Nhập email";
  else if (!isValidEmail(v.email)) e.email = "Email không hợp lệ";
  if (v.phoneNumber.trim() && !isLoosePhone(v.phoneNumber)) e.phoneNumber = "Số điện thoại không hợp lệ (tối đa 20 ký tự)";
  return e;
}

function serverFieldErrors(error: unknown): Errors {
  if (typeof error !== "object" || error === null || !("response" in error)) return {};
  const data = (error as { response?: { data?: { errors?: Record<string, string>; data?: Record<string, string> } } }).response?.data;
  const errors = data?.errors ?? (data?.data && typeof data.data === "object" ? data.data : undefined);
  if (!errors) return {};
  return { fullName: errors.fullName, email: errors.email, phoneNumber: errors.phoneNumber };
}

/** Edit a teacher's name, login email and phone (PUT /school-admin/teachers/{id}, full replace). */
export function TeacherEditDialog({
  teacher,
  onOpenChange,
}: {
  /** Open while set. */
  teacher: ApiTeacher | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { update } = useTeacherMutations();
  const open = !!teacher;
  const [form, setForm] = React.useState({ fullName: "", email: "", phoneNumber: "" });
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const [lastId, setLastId] = React.useState<string | null>(null);
  if ((teacher?.uid ?? null) !== lastId) {
    setLastId(teacher?.uid ?? null);
    if (teacher) {
      setForm({ fullName: teacher.fullName, email: teacher.email, phoneNumber: teacher.phoneNumber ?? "" });
      setTouched(false);
      setServerErrors({});
      setFormError(null);
      update.reset();
    }
  }

  const errors = validate(form);
  const shown: Errors = touched ? { ...serverErrors, ...errors } : serverErrors;
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerErrors((s) => ({ ...s, [key]: undefined }));
  };
  const emailChanged = !!teacher && form.email.trim().toLowerCase() !== teacher.email.toLowerCase();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!teacher) return;
    setTouched(true);
    setFormError(null);
    if (Object.keys(errors).length) return;
    update.mutate(
      {
        id: teacher.uid,
        payload: {
          fullName: form.fullName.trim().replace(/\s+/g, " "),
          email: form.email.trim().toLowerCase(),
          phoneNumber: form.phoneNumber.trim() ? form.phoneNumber.replace(/[\s.()-]/g, "") : undefined,
        },
      },
      {
        onSuccess: (t) => {
          toast.success(`Đã cập nhật thông tin của ${t.fullName}`);
          onOpenChange(false);
        },
        onError: (error) => {
          if (apiErrorStatus(error) === 409) {
            setServerErrors({ email: "Email này đã được dùng cho một tài khoản khác" });
            return;
          }
          if (apiErrorStatus(error) === 404) {
            setFormError("Không tìm thấy giáo viên này trong trường. Có thể tài khoản đã bị xóa.");
            return;
          }
          const fields = serverFieldErrors(error);
          if (Object.values(fields).some(Boolean)) setServerErrors(fields);
          else setFormError(apiErrorMessage(error, "Không cập nhật được thông tin giáo viên. Vui lòng thử lại."));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !update.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Sửa thông tin giáo viên</DialogTitle>
            <DialogDescription className="text-content-muted">
              Tên tài khoản <span className="break-all font-mono text-content-text">{teacher?.userName}</span> không đổi.
            </DialogDescription>
          </DialogHeader>

          <Field label="Họ và tên" required error={shown.fullName} htmlFor="teacher-edit-fullName">
            <StaffFormInput
              id="teacher-edit-fullName"
              value={form.fullName}
              autoComplete="off"
              aria-invalid={!!shown.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>
          <Field
            label="Email đăng nhập"
            required
            error={shown.email}
            hint={emailChanged ? "Giáo viên sẽ đăng nhập bằng email mới; email cũ không dùng được nữa." : undefined}
            htmlFor="teacher-edit-email"
          >
            <StaffFormInput
              id="teacher-edit-email"
              type="email"
              value={form.email}
              autoComplete="off"
              aria-invalid={!!shown.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại" error={shown.phoneNumber} hint="Để trống để xóa số điện thoại." htmlFor="teacher-edit-phone">
            <StaffFormInput
              id="teacher-edit-phone"
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
