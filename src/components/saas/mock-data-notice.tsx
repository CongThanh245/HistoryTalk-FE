"use client";

import * as React from "react";
import { DatabaseZap, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { useSaasStore } from "@/features/saas/store";
import { cn } from "@/lib/utils/cn";

/** Slim bar shown on every school (SaaS) screen while it runs on the mock store. */
export function MockDataNotice({ className }: { className?: string }) {
  const resetMockData = useSaasStore((s) => s.resetMockData);
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <div
        role="note"
        className={cn(
          "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-[2px] border border-[var(--status-warning-border)] bg-[var(--status-warning-bg)] px-3 py-1.5 text-xs text-[var(--text-secondary)]",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2">
          <DatabaseZap className="h-3.5 w-3.5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
          Dữ liệu mẫu — chưa kết nối API
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] underline-offset-4 hover:text-[var(--accent-gold)] hover:underline"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Khôi phục dữ liệu mẫu
        </button>
      </div>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Khôi phục dữ liệu mẫu?"
        description="Mọi thay đổi bạn đã thực hiện trên trường, lớp và tài khoản mẫu sẽ bị xóa và trở về dữ liệu ban đầu."
        confirmLabel="Khôi phục"
        variant="warning"
        onConfirm={() => {
          resetMockData();
          setOpen(false);
          toast.success("Đã khôi phục dữ liệu mẫu");
        }}
      />
    </>
  );
}
