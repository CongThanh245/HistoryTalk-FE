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
  /** Whether a value (uploaded or pending) currently occupies this slot */
  hasValue: boolean;
  /** Small caption under the controls, e.g. selected file name or "Đã có ảnh" */
  caption?: string;
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
  hasValue,
  caption,
  onPick,
  onClear,
  errorMessage,
  children,
}: MediaSlotFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

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
