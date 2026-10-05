"use client";

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
        className="max-w-[400px] rounded-[2px] border bg-card-bg border-[var(--text-primary)]"
      >
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle
            className="archive-title is-plain text-2xl"
          >
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
        <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isPending}
            onClick={onCancel}
            className="flex-1 rounded-[2px] h-11 border text-[13px] font-bold uppercase tracking-[0.08em] transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 bg-transparent border-[var(--text-primary)] text-content-heading"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={cn(
              "flex-1 rounded-[2px] h-11 border-0 text-[13px] font-bold uppercase tracking-[0.08em] transition-[filter,transform] hover:brightness-90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70",
            )}
            style={confirmStyles}
            onClick={(e) => {
              e.preventDefault();
              if (isPending) return;
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
