"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Chi bao dang tai lai du lieu (doi bo loc, tim kiem, sang trang) khi bang van hien du lieu cu.
 * Hien sau ~200ms (xem .fetching-delay) de khong nhap nhay khi API tra nhanh.
 */
export function FetchingBadge({ active, className }: { active: boolean; className?: string }) {
  if (!active) return null;
  return (
    <span role="status" className={cn("fetching-delay ml-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-gold)]", className)}>
      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Đang tải
    </span>
  );
}

/** Thanh chay ngang o mep tren cua bang. Khung chua phai co `relative`. */
export function FetchingBar({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span aria-hidden="true" className="fetching-delay pointer-events-none absolute inset-x-0 top-0 z-10 h-[3px] overflow-hidden">
      <span className="fetching-bar block h-full w-1/3 bg-[var(--accent-gold)]" />
    </span>
  );
}
