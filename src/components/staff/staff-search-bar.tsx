"use client";
import * as React from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StaffSearchBarProps {
  value: string; onChange: (v: string) => void; placeholder?: string;
  actionLabel?: string;
  onAction?: () => void; filters?: React.ReactNode;
}
export function StaffSearchBar({ value, onChange, placeholder = "Tìm kiếm...", actionLabel = "Add New", onAction, filters }: StaffSearchBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-content-subtle" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-10 h-10 rounded-xl border border-card-border bg-bg-main/50 text-content-text"
        />
      </div>
      {filters}
      <div className="flex-1" />
      {onAction && (
        <Button type="button" className="h-10 rounded-xl px-4 font-semibold border-0 shrink-0 bg-primary text-primary-foreground" onClick={onAction}>
          <Plus className="h-4 w-4 mr-1.5" />{actionLabel}
        </Button>
      )}
    </div>
  );
}
