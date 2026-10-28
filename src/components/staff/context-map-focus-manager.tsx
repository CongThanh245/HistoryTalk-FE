"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Crosshair, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StaffFormInput, StaffFormLabel, StaffFormTextarea } from "@/components/staff/staff-form";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { MapFocusPicker, VIETNAM_VIEW, type MapView } from "@/components/staff/map-focus-picker";
import { apiErrorMessage } from "@/features/saas/hooks-api";
import { cn } from "@/lib/utils/cn";
import {
  mapFocusService,
  type CreateMapFocusPayload,
  type MapFocus,
  type UpdateMapFocusPayload,
} from "@/services/map-focus.service";

/** Quan ly diem camera ban do cua 1 boi canh (GET/POST/PUT/PATCH reorder/DELETE map-focuses). */

const focusKey = (contextId: string) => ["map-focuses", contextId] as const;

interface FocusDraft {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  zoomLevel: string;
  isDefault: boolean;
}

const EMPTY_DRAFT: FocusDraft = { name: "", description: "", latitude: "", longitude: "", zoomLevel: "", isDefault: false };

function toDraft(focus: MapFocus): FocusDraft {
  return {
    name: focus.name,
    description: focus.description ?? "",
    latitude: String(focus.latitude),
    longitude: String(focus.longitude),
    zoomLevel: focus.zoomLevel != null ? String(focus.zoomLevel) : "",
    isDefault: focus.isDefault,
  };
}

function draftError(d: FocusDraft): string | null {
  if (!d.name.trim()) return "Nhập tên điểm.";
  const lat = Number(d.latitude);
  const lng = Number(d.longitude);
  if (d.latitude.trim() === "" || !Number.isFinite(lat) || lat < -90 || lat > 90) return "Chọn vị trí trên bản đồ.";
  if (d.longitude.trim() === "" || !Number.isFinite(lng) || lng < -180 || lng > 180) return "Chọn vị trí trên bản đồ.";
  if (d.zoomLevel.trim() !== "") {
    const z = Number(d.zoomLevel);
    if (!Number.isFinite(z) || z < 1 || z > 20) return "Zoom phải trong khoảng 1 đến 20.";
  }
  return null;
}

function toPayload(d: FocusDraft): CreateMapFocusPayload {
  return {
    name: d.name.trim(),
    description: d.description.trim() || undefined,
    latitude: Number(d.latitude),
    longitude: Number(d.longitude),
    zoomLevel: d.zoomLevel.trim() === "" ? undefined : Number(d.zoomLevel),
    isDefault: d.isDefault,
  };
}

function FocusForm({
  initial,
  fallbackView,
  onSubmit,
  onCancel,
  isPending,
}: {
  initial: FocusDraft;
  /** Where the picker opens for a new point (an existing point opens on itself). */
  fallbackView: MapView;
  onSubmit: (d: FocusDraft) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [draft, setDraft] = React.useState(initial);
  const [startView] = React.useState<MapView>(() =>
    initial.latitude && initial.longitude
      ? {
          latitude: Number(initial.latitude),
          longitude: Number(initial.longitude),
          zoom: initial.zoomLevel ? Number(initial.zoomLevel) : fallbackView.zoom,
        }
      : fallbackView,
  );
  const error = draftError(draft);
  const set = (patch: Partial<FocusDraft>) => setDraft((d) => ({ ...d, ...patch }));

  return (
    <div className="space-y-3 rounded-sm border border-[var(--card-light-border)] bg-[var(--bg-elevated)] p-4">
      <div className="grid gap-1.5">
        <StaffFormLabel>Tên điểm *</StaffFormLabel>
        <StaffFormInput value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="Vd. Cửa sông Bạch Đằng" />
      </div>
      <div className="grid gap-1.5">
        <StaffFormLabel>Mô tả</StaffFormLabel>
        <StaffFormTextarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={2} />
      </div>
      <div className="grid gap-1.5">
        <StaffFormLabel>Vị trí trên bản đồ *</StaffFormLabel>
        <p className="text-xs text-[var(--content-muted)]">
          Kéo và phóng to bản đồ đến đúng khung hình người xem sẽ thấy. Dấu ngắm ở giữa là vị trí của điểm.
        </p>
        <MapFocusPicker
          initial={startView}
          onChange={(view) =>
            set({ latitude: String(view.latitude), longitude: String(view.longitude), zoomLevel: String(view.zoom) })
          }
        />
        {draft.latitude && (
          <p className="text-[11px] tabular-nums text-[var(--content-muted)]">
            {draft.latitude}, {draft.longitude} · zoom {draft.zoomLevel}
          </p>
        )}
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--content-text)]">
        <input type="checkbox" checked={draft.isDefault} onChange={(e) => set({ isDefault: e.target.checked })} />
        Điểm mặc định khi mở bối cảnh trên bản đồ
      </label>
      {error && <p className="text-xs text-[var(--accent-danger)]">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" size="sm" disabled={!!error || isPending} onClick={() => onSubmit(draft)}>
          Lưu điểm
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

export function ContextMapFocusManager({ contextId }: { contextId: string }) {
  const qc = useQueryClient();
  const { data: focuses = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: focusKey(contextId),
    queryFn: () => mapFocusService.list(contextId),
  });
  const sorted = React.useMemo(() => [...focuses].sort((a, b) => a.orderIndex - b.orderIndex), [focuses]);
  // New points start where this context already is on the map, not at the whole-country view.
  const anchor = sorted.find((f) => f.isDefault) ?? sorted[0];
  const fallbackView: MapView = anchor
    ? { latitude: anchor.latitude, longitude: anchor.longitude, zoom: anchor.zoomLevel ?? 9 }
    : VIETNAM_VIEW;

  const refresh = () => qc.invalidateQueries({ queryKey: focusKey(contextId) });
  const onError = (err: unknown) => toast.error(apiErrorMessage(err, "Thao tác thất bại. Vui lòng thử lại."));

  const create = useMutation({ mutationFn: (p: CreateMapFocusPayload) => mapFocusService.create(contextId, p), onSuccess: refresh, onError });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMapFocusPayload }) => mapFocusService.update(contextId, id, payload),
    onSuccess: refresh,
    onError,
  });
  const reorder = useMutation({ mutationFn: (ids: string[]) => mapFocusService.reorder(contextId, ids), onSuccess: refresh, onError });
  const remove = useMutation({ mutationFn: (id: string) => mapFocusService.remove(contextId, id), onSuccess: refresh, onError });

  const [adding, setAdding] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<MapFocus | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    const ids = sorted.map((f) => f.focusId);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate(ids);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--content-heading)]">Điểm camera bản đồ</p>
          <p className="mt-1 text-xs text-[var(--content-muted)]">Các vị trí bản đồ sẽ bay tới khi xem bối cảnh này, theo thứ tự.</p>
        </div>
        {!adding && (
          <Button type="button" size="sm" variant="outline" onClick={() => { setAdding(true); setEditingId(null); }}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm điểm
          </Button>
        )}
      </div>

      {adding && (
        <FocusForm
          initial={EMPTY_DRAFT}
          fallbackView={fallbackView}
          isPending={create.isPending}
          onCancel={() => setAdding(false)}
          onSubmit={(d) => create.mutate(toPayload(d), { onSuccess: () => { setAdding(false); toast.success("Đã thêm điểm bản đồ."); } })}
        />
      )}

      {isLoading ? (
        <p className="text-xs text-[var(--content-muted)]">Đang tải...</p>
      ) : isError ? (
        <div className="space-y-2 text-xs text-[var(--accent-danger)]">
          <p>{apiErrorMessage(error, "Không tải được điểm bản đồ.")}</p>
          <Button type="button" size="sm" variant="outline" onClick={() => void refetch()}>Thử lại</Button>
        </div>
      ) : sorted.length === 0 && !adding ? (
        <p className="rounded-sm border border-dashed border-[var(--card-light-border)] py-6 text-center text-xs text-[var(--content-muted)]">
          Chưa có điểm bản đồ nào.
        </p>
      ) : (
        <ul className="space-y-2">
          {sorted.map((focus, index) =>
            editingId === focus.focusId ? (
              <li key={focus.focusId}>
                <FocusForm
                  initial={toDraft(focus)}
                  fallbackView={fallbackView}
                  isPending={update.isPending}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(d) =>
                    update.mutate(
                      { id: focus.focusId, payload: toPayload(d) },
                      { onSuccess: () => { setEditingId(null); toast.success("Đã cập nhật điểm bản đồ."); } },
                    )
                  }
                />
              </li>
            ) : (
              <li
                key={focus.focusId}
                className={cn(
                  "flex items-start gap-3 rounded-sm border px-3 py-2.5",
                  focus.isActive ? "border-[var(--card-light-border)]" : "border-dashed border-[var(--card-light-border)] opacity-60",
                )}
              >
                <Crosshair className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-gold)]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--content-heading)]">
                    {index + 1}. {focus.name}
                    {focus.isDefault && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-gold)]">
                        <Star className="h-3 w-3" /> Mặc định
                      </span>
                    )}
                    {!focus.isActive && <span className="text-xs font-semibold text-[var(--content-muted)]">Đã ẩn</span>}
                  </p>
                  <p className="text-xs tabular-nums text-[var(--content-muted)]">
                    {focus.latitude}, {focus.longitude} · zoom {focus.zoomLevel ?? "—"}
                    {focus.createdBy ? ` · ${focus.createdBy}` : ""}
                  </p>
                  {focus.description && <p className="mt-1 text-xs text-[var(--content-text)]">{focus.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button type="button" variant="ghost" size="icon-sm" title="Lên" disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" title="Xuống" disabled={index === sorted.length - 1 || reorder.isPending} onClick={() => move(index, 1)}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    disabled={update.isPending}
                    onClick={() => update.mutate({ id: focus.focusId, payload: { isActive: !focus.isActive } })}
                  >
                    {focus.isActive ? "Ẩn" : "Hiện"}
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" title="Sửa" onClick={() => { setEditingId(focus.focusId); setAdding(false); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" title="Xóa" className="text-[var(--accent-danger)]" onClick={() => setDeleteTarget(focus)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Xóa điểm bản đồ?"
        description={deleteTarget?.name}
        variant="danger"
        confirmLabel="Xóa"
        isPending={remove.isPending}
        onConfirm={() =>
          deleteTarget &&
          remove.mutate(deleteTarget.focusId, { onSuccess: () => { setDeleteTarget(null); toast.success("Đã xóa điểm bản đồ."); } })
        }
      />
    </div>
  );
}
