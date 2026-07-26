"use client";

import { RotateCcw, Search, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

type CharacterListToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "all" | "published" | "draft";
  onStatusFilterChange: (value: "all" | "published" | "draft") => void;
  eraFilter: string;
  onEraFilterChange: (value: string) => void;
  showTrash: boolean;
  trashCount: number;
  onToggleTrash: () => void;
  onCreate: () => void;
};

export function CharacterListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  eraFilter,
  onEraFilterChange,
  showTrash,
  trashCount,
  onToggleTrash,
  onCreate,
}: CharacterListToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
      <div className="relative w-full sm:w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-subtle" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tên, chức vị..."
          className="pl-10 h-10 rounded-xl border border-card-border bg-bg-main/50"
        />
      </div>

      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as typeof statusFilter)}>
        <SelectTrigger className="h-10 w-full rounded-xl sm:w-[150px]">
          <SelectValue placeholder="Trạng thái" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tất cả</SelectItem>
          <SelectItem value="published">Đã xuất bản</SelectItem>
          <SelectItem value="draft">Chưa xuất bản</SelectItem>
        </SelectContent>
      </Select>

      <Select value={eraFilter} onValueChange={onEraFilterChange}>
        <SelectTrigger className="h-10 w-full rounded-xl sm:w-[150px]">
          <SelectValue placeholder="Thời đại" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Mọi thời đại</SelectItem>
          <SelectItem value="Cổ đại">Cổ đại</SelectItem>
          <SelectItem value="Trung đại">Trung đại</SelectItem>
          <SelectItem value="Cận đại">Cận đại</SelectItem>
          <SelectItem value="Hiện đại">Hiện đại</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        className={cn(
          "h-10 rounded-xl px-4 font-semibold",
          showTrash
            ? "border-accent-danger text-accent-danger bg-accent-danger/8"
            : "border-card-border text-content-heading"
        )}
        onClick={onToggleTrash}
      >
        {showTrash ? (
          <>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Danh sách
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Thùng rác {trashCount > 0 && `(${trashCount})`}
          </>
        )}
      </Button>

      {!showTrash && (
        <Button
          className="h-10 rounded-xl px-4 font-semibold border-0 bg-accent-blue text-bg-deep shadow-sm shadow-accent-blue/20 transition-all duration-200 hover:brightness-90 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add New
        </Button>
      )}
    </div>
  );
}
