﻿﻿﻿﻿﻿﻿"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { PlusIcon, PencilIcon, TrashIcon, ChatCircleDotsIcon, ArrowCounterClockwiseIcon, MagnifyingGlassIcon, UsersIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useCharacters,
  useDeleteCharacter
} from "@/features/characters/hooks";
import type { Character } from "@/services/character.service";
import type { TrashItem } from "@/services/trash.service";
import { isValidUrl } from "@/lib/utils/url";
import { formatCharacterLifespan } from "@/lib/utils/character-date";

export default function StaffCharactersPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Character | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [restoreTarget, setRestoreTarget] = React.useState<{ id: string; title: string } | null>(null);
  const [restoreOpen, setRestoreOpen] = React.useState(false);

  const { data, isLoading, isFetching } = useCharacters({
    page: 1,
    limit: 100,
  });
  const deleteCharacter = useDeleteCharacter();
  const { data: trashItems = [], isLoading: isTrashLoading } = useTrashList("characters");
  const restoreCharacter = useTrashRestore("characters");
  const permanentDeleteCharacter = useTrashPermanentDelete("characters");

  const allItems = data?.content ?? [];
  const activeItems = allItems;

  const items = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q),
    );
  }, [activeItems, search]);

  const columns = React.useMemo<ColumnDef<Character>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nhân vật",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div
              className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative"
              style={{ background: "var(--card-light-border)" }}
            >
              {isValidUrl(row.original.imageUrl) && (
                <Image
                  src={row.original.imageUrl!}
                  alt={row.original.name}
                  fill
                  className="object-cover"
                />
              )}
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
              >
                {row.original.name}
              </p>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {row.original.title}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "isPublished",
        header: "Trạng thái",
        cell: ({ row }) => {
          const isDraft = !row.original.isPublished;
          return (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                background: isDraft
                  ? "rgba(234,179,8,0.12)"
                  : "rgba(34,197,94,0.12)",
                color: isDraft
                  ? "rgb(161,98,7)"
                  : "rgb(22,163,74)",
                border: `1px solid ${isDraft ? "rgba(234,179,8,0.3)" : "rgba(34,197,94,0.3)"}`,
              }}
            >
              {isDraft ? "Bản nháp" : "Đã xuất bản"}
            </span>
          );
        },
      },
      {
        id: "lifespan",
        header: "Thời gian sống",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {formatCharacterLifespan(row.original)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {/* Chat test button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              title="Chat thử với nhân vật"
              onClick={() => {
                router.push(`/staff/characters/${row.original.id}`);
              }}
              style={{ color: "var(--accent-blue)" }}
            >
              <ChatCircleDotsIcon className="h-4 w-4" />
            </Button>
            {/* Edit button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                router.push(`/staff/characters/${row.original.id}`);
              }}
              style={{ color: "var(--header-text-muted)" }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                setDeleteTarget(row.original);
                setDeleteOpen(true);
              }}
              style={{ color: "var(--accent-danger)" }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [router],
  );

  const trashColumns = React.useMemo<ColumnDef<Character>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nhân vật",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 min-w-[220px]">
            <div
              className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative"
              style={{ background: "var(--card-light-border)", opacity: 0.6 }}
            >
              {isValidUrl(row.original.imageUrl) && (
                <Image
                  src={row.original.imageUrl!}
                  alt={row.original.name}
                  fill
                  className="object-cover grayscale"
                />
              )}
            </div>
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)", opacity: 0.6 }}
              >
                {row.original.name}
              </p>
              <p className="text-xs" style={{ color: "var(--content-muted)" }}>
                {row.original.title}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "deletedAt",
        header: "Đã xóa lúc",
        cell: ({ row }) => {
          const date = row.original.deletedAt ? new Date(row.original.deletedAt) : null;
          const isValidDate = date && !isNaN(date.getTime());
          return (
            <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
              {isValidDate ? date.toLocaleString("vi-VN") : "—"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              title="Xóa vĩnh viễn"
              onClick={() => {
                setPermanentDeleteTarget({ id: row.original.id, title: row.original.name });
                setPermanentDeleteOpen(true);
              }}
              style={{ color: "var(--accent-danger)" }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );


  return (
    <StaffShell
      title="Quản lý nhân vật"
      description="Tạo, cập nhật và kiểm soát nhân vật lịch sử."
      icon={UsersIcon}
      accent="var(--accent-blue)"
    >
      <section
        className="rounded-2xl border p-6 space-y-5"
        style={{
          background: "var(--card-light-bg)",
          borderColor: "var(--card-light-border)",
        }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2
              className="text-base font-semibold"
              style={{ color: "var(--content-heading)" }}
            >
              {showTrash ? "Thùng rác nhân vật" : "Danh sách nhân vật"}
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {items.length} nhân vật
                  {isFetching && (
                    <span className="ml-2 text-xs opacity-50">
                      Đang cập nhật...
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-[300px]">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, chức vị..."
                className="pl-10 h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                }}
              />
            </div>
            <Button
              variant="outline"
              className="h-10 rounded-xl px-4 font-semibold"
              onClick={() => setShowTrash(!showTrash)}
              style={{
                borderColor: showTrash ? "var(--accent-danger)" : "var(--card-light-border)",
                color: showTrash ? "var(--accent-danger)" : "var(--content-heading)",
                background: showTrash ? "rgba(239,68,68,0.08)" : "transparent",
              }}
            >
              {showTrash ? (
                <><ArrowCounterClockwiseIcon className="h-4 w-4 mr-1.5" /> Danh sách</>
              ) : (
                <><TrashIcon className="h-4 w-4 mr-1.5" /> Thùng rác {trashItems.length > 0 && `(${trashItems.length})`}</>
              )}
            </Button>
            {!showTrash && (
              <Button
                className="h-10 rounded-xl px-4 font-semibold border-0 bg-[var(--accent-blue)] text-[var(--bg-deep)] shadow-sm shadow-[var(--accent-blue)]/20 transition-all duration-200 hover:brightness-90 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                onClick={() => router.push("/staff/characters/create")}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" /> Add New
              </Button>
            )}
          </div>
        </div>

        <StaffDataTable
          columns={showTrash ? trashColumns : columns}
          data={items}
          emptyMessage={showTrash ? "Thùng rác trống." : "Không tìm thấy nhân vật phù hợp."}
          isLoading={isLoading}
        />
      </section>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Chuyển vào thùng rác?"
        description="Nhân vật sẽ được chuyển vào thùng rác. Bạn có thể xem lại trong mục Thùng rác."
        confirmLabel={deleteCharacter.isPending ? "Đang xóa..." : "Chuyển vào thùng rác"}
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteCharacter.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              setDeleteTarget(null);
            },
          });
        }}
        isPending={deleteCharacter.isPending}
      />

      {/* Permanent Delete confirm */}
      <ConfirmDialog
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        title="Xóa vĩnh viễn nhân vật?"
        description="Hành động này không thể hoàn tác. Nhân vật sẽ bị xóa hoàn toàn khỏi hệ thống."
        confirmLabel={permanentDeleteCharacter.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
        variant="danger"
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteCharacter.mutate([permanentDeleteTarget.id], {
            onSuccess: () => {
              setPermanentDeleteOpen(false);
              setPermanentDeleteTarget(null);
            },
          });
        }}
        isPending={permanentDeleteCharacter.isPending}
      />
    </StaffShell>
  );
}
