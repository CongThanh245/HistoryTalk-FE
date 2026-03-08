"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ScrollText, Search, Plus, Pencil, Trash2 } from "lucide-react";
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

  const { data, isLoading, isFetching } = useEvents({
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const items = data?.content ?? [];

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
        cell: ({ row }) => (
          <div className="min-w-[260px]">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--content-heading)" }}
            >
              {row.original.title}
            </p>
            <p
              className="text-xs mt-0.5 line-clamp-1"
              style={{ color: "var(--content-muted)" }}
            >
              {row.original.summary}
            </p>
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
        id: "actions",
        header: "Thao tác",
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
              <Pencil className="h-4 w-4" />
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
              <Trash2 className="h-4 w-4" />
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
      title="Manage Historical Context"
      description="Tạo, cập nhật và kiểm soát bối cảnh lịch sử."
      icon={ScrollText}
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
              Danh sách bối cảnh
            </h2>
            <p className="text-sm" style={{ color: "var(--content-muted)" }}>
              {isLoading ? (
                "Đang tải..."
              ) : (
                <>
                  {items.length} bản ghi
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
              <Search
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
              className="h-10 rounded-xl px-4 font-semibold border-0"
              onClick={() => {
                setMode("create");
                setDraft(EMPTY_DRAFT);
                setDialogOpen(true);
              }}
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
                color: "var(--bg-deep)",
                boxShadow: "0 0 14px var(--accent-gold-glow)",
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" /> Add New
            </Button>
          </div>
        </div>

        <StaffDataTable
          columns={columns}
          data={items}
          emptyMessage="Không tìm thấy bối cảnh phù hợp."
        />
      </section>

      {/* Dialog create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "white" }}>
              {mode === "create"
                ? "Add Historical Context"
                : "Edit Historical Context"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Thông tin bối cảnh lịch sử hiển thị cho người dùng.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
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
                className="min-h-[90px]"
              />
            </div>

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
                  placeholder="VD: 938"
                />
              </div>
              <div className="grid gap-2">
                <Label>Năm bắt đầu</Label>
                <Input
                  type="number"
                  value={draft.startYear}
                  onChange={(e) => set("startYear")(e.target.value)}
                  placeholder="VD: 938"
                />
              </div>
              <div className="grid gap-2">
                <Label>Năm kết thúc</Label>
                <Input
                  type="number"
                  value={draft.endYear}
                  onChange={(e) => set("endYear")(e.target.value)}
                  placeholder="VD: 939"
                />
              </div>
            </div>

            {/* beforeTCN */}
            <div className="flex items-center gap-3">
              <Switch
                checked={draft.beforeTCN}
                onCheckedChange={set("beforeTCN")}
              />
              <Label>Trước Công Nguyên (TCN)</Label>
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

            {/* imageUrl + videoUrl */}
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !draft.name.trim() || !draft.era || !draft.category || isPending
              }
            >
              {isPending ? "Đang lưu..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ borderColor: "var(--card-light-border)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "white" }}>
              Xóa bối cảnh lịch sử?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "lightgray" }}>
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
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
              {deleteEvent.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffShell>
  );
}
