"use client";

import * as React from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChangePassword } from "@/features/profile/hooks";
import { cn } from "@/lib/utils/cn";

type Field = "currentPassword" | "newPassword" | "confirmPassword";

const LABELS: Record<Field, string> = {
  currentPassword: "Mật khẩu hiện tại",
  newPassword: "Mật khẩu mới",
  confirmPassword: "Xác nhận mật khẩu mới",
};

const EMPTY: Record<Field, string> = { currentPassword: "", newPassword: "", confirmPassword: "" };

/**
 * Change your own password (PATCH /users/me/password) from the account menu. For roles whose area has no profile
 * page — staff and school admins are kept out of /profile — this is their only way to change it.
 */
export function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { mutate: changePassword, isPending } = useChangePassword();
  const [form, setForm] = React.useState(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [visible, setVisible] = React.useState<Partial<Record<Field, boolean>>>({});

  // Start clean every time the dialog opens.
  const [lastOpen, setLastOpen] = React.useState(open);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setForm(EMPTY);
      setErrors({});
      setVisible({});
    }
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<Field, string>> = {};
    if (!form.currentPassword) next.currentPassword = "Nhập mật khẩu hiện tại";
    if (!form.newPassword) next.newPassword = "Nhập mật khẩu mới";
    else if (form.newPassword.length < 8) next.newPassword = "Mật khẩu tối thiểu 8 ký tự";
    else if (form.newPassword === form.currentPassword) next.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = "Mật khẩu xác nhận không khớp";
    setErrors(next);
    if (Object.keys(next).length) return;
    changePassword(form, { onSuccess: () => onOpenChange(false) });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isPending && onOpenChange(o)}>
      <DialogContent className="staff-theme sm:max-w-md">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Đổi mật khẩu</DialogTitle>
            <DialogDescription>Mật khẩu mới có ít nhất 8 ký tự và khác mật khẩu hiện tại.</DialogDescription>
          </DialogHeader>

          {(Object.keys(LABELS) as Field[]).map((field) => (
            <div key={field} className="space-y-1.5">
              <label htmlFor={`pw-${field}`} className="text-sm font-semibold text-content-heading">
                {LABELS[field]}
              </label>
              <div className="relative">
                <input
                  id={`pw-${field}`}
                  type={visible[field] ? "text" : "password"}
                  autoComplete={field === "currentPassword" ? "current-password" : "new-password"}
                  value={form[field]}
                  aria-invalid={!!errors[field]}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, [field]: e.target.value }));
                    if (errors[field]) setErrors((s) => ({ ...s, [field]: undefined }));
                  }}
                  className={cn(
                    "h-10 w-full rounded-lg border bg-[var(--bg-elevated)] px-3 pr-10 text-sm text-content-heading outline-none transition-[border-color,box-shadow] focus-visible:border-[var(--accent-gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-gold-active-bg)]",
                    errors[field] ? "border-[var(--accent-danger)]" : "border-[var(--border-default)]",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => ({ ...v, [field]: !v[field] }))}
                  aria-label={visible[field] ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1 text-content-muted hover:text-content-heading"
                >
                  {visible[field] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors[field] && <p className="text-xs text-[var(--accent-danger)]">{errors[field]}</p>}
            </div>
          ))}

          <DialogFooter className="items-center gap-2 sm:justify-between">
            <Link href="/forgot-password" className="text-sm text-content-muted hover:text-content-heading hover:underline">
              Quên mật khẩu?
            </Link>
            <div className="flex gap-2">
              <button type="button" className="btn-line" disabled={isPending} onClick={() => onOpenChange(false)}>
                Hủy
              </button>
              <button type="submit" className="btn-crimson disabled:opacity-50" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Đổi mật khẩu
              </button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
