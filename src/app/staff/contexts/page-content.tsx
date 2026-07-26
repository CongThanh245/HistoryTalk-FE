﻿"use client";

import * as React from "react";
import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { ScrollIcon, MagnifyingGlassIcon, PlusIcon, TrashIcon, ArrowCounterClockwiseIcon, EyeIcon, ImageSquareIcon } from "@phosphor-icons/react";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { StaffImageHoverPreview } from "@/components/staff/staff-media-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StaffFormSelect } from "@/components/staff/staff-form";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { useEvents, useUpdateEvent, useDeleteEvent } from "@/features/events/hooks";
import {
  useTrashList,
  useTrashRestore,
  useTrashPermanentDelete,
} from "@/features/trash/hooks";
import {
  type HistoricalEvent,
  type EventEraBackend,
  ERA_CONFIG,
  EventEra,
} from "@/services/event.service";
import type { TrashItem } from "@/services/trash.service";

// Constants for Select Options
const ERA_OPTIONS = [
  { value: "ANCIENT" as const, label: "Cổ đại" },
  { value: "MEDIEVAL" as const, label: "Trung đại" },
  { value: "MODERN" as const, label: "Cận đại" },
  { value: "CONTEMPORARY" as const, label: "Hiện đại" },
];

const publishStatusSorting: SortingFn<HistoricalEvent> = (rowA, rowB, columnId) => {
  const a = rowA.getValue<boolean>(columnId) ? 1 : 0;
  const b = rowB.getValue<boolean>(columnId) ? 1 : 0;
  return a - b;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("vi-VN");
}

function getCreatorName(value: HistoricalEvent["createdBy"]) {
  if (!value) return "—";
  return value.userName ?? value.uid ?? "—";
}

export default function StaffContextsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [eraFilter, setEraFilter] = React.useState<"all" | EventEraBackend>("all");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<HistoricalEvent | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    React.useState<{ id: string; title: string } | null>(null);
  const [restoreTarget, setRestoreTarget] =
    React.useState<{ id: string; title: string } | null>(null);
  const [restoreOpen, setRestoreOpen] = React.useState(false);
  const [tablePublishTarget, setTablePublishTarget] =
    React.useState<HistoricalEvent | null>(null);

  const { data, isLoading, isFetching } = useEvents({
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const { data: trashItems = [], isLoading: isTrashLoading } = useTrashList("historical-contexts");
  const restoreContext = useTrashRestore("historical-contexts");
  const permanentDeleteContext = useTrashPermanentDelete("historical-contexts");

  const items = React.useMemo(
    () => (data?.content ?? []).filter((item) => !item.deletedAt),
    [data?.content],
  );
  const displayedItems = React.useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" ? item.isPublished : !item.isPublished);
        const matchesEra = eraFilter === "all" || item.era === eraFilter;
        return matchesStatus && matchesEra;
      }),
    [eraFilter, items, statusFilter],
  );

  const columns = React.useMemo<ColumnDef<HistoricalEvent>[]>(
    () => [
      {
        accessorKey: "imageUrl",
        header: "Ảnh",
        cell: ({ row }) => (
          <StaffImageHoverPreview
            src={row.original.imageUrl}
            alt={row.original.title || "Ảnh bối cảnh lịch sử"}
            thumbClassName="h-14 w-20 rounded-lg border"
            previewClassName="h-48 w-72"
            sizes="80px"
            previewSizes="288px"
            fallback={<ImageSquareIcon className="h-5 w-5" />}
          />
        ),
        enableSorting: false,
      },
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => {
          const summary = row.original.summary || "";
          // Giới hạn 60 ký tự ở tầng dữ liệu để bảng không bị tràn ngang
          const truncatedSummary =
            summary.length > 60 ? summary.slice(0, 60) + "..." : summary;

          return (
            <div className="w-[220px]">
              <p
                className="truncate text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
                title={row.original.title}
              >
                {row.original.title}
              </p>
              <p
                className="text-xs mt-0.5 truncate"
                style={{ color: "var(--content-muted)" }}
                title={summary}
              >
                {truncatedSummary}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "isPublished",
        header: "Trạng thái",
        sortDescFirst: false,
        sortingFn: publishStatusSorting,
        cell: ({ row }) => {
          const isDraft = !row.original.isPublished;
          return (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isDraft ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                color: isDraft ? "rgb(161,98,7)" : "rgb(22,163,74)",
                border: `1px solid ${isDraft ? "rgba(234,179,8,0.2)" : "rgba(34,197,94,0.2)"}`,
              }}
            >
              <EyeIcon className="h-3 w-3" />
              {isDraft ? "Chưa xuất bản" : "Đã xuất bản"}
            </div>
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
              className="h-8 rounded-md px-3 text-xs font-semibold hover:bg-black/[0.04] hover:text-[var(--content-heading)]"
              onClick={() => router.push(`/staff/contexts/${row.original.id}`)}
              style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
            >
              Chỉnh sửa
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-8 rounded-md px-3 text-sm font-bold hover:bg-black/[0.04] hover:text-[var(--content-heading)]"
                  style={{ borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
                >
                  ...
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTablePublishTarget(row.original)}>
                  {row.original.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    setDeleteTarget(row.original);
                    setDeleteOpen(true);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                  Chuyển vào thùng rác
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
      {
        accessorKey: "era",
        header: "Thời đại",
        cell: ({ row }) => {
          const eraRaw = row.original.era;
          const era = eraRaw?.toLowerCase() as EventEra | undefined;
          const label =
            era && era in ERA_CONFIG ? ERA_CONFIG[era]?.label : undefined;
          return (
            <span
              className="text-xs font-medium"
              style={{ color: "var(--content-text)" }}
            >
              {label ?? "—"}
            </span>
          );
        },
      },
      {
        accessorKey: "year",
        header: "Năm",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.year < 0
              ? `${Math.abs(row.original.year)} TCN`
              : row.original.year}
          </span>
        ),
      },
      {
        accessorKey: "location",
        header: "Địa điểm",
        cell: ({ row }) => (
          <span className="block max-w-[140px] truncate text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.location || "—"}
          </span>
        ),
      },
      {
        accessorKey: "updatedDate",
        header: "Cập nhật",
        cell: ({ row }) => (
          <div className="text-xs" style={{ color: "var(--content-muted)" }}>
            <p>{formatDate(row.original.updatedDate)}</p>
            <p className="mt-0.5 opacity-70">Tạo: {formatDate(row.original.createdDate)}</p>
          </div>
        ),
      },
      {
        accessorKey: "createdBy",
        header: "Người tạo",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {getCreatorName(row.original.createdBy)}
          </span>
        ),
      },
    ],
    [router],
  );

  // Trash view columns
  const trashColumns = React.useMemo<ColumnDef<TrashItem>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <div className="min-w-[260px]">
            <p className="text-sm font-semibold" style={{ color: "var(--content-heading)", opacity: 0.6 }}>
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
            <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
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
            <Button variant="ghost" size="icon-sm" className="rounded-full" title="Khôi phục"
              onClick={() => { setRestoreTarget({ id: row.original.id, title: row.original.title }); setRestoreOpen(true); }}
              style={{ color: "var(--accent-blue)" }}
            >
              <ArrowCounterClockwiseIcon className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" className="rounded-full" title="Xoa vinh vien"
              onClick={() => { setPermanentDeleteTarget({ id: row.original.id, title: row.original.title }); setPermanentDeleteOpen(true); }}
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
      title="Quản lý bối cảnh lịch sử"
      description="Tạo, cập nhật và kiểm soát bối cảnh lịch sử."
      icon={ScrollIcon}
      accent="var(--accent-gold)"
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
              style={{
                color: "var(--content-heading)",
              }}
            >
              {showTrash ? "Thùng rác" : "Danh sách bối cảnh"}
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {displayedItems.length} bản ghi
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
            <div className="relative w-full sm:w-[340px]">
              <MagnifyingGlassIcon
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4"
                style={{ color: "var(--content-subtle)" }}
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tiêu đề..."
                className="pl-10 h-10 rounded-xl border"
                style={{
                  background: "rgba(27,38,50,0.05)",
                  borderColor: "var(--card-light-border)",
                }}
              />
            </div>
            <StaffFormSelect
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
              options={[
                { value: "all", label: "Tất cả" },
                { value: "published", label: "Đã xuất bản" },
                { value: "draft", label: "Chưa xuất bản" },
              ]}
              className="w-full rounded-xl sm:w-[150px]"
            />
            <StaffFormSelect
              value={eraFilter}
              onValueChange={(value) => setEraFilter(value as typeof eraFilter)}
              options={[
                { value: "all", label: "Mọi thời đại" },
                ...ERA_OPTIONS,
              ]}
              className="w-full rounded-xl sm:w-[150px]"
            />
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
                className="h-10 rounded-xl px-4 font-semibold border-0 bg-[var(--accent-gold)] text-[var(--bg-deep)] shadow-[0_0_14px_var(--accent-gold-glow)] transition-all duration-200 hover:brightness-90 hover:shadow-[0_0_18px_var(--accent-gold-glow)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                onClick={() => router.push("/staff/contexts/create")}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" /> Tạo bối cảnh
              </Button>
            )}
          </div>
        </div>

        {showTrash ? (
          <StaffDataTable columns={trashColumns} data={trashItems} emptyMessage="Thùng rác trống." isLoading={isTrashLoading} />
        ) : (
          <StaffDataTable columns={columns} data={displayedItems} emptyMessage="Không tìm thấy bối cảnh phù hợp." isLoading={isLoading} />
        )}
      </section>

      <ConfirmDialog
        open={!!tablePublishTarget}
        onOpenChange={(open) => !open && setTablePublishTarget(null)}
        title={tablePublishTarget?.isPublished ? "Ngừng xuất bản bối cảnh?" : "Xuất bản bối cảnh?"}
        description={
          tablePublishTarget?.isPublished
            ? `Bối cảnh "${tablePublishTarget?.title}" sẽ không hiển thị cho người dùng nữa.`
            : `Bối cảnh "${tablePublishTarget?.title}" sẽ hiển thị cho người dùng.`
        }
        confirmLabel={tablePublishTarget?.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
        variant="warning"
        isPending={updateEvent.isPending}
        onConfirm={() => {
          if (!tablePublishTarget) return;
          updateEvent.mutate(
            {
              id: tablePublishTarget.id,
              data: { isPublished: !tablePublishTarget.isPublished },
            },
            {
              onSuccess: () => setTablePublishTarget(null),
            },
          );
        }}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Chuyển vào thùng rác?"
        description="Bối cảnh sẽ được chuyển vào thùng rác. Bạn có thể xem lại trong mục Thùng rác."
        confirmLabel={deleteEvent.isPending ? "Đang xóa..." : "Chuyển vào thùng rác"}
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteEvent.mutate(deleteTarget.id, {
            onSuccess: () => {
              setDeleteOpen(false);
              setDeleteTarget(null);
            },
          });
        }}
        isPending={deleteEvent.isPending}
      />

      {/* Restore confirm */}
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Khôi phục bối cảnh?"
        description={`Bối cảnh "${restoreTarget?.title}" sẽ được khôi phục.`}
        confirmLabel="Khôi phục"
        variant="warning"
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreContext.mutate([restoreTarget.id], {
            onSuccess: () => {
              setRestoreOpen(false);
              setRestoreTarget(null);
            },
          });
        }}
        isPending={restoreContext.isPending}
      />

      {/* Permanent Delete confirm */}
      <ConfirmDialog
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        title="Xóa vĩnh viễn bối cảnh?"
        description="Hành động này không thể hoàn tác. Bối cảnh sẽ bị xóa hoàn toàn khỏi hệ thống."
        confirmLabel={permanentDeleteContext.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
        variant="danger"
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteContext.mutate([permanentDeleteTarget.id], {
            onSuccess: () => {
              setPermanentDeleteOpen(false);
              setPermanentDeleteTarget(null);
            },
          });
        }}
        isPending={permanentDeleteContext.isPending}
      />
    </StaffShell>
  );
}
