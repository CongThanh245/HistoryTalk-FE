"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Link2,
  Eye,
  Loader2,
  LocateFixed,
  Map,
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
import { useCreateMapPin, useDeleteMapPin, useMapPins, useOverviewMapPins, useUpdateMapPin } from "@/features/map-pins/hooks";
import { useEventCharacters } from "@/features/landmark/hooks";
import { useAuthStore } from "@/store/auth.store";
import type { CreateMapPinRequest, MapPin as BattlePin } from "@/services/map-pin.service";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { BattleDetailView } from "./BattleDetailView";
import type { MapOverlay } from "./map-overlay.types";
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
  const isAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
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

  // Keep the side panel in step with the selected battle, including browser Back/Forward.
  useEffect(() => {
    setPanelDismissed(!contextId);
    setSelectedPin((pin) => (pin && pin.contextId === contextId ? pin : null));
  }, [contextId]);

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } =
    useEvents({ page: 1, limit: 200 });

  const events = useMemo(
    () => (eventsData?.content ?? []).filter((event) => Boolean(event.id)),
    [eventsData?.content],
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

  const mainPin = useMemo(
    () => pins.find((pin) => pin.pinOwnerType === "ADMIN") ?? pins[0] ?? null,
    [pins],
  );
  const liveSelectedPin = selectedPin && pins.some((pin) => pin.pinId === selectedPin.pinId) ? selectedPin : null;
  const focusedPin = panelDismissed ? null : liveSelectedPin ?? mainPin;

  // Build the visible pin list for the map overview.
  // When admin is actively placing a new pin, exclude the current context's pin
  // so that clicking on the map doesn't accidentally hit the existing marker
  // instead of setting draftCoordinates.
  const visiblePins = overviewQueries.flatMap((query, index) => {
    const eventId = events[index]?.id;
    if (isAdding && eventId === activeContextId) return [];
    const pin = query.data?.find((item) => item.pinOwnerType === "ADMIN") ?? query.data?.[0];
    return pin ? [pin] : [];
  });

  // For regular users, only show events that have an admin-pinned location.
  // Admins always see all events so they can manage pins.
  const pinnedEventIds = useMemo(() => {
    const ids = new Set<string>();
    overviewQueries.forEach((query, index) => {
      const hasPin = query.data && query.data.length > 0;
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
  const canDeleteSelected = Boolean(focusedPin && isAdmin && focusedPin.pinOwnerType === "ADMIN");
  const overlayPlacing = Boolean(overlay?.placing) && !isAdding;
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
  }, [isAdding, isOpen, onClose, selectedPin, route.view, focusedPin, panelDismissed]);

  const chooseContext = (nextContextId: string) => {
    navigate({ battle: nextContextId || null, view: "map" }, "replace");
    setPanelDismissed(!nextContextId);
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(false);
    setDetailCharacterId(undefined);
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
  };

  const handleCreate = async (payload: CreateMapPinRequest) => {
    try {
      // Moving an existing pin edits it in place (PUT keeps its pinId; falls back to create-then-delete on 405).
      if (mainPin) {
        await updatePin.mutateAsync({ pin: mainPin, changes: { ...payload, description: payload.description ?? "" } });
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
        onPreview={() => navigate({ battle: activeEvent.id, view: "detail" }, "replace")}
        onBack={() => navigate({ battle: activeEvent.id, view: "map" }, "back")}
        onClose={() => { navigate({ battle: activeEvent.id, view: "map" }, "back"); setSelectedPin(null); }}
      />
    );
  }

  return (
    <div className={cn(styles.mapPage, "flex h-full min-h-0 flex-col bg-[var(--bg-main)] text-[var(--text-primary)]")}>
      <header className="shrink-0 border-b border-[var(--text-primary)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-white">
            <Map size={20} />
          </div>
          <div className="mr-auto min-w-0 flex-1 sm:flex-none">
            <h1 className="archive-title text-[22px] md:text-[26px]">Bản đồ trận đánh</h1>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              Những trận đánh làm nên lịch sử.
            </p>
          </div>

          {overlay?.headerSlot}

          <label className="relative order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 md:max-w-[420px]">
            <span className="sr-only">Chọn bối cảnh lịch sử</span>
            <select
              value={activeContextId ?? ""}
              onChange={(event) => chooseContext(event.target.value)}
              disabled={eventsLoading || overviewQueriesLoading || selectableEvents.length === 0}
              className="h-10 w-full appearance-none rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] py-0 pl-3 pr-9 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:opacity-60"
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

          {isAdmin && (
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

          {/* Nút X chỉ hiện khi đang có pin được chọn/hiển thị */}
          {!panelDismissed && activeContextId && (
            <button
              type="button"
              onClick={() => chooseContext("")}
              title="Bỏ chọn trận đánh"
              className="grid h-10 w-10 place-items-center rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] text-[var(--text-primary)] transition hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
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
        panelDismissed
          ? "grid-rows-1 lg:grid-cols-1 lg:grid-rows-1 lg:overflow-hidden"
          : "grid-rows-[minmax(200px,35%)_1fr] lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1 lg:overflow-hidden",
      )}>
        <main className="relative min-h-0 min-w-0 overflow-hidden border-r border-[var(--text-primary)]">
          <LeafletMap
            battle={activeEvent}
            battles={events}
            pins={overlay?.hideBattlePins ? [] : visiblePins}
            draftCoordinates={draftCoordinates ?? (isAdding ? null : overlay?.draft ?? null)}
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
                : overlayPlacing
                  ? overlay?.onMapClick
                  : (coordinates) => {
                      overlay?.onMapClick?.(coordinates);
                      chooseContext("");
                    }
            }
            overlayPins={overlay?.pins}
            selectedOverlayId={overlay?.selectedId ?? null}
            onSelectOverlayPin={overlay?.onSelectPin}
            overlayFocus={overlay?.focus ?? null}
            placing={overlayPlacing}
          />

          {overlay?.renderControls?.({ battleCount: overlay.hideBattlePins ? 0 : visiblePins.length })}


          {pinsFetching && !pinsLoading && (
            <StatusPill className="right-4 top-4">
              <Loader2 className="animate-spin" size={14} /> Đang cập nhật
            </StatusPill>
          )}

          {isAdding && !draftCoordinates && (
            <StatusPill className="left-1/2 top-4 -translate-x-1/2 bg-text-primary text-text-inverse">
              <LocateFixed size={16} /> Chọn một vị trí trên bản đồ
            </StatusPill>
          )}

          {(eventsError || pinsError) && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(390px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-5 text-center shadow-[var(--shadow-soft)]">
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
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(390px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-[2px] border border-[var(--text-primary)] bg-bg-surface p-5 text-center shadow-[var(--shadow-soft)] backdrop-blur">
              <MapPin className="mx-auto text-[var(--accent-gold)]" size={30} />
              <p className="mt-2 text-sm font-bold">Trận đánh này chưa có vị trí trên bản đồ</p>
              {isAdmin && (
                <button
                  type="button"
                  onClick={startAdding}
                  className="btn-ink mt-3 min-h-0 px-3 py-2 text-xs"
                >
                  <LocateFixed size={14} /> Ghim vị trí
                </button>
              )}
            </div>
          )}
        </main>

        {!panelDismissed && (
          <aside className="min-h-0 overflow-y-auto bg-[var(--bg-surface)]">
            {isAdding ? (
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
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

function StatusPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("absolute z-[500] flex items-center gap-2 rounded-[2px] border border-[var(--text-primary)] bg-bg-surface px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-primary)] shadow-[var(--shadow-soft)] backdrop-blur", className)}>
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
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  return (
    <div className={cn("flex min-h-full flex-col lg:h-full", styles.contextPanel)}>
      {/* Compact header: thumbnail beside the facts, so the content below needs little scrolling. */}
      <div className="flex shrink-0 gap-3 border-b border-[var(--text-primary)] px-4 py-3">
        <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-deep)]">
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
                {pin?.description?.trim() ? (
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
                href={`/staff/contexts/${event.id}?tab=characters`}
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
                  className="group flex min-w-0 items-center gap-2 rounded-[2px] border border-[var(--border-strong)] p-1.5 text-left transition-colors hover:border-[var(--text-primary)]"
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
              <div className="rounded-[2px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-3">
                <p className="text-sm text-[var(--text-tertiary)]">Bối cảnh này chưa liên kết nhân vật nào.</p>
                <Link
                  href={`/staff/contexts/${event.id}?tab=characters`}
                  className="btn-ink mt-2 h-9 min-h-0 px-3 text-xs"
                >
                  <Link2 size={15} /> Liên kết nhân vật
                </Link>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-tertiary)]">Chưa có nhân vật cho trận đánh này.</p>
            )
          )}
        </section>

        {pin?.description?.trim() && (
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
          <>
            <button
              type="button"
              onClick={onOpenEditor}
              disabled={!event}
              className="btn-crimson h-11 min-h-0 w-full px-3 text-xs disabled:opacity-45"
            >
              <SquarePen size={17} /> Chỉnh sửa lược đồ trận đánh
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={onOpenDetail} disabled={!event} title="Xem trang trận đánh như người học" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] disabled:opacity-45">
                <Eye size={15} /> Xem trước
              </button>
              <button type="button" onClick={onStartAdding} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--text-primary)] text-xs font-bold transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]">
                <LocateFixed size={15} /> {pin ? "Đổi ghim" : "Ghim vị trí"}
              </button>
              <button
                type="button"
                onClick={() => void onDelete()}
                disabled={!canDelete || isDeleting}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[2px] border border-[var(--accent-danger)] text-xs font-bold text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)] disabled:opacity-45"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} Xóa ghim
              </button>
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
  const [description, setDescription] = useState(initialPin?.description ?? "");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinates || !label.trim()) return;
    await onSubmit({
      label: label.trim(),
      description: description.trim() || undefined,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      pinYear: year,
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col">
      <div className="border-b border-[var(--text-primary)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="archive-title text-[22px]">Ghim vị trí trận đánh</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
              {coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)} · ${formatYear(year)}` : "Chưa chọn vị trí"}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="grid h-8 w-8 shrink-0 place-items-center rounded-[2px] hover:bg-[var(--sidebar-hover-bg)]" aria-label="Hủy">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 p-5">
        {!coordinates && (
          <div className="flex items-start gap-3 rounded-[2px] border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] p-4 text-sm text-[var(--gold-on-light)]">
            <LocateFixed className="mt-0.5 shrink-0" size={18} />
            <span>Bấm lên bản đồ để chọn nơi diễn ra trận đánh.</span>
          </div>
        )}

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Tên hiển thị *</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={200}
            required
            disabled={!coordinates}
            placeholder="Ví dụ: Trung tâm trận Bạch Đằng"
            className="h-11 w-full rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-base outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:bg-[var(--bg-deep)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">Thuyết minh diễn biến</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!coordinates}
            rows={6}
            placeholder="Nhập diễn biến trận đánh theo trình tự…"
            className="w-full resize-none rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 text-base leading-relaxed outline-none focus:border-[var(--accent-gold)] focus:ring-1 focus:ring-[var(--accent-gold)] disabled:bg-[var(--bg-deep)]"
          />
          <span className="mt-2 block text-xs leading-relaxed text-[var(--text-secondary)]">Nội dung này được đọc thành audio ở trang trận đánh. Có thể để trống.</span>
        </label>
      </div>

      <div className="flex gap-2 border-t border-[var(--text-primary)] p-4">
        <button type="button" onClick={onCancel} className="btn-line h-10 min-h-0 flex-1 px-3 text-xs">
          Hủy
        </button>
        <button type="submit" disabled={!coordinates || !label.trim() || isSubmitting} className="btn-crimson h-10 min-h-0 flex-[1.4] px-3 text-xs disabled:opacity-45">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Lưu vị trí
        </button>
      </div>
    </form>
  );
}
