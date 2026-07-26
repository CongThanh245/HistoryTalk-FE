"use client";

import * as React from "react";
import { UploadSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { StaffFormLabel } from "@/components/staff/staff-form";

interface MediaSlotFieldProps {
  label: string;
  icon?: React.ReactNode;
  accept: string;
  disabled?: boolean;
  isBusy?: boolean;
  /** Upload progress 0-100 while a direct upload is in flight; renders a progress bar instead of the plain "busy" state */
  progress?: number | null;
  /** Whether a value (uploaded or pending) currently occupies this slot */
  hasValue: boolean;
  /** Small caption under the controls, e.g. selected file name or "Đã có ảnh" */
  caption?: string;
  /** Always-visible constraint hint (format/size limit), shown regardless of state so it's known before picking a file */
  hint?: string;
  onPick: (file: File) => void;
  onClear?: () => void;
  errorMessage?: string;
  children?: React.ReactNode;
}

/**
 * One upload/replace/clear control for a single media slot (character image,
 * 3D model, video, context image...). Shared across staff character/context
 * detail views so each slot doesn't reimplement the same file-input wiring.
 */
export function MediaSlotField({
  label,
  icon,
  accept,
  disabled,
  isBusy,
  progress,
  hasValue,
  caption,
  hint,
  onPick,
  onClear,
  errorMessage,
  children,
}: MediaSlotFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const showProgressBar = isBusy && typeof progress === "number";

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <StaffFormLabel className="flex items-center gap-1.5">
          {icon}
          {label}
        </StaffFormLabel>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={disabled || isBusy}
            onClick={() => inputRef.current?.click()}
          >
            <UploadSimpleIcon className="mr-1.5 h-3.5 w-3.5" />
            {hasValue ? "Thay đổi" : "Tải lên"}
          </Button>
          {hasValue && onClear && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || isBusy}
              onClick={onClear}
              style={{ color: "var(--accent-danger)" }}
            >
              <TrashIcon className="mr-1 h-3.5 w-3.5" />
              Xóa
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </div>
      {showProgressBar && (
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full"
            style={{ background: "var(--card-light-border)" }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%`, background: "var(--accent-blue)" }}
            />
          </div>
          <span className="text-[11px] tabular-nums" style={{ color: "var(--content-muted)" }}>
            {progress}%
          </span>
        </div>
      )}
      {hint && (
        <p className="text-[11px]" style={{ color: "var(--content-subtle)" }}>
          {hint}
        </p>
      )}
      {caption && (
        <p className="text-xs" style={{ color: "var(--content-muted)" }}>
          {caption}
        </p>
      )}
      {errorMessage && (
        <p className="text-[11px] font-medium" style={{ color: "var(--accent-danger)" }}>
          {errorMessage}
        </p>
      )}
      {children}
    </div>
  );
}
