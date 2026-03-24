"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  type EventCategory,
  ERA_CONFIG,
  EventEra,
} from "@/services/event.service";

type DraftState = {
  id?: string;
  name: string;
  description: string;
  era: EventEraBackend | "";
  category: EventCategory | "";
  year: string;
  startYear: string;
  endYear: string;
  beforeTCN: boolean;
  location: string;
  imageUrl: string;
  videoUrl: string;
};

const EMPTY_DRAFT: DraftState = {
  name: "",
  description: "",
  era: "",
  category: "",
  year: "",
  startYear: "",
  endYear: "",
  beforeTCN: false,
  location: "",
  imageUrl: "",
  videoUrl: "",
};

export default function StaffContextsPage() {
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

  const { data, isLoading, isFetching } = useEvents({
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const permanentDeleteEvent = usePermanentDeleteEvent();

  const items = data?.content ?? [];

  // FE filter: active vs trashed
  const activeItems = items.filter((e) => !e.deletedAt);
  const trashedItems = items.filter((e) => !!e.deletedAt);
  const displayedItems = showTrash ? trashedItems : activeItems;

  const set = (field: keyof DraftState) => (val: any) =>
    setDraft((s) => ({ ...s, [field]: val }));

  const handleSave = () => {
    const payload = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      era: draft.era as EventEraBackend,
      category: draft.category as EventCategory,
      year: Number(draft.year) || 0,
      startYear: draft.startYear ? Number(draft.startYear) : undefined,
      endYear: draft.endYear ? Number(draft.endYear) : undefined,
      beforeTCN: draft.beforeTCN,
      location: draft.location.trim() || undefined,
      imageUrl: draft.imageUrl.trim() || undefined,
      videoUrl: draft.videoUrl.trim() || undefined,
    };

    if (mode === "create") {
      createEvent.mutate(payload, { onSuccess: () => setDialogOpen(false) });
    } else {
      updateEvent.mutate(
        { id: draft.id!, data: payload },
        { onSuccess: () => setDialogOpen(false) },
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
                  category: (e.category.toUpperCase() ?? "") as
                    | EventCategory
                    | "",
                  year: String(e.year ?? ""),
                  startYear: String(e.startYear ?? ""),
                  endYear: String(e.endYear ?? ""),
                  beforeTCN: e.beforeTCN ?? false,
                  location: e.location ?? "",
                  imageUrl: e.imageUrl ?? "",
                  videoUrl: e.videoUrl ?? "",
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
              <div className="grid gap-2">
                <Label>Tên sự kiện *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Trận Bạch Đằng"
                />
              </div>

              {/* Description */}
              <div className="grid gap-2">
                <Label>Mô tả *</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) => set("description")(e.target.value)}
                  placeholder="Bối cảnh lịch sử..."
                  className="min-h-[140px] resize-none"
                />
              </div>

              {/* Location */}
              <div className="grid gap-2">
                <Label>Địa điểm</Label>
                <Input
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

              {/* Era + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label>Thời đại *</Label>
                  <Select value={draft.era} onValueChange={set("era")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thời đại" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ANCIENT">Cổ đại</SelectItem>
                      <SelectItem value="MEDIEVAL">Trung đại</SelectItem>
                      <SelectItem value="MODERN">Cận đại</SelectItem>
                      <SelectItem value="CONTEMPORARY">Hiện đại</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Danh mục *</Label>
                  <Select value={draft.category} onValueChange={set("category")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAR">Chiến tranh</SelectItem>
                      <SelectItem value="POLITICS">Chính trị</SelectItem>
                      <SelectItem value="CULTURE">Văn hoá</SelectItem>
                      <SelectItem value="SCIENCE">Khoa học</SelectItem>
                      <SelectItem value="RELIGION">Tôn giáo</SelectItem>
                      <SelectItem value="OTHER">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Year + startYear + endYear */}
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label>Năm *</Label>
                  <Input
                    type="number"
                    value={draft.year}
                    onChange={(e) => set("year")(e.target.value)}
                    placeholder="938"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Năm bắt đầu</Label>
                  <Input
                    type="number"
                    value={draft.startYear}
                    onChange={(e) => set("startYear")(e.target.value)}
                    placeholder="938"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Năm kết thúc</Label>
                  <Input
                    type="number"
                    value={draft.endYear}
                    onChange={(e) => set("endYear")(e.target.value)}
                    placeholder="939"
                  />
                </div>
              </div>

              {/* beforeTCN */}
              <div className="flex items-center gap-3 py-1">
                <Switch
                  checked={draft.beforeTCN}
                  onCheckedChange={set("beforeTCN")}
                />
                <Label>Trước Công Nguyên (TCN)</Label>
              </div>

              {/* Media URLs */}
              <div className="space-y-3 pt-1">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--content-heading)" }}>
                  Media
                </p>
                <div className="grid gap-2">
                  <Label>URL hình ảnh</Label>
                  <Input
                    value={draft.imageUrl}
                    onChange={(e) => set("imageUrl")(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>URL video (YouTube)</Label>
                  <Input
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
              disabled={!draft.name.trim() || !draft.era || !draft.category || isPending}
            >
              {isPending ? "Đang lưu..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--content-heading)" }}>
              Chuyển vào thùng rác?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--content-muted)" }}>
              Bối cảnh sẽ được chuyển vào thùng rác. Bạn có thể xem lại trong mục Thùng rác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]">Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteEvent.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                  },
                });
              }}
            >
              {deleteEvent.isPending ? "Đang xóa..." : "Chuyển vào thùng rác"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Permanent Delete confirm */}
      <AlertDialog open={permanentDeleteOpen} onOpenChange={setPermanentDeleteOpen}>
        <AlertDialogContent style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--content-heading)" }}>
              Xóa vĩnh viễn bối cảnh?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--accent-danger)", fontWeight: 500 }}>
              Hành động này không thể hoàn tác. Bối cảnh sẽ bị xóa hoàn toàn khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-[var(--card-light-border)] hover:bg-black/5 text-[var(--content-heading)]">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              style={{ backgroundColor: "#ef4444" }}
              onClick={() => {
                if (!permanentDeleteTarget) return;
                permanentDeleteEvent.mutate(permanentDeleteTarget.id, {
                  onSuccess: () => {
                    setPermanentDeleteOpen(false);
                    setPermanentDeleteTarget(null);
                  },
                });
              }}
            >
              {permanentDeleteEvent.isPending ? "Đang xóa..." : "Xóa vĩnh viễn"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffShell>
  );
}
