"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ArrowCounterClockwiseIcon, EyeIcon } from "@phosphor-icons/react";
import { useIsStaff } from "@/features/auth/usePermission";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  StaffFormLabel,
  StaffFormInput,
  StaffFormTextarea,
  StaffFormSelect,
} from "@/components/staff/staff-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  usePermanentDeleteEvent,
} from "@/features/events/hooks";
import {
  type HistoricalEvent,
  type EventEraBackend,
  ERA_CONFIG,
  EventEra,
} from "@/services/event.service";

type DraftState = {
  id?: string;
  name: string;
  description: string;
  era: EventEraBackend | "";
  year: string;
  period: string;
  location: string;
  imageUrl: string;
  videoUrl: string;
  isActive: boolean;
  isPublished?: boolean;
};

const EMPTY_DRAFT: DraftState = {
  name: "",
  description: "",
  era: "",
  year: "",
  period: "",
  location: "",
  imageUrl: "",
  videoUrl: "",
  isActive: true,
  isPublished: false,
};

// Constants for Select Options
const ERA_OPTIONS = [
  { value: "ANCIENT" as const, label: "Cổ đại" },
  { value: "MEDIEVAL" as const, label: "Trung đại" },
  { value: "MODERN" as const, label: "Cận đại" },
  { value: "CONTEMPORARY" as const, label: "Hiện đại" },
];


export default function StaffContextsPage() {
  const isStaff = useIsStaff();
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] =
    React.useState<HistoricalEvent | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = React.useState(false);
  const [permanentDeleteTarget, setPermanentDeleteTarget] =
    React.useState<HistoricalEvent | null>(null);
  const [publishDialogOpen, setPublishDialogOpen] = React.useState(false);

  const { data, isLoading, isFetching } = useEvents({
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const permanentDeleteEvent = usePermanentDeleteEvent();

  const allItems = data?.content ?? [];

  // FE filter: active vs trashed
  const activeItems = allItems.filter((e) => e.isActive !== false);
  const trashedItems = allItems.filter((e) => e.isActive === false);
  const displayedItems = showTrash ? trashedItems : activeItems;

  const set = (field: keyof DraftState) => (val: any) =>
    setDraft((s) => ({ ...s, [field]: val }));

  const handleSave = () => {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      era: draft.era as EventEraBackend,
      year: Number(draft.year) || 0,
      period: draft.period.trim() || undefined,
      location: draft.location.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
      isActive: draft.isActive,
      isPublished: draft.isPublished,
    };

    const name = payload.name;
    if (mode === "create") {
      createEvent.mutate(payload, {
        onSuccess: () => {
          setDialogOpen(false);
          toast.success("Tạo thành công", {
            description: `"${name}" đã được tạo.`,
            duration: 4000,
          });
        },
      });
    } else {
      updateEvent.mutate(
        { id: draft.id!, data: payload },
        {
          onSuccess: () => {
            setDialogOpen(false);
            toast.success("Cập nhật thành công", {
              description: `"${name}" đã được cập nhật.`,
              duration: 4000,
            });
          },
        },
      );
    }
  };

  const columns = React.useMemo<ColumnDef<HistoricalEvent>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => {
          const summary = row.original.summary || "";
          // Giới hạn 100 ký tự ở tầng dữ liệu
          const truncatedSummary =
            summary.length > 100 ? summary.slice(0, 100) + "..." : summary;

          return (
            <div className="min-w-[260px]">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--content-heading)" }}
              >
                {row.original.title}
              </p>
              <p
                /* QUAN TRỌNG: Thêm 'overflow-hidden' và 'text-ellipsis' */
                className="text-xs mt-0.5 line-clamp-1 truncate max-w-[400px] block"
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
        cell: ({ row }) => {
          const isPublished = row.original.isPublished ?? false;
          return (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: isPublished ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                color: isPublished ? "rgb(22,163,74)" : "rgb(220,38,38)",
                border: `1px solid ${isPublished ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
              }}
            >
              <EyeIcon className="h-3 w-3" />
              {isPublished ? "Công khai" : "Riêng tư"}
            </div>
          );
        },
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
        id: "actions",
        header: () => <div className="text-right pr-4">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => {
                const e = row.original;
                setMode("edit");
                setDraft({
                  id: e.id,
                  name: e.title,
                  description: e.summary,
                  era: (e.era ?? "") as EventEraBackend | "",
                  year: String(e.year ?? ""),
                  period: e.period ?? "",
                  location: e.location ?? "",
                  imageUrl: e.imageUrl ?? "",
                  videoUrl: e.videoUrl ?? "",
                  isActive: e.isActive ?? true,
                  isPublished: e.isPublished ?? false,
                });
                setDialogOpen(true);
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
    [],
  );

  // Trash view columns
  const trashColumns = React.useMemo<ColumnDef<HistoricalEvent>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <div className="min-w-[260px]">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--content-heading)", opacity: 0.6 }}
            >
              {row.original.title}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--content-muted)" }}
            >
              {row.original.summary?.length > 80
                ? row.original.summary.slice(0, 80) + "..."
                : row.original.summary}
            </p>
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
        accessorKey: "era",
        header: "Thời đại",
        cell: ({ row }) => {
          const eraRaw = row.original.era;
          const era = eraRaw?.toLowerCase() as EventEra | undefined;
          const label = era && era in ERA_CONFIG ? ERA_CONFIG[era]?.label : undefined;
          return (
            <span className="text-xs font-medium" style={{ color: "var(--content-text)" }}>
              {label ?? "—"}
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
                setPermanentDeleteTarget(row.original);
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

  const isPending = createEvent.isPending || updateEvent.isPending;

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
            {isStaff && (
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
                  <><TrashIcon className="h-4 w-4 mr-1.5" /> Thùng rác {trashedItems.length > 0 && `(${trashedItems.length})`}</>
                )}
              </Button>
            )}
            {!showTrash && (
              <Button
                className="h-10 rounded-xl px-4 font-semibold border-0"
                onClick={() => {
                  setMode("create");
                  setDraft(EMPTY_DRAFT);
                  setDialogOpen(true);
                }}
                style={{
                  background: "var(--accent-gold)",
                  color: "var(--bg-deep)",
                  boxShadow: "0 0 14px var(--accent-gold-glow)",
                }}
              >
                <PlusIcon className="h-4 w-4 mr-1.5" /> Add New
              </Button>
            )}
          </div>
        </div>

        <StaffDataTable
          columns={showTrash ? trashColumns : columns}
          data={displayedItems}
          emptyMessage={showTrash ? "Thùng rác trống." : "Không tìm thấy bối cảnh phù hợp."}
          isLoading={isLoading}
        />
      </section>

      {/* Dialog create/edit — wide 2-column layout */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="w-[95vw] sm:max-w-none max-w-none p-0 overflow-hidden"
          style={{ background: "var(--bg-content)", borderColor: "var(--card-light-border)", color: "var(--content-heading)" }}
        >
          {/* Header */}
          <div className="px-8 pt-7 pb-5 border-b" style={{ borderColor: "var(--card-light-border)" }}>
            <DialogTitle style={{ color: "var(--content-heading)", fontSize: 18 }}>
              {mode === "create" ? "Add Historical Context" : "Edit Historical Context"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)", marginTop: 4 }}>
              Thông tin bối cảnh lịch sử hiển thị cho người dùng.
            </DialogDescription>
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto max-h-[calc(100vh-140px)]">

            {/* ── Left column: content fields ── */}
            <div className="px-8 py-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                Nội dung
              </p>

              {/* Name */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Tên sự kiện *</StaffFormLabel>
                <StaffFormInput
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Trận Bạch Đằng"
                />
              </div>

              {/* Description */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Mô tả *</StaffFormLabel>
                <StaffFormTextarea
                  value={draft.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="Bối cảnh lịch sử..."
                />
              </div>

              {/* Location */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Địa điểm</StaffFormLabel>
                <StaffFormInput
                  value={draft.location}
                  onChange={(e) => set("location")(e.target.value)}
                  placeholder="VD: Sông Bạch Đằng, Quảng Ninh"
                />
              </div>
            </div>

            {/* ── Right column: meta fields ── */}
            <div className="px-8 py-6 space-y-5 border-t lg:border-t-0 lg:border-l" style={{ borderColor: "var(--card-light-border)" }}>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                Phân loại & Thời gian
              </p>

              {/* Era */}
              <div className="grid gap-1.5">
                <StaffFormLabel>Thời đại *</StaffFormLabel>
                <StaffFormSelect
                  value={draft.era}
                  onValueChange={set("era")}
                  placeholder="Chọn thời đại"
                  options={ERA_OPTIONS}
                />
              </div>

              {/* Year + Period */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <StaffFormLabel>Năm *</StaffFormLabel>
                  <StaffFormInput
                    type="number"
                    value={draft.year}
                    onChange={(e) => set("year")(e.target.value)}
                    placeholder="938"
                  />
                </div>
                <div className="grid gap-1.5">
                  <StaffFormLabel>Giai đoạn / Thời kỳ</StaffFormLabel>
                  <StaffFormInput
                    value={draft.period}
                    onChange={(e) => set("period")(e.target.value)}
                    placeholder="VD: Thời kỳ Bắc thuộc"
                  />
                </div>
              </div>

              {/* isPublished Toggle */}
              <div
                className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border transition-colors"
                style={{
                  borderColor: draft.isPublished ? "rgba(34,197,94,0.35)" : "rgba(239,68,68,0.35)",
                  background: draft.isPublished ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                }}
              >
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: draft.isPublished ? "rgb(22,163,74)" : "rgb(220,38,38)" }}>
                    {draft.isPublished ? "Công khai" : "Riêng tư"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                    {draft.isPublished
                      ? "Đang hiển thị công khai cho người dùng."
                      : "Không hiển thị cho người dùng."}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={draft.isPublished}
                  onClick={() => set("isPublished")(!draft.isPublished)}
                  className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  style={{
                    background: draft.isPublished ? "rgb(34,197,94)" : "rgba(239,68,68,0.4)",
                  }}
                >
                  <span
                    className="pointer-events-none block h-5 w-5 rounded-full shadow-lg transition-transform"
                    style={{
                      background: "#fff",
                      transform: draft.isPublished ? "translateX(20px)" : "translateX(0)",
                    }}
                  />
                </button>
              </div>

              {/* Media URLs */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                  Media
                </p>
                <div className="grid gap-1.5">
                  <StaffFormLabel>URL hình ảnh</StaffFormLabel>
                  <StaffFormInput
                    value={draft.imageUrl}
                    onChange={(e) => set("imageUrl")(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-1.5">
                  <StaffFormLabel>URL video (YouTube)</StaffFormLabel>
                  <StaffFormInput
                    value={draft.videoUrl}
                    onChange={(e) => set("videoUrl")(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t flex justify-end gap-2" style={{ borderColor: "var(--card-light-border)" }}>
            <Button variant="outline" className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!draft.name.trim() || !draft.era || !draft.year || isPending}
            >
              {isPending ? "Đang lưu..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Permanent Delete confirm */}
      <ConfirmDialog
        open={permanentDeleteOpen}
        onOpenChange={setPermanentDeleteOpen}
        title="Xóa vĩnh viễn bối cảnh?"
        description="Hành động này không thể hoàn tác. Bối cảnh sẽ bị xóa hoàn toàn khỏi hệ thống."
        confirmLabel={permanentDeleteEvent.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
        variant="danger"
        onConfirm={() => {
          if (!permanentDeleteTarget) return;
          permanentDeleteEvent.mutate(permanentDeleteTarget.id, {
            onSuccess: () => {
              setPermanentDeleteOpen(false);
              setPermanentDeleteTarget(null);
            },
          });
        }}
        isPending={permanentDeleteEvent.isPending}
      />
    </StaffShell>
  );
}
