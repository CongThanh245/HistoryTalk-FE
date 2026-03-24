"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UsersIcon, MagnifyingGlassIcon, PlusIcon, PencilIcon, TrashIcon, ChatCircleDotsIcon, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import Image from "next/image";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  StaffCharacterModal,
  EMPTY_CHARACTER_DRAFT,
  type CharacterDraft,
} from "@/components/staff/staff-character-modal";

export default function StaffCharactersPage() {
  const [search, setSearch] = React.useState("");
  const [modalOpen, setModalOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"create" | "edit">("create");
  const [draft, setDraft] = React.useState<CharacterDraft>(EMPTY_CHARACTER_DRAFT);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Character | null>(null);
  const [createdCharacterId, setCreatedCharacterId] = React.useState<string | null>(null);
  const [showTrash, setShowTrash] = React.useState(false);

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

  const allItems = data?.content ?? [];
  const activeItems = allItems.filter((c) => !c.deletedAt);
  const trashedItems = allItems.filter((c) => !!c.deletedAt);
  const filteredItems = showTrash ? trashedItems : activeItems;

  const items = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return filteredItems;
    return filteredItems.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q) ||
        x.side?.toLowerCase().includes(q),
    );
  }, [filteredItems, search]);

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
      isDraft: draft.isDraft,
    };

    if (mode === "create" && !createdCharacterId) {
      createCharacter.mutate(payload, {
        onSuccess: (newChar) => {
          // Don't close modal — set created id so chat becomes available
          setCreatedCharacterId(newChar.id);
          setDraft((prev) => ({ ...prev, id: newChar.id }));
        },
      });
    } else {
      const id = createdCharacterId || draft.id!;
      updateCharacter.mutate(
        { id, data: payload },
        {
          onSuccess: () => {
            // Stay in modal, just exit edit mode
          },
        },
      );
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCreatedCharacterId(null);
    setDraft(EMPTY_CHARACTER_DRAFT);
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
        accessorKey: "isDraft",
        header: "Trạng thái",
        cell: ({ row }) => {
          const isDraft = row.original.isDraft;
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
            {/* Chat test button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              title="Chat thử với nhân vật"
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
                  isDraft: c.isDraft ?? false,
                });
                setCreatedCharacterId(null);
                setModalOpen(true);
              }}
              disabled={!row.original.contextId}
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
                  isDraft: c.isDraft ?? false,
                });
                setCreatedCharacterId(null);
                setModalOpen(true);
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
              {row.original.imageUrl && (
                <Image
                  src={row.original.imageUrl}
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
        cell: ({ row }) => (
          <span className="text-xs" style={{ color: "var(--accent-danger)" }}>
            {row.original.deletedAt
              ? new Date(row.original.deletedAt).toLocaleString("vi-VN")
              : "—"}
          </span>
        ),
      },
      {
        accessorKey: "side",
        header: "Phe",
        cell: ({ row }) => (
          <span
            className="text-xs font-medium"
            style={{ color: "var(--content-text)", opacity: 0.6 }}
          >
            {row.original.side ?? "—"}
          </span>
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
                placeholder="Tìm theo tên, chức vị, phe..."
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
                  setDraft(EMPTY_CHARACTER_DRAFT);
                  setCreatedCharacterId(null);
                  setModalOpen(true);
                }}
                style={{
                  background: "var(--accent-blue)",
                  color: "#fff",
                }}
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
        />
      </section>

      {/* Fullscreen character modal */}
      <StaffCharacterModal
        open={modalOpen}
        onClose={handleCloseModal}
        mode={mode}
        draft={draft}
        setDraft={setDraft}
        onSave={handleSave}
        isPending={isPending}
        eventOptions={eventOptions}
        isLoadingEvents={isLoadingEvents}
        createdCharacterId={createdCharacterId}
      />

      {/* Delete confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "var(--content-heading)" }}>
              Chuyển vào thùng rác?
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: "var(--content-muted)" }}>
              Nhân vật sẽ được chuyển vào thùng rác. Bạn có thể xem lại trong mục Thùng rác.
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
                if (!deleteTarget) return;
                deleteCharacter.mutate(deleteTarget.id, {
                  onSuccess: () => {
                    setDeleteOpen(false);
                    setDeleteTarget(null);
                  },
                });
              }}
            >
              {deleteCharacter.isPending ? "Đang xóa..." : "Chuyển vào thùng rác"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StaffShell>
  );
}
