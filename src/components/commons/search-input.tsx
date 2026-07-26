"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }: SearchInputProps) {
  return (
    <div
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-150 focus-within:border-[rgba(201,162,77,0.4)] bg-card-bg border-card-border"
    >
      <Search className="w-4 h-4 shrink-0 text-content-subtle" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-sm outline-none text-content-text"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="text-xs cursor-pointer transition-opacity hover:opacity-70 text-content-subtle"
        >
          ✕
        </button>
      )}
    </div>
  );
}