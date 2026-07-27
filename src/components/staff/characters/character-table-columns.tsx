"use client";

import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffImageHoverPreview } from "@/components/staff/staff-media-preview";
import type { Character } from "@/services/character.service";
import { formatCharacterLifespan } from "@/lib/utils/character-date";

type TrashRow = {
  id: string;
  title: string;
  deletedAt: string;
};

type CharacterColumnHandlers = {
  onEdit: (character: Character) => void;
  onPublishToggle: (character: Character) => void;
  onDelete: (character: Character) => void;
  onOpenContext: (contextId: string) => void;
};

type CharacterTrashColumnHandlers = {
  onRestore: (row: TrashRow) => void;
  onPermanentDelete: (row: TrashRow) => void;
};

const publishStatusSorting: SortingFn<Character> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<boolean>(columnId) ? 1 : 0;
  const b = rowB.getValue<boolean>(columnId) ? 1 : 0;
  return a - b;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function getCreatorName(value: Character["createdBy"]) {
  if (!value) return "—";
  return typeof value === "string" ? value : value.userName ?? value.uid ?? "—";
}

export function createCharacterColumns({
  onEdit,
  onPublishToggle,
  onDelete,
  onOpenContext,
}: CharacterColumnHandlers): ColumnDef<Character>[] {
  return [
    {
      accessorKey: "name",
      header: "Nhân vật",
      cell: ({ row }) => (
        <div className="flex items-center gap-3 min-w-[220px]">
          <StaffImageHoverPreview
            src={row.original.imageUrl}
            alt={row.original.name}
            thumbClassName="h-9 w-9 rounded-lg"
            previewClassName="h-56 w-40"
            sizes="36px"
            previewSizes="160px"
          />
          <div className="min-w-0 max-w-[180px]">
            <p className="truncate text-sm font-semibold text-content-heading" title={row.original.name}>
              {row.original.name}
            </p>
            <p className="truncate text-xs text-content-muted" title={row.original.title}>
              {row.original.title}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "isPublished",
      header: "Trạng thái",
      sortDescFirst: false,
      sortingFn: publishStatusSorting,
      cell: ({ row }) => {
        const isDraft = !row.original.isPublished;
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border",
              isDraft
                ? "bg-[rgba(234,179,8,0.12)] text-[rgb(161,98,7)] border-[rgba(234,179,8,0.3)]"
                : "bg-[rgba(34,197,94,0.12)] text-[rgb(22,163,74)] border-[rgba(34,197,94,0.3)]",
            )}
          >
            {isDraft ? "Chưa xuất bản" : "Đã xuất bản"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => (
        <div className="flex min-w-[140px] items-center gap-2">
          <Button
            variant="outline"
            className="h-8 rounded-md px-3 text-xs font-semibold border-card-light-border text-content-heading hover:bg-black/[0.04] hover:text-[var(--content-heading)]"
            onClick={() => onEdit(row.original)}
          >
            Chỉnh sửa
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-8 rounded-md px-3 text-sm font-bold border-card-light-border text-content-heading hover:bg-black/[0.04] hover:text-[var(--content-heading)]"
              >
                ...
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPublishToggle(row.original)}>
                {row.original.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => onDelete(row.original)}>
                <Trash2 className="h-4 w-4" />
                Chuyển vào thùng rác
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
    {
      id: "contexts",
      header: "Bối cảnh",
      cell: ({ row }) => {
        const contexts = row.original.contexts ?? [];
        if (contexts.length === 0) {
          return <span className="text-xs text-content-muted">—</span>;
        }
        return (
          <div className="flex max-w-[180px] flex-wrap items-center gap-1">
            {contexts.slice(0, 1).map((context) => (
              <button
                key={context.contextId}
                type="button"
                className="max-w-[140px] truncate rounded-full border border-card-light-border px-2 py-0.5 text-[11px] font-medium text-content-text hover:bg-black/[0.04]"
                onClick={() => onOpenContext(context.contextId)}
                title={context.name || "Bối cảnh"}
              >
                {context.name || "Bối cảnh"}
              </button>
            ))}
            {contexts.length > 1 && (
              <span className="shrink-0 text-[11px] text-content-muted" title={contexts.slice(1).map((c) => c.name).join(", ")}>
                +{contexts.length - 1}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "lifespan",
      header: "Thời gian sống",
      cell: ({ row }) => (
        <span className="text-xs text-content-muted">
          {formatCharacterLifespan(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "updatedDate",
      header: "Cập nhật",
      cell: ({ row }) => (
        <div className="text-xs text-content-muted">
          <p>{formatDate(row.original.updatedDate)}</p>
          <p className="mt-0.5 opacity-70">Tạo: {formatDate(row.original.createdDate)}</p>
        </div>
      ),
    },
    {
      accessorKey: "createdBy",
      header: "Người tạo",
      cell: ({ row }) => (
        <span className="text-xs text-content-muted">
          {getCreatorName(row.original.createdBy)}
        </span>
      ),
    },
  ];
}

export function createCharacterTrashColumns({
  onRestore,
  onPermanentDelete,
}: CharacterTrashColumnHandlers): ColumnDef<TrashRow>[] {
  return [
    {
      accessorKey: "title",
      header: "Nhân vật",
      cell: ({ row }) => (
        <div className="min-w-[220px] opacity-60">
          <p className="text-sm font-semibold text-content-heading">
            {row.original.title}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "deletedAt",
      header: "Đã xóa lúc",
      cell: ({ row }) => {
        const date = new Date(row.original.deletedAt);
        return (
          <span className="text-xs text-accent-danger">
            {!isNaN(date.getTime()) ? date.toLocaleString("vi-VN") : "—"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right pr-4">Thao tác</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-accent-blue"
            title="Khôi phục"
            onClick={() => onRestore(row.original)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full text-accent-danger"
            title="Xóa vĩnh viễn"
            onClick={() => onPermanentDelete(row.original)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];
}
