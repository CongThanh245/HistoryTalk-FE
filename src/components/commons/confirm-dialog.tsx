"use client";

import type * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  /** Chay them logic tuy chinh khi bam Huy (vi du: bat dau lai tu dau thay vi chi dong dialog). */
  onCancel?: () => void;
  isPending?: boolean;
  variant?: "danger" | "primary" | "warning";
  /** Extra content under the description (e.g. the list of affected records). */
  children?: React.ReactNode;
  /** Disables the confirm button (e.g. when the action is not allowed). */
  confirmDisabled?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Hủy",
  confirmLabel = "Xác nhận",
  onConfirm,
  onCancel,
  isPending = false,
  variant = "primary",
  children,
  confirmDisabled = false,
}: ConfirmDialogProps) {
  const confirmStyles =
    variant === "danger"
      ? { backgroundColor: "var(--accent-danger)", color: "#FFFFFF" }
      : variant === "warning"
        ? { backgroundColor: "var(--status-warning)", color: "#FFFFFF" }
        : { backgroundColor: "var(--accent-gold)", color: "#FFFFFF" };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        className="max-w-[420px] gap-5 rounded-md border bg-card-bg border-border-card shadow-[var(--shadow-strong)]"
      >
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-content-heading">
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription
              className="text-sm leading-relaxed text-content-muted"
            >
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children && <div className="max-h-[40dvh] overflow-y-auto text-sm text-content-text">{children}</div>}
        {/* Sentence-case buttons sized to their label, right-aligned: the action reads, it doesn't shout. */}
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            disabled={isPending}
            onClick={onCancel}
            className="h-10 rounded-sm border px-4 text-sm font-semibold transition-colors hover:bg-[var(--status-neutral-bg)] hover:text-content-heading hover:border-[var(--border-strong)] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--border-strong)] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 bg-transparent border-border-card text-content-heading"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending || confirmDisabled}
            className={cn(
              "h-10 rounded-sm border-0 px-4 text-sm font-semibold transition-[filter,transform] hover:brightness-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70",
            )}
            style={confirmStyles}
            onClick={(e) => {
              e.preventDefault();
              if (isPending || confirmDisabled) return;
              onConfirm();
            }}
          >
            {isPending ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </span>
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
