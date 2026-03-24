"use client";

import * as React from "react";
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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  isPending?: boolean;
  variant?: "danger" | "primary";
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  cancelLabel = "Hủy",
  confirmLabel = "Xác nhận",
  onConfirm,
  isPending = false,
  variant = "primary",
}: ConfirmDialogProps) {
  
  const confirmStyles =
    variant === "danger"
      ? { backgroundColor: "#ef4444", color: "#fff" } // fallback to red if var fails
      : { backgroundColor: "var(--accent-blue)", color: "#fff" };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            className="flex-1 rounded-xl h-11 border transition-all hover:bg-black/[0.03] active:scale-[0.98]"
            style={{ 
              background: "transparent",
              borderColor: "var(--card-light-border)",
              color: "var(--content-heading)"
            }}
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(
              "flex-1 rounded-xl h-11 border-0 shadow-lg shadow-blue-500/10 transition-all active:scale-[0.98]",
              isPending && "opacity-70 pointer-events-none"
            )}
            style={confirmStyles}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? "Đang xử lý..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
