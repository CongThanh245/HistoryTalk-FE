"use client";

import * as React from "react";
import { KeyRound, Mail } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { Classroom } from "@/features/saas/types";
import { cn } from "@/lib/utils/cn";

/* ───────────────────────── Side drawer ───────────────────────── */
/** Right-hand drawer for create / edit forms. Full width on phones, 32rem on larger screens. */
export function AccountDrawer({
  open,
  onOpenChange,
  title,
  description,
  footer,
  children,
  wide,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  footer: React.ReactNode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "staff-theme w-full max-w-full gap-0 border-l border-border-card bg-[var(--bg-surface)] p-0 text-content-text sm:max-w-lg",
          wide && "sm:max-w-xl",
        )}
      >
        <SheetHeader className="border-b border-[var(--border-default)] px-5 pb-4 pt-5 pr-12">
          <SheetTitle className="archive-title is-plain text-2xl">{title}</SheetTitle>
          {description && <SheetDescription className="text-sm text-content-muted">{description}</SheetDescription>}
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">{children}</div>
        <SheetFooter className="mt-0 flex-col-reverse gap-2 border-t border-[var(--border-default)] px-5 py-4 sm:flex-row sm:justify-end">
          {footer}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

/** Small section title inside forms (plain text, not an eyebrow label). */
export function FormSection({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-1 text-sm font-bold text-content-heading">{title}</legend>
      {description && <p className="-mt-2 text-xs text-content-muted">{description}</p>}
      {children}
    </fieldset>
  );
}

/* ───────────────────────── Account setup ───────────────────────── */
export type AccountSetupMode = "INVITE" | "TEMP_PASSWORD";

/** Radio choice: send an activation email, or create a temp password shown once. */
export function AccountSetupChoice({
  value,
  onChange,
  name,
  email,
}: {
  value: AccountSetupMode;
  onChange: (v: AccountSetupMode) => void;
  name: string;
  email?: string;
}) {
  const options: { value: AccountSetupMode; icon: typeof Mail; title: string; text: string }[] = [
    {
      value: "INVITE",
      icon: Mail,
      title: "Gửi email mời",
      text: email ? `Gửi liên kết kích hoạt tới ${email}. Tài khoản ở trạng thái Chờ kích hoạt.` : "Gửi liên kết kích hoạt qua email. Tài khoản ở trạng thái Chờ kích hoạt.",
    },
    {
      value: "TEMP_PASSWORD",
      icon: KeyRound,
      title: "Tạo mật khẩu tạm",
      text: "Tài khoản hoạt động ngay. Mật khẩu tạm hiển thị một lần để bạn gửi trực tiếp.",
    },
  ];
  return (
    <div role="radiogroup" aria-label="Cách kích hoạt tài khoản" className="grid gap-2 sm:grid-cols-2">
      {options.map((o) => {
        const checked = value === o.value;
        const Icon = o.icon;
        return (
          <label
            key={o.value}
            className={cn(
              "flex cursor-pointer gap-3 rounded-sm border p-3 transition-colors focus-within:outline-2 focus-within:outline-[var(--accent-gold)]",
              checked ? "border-border-card bg-[var(--status-neutral-bg)]" : "border-[var(--border-strong)] hover:border-[var(--text-primary)]",
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={checked}
              onChange={() => onChange(o.value)}
              className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent-gold)]"
            />
            <span className="space-y-1">
              <span className="flex items-center gap-1.5 text-sm font-bold text-content-heading">
                <Icon className="h-4 w-4 text-[var(--accent-gold)]" aria-hidden="true" />
                {o.title}
              </span>
              <span className="block text-xs leading-relaxed text-content-muted">{o.text}</span>
            </span>
          </label>
        );
      })}
    </div>
  );
}

/* ───────────────────────── Class checklist ───────────────────────── */
/** Multi-select of classes grouped by grade; each item can show a note (e.g. "đã có GVCN: …"). */
export function ClassChecklist({
  classes,
  selected,
  onChange,
  note,
  disabledIds,
  label,
}: {
  classes: Classroom[];
  selected: string[];
  onChange: (ids: string[]) => void;
  note?: (c: Classroom) => React.ReactNode;
  disabledIds?: string[];
  label: string;
}) {
  const byGrade = React.useMemo(() => {
    const m = new Map<number, Classroom[]>();
    for (const c of classes) m.set(c.grade, [...(m.get(c.grade) ?? []), c]);
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [classes]);
  const disabled = new Set(disabledIds);

  if (classes.length === 0) return <p className="text-sm text-content-muted">Trường chưa có lớp nào.</p>;

  return (
    <div role="group" aria-label={label} className="max-h-60 space-y-3 overflow-y-auto rounded-sm border border-[var(--border-strong)] p-3">
      {byGrade.map(([grade, list]) => (
        <div key={grade} className="space-y-1.5">
          <p className="text-xs font-bold text-content-muted">Khối {grade}</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {list.map((c) => {
              const checked = selected.includes(c.id);
              const isDisabled = disabled.has(c.id);
              return (
                <label
                  key={c.id}
                  className={cn("flex items-start gap-2 rounded-sm px-1.5 py-1 text-sm", isDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-[var(--status-neutral-bg)]")}
                >
                  <Checkbox
                    className="mt-0.5"
                    checked={checked}
                    disabled={isDisabled}
                    onCheckedChange={(v) => onChange(v === true ? [...selected, c.id] : selected.filter((x) => x !== c.id))}
                  />
                  <span className="min-w-0">
                    <span className="font-semibold">{c.name}</span>
                    {note && <span className="block text-[11px] leading-snug text-content-muted">{note(c)}</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
