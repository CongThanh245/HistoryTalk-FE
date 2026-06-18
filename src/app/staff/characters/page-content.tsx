﻿﻿﻿﻿﻿﻿"use client";

import * as React from "react";
import { UsersIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { StaffShell } from "@/components/staff/staff-shell";
import { StaffDataTable } from "@/components/staff/staff-data-table";
import { CharacterListToolbar } from "@/components/staff/characters/character-list-toolbar";
import {
  createCharacterColumns,
  createCharacterTrashColumns,
} from "@/components/staff/characters/character-table-columns";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import {
  useCharacters,
  useDeleteCharacter,
  useUpdateCharacter,
} from "@/features/characters/hooks";
import {
  useTrashList,
  useTrashRestore,
  useTrashPermanentDelete,
} from "@/features/trash/hooks";
import type { Character } from "@/services/character.service";

export default function StaffCharactersPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all");
  const [eraFilter, setEraFilter] = React.useState("all");
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<Character | null>(null);
  const [publishTarget, setPublishTarget] = React.useState<Character | null>(null);
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
  const updateCharacter = useUpdateCharacter();
  const { data: trashItems = [], isLoading: isTrashLoading } = useTrashList("characters");
  const restoreCharacter = useTrashRestore("characters");
  const permanentDeleteCharacter = useTrashPermanentDelete("characters");

  const activeItems = React.useMemo(
    () => (data?.content ?? []).filter((item) => !item.deletedAt),
    [data?.content],
  );

  const items = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeItems;
    return activeItems.filter(
      (x) =>
        x.name.toLowerCase().includes(q) ||
        x.title?.toLowerCase().includes(q) ||
        x.contexts?.some((context) => context.name.toLowerCase().includes(q)),
    );
  }, [activeItems, search]);

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? item.isPublished : !item.isPublished);
      const matchesEra = eraFilter === "all" || item.era === eraFilter;
      return matchesStatus && matchesEra;
    });
  }, [eraFilter, items, statusFilter]);

  type TrashRow = (typeof trashItems)[number];
  const columns = React.useMemo(
    () =>
      createCharacterColumns({
        onEdit: (character) => router.push(`/staff/characters/${character.id}`),
        onPublishToggle: setPublishTarget,
        onDelete: (character) => {
          setDeleteTarget(character);
          setDeleteOpen(true);
        },
        onOpenContext: (contextId) => router.push(`/events?event=${contextId}`),
      }),
    [router],
  );

  const trashColumns = React.useMemo(
    () =>
      createCharacterTrashColumns({
        onRestore: (row: TrashRow) => {
          setRestoreTarget({ id: row.id, title: row.title });
          setRestoreOpen(true);
        },
        onPermanentDelete: (row: TrashRow) => {
          setPermanentDeleteTarget({ id: row.id, title: row.title });
          setPermanentDeleteOpen(true);
        },
      }),
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
                  {filteredItems.length} nhân vật
                  {isFetching && (
                    <span className="ml-2 text-xs opacity-50">
                      Đang cập nhật...
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          <CharacterListToolbar
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            eraFilter={eraFilter}
            onEraFilterChange={setEraFilter}
            showTrash={showTrash}
            trashCount={trashItems.length}
            onToggleTrash={() => setShowTrash((value) => !value)}
            onCreate={() => router.push("/staff/characters/create")}
          />
        </div>

        {showTrash ? (
          <StaffDataTable
            columns={trashColumns}
            data={trashItems}
            emptyMessage="Thùng rác trống."
            isLoading={isTrashLoading}
          />
        ) : (
          <StaffDataTable
            columns={columns}
            data={filteredItems}
            emptyMessage="Không tìm thấy nhân vật phù hợp."
            isLoading={isLoading}
          />
        )}
      </section>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(open) => !open && setPublishTarget(null)}
        title={publishTarget?.isPublished ? "Ngừng xuất bản nhân vật?" : "Xuất bản nhân vật?"}
        description={
          publishTarget?.isPublished
            ? `Nhân vật "${publishTarget?.name}" sẽ không hiển thị cho người dùng nữa.`
            : `Nhân vật "${publishTarget?.name}" sẽ hiển thị cho người dùng.`
        }
        confirmLabel={publishTarget?.isPublished ? "Ngừng xuất bản" : "Xuất bản"}
        variant="warning"
        isPending={updateCharacter.isPending}
        onConfirm={() => {
          if (!publishTarget) return;
          updateCharacter.mutate(
            {
              id: publishTarget.id,
              data: { isPublished: !publishTarget.isPublished },
            },
            {
              onSuccess: () => setPublishTarget(null),
            },
          );
        }}
      />

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

      {/* Restore confirm */}
      <ConfirmDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Khôi phục nhân vật?"
        description={`Nhân vật "${restoreTarget?.title}" sẽ được khôi phục và hiển thị trở lại.`}
        confirmLabel={restoreCharacter.isPending ? "Đang khôi phục..." : "Khôi phục"}
        variant="primary"
        onConfirm={() => {
          if (!restoreTarget) return;
          restoreCharacter.mutate([restoreTarget.id], {
            onSuccess: () => {
              setRestoreOpen(false);
              setRestoreTarget(null);
            },
          });
        }}
        isPending={restoreCharacter.isPending}
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
