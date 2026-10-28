"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AudioLines,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  ChevronDown,
  Link2,
  Eye,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  SquarePen,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { useEvents } from "@/features/events/hooks";
import {
  useCreateMapPin,
  useDeleteMapPin,
  useMapPins,
  useOverviewMapPins,
  useUpdateMapPin,
  type MapPinMessages,
} from "@/features/map-pins/hooks";
import { ConfirmDialog } from "@/components/commons/confirm-dialog";
import { useEventCharacters } from "@/features/landmark/hooks";
import { useAuthStore } from "@/store/auth.store";
import type { CreateMapPinRequest, MapPin as BattlePin } from "@/services/map-pin.service";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { BattleDetailView } from "./BattleDetailView";
import type { BattleOverviewItem, MapOverlay, OverlayPin, StudyNoteSummary } from "./map-overlay.types";
import {
  STUDY_NOTE_COLOR,
  STUDY_NOTE_PREFIX,
  STUDY_NOTE_ROLES,
  StudyNoteForm,
  StudyNotesSection,
  type StudyNoteDraft,
} from "./StudyNotes";
import styles from "./battle-experience.module.css";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-bg-main">
        <Loader2 className="animate-spin text-[var(--accent-gold)]" size={30} />
      </div>
    ),
  },
);

/** Which battle is selected and which screen is shown: map, battle page, or lược đồ editor. */
export type MapRoute = { battle: string | null; view: "map" | "detail" | "edit" };
/** push: new history entry · replace: same entry · back: return to the previous screen. */
export type MapRouteNavigation = "push" | "replace" | "back";

interface HistoricalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** When given, the route is controlled (e.g. synced with the page URL); otherwise kept in local state. */
  route?: MapRoute;
  onRouteChange?: (next: MapRoute, how: MapRouteNavigation) => void;
  /** Optional custom layers (class map, personal notes) drawn above the battle map. */
  overlay?: MapOverlay;
}

type Coordinates = { latitude: number; longitude: number };
/** Add/edit form of a study note; `placing` = the next map click sets its position. */
type NoteEditor = { contextId: string; pin: BattlePin | null; coordinates: Coordinates | null; placing: boolean };

const STUDY_NOTE_MESSAGES: MapPinMessages = {
  created: "Đã lưu ghi chú",
  deleted: "Đã xóa ghi chú",
  createError: "Không lưu được ghi chú. Vui lòng thử lại.",
  updateError: "Không cập nhật được ghi chú. Vui lòng thử lại.",
  deleteError: "Không xóa được ghi chú. Vui lòng thử lại.",
};

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
const DEFAULT_YEAR = new Date().getFullYear();
const HISTORICAL_MAP_IMAGE = "/war.jpg";

function eventYear(event?: { year?: number; startYear?: number }) {
  return event?.year ?? event?.startYear ?? DEFAULT_YEAR;
}

function formatYear(year: number) {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

export function HistoricalMapModal({ isOpen, onClose, route: controlledRoute, onRouteChange, overlay }: HistoricalMapModalProps) {
  const user = useAuthStore((state) => state.user);
  // "Xem như người học": a Content Admin sees the learner screen, without any editing control.
  // Pages with their own battles (overlay.events) decide who edits; otherwise Content / System Admins.
  const isAdmin =
    (overlay?.canEdit ?? (user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN")) && !overlay?.previewAsLearner;
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  // Personal study notes (USER pins): learners only — never in the admin "Xem như người học" preview.
  const canTakeNotes =
    Boolean(user && (STUDY_NOTE_ROLES as readonly string[]).includes(user.role)) && !overlay?.previewAsLearner && !overlay?.disableStudyNotes;
  const isGuest = authHydrated && !user;
  const [localRoute, setLocalRoute] = useState<MapRoute>({ battle: null, view: "map" });
  const route = controlledRoute ?? localRoute;
  const navigate = (next: MapRoute, how: MapRouteNavigation) => {
    if (controlledRoute && onRouteChange) onRouteChange(next, how);
    else setLocalRoute(next);
  };
  const contextId = route.battle;
  const [selectedPin, setSelectedPin] = useState<BattlePin | null>(null);
  const [panelDismissed, setPanelDismissed] = useState(!route.battle);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [detailCharacterId, setDetailCharacterId] = useState<string | undefined>();
  /** Screen the editor returns to when closed (only meaningful without browser history). */
  const [editorOrigin, setEditorOrigin] = useState<"map" | "detail">("map");
  const [noteEditor, setNoteEditor] = useState<NoteEditor | null>(null);
  const [selectedNote, setSelectedNote] = useState<{ id: string; contextId: string } | null>(null);
  const [pendingNoteDelete, setPendingNoteDelete] = useState<BattlePin | null>(null);
  /** Camera target for a study note; only wins while the custom layer's focus is unchanged. */
  const [noteFocus, setNoteFocus] = useState<(Coordinates & { key: string; seq: number; overlayKey?: string }) | null>(null);

  // Keep the side panel in step with the selected battle, including browser Back/Forward.
  useEffect(() => {
    setPanelDismissed(!contextId);
    setSelectedPin((pin) => (pin && pin.contextId === contextId ? pin : null));
    setNoteEditor((editor) => (editor && editor.contextId === contextId ? editor : null));
    setSelectedNote((note) => (note && note.contextId === contextId ? note : null));
  }, [contextId]);

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } =
    useEvents({ page: 1, limit: 200 });

  const customEvents = overlay?.events;
  const events = useMemo(
    () => (customEvents ?? eventsData?.content ?? []).filter((event) => Boolean(event.id)),
    [customEvents, eventsData?.content],
  );

  const activeContextId = contextId;
  const overviewQueries = useOverviewMapPins(events.map((event) => ({ id: event.id, year: eventYear(event) })));
  const activeEvent = events.find((event) => event.id === activeContextId);
  const activeYear = eventYear(activeEvent);

  const {
    data: pins = [],
    isLoading: pinsLoading,
    isFetching: pinsFetching,
    isError: pinsError,
    refetch: refetchPins,
  } = useMapPins(activeContextId, activeYear);

  const createPin = useCreateMapPin(activeContextId, activeYear);
  const deletePin = useDeleteMapPin(activeContextId, activeYear);
  const updatePin = useUpdateMapPin(activeContextId, activeYear);
  const { data: characters = [], isLoading: charactersLoading } = useEventCharacters(activeContextId);
  const createNote = useCreateMapPin(activeContextId, activeYear, STUDY_NOTE_MESSAGES);
  const updateNote = useUpdateMapPin(activeContextId, activeYear, STUDY_NOTE_MESSAGES);
  const deleteNote = useDeleteMapPin(activeContextId, activeYear, STUDY_NOTE_MESSAGES);

  const mainPin = useMemo(
    () => pins.find((pin) => pin.pinOwnerType === "ADMIN") ?? null,
    [pins],
  );
  const liveSelectedPin = selectedPin && pins.some((pin) => pin.pinId === selectedPin.pinId) ? selectedPin : null;
  const focusedPin = panelDismissed ? null : liveSelectedPin ?? mainPin;

  // ── Study notes of the selected battle (the API returns only the caller's own USER pins) ──
  const studyNotes = useMemo(
    () => (canTakeNotes ? pins.filter((pin) => pin.pinOwnerType === "USER") : []),
    [canTakeNotes, pins],
  );
  const selectedNoteId = selectedNote && studyNotes.some((pin) => pin.pinId === selectedNote.id) ? selectedNote.id : null;
  const notePlacing = Boolean(noteEditor?.placing) && !isAdding;
  const notesBusy = Boolean(noteEditor) || createNote.isPending || updateNote.isPending || deleteNote.isPending;
  const showNoteMarkers = canTakeNotes && !overlay?.hideStudyNotes;
  const editingNoteId = noteEditor?.pin?.pinId;
  const overlayPinsSource = overlay?.pins;
  const activeTitle = activeEvent?.title;
  const mapOverlayPins = useMemo<OverlayPin[] | undefined>(() => {
    if (!showNoteMarkers || studyNotes.length === 0) return overlayPinsSource;
    const notePins: OverlayPin[] = studyNotes
      .filter((pin) => pin.pinId !== editingNoteId)
      .map((pin) => ({
        id: STUDY_NOTE_PREFIX + pin.pinId,
        label: pin.label,
        latitude: pin.latitude,
        longitude: pin.longitude,
        variant: "personal",
        tone: "jade",
        meta: pin.description?.trim() ? clip(pin.description.trim(), 120) : `Ghi chú · ${activeTitle ?? formatYear(pin.pinYear)}`,
      }));
    return [...(overlayPinsSource ?? []), ...notePins];
  }, [showNoteMarkers, studyNotes, overlayPinsSource, editingNoteId, activeTitle]);

  // Build the visible pin list for the map overview.
  // When admin is actively placing a new pin, exclude the current context's pin
  // so that clicking on the map doesn't accidentally hit the existing marker
  // instead of setting draftCoordinates.
  const visiblePins = overviewQueries.flatMap((query, index) => {
    const eventId = events[index]?.id;
    if (isAdding && eventId === activeContextId) return [];
    const pin = query.data?.find((item) => item.pinOwnerType === "ADMIN");
    return pin ? [pin] : [];
  });

  // For regular users, only show events that have an admin-pinned location.
  // Admins always see all events so they can manage pins.
  const pinnedEventIds = useMemo(() => {
    const ids = new Set<string>();
    overviewQueries.forEach((query, index) => {
      const hasPin = query.data?.some((pin) => pin.pinOwnerType === "ADMIN");
      if (hasPin && events[index]?.id) {
        ids.add(events[index].id);
      }
    });
    return ids;
  }, [overviewQueries, events]);

  const selectableEvents = useMemo(
    () => isAdmin ? events : events.filter((event) => pinnedEventIds.has(event.id)),
    [isAdmin, events, pinnedEventIds],
  );
  const overviewQueriesLoading = overviewQueries.some((q) => q.isLoading);

  // Every saved study note of the viewer, read from the per-battle queries the overview already
  // makes (each battle at its own year), so listing them costs no extra request.
  const allStudyNotes = useMemo<StudyNoteSummary[]>(() => {
    if (!canTakeNotes) return [];
    return overviewQueries.flatMap((query, index) => {
      const event = events[index];
      if (!event) return [];
      return (query.data ?? [])
        .filter((pin) => pin.pinOwnerType === "USER")
        .map((pin) => ({
          pinId: pin.pinId,
          contextId: pin.contextId,
          label: pin.label,
          note: pin.description,
          battleTitle: event.title,
          year: pin.pinYear,
          latitude: pin.latitude,
          longitude: pin.longitude,
        }));
    });
  }, [canTakeNotes, overviewQueries, events]);

  // Summary of every selectable battle for the overlay search box and the admin overview list.
  const battleOverview: BattleOverviewItem[] = selectableEvents.map((event) => {
    const query = overviewQueries[events.indexOf(event)];
    const pin = query?.data?.find((item) => item.pinOwnerType === "ADMIN");
    const battleMap = event.battleMap;
    return {
      id: event.id,
      title: event.title,
      year: event.year,
      location: event.location ?? undefined,
      coordinates: pin ? { latitude: pin.latitude, longitude: pin.longitude } : null,
      hasNarration:
        Boolean(battleMap?.phases?.some((phase) => phase.narration.trim().length > 0)) || Boolean(pin?.description?.trim()),
      hasBattleMap: Boolean(battleMap && (battleMap.symbols.length > 0 || battleMap.imageUrl)),
    };
  });
  const canDeleteSelected = Boolean(focusedPin && isAdmin && focusedPin.pinOwnerType === "ADMIN");
  const overlayPlacing = Boolean(overlay?.placing) && !isAdding && !notePlacing;
  const overlayFocusKey = overlay?.focus?.key;
  const mapFocus = noteFocus && noteFocus.overlayKey === overlayFocusKey ? noteFocus : overlay?.focus ?? null;
  const overlayEscapeRef = useRef(overlay?.onEscape);
  useEffect(() => {
    overlayEscapeRef.current = overlay?.onEscape;
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (route.view !== "map") {
        return; // Detail/editor handles Escape and unsaved changes.
      } else if (pendingNoteDelete) {
        return; // The confirm dialog closes itself.
      } else if (!isAdding && noteEditor) {
        // Esc while re-placing an existing note returns to its form; otherwise it closes the form.
        if (noteEditor.placing && noteEditor.coordinates) setNoteEditor({ ...noteEditor, placing: false });
        else setNoteEditor(null);
        return;
      } else if (!isAdding && selectedNote) {
        setSelectedNote(null);
        return;
      } else if (!isAdding && overlayEscapeRef.current?.()) {
        return; // A custom layer (placement, detail panel) consumed it.
      } else if (isAdding || selectedPin) {
        setIsAdding(false);
        setDraftCoordinates(null);
        setSelectedPin(null);
        navigate({ battle: null, view: "map" }, "replace");
        setPanelDismissed(true);
      } else if (focusedPin && !panelDismissed) {
        setPanelDismissed(true);
        navigate({ battle: null, view: "map" }, "replace");
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate is recreated each render
  }, [isAdding, isOpen, onClose, selectedPin, route.view, focusedPin, panelDismissed, noteEditor, selectedNote, pendingNoteDelete]);

  const chooseContext = (nextContextId: string) => {
    navigate({ battle: nextContextId || null, view: "map" }, "replace");
    setPanelDismissed(!nextContextId);
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(false);
    setDetailCharacterId(undefined);
    setNoteEditor(null);
    setSelectedNote(null);
  };

  const openScreen = (view: "detail" | "edit", characterId?: string) => {
    if (!activeEvent) return;
    setDetailCharacterId(characterId);
    if (view === "edit") setEditorOrigin(route.view === "detail" ? "detail" : "map");
    navigate({ battle: activeEvent.id, view }, "push");
  };

  const startAdding = () => {
    if (!isAdmin || !activeContextId) return;
    setPanelDismissed(false);
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(true);
    setNoteEditor(null);
  };

  // ── Study notes ──
  const focusNote = (coordinates: Coordinates, id: string) =>
    setNoteFocus((previous) => {
      const seq = (previous?.seq ?? 0) + 1;
      return { latitude: coordinates.latitude, longitude: coordinates.longitude, seq, key: `${id}:${seq}`, overlayKey: overlayFocusKey };
    });

  const selectNote = (pin: { pinId: string; contextId: string; latitude: number; longitude: number }) => {
    setSelectedNote({ id: pin.pinId, contextId: pin.contextId });
    setPanelDismissed(false);
    focusNote(pin, pin.pinId);
  };

  const startNote = () => {
    if (!canTakeNotes || !activeContextId) return;
    setIsAdding(false);
    setDraftCoordinates(null);
    setSelectedNote(null);
    setPanelDismissed(false);
    setNoteEditor({ contextId: activeContextId, pin: null, coordinates: null, placing: true });
  };

  const editNote = (pin: BattlePin, move: boolean) => {
    if (!canTakeNotes) return;
    setNoteEditor({
      contextId: pin.contextId,
      pin,
      coordinates: { latitude: pin.latitude, longitude: pin.longitude },
      placing: move,
    });
  };

  const saveNote = async (draft: StudyNoteDraft) => {
    if (!noteEditor?.coordinates) return;
    const position = { latitude: noteEditor.coordinates.latitude, longitude: noteEditor.coordinates.longitude };
    try {
      const saved = noteEditor.pin
        ? await updateNote.mutateAsync({
            pin: noteEditor.pin,
            // "" clears the note on the server.
            changes: { label: draft.label, description: draft.note, ...position },
          })
        : await createNote.mutateAsync({ label: draft.label, description: draft.note || undefined, ...position, pinYear: activeYear });
      if (noteEditor.pin) toast.success("Đã cập nhật ghi chú");
      setNoteEditor(null);
      setSelectedNote({ id: saved.pinId, contextId: saved.contextId });
    } catch {
      // The mutation shows the error toast; keep the form for retry.
    }
  };

  const confirmNoteDelete = async () => {
    const pin = pendingNoteDelete;
    if (!pin) return;
    setPendingNoteDelete(null);
    try {
      await deleteNote.mutateAsync(pin.pinId);
      setSelectedNote(null);
    } catch {
      // Toast already shown.
    }
  };

  const openStudyNote = (note: StudyNoteSummary) => {
    if (note.contextId !== activeContextId) chooseContext(note.contextId);
    setIsAdding(false);
    setNoteEditor(null);
    selectNote(note);
  };

  const handleCreate = async (payload: CreateMapPinRequest) => {
    try {
      // Moving an existing pin edits it in place (PUT keeps its pinId; falls back to create-then-delete on 405).
      if (mainPin) {
        // No description: narration now lives in the battle map phases; the stored text is left as is.
        await updatePin.mutateAsync({ pin: mainPin, changes: payload });
        toast.success("Đã cập nhật vị trí ghim");
      }
      else await createPin.mutateAsync(payload);
      setDraftCoordinates(null);
      setIsAdding(false);
    } catch {
      // Mutations surface their own toast; keep the draft for retry.
    }
  };

  const handleDelete = async () => {
    if (!focusedPin) return;
    try {
      await deletePin.mutateAsync(focusedPin.pinId);
      setSelectedPin(null);
    } catch {
      // Keep the panel open so the admin can retry.
    }
  };

  if (route.view !== "map" && activeEvent) {
    return (
      <BattleDetailView
        key={activeEvent.id}
        event={activeEvent}
        pin={focusedPin}
        characters={characters}
        initialCharacterId={detailCharacterId}
        editing={route.view === "edit"}
        onOpenEditor={() => openScreen("edit")}
        onCloseEditor={() => navigate({ battle: activeEvent.id, view: editorOrigin }, "back")}
        onBack={() => navigate({ battle: activeEvent.id, view: "map" }, "back")}
        onClose={() => { navigate({ battle: activeEvent.id, view: "map" }, "back"); setSelectedPin(null); }}
        previewAsLearner={overlay?.previewAsLearner}
        canEdit={overlay?.canEdit}
        onSaveBattleMap={overlay?.saveBattleMap ? (map) => overlay.saveBattleMap!(activeEvent.id, map) : undefined}
      />
    );
  }

  return (
    <div className={cn(styles.mapPage, "flex h-full min-h-0 flex-col bg-[var(--bg-main)] text-[var(--text-primary)]")}>
      {/* The map is the content: a slim title row, so the map gets the height. */}
      <header className="shrink-0 border-b border-[var(--border-default)] bg-[var(--header-bg)] px-4 py-2.5 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-auto min-w-0 flex-1 sm:flex-none">
            <h1 className="font-title text-lg font-bold leading-tight text-[var(--text-primary)] md:text-xl">{overlay?.title ?? "Bản đồ trận đánh"}</h1>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              {overlay?.subtitle ?? "Những trận đánh làm nên lịch sử."}
            </p>
          </div>

          {overlay?.headerSlot}

          {!overlay?.hideBattlePicker && (
            <label className="relative order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 md:max-w-[420px]">
              <span className="sr-only">Chọn bối cảnh lịch sử</span>
              <select
                value={activeContextId ?? ""}
                onChange={(event) => chooseContext(event.target.value)}
                disabled={eventsLoading || overviewQueriesLoading || selectableEvents.length === 0}
                className="h-10 w-full appearance-none rounded-sm border border-border-card bg-[var(--bg-surface)] py-0 pl-3 pr-9 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:opacity-60"
              >
                {selectableEvents.length > 0 && <option value="">— Tất cả trận đánh —</option>}
                {selectableEvents.length === 0 ? (
                  <option value="">
                    {overviewQueriesLoading ? "Đang tải..." : isAdmin ? "Không có bối cảnh khả dụng" : "Chưa có trận đánh nào được ghim"}
                  </option>
                ) : (
                  selectableEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={16} />
            </label>
          )}

          {isAdmin && !overlay?.hideBattlePicker && (
            <button
              type="button"
              onClick={startAdding}
              disabled={!activeContextId || isAdding}
              className="btn-ink h-10 min-h-0 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">{mainPin ? "Đổi vị trí ghim" : "Ghim vị trí"}</span>
            </button>
          )}

          {canTakeNotes && activeContextId && mainPin && (
            <button
              type="button"
              onClick={startNote}
              disabled={notesBusy}
              aria-label="Thêm ghi chú cho trận đánh này"
              title="Thêm ghi chú của tôi"
              className="btn-line h-10 min-h-0 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Bookmark size={16} className="text-[var(--jade)]" />
              <span className="hidden sm:inline">Thêm ghi chú</span>
            </button>
          )}

          {/* Nút X chỉ hiện khi đang có pin được chọn/hiển thị */}
          {!panelDismissed && activeContextId && (
            <button
              type="button"
              onClick={() => chooseContext("")}
              title="Bỏ chọn trận đánh"
              className="grid h-10 w-10 place-items-center rounded-sm border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
              aria-label="Bỏ chọn trận đánh"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      {overlay?.topSlot}

      <div className={cn(
        "grid min-h-0 flex-1 gap-0 overflow-y-auto bg-bg-main",
        // Placing a pin floats a small card over the map instead of opening the side column, so the map keeps its width.
        panelDismissed || isAdding
          ? "grid-rows-1 lg:grid-cols-1 lg:grid-rows-1 lg:overflow-hidden"
          : "grid-rows-[minmax(200px,35%)_1fr] lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1 lg:overflow-hidden",
      )}>
        <main className="map-stage relative min-h-0 min-w-0 overflow-hidden border-r border-[var(--text-primary)]">
          <LeafletMap
            battle={activeEvent}
            battles={events}
            pins={overlay?.hideBattlePins ? [] : visiblePins}
            draftCoordinates={draftCoordinates ?? (isAdding ? null : noteEditor ? noteEditor.coordinates : overlay?.draft ?? null)}
            draftLabel={noteEditor && !isAdding ? "Ghi chú · Chưa lưu" : undefined}
            draftColor={noteEditor && !isAdding ? STUDY_NOTE_COLOR : undefined}
            selectedPinId={focusedPin?.pinId ?? null}
            panelDismissed={panelDismissed}
            isAdding={isAdding}
            onSelectPin={(pin) => {
              navigate({ battle: pin.contextId, view: "map" }, "replace");
              setSelectedPin(pin);
              setPanelDismissed(false);
              setIsAdding(false);
              setDraftCoordinates(null);
            }}
            onMapClick={
              isAdding
                ? setDraftCoordinates
                : notePlacing
                  ? (coordinates) => setNoteEditor((editor) => (editor ? { ...editor, coordinates, placing: false } : editor))
                  : overlayPlacing
                  ? overlay?.onMapClick
                  : (coordinates) => {
                      overlay?.onMapClick?.(coordinates);
                      chooseContext("");
                    }
            }
            overlayPins={mapOverlayPins?.filter((pin) => !pin.eventId || !pinnedEventIds.has(pin.eventId))}
            selectedOverlayId={selectedNoteId && showNoteMarkers ? STUDY_NOTE_PREFIX + selectedNoteId : overlay?.selectedId ?? null}
            onSelectOverlayPin={(id) => {
              if (id.startsWith(STUDY_NOTE_PREFIX)) {
                const pin = studyNotes.find((note) => note.pinId === id.slice(STUDY_NOTE_PREFIX.length));
                if (pin && !noteEditor) selectNote(pin);
                return;
              }
              setSelectedNote(null);
              overlay?.onSelectPin?.(id);
            }}
            overlayFocus={mapFocus}
            placing={overlayPlacing || notePlacing}
          />

          {overlay?.renderControls?.({
            battleCount: overlay.hideBattlePins ? 0 : visiblePins.length,
            battles: battleOverview,
            battlesLoading: eventsLoading || overviewQueriesLoading,
            battlesError: eventsError,
            retryBattles: () => void refetchEvents(),
            selectedBattleId: panelDismissed ? null : activeContextId,
            selectBattle: chooseContext,
            canTakeNotes,
            studyNotes: allStudyNotes,
            studyNotesLoading: canTakeNotes && (eventsLoading || overviewQueriesLoading),
            openStudyNote,
            selectedStudyNoteId: selectedNoteId,
            addStudyNote: canTakeNotes && activeContextId && mainPin && !notesBusy && !panelDismissed ? startNote : null,
          })}


          {pinsFetching && !pinsLoading && (
            <StatusPill className="right-4 top-4">
              <Loader2 className="animate-spin" size={14} /> Đang cập nhật
            </StatusPill>
          )}

          {notePlacing && (
            <StatusPill className="left-1/2 top-4 -translate-x-1/2 bg-text-primary text-text-inverse">
              <Bookmark size={16} /> Chạm vào bản đồ để đặt ghi chú
            </StatusPill>
          )}

          {isAdding && (
            <div className="absolute z-[530] max-lg:inset-x-3 max-lg:bottom-3 lg:right-4 lg:top-4 lg:w-[340px]">
              <CreatePinPanel
                key={activeContextId}
                battleTitle={activeEvent?.title ?? ""}
                initialPin={mainPin}
                coordinates={draftCoordinates}
                year={activeYear}
                isSubmitting={createPin.isPending || deletePin.isPending || updatePin.isPending}
                onCancel={() => {
                  setIsAdding(false);
                  setDraftCoordinates(null);
                }}
                onSubmit={handleCreate}
              />
            </div>
          )}

          {(eventsError || pinsError) && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(390px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-sm border border-border-card bg-[var(--bg-surface)] p-5 text-center shadow-[var(--shadow-soft)]">
              <AlertCircle className="mx-auto text-[var(--accent-danger)]" size={28} />
              <p className="mt-2 text-sm font-bold">Không tải được dữ liệu bản đồ</p>
              <button
                type="button"
                onClick={() => void (eventsError ? refetchEvents() : refetchPins())}
                className="btn-ink mt-3 min-h-0 px-3 py-2 text-xs"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}

          {!pinsLoading && !pinsError && !mainPin && !isAdding && activeContextId && (
            // Thanh nho o mep duoi thay vi hop giua man hinh: khong che ban do.
            <div className="absolute bottom-4 left-1/2 z-[500] flex w-max max-w-[calc(100%-32px)] -translate-x-1/2 items-center gap-3 rounded-sm border border-border-card bg-bg-surface py-2 pl-3 pr-2 text-sm shadow-[var(--shadow-soft)] backdrop-blur">
              <MapPin className="shrink-0 text-[var(--accent-gold)]" size={18} aria-hidden="true" />
              <span className="font-semibold">Chưa có vị trí trên bản đồ</span>
              {isAdmin && (
                <button type="button" onClick={startAdding} className="btn-ink h-8 min-h-0 px-3 text-xs">
                  <LocateFixed size={14} /> Ghim vị trí
                </button>
              )}
            </div>
          )}
        </main>

        {!panelDismissed && !isAdding && (
          <aside className="min-h-0 overflow-y-auto bg-[var(--bg-surface)]">
            {noteEditor ? (
              <StudyNoteForm
                key={noteEditor.pin?.pinId ?? "new"}
                battleTitle={activeEvent?.title ?? ""}
                year={activeYear}
                initial={noteEditor.pin}
                coordinates={noteEditor.coordinates}
                placing={noteEditor.placing}
                submitting={createNote.isPending || updateNote.isPending}
                onPickOnMap={() => setNoteEditor({ ...noteEditor, placing: true })}
                onCancel={() => setNoteEditor(null)}
                onSubmit={saveNote}
              />
            ) : (
              <BattleContextPanel
                key={activeContextId}
                event={activeEvent}
                pin={focusedPin}
                characters={characters}
                charactersLoading={charactersLoading}
                isAdmin={isAdmin}
                canDelete={canDeleteSelected}
                isDeleting={deletePin.isPending}
                onDelete={handleDelete}
                onStartAdding={startAdding}
                onOpenDetail={() => openScreen("detail")}
                onOpenEditor={() => openScreen("edit")}
                onOpenCharacter={(id) => openScreen("detail", id)}
                characterLinkHref={activeEvent && overlay?.characterLinkHref ? overlay.characterLinkHref(activeEvent.id) : undefined}
                notesSlot={
                  canTakeNotes ? (
                    <StudyNotesSection
                      mode="learner"
                      notes={studyNotes}
                      loading={pinsLoading}
                      selectedId={selectedNoteId}
                      busy={notesBusy}
                      onSelect={(pin) => (pin.pinId === selectedNoteId ? setSelectedNote(null) : selectNote(pin))}
                      onAdd={startNote}
                      onEdit={(pin) => editNote(pin, false)}
                      onMove={(pin) => editNote(pin, true)}
                      onDelete={setPendingNoteDelete}
                    />
                  ) : isGuest && activeEvent ? (
                    <StudyNotesSection mode="guest" />
                  ) : null
                }
              />
            )}
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={pendingNoteDelete !== null}
        onOpenChange={(open) => !open && setPendingNoteDelete(null)}
        title="Xóa ghi chú này?"
        description={pendingNoteDelete ? `«${pendingNoteDelete.label}» sẽ bị xóa vĩnh viễn khỏi bản đồ của bạn.` : undefined}
        confirmLabel="Xóa ghi chú"
        variant="danger"
        isPending={deleteNote.isPending}
        onConfirm={() => void confirmNoteDelete()}
      />
    </div>
  );
}

function StatusPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("absolute z-[500] flex items-center gap-2 rounded-sm border border-border-card bg-bg-surface px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[var(--shadow-soft)] backdrop-blur", className)}>
      {children}
    </div>
  );
}

/** Small grey section label: sections are separated by space, not by heavy rules. */
const PANEL_LABEL = "mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]";

function BattleContextPanel({
  event,
  pin,
  characters,
  charactersLoading,
  isAdmin,
  canDelete,
  isDeleting,
  onDelete,
  onStartAdding,
  onOpenDetail,
  onOpenEditor,
  onOpenCharacter,
  characterLinkHref,
  notesSlot,
}: {
  event?: HistoricalEvent;
  pin: BattlePin | null;
  characters: Character[];
  charactersLoading: boolean;
  isAdmin: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
  onStartAdding: () => void;
  onOpenDetail: () => void;
  onOpenEditor: () => void;
  onOpenCharacter: (id: string) => void;
  characterLinkHref?: string;
  /** "Ghi chú của tôi" block (learners) or the sign-in hint (guests). */
  notesSlot?: ReactNode;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const phases = event?.battleMap?.phases ?? [];
  const linkHref = event ? characterLinkHref ?? `/staff/contexts/${event.id}?tab=characters` : "";
  return (
    <div className={cn("flex min-h-full flex-col lg:h-full", styles.contextPanel)}>
      {/* Compact header: thumbnail beside the facts, so the content below needs little scrolling. */}
      <div className="flex shrink-0 gap-3 border-b border-[var(--text-primary)] px-4 py-3">
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-sm border border-border-card bg-[var(--bg-deep)]">
          <Image
            src={event?.imageUrl || HISTORICAL_MAP_IMAGE}
            alt=""
            fill
            sizes="88px"
            className={cn("object-cover", styles.contextImage)}
          />
        </div>
        <div className="min-w-0 flex-1">
          {event ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-[26px] font-extrabold leading-none tabular-nums text-[var(--accent-gold)]">
                  {Math.abs(event.year)}
                </span>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  {event.year < 0 ? "TCN" : "SCN"}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 font-display text-[19px] font-bold leading-[1.2] text-[var(--text-primary)]">{event.title}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-[var(--text-secondary)]">
                {event.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-[var(--accent-gold)]" aria-hidden="true" /> {event.location}
                  </span>
                )}
                {phases.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[var(--jade)]">
                    <AudioLines size={12} aria-hidden="true" /> {phases.length} giai đoạn
                  </span>
                ) : pin?.description?.trim() ? (
                  <span className="inline-flex items-center gap-1 text-[var(--jade)]">
                    <AudioLines size={12} aria-hidden="true" /> Có thuyết minh
                  </span>
                ) : null}
                {!pin && <span className="text-[var(--text-tertiary)]">Chưa ghim trên bản đồ</span>}
              </p>
            </>
          ) : (
            <p className="font-display text-[20px] font-bold leading-[1.2]">Chọn một trận đánh</p>
          )}
        </div>
      </div>
      {isAdmin && pin && (
        <p className="shrink-0 border-b border-[var(--border-default)] px-4 py-1.5 text-[11px] tabular-nums text-[var(--text-muted)]">
          Ghim: {pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)} · năm {formatYear(pin.pinYear)}
        </p>
      )}

      <div className="min-h-0 space-y-5 px-4 py-3.5 lg:flex-1 lg:overflow-y-auto">
        {event && (
          <section>
            <p className={PANEL_LABEL}>Bối cảnh</p>
            <p className={cn("text-[14px] leading-6 text-[var(--text-primary)]", !summaryOpen && "line-clamp-3")}>
              {event.summary || "Bối cảnh này chưa có phần mô tả."}
            </p>
            {(event.summary?.length ?? 0) > 160 && (
              <button
                type="button"
                onClick={() => setSummaryOpen((open) => !open)}
                className="mt-1 text-[12px] font-bold text-[var(--gold-on-light)] hover:underline"
              >
                {summaryOpen ? "Thu gọn" : "Đọc thêm"}
              </button>
            )}
          </section>
        )}

        <section>
          <div className="flex items-baseline justify-between gap-2">
            <p className={PANEL_LABEL}>Gặp nhân vật lịch sử</p>
            {isAdmin && event && characters.length > 0 && (
              <Link
                href={linkHref}
                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)] hover:underline"
              >
                <Link2 size={13} /> Liên kết thêm
              </Link>
            )}
          </div>
          {characters.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {characters.slice(0, 6).map((character) => (
                <button
                  key={character.id}
                  type="button"
                  onClick={() => onOpenCharacter(character.id)}
                  title={`Trò chuyện với ${character.name}`}
                  className="group flex min-w-0 items-center gap-2 rounded-sm border border-[var(--border-strong)] p-1.5 text-left transition-colors hover:border-[var(--text-primary)]"
                >
                  <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] font-display text-sm font-bold text-[var(--gold-on-light)]">
                    {character.avatarUrl ? <Image src={character.avatarUrl} alt="" fill sizes="36px" className="object-cover" /> : character.name.charAt(0)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold leading-tight text-[var(--text-primary)]">{character.name}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[var(--gold-on-light)]">
                      Trò chuyện <ArrowUpRight size={11} />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
          {charactersLoading && <p className="text-sm text-[var(--text-tertiary)]">Đang tải nhân vật…</p>}
          {!charactersLoading && characters.length === 0 && (
            isAdmin && event ? (
              <div className="rounded-sm border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
                <p className="text-sm text-[var(--text-tertiary)]">Bối cảnh này chưa liên kết nhân vật nào.</p>
                <Link
                  href={linkHref}
                  className="btn-ink mt-2 h-9 min-h-0 px-3 text-xs"
                >
                  <Link2 size={15} /> Liên kết nhân vật
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Chưa có nhân vật liên kết.</p>
            )
          )}
        </section>

        {notesSlot}

        {phases.length > 0 ? (
          <section>
            <p className={PANEL_LABEL}>Diễn biến</p>
            <ol className="space-y-1">
              {phases.map((phase, i) => (
                <li key={phase.id} className="flex gap-2 text-[13px] leading-5 text-[var(--text-secondary)]">
                  <span className="w-4 shrink-0 text-right font-bold tabular-nums text-[var(--text-tertiary)]">{i + 1}</span>
                  <span className="min-w-0 truncate">{phase.title || "Chưa đặt tên"}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : pin?.description?.trim() && (
          <section>
            <p className={PANEL_LABEL}>Thuyết minh diễn biến</p>
            <p className="line-clamp-2 whitespace-pre-wrap text-[13px] leading-6 text-[var(--text-secondary)]" title={pin.description}>
              {pin.description}
            </p>
          </section>
        )}
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-[var(--text-primary)] px-4 py-3">
        {isAdmin ? (
          // Nut chinh la buoc tiep theo: chua ghim thi ghim truoc, da ghim thi soan luoc do.
          <>
            {pin ? (
              <button
                type="button"
                onClick={onOpenEditor}
                disabled={!event}
                className="btn-crimson h-11 min-h-0 w-full px-3 text-xs disabled:opacity-45"
              >
                <SquarePen size={17} /> Soạn lược đồ diễn biến
              </button>
            ) : (
              <button type="button" onClick={onStartAdding} disabled={!event} className="btn-crimson h-11 min-h-0 w-full px-3 text-xs disabled:opacity-45">
                <LocateFixed size={17} /> Ghim vị trí lên bản đồ
              </button>
            )}
            <div className={cn("grid gap-2", pin ? "grid-cols-3" : "grid-cols-2")}>
              <button type="button" onClick={onOpenDetail} disabled={!event} title="Xem như người học" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-[var(--text-primary)] text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] disabled:opacity-45">
                <Eye size={15} /> Xem trước
              </button>
              {pin ? (
                <>
                  <button type="button" onClick={onStartAdding} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-[var(--text-primary)] text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]">
                    <LocateFixed size={15} /> Đổi ghim
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete()}
                    disabled={!canDelete || isDeleting}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-[var(--accent-danger)] text-xs font-bold text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)] disabled:opacity-45"
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} Xóa ghim
                  </button>
                </>
              ) : (
                <button type="button" onClick={onOpenEditor} disabled={!event} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-sm border border-[var(--text-primary)] text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] disabled:opacity-45">
                  <SquarePen size={15} /> Soạn lược đồ
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onOpenDetail}
            disabled={!event}
            className="btn-crimson h-11 min-h-0 w-full px-3 text-xs disabled:opacity-45"
          >
            <BookOpen size={17} /> Khám phá trận đánh <ArrowUpRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}


interface CreatePinPanelProps {
  battleTitle: string;
  initialPin: BattlePin | null;
  coordinates: Coordinates | null;
  year: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMapPinRequest) => Promise<void>;
}

function CreatePinPanel({ battleTitle, initialPin, coordinates, year, isSubmitting, onCancel, onSubmit }: CreatePinPanelProps) {
  const [label, setLabel] = useState(initialPin?.label ?? battleTitle);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinates || !label.trim()) return;
    await onSubmit({
      label: label.trim(),
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      pinYear: year,
    });
  };

  return (
    // A floating card over the map: one line of guidance, the label, and Save — the map stays the workspace.
    <form
      onSubmit={submit}
      className="rounded-md border border-border-card bg-[var(--bg-surface)] shadow-[var(--shadow-strong)]"
    >
      <div className="flex items-start justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <h2 className="truncate text-[15px] font-semibold">
            {initialPin ? "Đổi vị trí" : "Ghim vị trí"}: {battleTitle}
          </h2>
          <p className={cn("mt-0.5 flex items-center gap-1.5 text-xs", coordinates ? "text-[var(--text-tertiary)]" : "font-semibold text-[var(--accent-gold)]")}>
            <LocateFixed size={13} className="shrink-0" aria-hidden="true" />
            {coordinates
              ? `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)} · ${formatYear(year)} — bấm chỗ khác để đổi`
              : "Bấm lên bản đồ tại nơi diễn ra sự kiện"}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="grid h-7 w-7 shrink-0 place-items-center rounded-sm hover:bg-[var(--sidebar-hover-bg)]" aria-label="Hủy">
          <X size={16} />
        </button>
      </div>

      <label className="block px-4 pt-3">
        <span className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Tên hiển thị</span>
        <input
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          maxLength={200}
          required
          placeholder="Ví dụ: Trung tâm trận Bạch Đằng"
          className="h-10 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-sm outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)]"
        />
      </label>

      <div className="flex justify-end gap-2 px-4 pb-3 pt-3">
        <button type="button" onClick={onCancel} className="btn-line h-9 min-h-0 px-3 text-xs">
          Hủy
        </button>
        <button type="submit" disabled={!coordinates || !label.trim() || isSubmitting} className="btn-crimson h-9 min-h-0 px-4 text-xs disabled:opacity-45">
          {isSubmitting ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />} Lưu vị trí
        </button>
      </div>
    </form>
  );
}
