"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StaffFormInput } from "@/components/staff/staff-form";
import { DIALOG_CLASS, DIALOG_TITLE_CLASS, Field, isValidEmail } from "@/components/saas/saas-ui";
import { isValidVnPhone } from "@/components/saas/accounts-utils";
import { apiErrorMessage, apiErrorStatus, useCreateApiTeacher } from "@/features/saas/hooks-api";
import type { ApiTeacher } from "@/services/school.service";
import { cn } from "@/lib/utils/cn";

type Errors = Partial<Record<"fullName" | "email" | "phoneNumber", string>>;

function validate(v: { fullName: string; email: string; phoneNumber: string }): Errors {
  const e: Errors = {};
  const name = v.fullName.trim();
  if (!name) e.fullName = "Nhập họ và tên";
  else if (name.length < 2 || name.length > 150) e.fullName = "Họ tên từ 2 đến 150 ký tự";
  if (!v.email.trim()) e.email = "Nhập email";
  else if (!isValidEmail(v.email)) e.email = "Email không hợp lệ";
  if (v.phoneNumber.trim() && !isValidVnPhone(v.phoneNumber)) e.phoneNumber = "Số di động Việt Nam 10 số, ví dụ 0912 345 678";
  return e;
}

function serverFieldErrors(error: unknown): Errors {
  if (typeof error !== "object" || error === null || !("response" in error)) return {};
  const errors = (error as { response?: { data?: { errors?: Record<string, string> } } }).response?.data?.errors;
  if (!errors) return {};
  return { fullName: errors.fullName, email: errors.email, phoneNumber: errors.phoneNumber };
}

/**
 * Create a Teacher account (POST /school-admin/teachers): full name, email and phone only. The backend generates
 * the user name and a temporary password, returned once in `onCreated`.
 */
export function TeacherCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (teacher: ApiTeacher) => void;
}) {
  const create = useCreateApiTeacher();
  const [form, setForm] = React.useState({ fullName: "", email: "", phoneNumber: "" });
  const [touched, setTouched] = React.useState(false);
  const [serverErrors, setServerErrors] = React.useState<Errors>({});
  const [formError, setFormError] = React.useState<string | null>(null);

  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm({ fullName: "", email: "", phoneNumber: "" });
      setTouched(false);
      setServerErrors({});
      setFormError(null);
      create.reset();
    }
  }

  const errors = validate(form);
  const shown: Errors = touched ? { ...serverErrors, ...errors } : serverErrors;
  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setServerErrors((s) => ({ ...s, [key]: undefined }));
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setFormError(null);
    if (Object.keys(errors).length) return;
    create.mutate(
      {
        fullName: form.fullName.trim().replace(/\s+/g, " "),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim() ? form.phoneNumber.replace(/[\s.()-]/g, "") : undefined,
      },
      {
        onSuccess: (teacher) => {
          onOpenChange(false);
          onCreated(teacher);
        },
        onError: (error) => {
          if (apiErrorStatus(error) === 409) {
            setServerErrors({ email: "Email này đã được dùng cho một tài khoản khác" });
            return;
          }
          const fields = serverFieldErrors(error);
          if (Object.values(fields).some(Boolean)) setServerErrors(fields);
          else setFormError(apiErrorMessage(error, "Không tạo được tài khoản giáo viên. Vui lòng thử lại."));
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !create.isPending && onOpenChange(o)}>
      <DialogContent className={cn(DIALOG_CLASS, "sm:max-w-md")}>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle className={DIALOG_TITLE_CLASS}>Thêm giáo viên</DialogTitle>
            <DialogDescription className="text-content-muted">
              Hệ thống tự tạo tên tài khoản và mật khẩu tạm. Giáo viên đăng nhập bằng email và phải đổi mật khẩu ở lần đầu.
            </DialogDescription>
          </DialogHeader>

          <Field label="Họ và tên" required error={shown.fullName} htmlFor="teacher-fullName">
            <StaffFormInput
              id="teacher-fullName"
              value={form.fullName}
              autoComplete="off"
              placeholder="VD: Trần Thị Lan"
              aria-invalid={!!shown.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </Field>
          <Field label="Email đăng nhập" required error={shown.email} htmlFor="teacher-email">
            <StaffFormInput
              id="teacher-email"
              type="email"
              value={form.email}
              autoComplete="off"
              placeholder="giaovien@truong.edu.vn"
              aria-invalid={!!shown.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại" error={shown.phoneNumber} htmlFor="teacher-phone">
            <StaffFormInput
              id="teacher-phone"
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
            <button type="button" className="btn-line" disabled={create.isPending} onClick={() => onOpenChange(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-crimson disabled:opacity-50" disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Tạo tài khoản
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
