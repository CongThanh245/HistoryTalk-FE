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
import { CircleNotchIcon } from "@phosphor-icons/react";

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
      ? { backgroundColor: "#ef4444", color: "#fff" }
      : variant === "warning"
        ? {
            backgroundColor: "var(--accent-gold)",
            color: "var(--bg-deep)",
            boxShadow: "0 0 14px var(--accent-gold-glow)",
          }
        : { backgroundColor: "var(--accent-blue)", color: "#fff" };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (isPending && !nextOpen) return;
        onOpenChange(nextOpen);
      }}
    >
      <AlertDialogContent
        className="max-w-[400px] rounded-2xl border"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle
            className="text-xl font-bold"
            style={{ color: "var(--content-heading)" }}
          >
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription
              className="text-sm leading-relaxed"
              style={{ color: "var(--content-muted)" }}
            >
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
          <AlertDialogCancel
            disabled={isPending}
            onClick={onCancel}
            className="flex-1 rounded-xl h-11 border transition-all hover:bg-black/[0.03] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
            style={{
              background: "transparent",
              borderColor: "var(--card-light-border)",
              color: "var(--content-heading)",
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            className={cn(
              "flex-1 rounded-xl h-11 border-0 shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70",
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
                <CircleNotchIcon className="h-4 w-4 animate-spin" />
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
