"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UsersIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  useCharacters,
  useCreateCharacter,
  useUpdateCharacter,
  useDeleteCharacter,
} from "@/features/characters/hooks";
import type { Character } from "@/services/character.service";
import { useEvents } from "@/features/events/hooks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DraftState = {
  id?: string;
  name: string;
  title: string;
  background: string;
  image: string;
  personality: string;
  lifespan: string;
  side: string;
  contextId: string;
};

const EMPTY_DRAFT: DraftState = {
  name: "",
  title: "",
  background: "",
  image: "",
  personality: "",
  lifespan: "",
  side: "",
  contextId: "",
};

export default function StaffCharactersPage() {
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<DraftState>(EMPTY_DRAFT);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Character | null>(
    null,
  );
  const { data: eventsData, isLoading: isLoadingEvents } = useEvents({
    page: 1,
    limit: 100,
  });

  const eventOptions = eventsData?.content ?? [];

  const { data, isLoading, isFetching } = useCharacters({
    page: 1,
    limit: 100,
  });
  const createCharacter = useCreateCharacter();
  const updateCharacter = useUpdateCharacter();
  const deleteCharacter = useDeleteCharacter();

  const items = React.useMemo(() => {
    const all = data?.content ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q) ||
        x.side?.toLowerCase().includes(q),
    );
  }, [data, search]);

  const set = (field: keyof DraftState) => (val: string) =>
    setDraft((s) => ({ ...s, [field]: val }));

  const handleSave = () => {
    const payload = {
      name: draft.name.trim(),
      title: draft.title.trim(),
      background: draft.background.trim() || undefined,
      image: draft.image.trim() || undefined,
      personality: draft.personality.trim() || undefined,
      lifespan: draft.lifespan.trim() || undefined,
      side: draft.side.trim() || undefined,
      contextId: draft.contextId.trim() || undefined,
    };

    if (mode === "create") {
      createCharacter.mutate(payload, {
        onSuccess: () => setDialogOpen(false),
      });
    } else {
      updateCharacter.mutate(
        { id: draft.id!, data: payload },
        { onSuccess: () => setDialogOpen(false) },
      );
    }
  };

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
              {row.original.imageUrl && (
                <Image
                  src={row.original.imageUrl}
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
        accessorKey: "side",
        header: "Phe",
        cell: ({ row }) => (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--content-text)" }}
          >
            {row.original.side ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "lifespan",
        header: "Thời gian sống",
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--content-muted)" }}>
            {row.original.lifespan ?? "—"}
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
                const c = row.original;
                setMode("edit");
                setDraft({
                  id: c.id,
                  name: c.name ?? "",
                  title: c.title ?? "",
                  background: c.background ?? "",
                  image: c.imageUrl ?? "",
                  personality: c.personality ?? "",
                  lifespan: c.lifespan ?? "",
                  side: c.side ?? "",
                  contextId: c.contextId ?? "",
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

  const isPending = createCharacter.isPending || updateCharacter.isPending;

  return (
    <StaffShell
      title="Manage Characters"
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
              style={{
                color: "var(--content-heading)",
              }}
            >
              Danh sách nhân vật
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
                placeholder="Tìm theo tên, chức vị, phe..."
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
                  "linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-teal) 100%)",
                color: "#fff",
              }}
            >
              <PlusIcon className="h-4 w-4 mr-1.5" /> Add New
            </Button>
          </div>
        </div>

        <StaffDataTable
          columns={columns}
          data={items}
          emptyMessage="Không tìm thấy nhân vật phù hợp."
        />
      </section>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
          style={{ borderColor: "var(--card-light-border)" }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "white" }}>
              {mode === "create" ? "Add Character" : "Edit Character"}
            </DialogTitle>
            <DialogDescription style={{ color: "var(--content-muted)" }}>
              Thông tin nhân vật lịch sử.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tên nhân vật *</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => set("name")(e.target.value)}
                  placeholder="VD: Ngô Quyền"
                />
              </div>
              <div className="grid gap-2">
                <Label>Chức vị *</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => set("title")(e.target.value)}
                  placeholder="VD: Tiết độ sứ"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Phe / Quốc gia</Label>
                <Input
                  value={draft.side}
                  onChange={(e) => set("side")(e.target.value)}
                  placeholder="VD: Đại Việt"
                />
              </div>
              <div className="grid gap-2">
                <Label>Năm sống</Label>
                <Input
                  value={draft.lifespan}
                  onChange={(e) => set("lifespan")(e.target.value)}
                  placeholder="VD: 898–944"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Bối cảnh lịch sử</Label>
              <Select
                value={draft.contextId}
                onValueChange={set("contextId")}
                disabled={isLoadingEvents}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      isLoadingEvents
                        ? "Đang tải..."
                        : "Chọn bối cảnh liên quan"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title} —{" "}
                      {ev.year < 0 ? `${Math.abs(ev.year)} TCN` : ev.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>URL hình ảnh</Label>
              <Input
                value={draft.image}
                onChange={(e) => set("image")(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Tiểu sử / Bối cảnh</Label>
              <Textarea
                value={draft.background}
                onChange={(e) => set("background")(e.target.value)}
                placeholder="Mô tả cuộc đời, vai trò lịch sử..."
                className="min-h-[90px]"
              />
            </div>

            <div className="grid gap-2">
              <Label>Tính cách</Label>
              <Textarea
                value={draft.personality}
                onChange={(e) => set("personality")(e.target.value)}
                placeholder="Đặc điểm tính cách, phong cách nói chuyện..."
                className="min-h-[70px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!draft.name.trim() || !draft.title.trim() || isPending}
            >
              {isPending ? "Đang lưu..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ backgroundColor: "#1a1f2e", borderColor: "rgba(255,255,255,0.1)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#FFFFFF" }}> {/* Màu trắng cho tiêu đề */}
              Xóa nhân vật?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "#9ca3af" }}> {/* Màu xám nhạt cho mô tả */}
              Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ color: "#fbbf24", backgroundColor: "transparent", border: "1px solid #374151" }}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              style={{ backgroundColor: "#ef4444" }} // Màu đỏ đậm chất "Xóa"
              onClick={() => {
                if (!deleteTarget) return;
                deleteCharacter.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                  },
                });
              }}
            >
              {deleteCharacter.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffShell>
  );
}
