"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
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
import { LOCAL_SCOPE_LABEL, localKeys, useStudentLocalContent, useTeacherLocalContent } from "@/features/saas/hooks-local-content";
import { localContentService, type LocalItem } from "@/services/local-content.service";
import type { HistoricalEvent } from "@/services/event.service";
import type { BattleMap } from "@/components/historical-map/battle-map.types";
import { useQueryClient } from "@tanstack/react-query";

type ListTab = "battles" | "notes";

const formatYear = (year: number) => (year < 0 ? `${Math.abs(year)} TCN` : String(year));

const LOCAL_PREFIX = "local:";
const GUIDE_KEY = "ht.classMap.guideHidden";

/** Ba buoc dung ban do Kho tu lieu cho giao vien; an duoc, nho theo trinh duyet. */
function TeacherMapGuide() {
  const stored = React.useSyncExternalStore(
    () => () => undefined,
    () => {
      try {
        return window.localStorage.getItem(GUIDE_KEY) === "1";
      } catch {
        return false;
      }
    },
    () => true,
  );
  const [dismissed, setDismissed] = React.useState(false);
  if (stored || dismissed) return null;
  const hide = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(GUIDE_KEY, "1");
    } catch {
      // Private mode: only hidden for this visit.
    }
  };
  return (
    <div className="relative mx-3 mb-2 rounded-sm border border-[var(--border-default)] bg-[var(--bg-main)] py-2 pl-3 pr-8 text-[12px] leading-5 text-[var(--text-secondary)]">
      <ol className="list-decimal space-y-0.5 pl-4">
        <li>Chọn một bối cảnh bên dưới.</li>
        <li>
          Bấm <b>Ghim vị trí</b> rồi chạm lên bản đồ.
        </li>
        <li>
          <b>Soạn lược đồ</b> để vẽ diễn biến theo từng giai đoạn.
        </li>
      </ol>
      <button
        type="button"
        onClick={hide}
        aria-label="Ẩn hướng dẫn"
        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-sm text-[var(--text-tertiary)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--text-primary)]"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Local contexts of the viewer's school for the Kho tư liệu map. `contexts`: published ones with coordinates (the
 * "Kho tư liệu" layer). `battles`: what the map treats as battles — every context a teacher can see (they place pins
 * and edit battle maps like a Content Admin), only published ones for students.
 */
function usePublishedLocalContexts(
  role: string | null,
  active: boolean,
): { contexts: LocalItem[]; battles: LocalItem[]; enabled: boolean } {
  const isTeacher = active && role === "TEACHER";
  const isStudent = active && role === "SCHOOL_STUDENT";
  const teacher = useTeacherLocalContent(isTeacher);
  const student = useStudentLocalContent(isStudent);
  const items = isTeacher ? teacher.contexts : isStudent ? student.items : [];
  const battles = items.filter((i) => i.type === "CONTEXT" && (isTeacher || i.isPublished));
  const contexts = items.filter(
    (i) =>
      i.type === "CONTEXT" &&
      i.isPublished &&
      i.latitude != null &&
      i.longitude != null &&
      isInsideMapBounds({ latitude: i.latitude, longitude: i.longitude }),
  );
  return { contexts, battles, enabled: isTeacher || isStudent };
}

/** A local context in the shape the battle map expects (BC years are negative there). */
function toBattleEvent(c: LocalItem): HistoricalEvent {
  const raw = c.year ?? c.startYear ?? c.endYear ?? new Date().getFullYear();
  return {
    id: c.id,
    title: c.name,
    summary: c.description ?? "",
    year: c.isBC ? -Math.abs(raw) : raw,
    location: c.location ?? undefined,
    imageUrl: c.imageUrl ?? null,
    videoUrl: c.videoUrl ?? null,
    battleMap: c.battleMap ?? null,
    isPublished: c.isPublished,
    status: c.status,
  };
}

/**
 * One map page per content owner, so HistoryTalk and school content never share a map:
 * - `mode="battles"` (HistoryTalk): "Bản đồ chung", battles pinned by Content Admins (editable by them, read-only
 *   for everyone else), plus "Ghi chú của tôi" (CUSTOMER, SCHOOL_STUDENT, TEACHER), the viewer's own study notes
 *   anchored to a battle and its year (USER map pins).
 * - `mode="class"` ("Bản đồ lớp", TEACHER, SCHOOL_STUDENT): published local contexts with coordinates.
 * The class layer (teacher pins per class) has no API yet and is not shown.
 */
export function LayeredHistoricalMap({ onClose, mode = "battles" }: { onClose: () => void; mode?: "battles" | "class" }) {
  const role = useRole();
  const router = useRouter();
  const classMode = mode === "class";
  const local = usePublishedLocalContexts(role, classMode);
  const [localFocus, setLocalFocus] = React.useState<(MapCoordinates & { key: string }) | null>(null);
  const [selectedLocalId, setSelectedLocalId] = React.useState<string | null>(null);
  const qc = useQueryClient();
  // Kho tư liệu map: teachers manage pins, camera focuses and battle maps of their school's contexts.
  const teacherEditableRole = classMode && role === "TEACHER";
  const globalEditableRole = (!classMode && (role === "CONTENT_ADMIN" || role === "SYSTEM_ADMIN")) || teacherEditableRole;
  // Study notes are anchored to battles, so they belong to the battle map.
  const hasNotesLayer = !classMode && Boolean(role && (STUDY_NOTE_ROLES as readonly string[]).includes(role));

  const [adminPreview, setAdminPreview] = React.useState(false);
  const globalEditable = globalEditableRole && !adminPreview;
  const teacherEditable = teacherEditableRole && !adminPreview;

  const [overrides, setOverrides] = React.useState<Partial<Record<MapLayerKey, boolean>>>({});
  const visible = {
    global: !classMode && (globalEditable ? true : overrides.global ?? true),
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
        meta: `${LOCAL_SCOPE_LABEL[c.contentScope]} · ${localMeta(c)}`,
        // Replaced by the context's own map pin once a teacher has placed one.
        eventId: c.id,
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
      <span className="hidden sm:inline">{adminPreview ? "Thoát xem trước" : classMode ? "Xem như học sinh" : "Xem như người học"}</span>
    </button>
  );

  // Who sees the edits is said once, in the subtitle (see `overlay` below), instead of a separate header badge.
  const headerSlot = teacherEditableRole || globalEditableRole ? previewButton : undefined;

  const topSlot = adminPreview ? (
    // Nut "Thoát xem trước" da o header; thanh nay chi bao trang thai.
    <div role="status" className="flex items-center gap-2 border-b border-[var(--text-primary)] bg-[var(--text-primary)] px-4 py-1.5 text-xs font-semibold text-[var(--text-inverse)] md:px-6">
      <Eye size={14} aria-hidden="true" /> Đang xem như {classMode ? "học sinh" : "người học"} — các công cụ chỉnh sửa đã ẩn.
    </div>
  ) : undefined;

  const renderControls = (info: MapControlsInfo) => {
    const notesOn = hasNotesLayer && info.canTakeNotes && visible.personal;
    // An editor's only layer is the locked "Bản đồ chung": nothing to toggle, so no layer row (the list stays).
    const rows: MapLayerRow[] = classMode || globalEditable
      ? []
      : [
          {
            key: "global",
            label: "Bản đồ chung",
            hint: globalEditable ? "Bạn đang chỉnh sửa · hiển thị cho mọi người dùng" : "Trận đánh toàn quốc · chỉ đọc",
            count: info.battleCount,
            checked: visible.global,
            locked: globalEditable,
          },
        ];
    // Ban do Kho tu lieu chi co mot lop (boi canh cua truong): khong co gi de bat/tat nen khong hien o chon lop.
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
            {...(teacherEditable && { title: "Bối cảnh của trường", noun: "bối cảnh", intro: <TeacherMapGuide /> })}
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

    const showControl = classMode ? rows.length > 0 || Boolean(list) : rows.length > 1 || Boolean(list);

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
        {/* The battle list has its own filter box; a second search box would only search the same battles. */}
        {!(activeTab === "battles" && localPins.length === 0 && notePins.length === 0) && (
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
        )}
        {/* Ghim tren ban do den tu ca toa do cua boi canh lan ghim rieng (battleCount), nen dem ca hai. */}
        {classMode && !list && !info.battlesLoading && (
          <p className="max-md:absolute max-md:inset-x-3 max-md:top-16 max-md:z-[525] rounded-sm border border-border-card bg-[var(--bg-surface)] px-3 py-2 text-xs leading-snug text-[var(--text-secondary)] shadow-[var(--shadow-soft)] md:pointer-events-auto">
            {info.battleCount + localPins.length === 0
              ? "Chưa có bối cảnh nào được ghim lên bản đồ."
              : "Bấm vào một ghim để xem bối cảnh thầy cô soạn."}
          </p>
        )}
        {showControl && (
          <MapLayerControl
            className="md:pointer-events-auto"
            title={rows.length ? undefined : classMode ? "Bối cảnh" : "Trận đánh"}
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
    // On the Kho tư liệu map the "battles" are the school's contexts, shown with the local layer.
    hideBattlePins: classMode ? !visible.local : !visible.global,
    hideStudyNotes: !visible.personal,
    previewAsLearner: adminPreview,
    // Content Admin: the side list picks battles and the battle panel holds the pin actions, like the teacher map.
    ...(!classMode && globalEditable && {
      subtitle: "Bạn đang chỉnh sửa bản đồ chung · mọi người dùng đều thấy thay đổi",
      hideBattlePicker: true,
    }),
    ...(classMode && {
      title: "Bản đồ Kho tư liệu",
      subtitle: teacherEditable
        ? "Ghim bối cảnh lên bản đồ và soạn lược đồ diễn biến. Học sinh của trường thấy bối cảnh đã xuất bản."
        : "Bối cảnh lịch sử thầy cô soạn cho lớp và trường.",
      // Danh sach ben trai da chon boi canh; khong can them o chon tren header.
      hideBattlePicker: true,
      disableStudyNotes: true,
      characterLinkHref: (id: string) => ROUTES.TEACHING.LOCAL_EDIT(id, "CONTEXT"),
      events: local.battles.map(toBattleEvent),
      canEdit: teacherEditableRole,
      saveBattleMap: async (eventId: string, map: BattleMap) => {
        const saved = await localContentService.updateContext(eventId, { battleMap: map });
        qc.invalidateQueries({ queryKey: ["local-content", "teacher"] });
        qc.setQueryData(localKeys.item("CONTEXT", eventId), saved);
        return saved.battleMap ?? map;
      },
    }),
    headerSlot,
    topSlot,
    renderControls,
  };

  return <UrlSyncedHistoricalMap onClose={onClose} overlay={overlay} />;
}
