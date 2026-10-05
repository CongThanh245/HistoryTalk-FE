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
      "text-[var(--text-tertiary)] text-[11px] font-semibold uppercase tracking-[0.1em]",
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
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      "rounded-[2px] bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--text-primary)] transition-all h-10 disabled:pointer-events-auto disabled:cursor-not-allowed",
      className
    )}
    {...props}
  />
));
StaffFormInput.displayName = "StaffFormInput";

// ── Textarea ──
export type StaffFormTextareaProps = React.ComponentPropsWithoutRef<typeof Textarea>;

export const StaffFormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StaffFormTextareaProps
>(({ className, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(
      "rounded-[2px] bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--text-primary)] transition-all min-h-[140px] resize-none",
      className
    )}
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
          "rounded-[2px] bg-[var(--bg-elevated)] border-[var(--border-strong)] text-content-heading focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--text-primary)] transition-all h-10",
          className
        )}
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
