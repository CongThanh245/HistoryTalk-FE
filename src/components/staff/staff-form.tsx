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
export interface StaffFormLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {}

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
export interface StaffFormInputProps extends React.ComponentPropsWithoutRef<typeof Input> {}

export const StaffFormInput = React.forwardRef<
  HTMLInputElement,
  StaffFormInputProps
>(({ className, style, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn(
      "bg-black/[0.02] border-[var(--card-light-border)] focus:bg-white transition-all h-10",
      className
    )}
    style={{ color: "var(--content-heading)", ...style }}
    {...props}
  />
));
StaffFormInput.displayName = "StaffFormInput";

// ── Textarea ──
export interface StaffFormTextareaProps extends React.ComponentPropsWithoutRef<typeof Textarea> {}

export const StaffFormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  StaffFormTextareaProps
>(({ className, style, ...props }, ref) => (
  <Textarea
    ref={ref}
    className={cn(
      "bg-black/[0.02] border-[var(--card-light-border)] focus:bg-white transition-all min-h-[140px] resize-none",
      className
    )}
    style={{ color: "var(--content-heading)", ...style }}
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
          "bg-black/[0.02] border-[var(--card-light-border)] focus:bg-white transition-all h-10",
          className
        )}
        style={{ color: "var(--content-heading)" }}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
