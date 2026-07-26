"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

// ── Label ──
export type StaffFormLabelProps = React.ComponentPropsWithoutRef<typeof Label>;

export const StaffFormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  StaffFormLabelProps
>(({ className, ...props }, ref) => (
  <Label
    ref={ref}
    className={cn(
      "text-[var(--content-muted)] text-[11px] font-semibold uppercase tracking-wider",
      className
    )}
    {...props}
  />
));
StaffFormLabel.displayName = "StaffFormLabel";

// ── Input ──
export type StaffFormInputProps = React.ComponentPropsWithoutRef<typeof Input>;

export const StaffFormInput = React.forwardRef<
  HTMLInputElement,
  StaffFormInputProps
>(({ className, style, disabled, ...props }, ref) => (
  <Input
    ref={ref}
    disabled={disabled}
    className={cn(
      "border-[var(--card-light-border)] transition-all h-10 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:opacity-100",
      // Read-only (view mode) needs to look visibly locked, not just a
      // slightly-faded version of the editable state — same bg/border as
      // enabled made it easy to click in and wonder why nothing happens.
      disabled ? "bg-black/[0.05] border-dashed" : "bg-black/[0.02] focus:bg-white",
      className
    )}
    style={{ color: disabled ? "var(--content-muted)" : "var(--content-heading)", ...style }}
    {...props}
  />
));
StaffFormInput.displayName = "StaffFormInput";

// ── Textarea ──
export type StaffFormTextareaProps = React.ComponentPropsWithoutRef<typeof Textarea>;

export const StaffFormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StaffFormTextareaProps
>(({ className, style, disabled, ...props }, ref) => (
  <Textarea
    ref={ref}
    disabled={disabled}
    className={cn(
      "border-[var(--card-light-border)] transition-all min-h-[140px] resize-none disabled:opacity-100 disabled:cursor-not-allowed",
      disabled ? "bg-black/[0.05] border-dashed" : "bg-black/[0.02] focus:bg-white",
      className
    )}
    style={{ color: disabled ? "var(--content-muted)" : "var(--content-heading)", ...style }}
    {...props}
  />
));
StaffFormTextarea.displayName = "StaffFormTextarea";

// ── Select ──
export interface StaffFormSelectProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  options: { value: T; label: string }[];
  className?: string;
  disabled?: boolean;
}

export function StaffFormSelect<T extends string>({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  disabled,
}: StaffFormSelectProps<T>) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "border-[var(--card-light-border)] transition-all h-10 disabled:opacity-100 disabled:cursor-not-allowed",
          disabled ? "bg-black/[0.05] border-dashed" : "bg-black/[0.02] focus:bg-white",
          className
        )}
        style={{ color: disabled ? "var(--content-muted)" : "var(--content-heading)" }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
