"use client";

import * as React from "react";
import { Upload, Trash2 } from "lucide-react";
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
  /** Largest file the backend accepts for this slot; bigger picks are refused here instead of failing with 413. */
  maxMb?: number;
  onClear?: () => void;
  errorMessage?: string;
  children?: React.ReactNode;
}

/** Whether a file matches an input's accept list (".glb", "image/png", "video/*"). The OS picker can be switched to "All files". */
export function matchesAccept(file: File, accept: string) {
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean)
    .some((a) => (a.startsWith(".") ? name.endsWith(a) : a.endsWith("/*") ? type.startsWith(a.slice(0, -1)) : type === a));
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
  maxMb,
  onClear,
  errorMessage,
  children,
}: MediaSlotFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = React.useState<string | null>(null);

  const pick = (file: File) => {
    if (!matchesAccept(file, accept)) {
      setPickError(`“${file.name}” không đúng định dạng.${hint ? ` Chỉ nhận ${hint.split(" · ")[0]}.` : ""}`);
      return;
    }
    if (maxMb && file.size > maxMb * 1024 * 1024) {
      setPickError(`“${file.name}” nặng ${(file.size / 1024 / 1024).toFixed(1)}MB, vượt giới hạn ${maxMb}MB.`);
      return;
    }
    setPickError(null);
    onPick(file);
  };
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
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            {hasValue ? "Thay đổi" : "Tải lên"}
          </Button>
          {hasValue && onClear && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || isBusy}
              onClick={onClear}
              className="text-accent-danger"
            >
              <Trash2 className="mr-1 h-3.5 w-3.5" />
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
            if (file) pick(file);
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
          {/* At 100% the bytes are sent but the server is still storing/transcoding: say so instead of a frozen 100%. */}
          <span className="text-[11px] tabular-nums" style={{ color: "var(--content-muted)" }}>
            {progress >= 100 ? "Đang xử lý…" : `${progress}%`}
          </span>
        </div>
      )}
      {hint && (
        <p className="text-[11px]" style={{ color: "var(--content-subtle)" }}>
          {hint}
        </p>
      )}
      {caption && (
        <p className="text-xs text-content-muted">
          {caption}
        </p>
      )}
      {(pickError || errorMessage) && (
        <p role="alert" className="text-[11px] font-medium text-accent-danger">
          {pickError ?? errorMessage}
        </p>
      )}
      {children}
    </div>
  );
}
