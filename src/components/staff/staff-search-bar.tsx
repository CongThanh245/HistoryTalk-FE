"use client";
import * as React from "react";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface StaffSearchBarProps {
  value: string; onChange: (v: string) => void; placeholder?: string;
  actionLabel?: string; actionGradient?: string; actionColor?: string;
  onAction?: () => void; filters?: React.ReactNode;
}
export function StaffSearchBar({ value, onChange, placeholder = "Tìm kiếm...", actionLabel = "Add New", actionGradient = "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)", actionColor = "var(--bg-deep)", onAction, filters }: StaffSearchBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative w-[300px]">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: "var(--content-subtle)" }} />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-10 h-10 rounded-xl border" style={{ background: "rgba(27,38,50,0.05)", borderColor: "var(--card-light-border)", color: "var(--content-text)" }} />
      </div>
      {filters}
      <div className="flex-1" />
      {onAction && (
        <Button type="button" className="h-10 rounded-xl px-4 font-semibold border-0 shrink-0" onClick={onAction} style={{ background: actionGradient, color: actionColor }}>
          <PlusIcon className="h-4 w-4 mr-1.5" />{actionLabel}
        </Button>
      )}
    </div>
  );
}
