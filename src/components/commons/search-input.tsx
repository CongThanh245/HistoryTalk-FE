"use client";

import { MagnifyingGlassIcon } from "@phosphor-icons/react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }: SearchInputProps) {
  return (
    <div
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 focus-within:border-[rgba(201,162,77,0.4)]"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <MagnifyingGlassIcon className="w-4 h-4 shrink-0" style={{ color: "var(--content-subtle)" }} />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none"
        style={{ color: "var(--content-text)" }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-xs cursor-pointer transition-opacity hover:opacity-70"
          style={{ color: "var(--content-subtle)" }}
        >
          ✕
        </button>
      )}
    </div>
  );
}