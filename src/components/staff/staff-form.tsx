"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectEmpty,
  SelectItem,
  SelectSearch,
  SelectTrigger,
  SelectValue,
  useSelectSearch,
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
      "text-[13.5px] font-semibold text-[var(--text-primary)]",
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
      "rounded-lg bg-[var(--bg-elevated)] border-[var(--border-default)] text-content-heading placeholder:text-content-subtle hover:border-[var(--border-strong)] focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--accent-gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-gold-active-bg)] transition-[border-color,box-shadow] h-10 disabled:pointer-events-auto disabled:cursor-not-allowed",
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
      "rounded-lg bg-[var(--bg-elevated)] border-[var(--border-default)] text-content-heading placeholder:text-content-subtle hover:border-[var(--border-strong)] focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--accent-gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-gold-active-bg)] transition-[border-color,box-shadow] min-h-[140px] resize-none",
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
  /** Mac dinh: tu hien o tim kiem khi danh sach dai hon SEARCH_THRESHOLD. */
  searchable?: boolean;
}

const SEARCH_THRESHOLD = 7;

export function StaffFormSelect<T extends string>({
  value,
  onValueChange,
  placeholder,
  options,
  className,
  disabled,
  searchable = options.length > SEARCH_THRESHOLD,
}: StaffFormSelectProps<T>) {
  const { search, setSearch, matches, onOpenChange } = useSelectSearch();
  // Giu lai muc dang chon de SelectValue khong mat chu khi loc.
  const shown = options.filter((opt) => opt.value === value || matches(opt.label));
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled} onOpenChange={onOpenChange}>
      <SelectTrigger
        className={cn(
          "rounded-lg bg-[var(--bg-elevated)] border-[var(--border-default)] text-content-heading placeholder:text-content-subtle hover:border-[var(--border-strong)] focus:bg-[var(--bg-elevated)] focus-visible:border-[var(--accent-gold)] focus-visible:ring-[3px] focus-visible:ring-[var(--accent-gold-active-bg)] transition-[border-color,box-shadow] h-10",
          className
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" side="bottom" align="start" className={cn(searchable && "max-h-80")}>
        {searchable && <SelectSearch value={search} onChange={setSearch} />}
        {shown.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
        {!options.some((opt) => matches(opt.label)) && <SelectEmpty />}
      </SelectContent>
    </Select>
  );
}
