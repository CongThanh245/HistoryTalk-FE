"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Globe2 } from "lucide-react";
import { UrlSyncedHistoricalMap } from "@/components/historical-map/UrlSyncedHistoricalMap";
import { isInsideMapBounds, type MapControlsInfo, type MapCoordinates, type MapOverlay, type OverlayPin } from "@/components/historical-map/map-overlay.types";
import { STUDY_NOTE_PREFIX, STUDY_NOTE_ROLES } from "@/components/historical-map/StudyNotes";
import { MapLayerControl, MapLayerToggle, type MapLayerRow } from "@/components/saas/map-layer-control";
import { BattleOverviewList, ListTabs, StudyNotesList } from "@/components/saas/map-pin-lists";
import { MapSearchBox } from "@/components/saas/map-search";
import { localMeta } from "@/components/saas/local-content-ui";
import { ROUTES } from "@/constants/routes";
import { useRole } from "@/features/auth/usePermission";
import type { MapLayerKey } from "@/features/saas/hooks-map";
import { useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import type { LocalItem } from "@/services/local-content.service";

type ListTab = "battles" | "notes";

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

const LOCAL_PREFIX = "local:";

/** Published local contexts the viewer's school has, for the "Tư liệu lớp & trường" layer. */
function usePublishedLocalContexts(role: string | null): { contexts: LocalItem[]; enabled: boolean } {
  const isTeacher = role === "TEACHER";
  const isStudent = role === "SCHOOL_STUDENT";
  const teacher = useTeacherLocalContent(isTeacher);
  const student = useStudentLocalContent(isStudent);
  const items = isTeacher ? teacher.contexts : isStudent ? student.items : [];
  const contexts = items.filter(
    (i) =>
      i.type === "CONTEXT" &&
      i.isPublished &&
      i.latitude != null &&
      i.longitude != null &&
      isInsideMapBounds({ latitude: i.latitude, longitude: i.longitude }),
  );
  return { contexts, enabled: isTeacher || isStudent };
}

/**
 * Battle map with the layers backed by the API:
 * - "Bản đồ chung": battles pinned by Content Admins (editable by them, read-only for everyone else).
 * - "Ghi chú của tôi" (CUSTOMER, SCHOOL_STUDENT, TEACHER): the viewer's own study notes, each anchored
 *   to a battle and its year (USER map pins).
 * - "Tư liệu lớp & trường" (TEACHER, SCHOOL_STUDENT): published local contexts with coordinates.
 * The class layer (teacher pins per class) has no API yet and is not shown.
 */
export function LayeredHistoricalMap({ onClose }: { onClose: () => void }) {
  const role = useRole();
  const router = useRouter();
  const local = usePublishedLocalContexts(role);
  const [localFocus, setLocalFocus] = React.useState<(MapCoordinates & { key: string }) | null>(null);
  const [selectedLocalId, setSelectedLocalId] = React.useState<string | null>(null);
  const globalEditableRole = role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN";
  const hasNotesLayer = Boolean(role && (STUDY_NOTE_ROLES as readonly string[]).includes(role));

  const [adminPreview, setAdminPreview] = React.useState(false);
  const globalEditable = globalEditableRole && !adminPreview;

  const [overrides, setOverrides] = React.useState<Partial<Record<MapLayerKey, boolean>>>({});
  const visible = {
    global: globalEditable ? true : overrides.global ?? true,
    personal: hasNotesLayer && (overrides.personal ?? true),
    local: local.enabled && (overrides.local ?? true),
  };

  const localPins: OverlayPin[] = visible.local
    ? local.contexts.map((c) => ({
        id: LOCAL_PREFIX + c.id,
        label: c.name,
        latitude: c.latitude!,
        longitude: c.longitude!,
        variant: "local",
        meta: `Tư liệu lớp & trường · ${localMeta(c)}`,
      }))
    : [];

  const openLocal = (pinId: string) => {
    const id = pinId.slice(LOCAL_PREFIX.length);
    if (selectedLocalId === pinId) {
      router.push(ROUTES.CLASS_MATERIAL_DETAIL("CONTEXT", id));
      return;
    }
    setSelectedLocalId(pinId);
  };
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [listTab, setListTab] = React.useState<ListTab | null>(null);

  const toggleLayer = (key: MapLayerKey, next: boolean) => setOverrides((o) => ({ ...o, [key]: next }));

  const onEscape = () => {
    if (mobileOpen) {
      setMobileOpen(false);
      return true;
    }
    return false;
  };

  const previewButton = (
    <button
      type="button"
      onClick={() => {
        setAdminPreview((v) => !v);
        setListTab(null);
      }}
      aria-pressed={adminPreview}
      className={adminPreview ? "btn-ink h-10 min-h-0 px-3 text-xs" : "btn-line h-10 min-h-0 px-3 text-xs"}
    >
      {adminPreview ? <EyeOff size={15} /> : <Eye size={15} />}
      <span className="hidden sm:inline">{adminPreview ? "Thoát xem trước" : "Xem như người học"}</span>
    </button>
  );

  const headerSlot = globalEditableRole ? (
    <>
      <span className="inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] px-2 py-1 text-[11px] font-bold tracking-[0.04em] text-[var(--text-primary)]">
        <Globe2 size={13} className="text-[var(--accent-gold)]" aria-hidden="true" />
        Bản đồ chung — hiển thị cho mọi người dùng
      </span>
      {previewButton}
    </>
  ) : undefined;

  const topSlot = adminPreview ? (
    <div role="status" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--text-inverse)] md:px-6">
      <span className="inline-flex items-center gap-2">
        <Eye size={14} aria-hidden="true" /> Đang xem như người học — các công cụ chỉnh sửa bản đồ chung đã ẩn.
      </span>
      <button
        type="button"
        onClick={() => setAdminPreview(false)}
        className="py-1 text-[11px] font-bold uppercase tracking-[0.08em] underline-offset-4 hover:underline"
      >
        Thoát xem trước
      </button>
    </div>
  ) : undefined;

  const renderControls = (info: MapControlsInfo) => {
    const notesOn = hasNotesLayer && info.canTakeNotes && visible.personal;
    const rows: MapLayerRow[] = [
      {
        key: "global",
        label: "Bản đồ chung",
        hint: globalEditable ? "Bạn đang chỉnh sửa · hiển thị cho mọi người dùng" : "Trận đánh toàn quốc · chỉ đọc",
        count: info.battleCount,
        checked: visible.global,
        locked: globalEditable,
      },
    ];
    if (local.enabled) {
      rows.push({
        key: "local",
        label: "Tư liệu lớp & trường",
        hint: "Bối cảnh giáo viên soạn, đã duyệt · nhấp hai lần để mở",
        count: local.contexts.length,
        checked: visible.local,
      });
    }
    if (hasNotesLayer && info.canTakeNotes) {
      rows.push({
        key: "personal",
        label: "Ghi chú của tôi",
        hint: "Gắn với từng trận đánh · chỉ mình bạn thấy",
        count: info.studyNotes.length,
        checked: visible.personal,
      });
    }

    const tabs: { value: ListTab; label: string; count?: number }[] = [];
    if (globalEditable) tabs.push({ value: "battles", label: "Trận đánh" });
    if (notesOn) tabs.push({ value: "notes", label: "Ghi chú", count: info.studyNotesLoading ? undefined : info.studyNotes.length });
    const activeTab = tabs.find((t) => t.value === listTab)?.value ?? tabs[0]?.value ?? null;

    // Study notes in the search box: picking one opens its battle and the note.
    const notePins: OverlayPin[] = notesOn
      ? info.studyNotes.map((n) => ({
          id: STUDY_NOTE_PREFIX + n.pinId,
          label: n.label,
          latitude: n.latitude,
          longitude: n.longitude,
          variant: "personal",
          meta: `${n.battleTitle} · ${formatYear(n.year)}`,
        }))
      : [];
    const pickNote = (id: string) => {
      if (id.startsWith(LOCAL_PREFIX)) {
        const pin = localPins.find((p) => p.id === id);
        setMobileOpen(false);
        if (pin) {
          setSelectedLocalId(id);
          setLocalFocus({ latitude: pin.latitude, longitude: pin.longitude, key: `${id}-${Date.now()}` });
        }
        return;
      }
      const note = info.studyNotes.find((n) => STUDY_NOTE_PREFIX + n.pinId === id);
      if (!note) return;
      setMobileOpen(false);
      info.openStudyNote(note);
    };
    const pickBattle = (id: string) => {
      setMobileOpen(false);
      info.selectBattle(id);
    };

    const list = activeTab ? (
      <>
        {tabs.length > 1 && <ListTabs tabs={tabs} value={activeTab} onChange={setListTab} />}
        {activeTab === "battles" ? (
          <BattleOverviewList
            battles={info.battles}
            loading={info.battlesLoading}
            error={info.battlesError}
            onRetry={info.retryBattles}
            selectedId={info.selectedBattleId}
            onPick={pickBattle}
          />
        ) : (
          <StudyNotesList
            notes={info.studyNotes}
            loading={info.studyNotesLoading}
            selectedId={info.selectedStudyNoteId}
            onPick={(note) => pickNote(STUDY_NOTE_PREFIX + note.pinId)}
            onAdd={
              info.addStudyNote
                ? () => {
                    setMobileOpen(false);
                    info.addStudyNote?.();
                  }
                : undefined
            }
          />
        )}
      </>
    ) : null;

    const showControl = rows.length > 1 || Boolean(list);

    return (
      <div className="max-md:contents md:pointer-events-none md:absolute md:bottom-4 md:left-4 md:top-4 md:z-[520] md:flex md:w-[300px] md:flex-col md:gap-2">
        {showControl && (
          <MapLayerToggle
            open={mobileOpen}
            onOpenChange={setMobileOpen}
            visible={rows.filter((r) => r.checked).length}
            total={rows.length}
            className="absolute left-3 top-3 z-[525]"
          />
        )}
        <MapSearchBox
          battles={info.battles}
          pins={[...localPins, ...notePins]}
          showBattles={visible.global}
          onPickBattle={pickBattle}
          onPickPin={pickNote}
          className={
            showControl
              ? "max-md:absolute max-md:left-[60px] max-md:right-3 max-md:top-3 max-md:z-[525] md:pointer-events-auto md:shrink-0"
              : "max-md:absolute max-md:inset-x-3 max-md:top-3 max-md:z-[525] md:pointer-events-auto md:shrink-0"
          }
        />
        {showControl && (
          <MapLayerControl
            className="md:pointer-events-auto"
            rows={rows}
            onToggle={toggleLayer}
            classes={[]}
            classId={null}
            onClassChange={() => undefined}
            onAddPersonalPin={notesOn && info.addStudyNote ? info.addStudyNote : undefined}
            personalAddHint={
              notesOn && !info.addStudyNote ? "Chọn một trận đánh trên bản đồ để thêm ghi chú cho trận đó." : undefined
            }
            mobileOpen={mobileOpen}
            onMobileOpenChange={setMobileOpen}
          >
            {list}
          </MapLayerControl>
        )}
      </div>
    );
  };

  const overlay: MapOverlay = {
    pins: localPins,
    selectedId: selectedLocalId,
    onSelectPin: (id) => {
      if (id.startsWith(LOCAL_PREFIX)) openLocal(id);
    },
    focus: localFocus,
    onEscape,
    hideBattlePins: !visible.global,
    hideStudyNotes: !visible.personal,
    previewAsLearner: adminPreview,
    headerSlot,
    topSlot,
    renderControls,
  };

  return <UrlSyncedHistoricalMap onClose={onClose} overlay={overlay} />;
}
