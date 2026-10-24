"use client";

import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** "lg": the page's main search (catalog pages), taller and rounder. */
  size?: "default" | "lg";
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm...", size = "default" }: SearchInputProps) {
  const large = size === "lg";
  return (
    <div
      className={cn(
        "w-full flex items-center border transition-[border-color,box-shadow] duration-150 bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--border-strong)] focus-within:border-[var(--accent-gold)] focus-within:shadow-[0_0_0_3px_var(--accent-gold-active-bg)]",
        large ? "h-14 gap-3 rounded-xl px-5" : "h-10 gap-2.5 rounded-lg px-3.5",
      )}
    >
      <Search className={cn("shrink-0 text-content-subtle", large ? "h-5 w-5" : "h-4 w-4")} aria-hidden="true" />
      <input
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn("min-w-0 flex-1 bg-transparent outline-none text-content-text placeholder:text-content-subtle [&::-webkit-search-cancel-button]:hidden", large ? "text-base" : "text-sm")}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Xóa tìm kiếm"
          className="grid h-7 w-7 place-items-center rounded-full cursor-pointer transition-colors text-content-subtle hover:bg-[var(--status-neutral-bg)] hover:text-content-heading"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
