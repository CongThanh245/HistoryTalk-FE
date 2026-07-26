"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // Đảm bảo bạn đã cài shadcn pagination
import { cn } from "@/lib/utils/cn";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function CustomPagination({
  page,
  totalPages,
  onChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Giữ nguyên logic tính toán dải trang của bạn
  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    pages.push(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  // Style chung cho các nút
  const commonClasses = "bg-card-bg border border-card-border text-content-text";

  // Style riêng cho nút đang active
  const activeClasses = "bg-[var(--burning-flame)] text-bg-deep shadow-[0_2px_8px_var(--accent-gold-glow)] border-none";

  return (
    <Pagination className="pt-4">
      <PaginationContent className="gap-1.5">
        {/* Nút Quay lại */}
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page > 1) onChange(page - 1);
            }}
            aria-disabled={page === 1}
            className={cn(
              "w-auto h-8 p-0 justify-center transition-all hover:opacity-80",
              page === 1 ? "opacity-30 cursor-not-allowed" : "cursor-pointer",
              commonClasses,
            )}
          />
        </PaginationItem>

        {/* Danh sách các số trang */}
        {getPages().map((p, i) => (
          <PaginationItem key={i}>
            {p === "..." ? (
              <PaginationEllipsis
                className="w-8 h-8 text-content-muted"
              />
            ) : (
              <PaginationLink
                href="#"
                isActive={page === p}
                onClick={(e) => {
                  e.preventDefault();
                  onChange(p as number);
                }}
                className={cn(
                  "w-8 h-8 p-0 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer",
                  page === p ? activeClasses : commonClasses,
                )}
              >
                {p}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        {/* Nút Tiếp theo */}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (page < totalPages) onChange(page + 1);
            }}
            aria-disabled={page === totalPages}
            className={cn(
              "w-auto h-8 p-0 justify-center transition-all hover:opacity-80",
              page === totalPages
                ? "opacity-30 cursor-not-allowed"
                : "cursor-pointer",
              commonClasses,
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
