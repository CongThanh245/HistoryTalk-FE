"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe2, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { UrlSyncedHistoricalMap } from "@/components/historical-map/UrlSyncedHistoricalMap";
import type { MapCoordinates, MapOverlay, OverlayPin } from "@/components/historical-map/map-overlay.types";
import { MockDataNotice } from "@/components/saas/mock-data-notice";
import { MapLayerControl, type MapLayerRow } from "@/components/saas/map-layer-control";
import {
  ClassPinDetails,
  ClassPinForm,
  LocalContextDetails,
  PersonalPinDetails,
  PersonalPinForm,
  type ClassPinDraft,
} from "@/components/saas/map-overlay-panel";
import { useHydrated } from "@/components/saas/saas-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import {
  MAP_TEACHER_ID,
  formatDueDate,
  getMapRoleConfig,
  isPinOverdue,
  useClassLayer,
  useMapClassOptions,
  usePersonalPins,
  usePlaceableLocalContexts,
  type MapLayerKey,
} from "@/features/saas/hooks-map";
import { useSaasStore } from "@/features/saas/store";
import { useAuthStore } from "@/store/auth.store";

type OverlayTarget = "class" | "personal";
type Selection = { kind: "class" | "local" | "personal"; id: string } | null;
type Editor = { target: OverlayTarget; pinId?: string; coordinates: MapCoordinates | null; placing: boolean } | null;

const PREFIX = { class: "class:", local: "local:", personal: "personal:" } as const;

/**
 * Global + Custom map (Role Matrix row 21). Wraps the URL-synced battle map and adds the class and
 * personal layers the current role may see. `?layer=class&classId=<id>` preselects the class layer.
 */
export function LayeredHistoricalMap({ onClose }: { onClose: () => void }) {
  const role = useRole();
  const ownerId = useAuthStore((s) => s.user?.uid) || "demo";
  const config = React.useMemo(() => getMapRoleConfig(role), [role]);
  const hydrated = useHydrated();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlLayer = params.get("layer");
  const urlClassId = params.get("classId");
  const hasClassLayer = config.layers.includes("class");
  const hasPersonalLayer = config.layers.includes("personal");

  // ── Layer visibility (user overrides on top of role defaults) ──
  const [overrides, setOverrides] = React.useState<Partial<Record<MapLayerKey, boolean>>>({});
  const visible: Record<MapLayerKey, boolean> = {
    global: config.globalEditable ? true : overrides.global ?? true,
    class: hasClassLayer && (overrides.class ?? (config.classDefaultOn || urlLayer === "class")),
    personal: hasPersonalLayer && (overrides.personal ?? true),
  };

  // ── Class picker ──
  const classes = useMapClassOptions(config.classScope);
  const [pickedClassId, setPickedClassId] = React.useState<string | null>(null);
  const wantedClassId = pickedClassId ?? urlClassId;
  const classId = classes.find((c) => c.id === wantedClassId)?.id ?? classes[0]?.id ?? null;
  const activeClass = classes.find((c) => c.id === classId);

  const classLayer = useClassLayer(hasClassLayer ? classId : null);
  const personalPins = usePersonalPins(hasPersonalLayer ? ownerId : null);
  const placeableContexts = usePlaceableLocalContexts(config.classEditable ? classId : null);

  const createClassPin = useSaasStore((s) => s.createClassPin);
  const updateClassPin = useSaasStore((s) => s.updateClassPin);
  const removeClassPin = useSaasStore((s) => s.removeClassPin);
  const createPersonalPin = useSaasStore((s) => s.createPersonalPin);
  const updatePersonalPin = useSaasStore((s) => s.updatePersonalPin);
  const removePersonalPin = useSaasStore((s) => s.removePersonalPin);

  // ── Interaction state ──
  const [selection, setSelection] = React.useState<Selection>(null);
  const [editor, setEditor] = React.useState<Editor>(null);
  const [focus, setFocus] = React.useState<MapOverlay["focus"]>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Selection>(null);

  const focusOn = (c: MapCoordinates) => setFocus({ latitude: c.latitude, longitude: c.longitude, key: `${c.latitude},${c.longitude},${Date.now()}` });

  const writeUrl = (patch: Record<string, string | null>) => {
    const query = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) query.set(k, v);
      else query.delete(k);
    }
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const changeClass = (id: string) => {
    setPickedClassId(id);
    setSelection(null);
    setEditor(null);
    writeUrl({ layer: "class", classId: id });
  };

  const toggleLayer = (key: MapLayerKey, next: boolean) => {
    setOverrides((o) => ({ ...o, [key]: next }));
    if (!next && selection && (selection.kind === key || (key === "class" && selection.kind === "local"))) setSelection(null);
    if (!next && editor?.target === key) setEditor(null);
    if (key === "class") writeUrl(next ? { layer: "class", classId } : { layer: null, classId: null });
  };

  const classPinCanEdit = (createdBy: string) => config.classEditable && createdBy === MAP_TEACHER_ID;

  // ── Markers ──
  const editingId = editor?.pinId;
  const overlayPins = React.useMemo<OverlayPin[]>(() => {
    if (!hydrated) return [];
    const list: OverlayPin[] = [];
    if (visible.class) {
      for (const pin of classLayer.pins) {
        if (editor?.target === "class" && pin.id === editingId) continue;
        const overdue = isPinOverdue(pin);
        list.push({
          id: PREFIX.class + pin.id,
          label: pin.label,
          latitude: pin.latitude,
          longitude: pin.longitude,
          variant: pin.kind === "ASSIGNMENT" ? "assignment" : "class",
          meta:
            pin.kind === "ASSIGNMENT"
              ? `Bài tập · hạn ${formatDueDate(pin.dueDate)}${overdue ? " · quá hạn" : ""}`
              : ["Địa danh lịch sử", pin.year !== undefined ? String(pin.year) : ""].filter(Boolean).join(" · "),
          muted: overdue,
        });
      }
      for (const ctx of classLayer.contexts) {
        list.push({
          id: PREFIX.local + ctx.id,
          label: ctx.title,
          latitude: ctx.latitude as number,
          longitude: ctx.longitude as number,
          variant: "local",
          meta: `Bối cảnh địa phương · ${ctx.year}`,
        });
      }
    }
    if (visible.personal) {
      for (const pin of personalPins) {
        if (editor?.target === "personal" && pin.id === editingId) continue;
        list.push({ id: PREFIX.personal + pin.id, label: pin.label, latitude: pin.latitude, longitude: pin.longitude, variant: "personal", meta: "Ghim của tôi" });
      }
    }
    return list;
  }, [hydrated, visible.class, visible.personal, classLayer, personalPins, editor?.target, editingId]);

  const selectedOverlayId = selection ? PREFIX[selection.kind] + selection.id : null;

  const onSelectPin = (overlayId: string) => {
    const [kind, ...rest] = overlayId.split(":");
    const id = rest.join(":");
    if (kind !== "class" && kind !== "local" && kind !== "personal") return;
    setEditor(null);
    setSelection({ kind, id });
    const marker = overlayPins.find((p) => p.id === overlayId);
    if (marker) focusOn(marker);
  };

  // ── Editing ──
  const startAdd = (target: OverlayTarget) => {
    setSelection(null);
    setEditor({ target, coordinates: null, placing: true });
  };

  const startEdit = (target: OverlayTarget, pin: { id: string } & MapCoordinates, placing: boolean) => {
    setSelection(null);
    setEditor({ target, pinId: pin.id, coordinates: { latitude: pin.latitude, longitude: pin.longitude }, placing });
  };

  const closeEditor = () => {
    if (editor?.pinId) setSelection({ kind: editor.target, id: editor.pinId });
    setEditor(null);
  };

  const saveClassPin = (draft: ClassPinDraft) => {
    if (!editor?.coordinates || !classId) return;
    const position = { latitude: editor.coordinates.latitude, longitude: editor.coordinates.longitude };
    if (editor.pinId) {
      updateClassPin(editor.pinId, { ...draft, ...position });
      setSelection({ kind: "class", id: editor.pinId });
      toast.success("Đã cập nhật ghim lớp");
    } else {
      const created = createClassPin({ ...draft, ...position, classId, createdBy: MAP_TEACHER_ID });
      setSelection({ kind: "class", id: created.id });
      toast.success(`Đã thêm ghim vào bản đồ lớp ${activeClass?.name ?? ""}`.trim());
    }
    setOverrides((o) => ({ ...o, class: true }));
    setEditor(null);
  };

  const savePersonalPin = (draft: { label: string; note: string }) => {
    if (!editor?.coordinates) return;
    const position = { latitude: editor.coordinates.latitude, longitude: editor.coordinates.longitude };
    if (editor.pinId) {
      updatePersonalPin(editor.pinId, { ...draft, ...position });
      setSelection({ kind: "personal", id: editor.pinId });
      toast.success("Đã cập nhật ghim ghi chú");
    } else {
      const created = createPersonalPin({ ...draft, ...position, ownerId });
      setSelection({ kind: "personal", id: created.id });
      toast.success("Đã thêm ghim ghi chú");
    }
    setOverrides((o) => ({ ...o, personal: true }));
    setEditor(null);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.kind === "class") removeClassPin(pendingDelete.id);
    if (pendingDelete.kind === "personal") removePersonalPin(pendingDelete.id);
    toast.success("Đã xóa ghim");
    setSelection(null);
    setPendingDelete(null);
  };

  // ── Map events ──
  const onMapClick = (c: MapCoordinates) => {
    if (editor?.placing) {
      setEditor({ ...editor, coordinates: c, placing: false });
      return;
    }
    setSelection(null);
  };

  const onEscape = () => {
    if (pendingDelete) return true;
    if (editor?.placing && editor.coordinates) {
      setEditor({ ...editor, placing: false });
      return true;
    }
    if (editor) {
      closeEditor();
      return true;
    }
    if (selection) {
      setSelection(null);
      return true;
    }
    return false;
  };

  // ── Panel ──
  const selectedClassPin = selection?.kind === "class" ? classLayer.pins.find((p) => p.id === selection.id) : undefined;
  const selectedContext = selection?.kind === "local" ? classLayer.contexts.find((c) => c.id === selection.id) : undefined;
  const selectedPersonal = selection?.kind === "personal" ? personalPins.find((p) => p.id === selection.id) : undefined;
  const canOpenClassContent = role === "TEACHER" || role === "SCHOOL_STUDENT";

  let panel: React.ReactNode = null;
  if (editor?.target === "class") {
    const initial = editor.pinId ? classLayer.pins.find((p) => p.id === editor.pinId) : undefined;
    panel = (
      <ClassPinForm
        key={editor.pinId ?? "new"}
        initial={initial}
        className={activeClass?.name}
        coordinates={editor.coordinates}
        placing={editor.placing}
        localContexts={placeableContexts}
        onPickOnMap={() => setEditor({ ...editor, placing: true })}
        onUseContext={(ctx) => {
          const c = { latitude: ctx.latitude as number, longitude: ctx.longitude as number };
          setEditor({ ...editor, coordinates: c, placing: false });
          focusOn(c);
        }}
        onCancel={closeEditor}
        onSubmit={saveClassPin}
      />
    );
  } else if (editor?.target === "personal") {
    const initial = editor.pinId ? personalPins.find((p) => p.id === editor.pinId) : undefined;
    panel = (
      <PersonalPinForm
        key={editor.pinId ?? "new"}
        initial={initial}
        coordinates={editor.coordinates}
        placing={editor.placing}
        onPickOnMap={() => setEditor({ ...editor, placing: true })}
        onCancel={closeEditor}
        onSubmit={savePersonalPin}
      />
    );
  } else if (selectedClassPin) {
    const editable = classPinCanEdit(selectedClassPin.createdBy);
    panel = (
      <ClassPinDetails
        pin={selectedClassPin}
        className={activeClass?.name}
        canEdit={editable}
        assignmentsHref={
          role === "SCHOOL_STUDENT" ? ROUTES.MY_ASSIGNMENTS : role === "TEACHER" ? ROUTES.TEACHING.ASSIGNMENTS : undefined
        }
        assignmentsLabel={role === "TEACHER" ? "Quản lý bài tập" : "Xem bài tập"}
        onClose={() => setSelection(null)}
        onEdit={() => startEdit("class", selectedClassPin, false)}
        onMove={() => startEdit("class", selectedClassPin, true)}
        onDelete={() => setPendingDelete({ kind: "class", id: selectedClassPin.id })}
      />
    );
  } else if (selectedContext) {
    panel = (
      <LocalContextDetails
        context={selectedContext}
        href={canOpenClassContent && classId ? `${ROUTES.CLASSES}/${classId}/local/${selectedContext.id}` : undefined}
        onClose={() => setSelection(null)}
      />
    );
  } else if (selectedPersonal) {
    panel = (
      <PersonalPinDetails
        pin={selectedPersonal}
        onClose={() => setSelection(null)}
        onEdit={() => startEdit("personal", selectedPersonal, false)}
        onMove={() => startEdit("personal", selectedPersonal, true)}
        onDelete={() => setPendingDelete({ kind: "personal", id: selectedPersonal.id })}
      />
    );
  }

  // ── Layer rows ──
  const rows: MapLayerRow[] = config.layers.map((key) => {
    if (key === "global")
      return {
        key,
        label: "Bản đồ chung",
        hint: config.globalEditable ? "Hiển thị cho mọi người dùng" : "Trận đánh toàn quốc · chỉ đọc",
        count: 0,
        checked: visible.global,
        locked: config.globalEditable,
      };
    if (key === "class")
      return {
        key,
        label: "Bản đồ lớp",
        hint: config.classEditable ? "Ghim bạn đặt cho lớp" : config.globalEditable ? "Xem trước · chỉ đọc" : "Chỉ đọc",
        count: hydrated ? classLayer.pins.length + classLayer.contexts.length : 0,
        checked: visible.class,
      };
    return {
      key,
      label: "Ghim của tôi",
      hint: "Ghi chú học tập · chỉ mình bạn thấy",
      count: hydrated ? personalPins.length : 0,
      checked: visible.personal,
    };
  });

  const emptyClassText =
    role === "TEACHER"
      ? "Bạn chưa phụ trách lớp nào."
      : role === "SCHOOL_STUDENT"
        ? "Bạn chưa thuộc lớp nào."
        : "Trường chưa có lớp nào.";

  const showControl = config.layers.length > 1;

  const overlay: MapOverlay = {
    pins: overlayPins,
    selectedId: selectedOverlayId,
    onSelectPin,
    placing: Boolean(editor?.placing),
    draft: editor?.coordinates ?? null,
    onMapClick,
    onEscape,
    focus,
    hideBattlePins: !visible.global,
    headerSlot: config.globalEditable ? (
      <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] px-2 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--text-primary)]">
        <Globe2 size={13} className="text-[var(--accent-gold)]" aria-hidden="true" />
        Bản đồ chung — hiển thị cho mọi người dùng
      </span>
    ) : undefined,
    topSlot: config.usesMockLayers && hydrated ? <MockDataNotice className="rounded-none border-x-0 border-t-0 px-4 md:px-6" /> : undefined,
    renderControls: ({ battleCount }) => (
      <>
        {showControl && (
          <MapLayerControl
            rows={rows.map((r) => (r.key === "global" ? { ...r, count: battleCount } : r))}
            onToggle={toggleLayer}
            classes={hydrated ? classes : []}
            classId={classId}
            onClassChange={changeClass}
            emptyClassText={hydrated ? emptyClassText : "Đang tải…"}
            onAddClassPin={config.classEditable ? () => startAdd("class") : undefined}
            onAddPersonalPin={config.personalEditable ? () => startAdd("personal") : undefined}
            addDisabled={!hydrated || Boolean(editor?.placing)}
            footnote={
              config.globalEditable && visible.class
                ? "Lớp bản đồ của trường dùng dữ liệu mẫu — chưa kết nối API."
                : undefined
            }
          />
        )}
        {editor?.placing && (
          <div className="pointer-events-none absolute left-1/2 top-4 z-[510] hidden -translate-x-1/2 items-center gap-2 rounded-[2px] border border-[var(--text-primary)] bg-[var(--text-primary)] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-inverse)] shadow-[var(--shadow-soft)] md:flex">
            <LocateFixed size={15} aria-hidden="true" /> Bấm lên bản đồ để đặt ghim · Esc để hủy
          </div>
        )}
        {panel}
      </>
    ),
  };

  return (
    <>
      <UrlSyncedHistoricalMap onClose={onClose} overlay={overlay} />
      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Xóa ghim này?"
        description={
          pendingDelete?.kind === "class"
            ? "Ghim sẽ biến mất khỏi bản đồ lớp của tất cả học sinh trong lớp."
            : "Ghim ghi chú sẽ bị xóa khỏi bản đồ của bạn."
        }
        confirmLabel="Xóa ghim"
        variant="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}
