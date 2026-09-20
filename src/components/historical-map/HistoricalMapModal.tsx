"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  Loader2,
  LocateFixed,
  Map,
  MapPin,
  MessageCircle,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEvents } from "@/features/events/hooks";
import { useCreateMapPin, useDeleteMapPin, useMapPins } from "@/features/map-pins/hooks";
import { useEventCharacters } from "@/features/landmark/hooks";
import { useAuthStore } from "@/store/auth.store";
import type { CreateMapPinRequest, MapPin as BattlePin, MapPinType } from "@/services/map-pin.service";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import { BattleDetailView } from "./BattleDetailView";
import styles from "./battle-experience.module.css";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#fff7e6]">
        <Loader2 className="animate-spin text-[var(--accent-gold)]" size={30} />
      </div>
    ),
  },
);

interface HistoricalMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Coordinates = { latitude: number; longitude: number };
type ViewMode = "map" | "detail";
const DEFAULT_YEAR = new Date().getFullYear();
const HISTORICAL_MAP_IMAGE = "/war.jpg";

function eventYear(event?: { year?: number; startYear?: number }) {
  return event?.year ?? event?.startYear ?? DEFAULT_YEAR;
}

function formatYear(year: number) {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

export function HistoricalMapModal({ isOpen, onClose }: HistoricalMapModalProps) {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
  const [contextId, setContextId] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<BattlePin | null>(null);
  const [panelDismissed, setPanelDismissed] = useState(false);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("map");
  const [detailCharacterId, setDetailCharacterId] = useState<string | undefined>();

  const { data: eventsData, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } =
    useEvents({ page: 1, limit: 200 });

  const events = useMemo(
    () => (eventsData?.content ?? []).filter((event) => Boolean(event.id)),
    [eventsData?.content],
  );

  const activeContextId = contextId ?? events[0]?.id ?? null;
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
  const { data: characters = [] } = useEventCharacters(activeContextId);

  const mainPin = useMemo(
    () => pins.find((pin) => pin.pinOwnerType === "ADMIN") ?? pins[0] ?? null,
    [pins],
  );
  const focusedPin = selectedPin ?? mainPin;
  const visiblePins = useMemo(() => mainPin ? [mainPin] : [], [mainPin]);
  const canDeleteSelected = Boolean(focusedPin && isAdmin && focusedPin.pinOwnerType === "ADMIN");

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (viewMode === "detail") {
        setViewMode("map");
      } else if (isAdding || selectedPin) {
        setIsAdding(false);
        setDraftCoordinates(null);
        setSelectedPin(null);
      } else if (focusedPin && !panelDismissed) {
        setPanelDismissed(true);
      } else {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAdding, isOpen, onClose, selectedPin, viewMode, focusedPin, panelDismissed]);

  const chooseContext = (nextContextId: string) => {
    setContextId(nextContextId);
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(false);
    setViewMode("map");
    setDetailCharacterId(undefined);
  };

  const startAdding = () => {
    if (!isAdmin || !activeContextId) return;
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(true);
    setViewMode("map");
  };

  const handleCreate = async (payload: CreateMapPinRequest) => {
    try {
      if (mainPin) await deletePin.mutateAsync(mainPin.pinId);
      await createPin.mutateAsync(payload);
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

  if (viewMode === "detail" && activeEvent) {
    return (
      <BattleDetailView
        key={activeEvent.id}
        event={activeEvent}
        pin={focusedPin}
        characters={characters}
        initialCharacterId={detailCharacterId}
        onBack={() => setViewMode("map")}
        onClose={() => { setViewMode("map"); setSelectedPin(null); }}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-main)] text-[var(--text-primary)]">
      <header className="shrink-0 border-b border-[var(--border-default)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#09090B] text-[var(--accent-gold)] shadow-[0_10px_30px_rgba(9,9,11,0.18)]">
            <Map size={20} />
          </div>
          <div className="mr-auto min-w-0 flex-1 sm:flex-none">
            <h1 className="text-base font-black leading-tight md:text-lg">Bản đồ trận đánh</h1>
            <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">
              Những trận đánh làm nên lịch sử.
            </p>
          </div>

          <label className="relative order-last w-full min-w-0 sm:order-none sm:w-auto sm:flex-1 md:max-w-[420px]">
            <span className="sr-only">Chọn bối cảnh lịch sử</span>
            <select
              value={activeContextId ?? ""}
              onChange={(event) => chooseContext(event.target.value)}
              disabled={eventsLoading || events.length === 0}
              className="h-10 w-full appearance-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] py-0 pl-3 pr-9 text-sm font-semibold text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold-glow)] disabled:opacity-60"
            >
              {events.length === 0 ? (
                <option value="">Không có bối cảnh khả dụng</option>
              ) : (
                events.map((event) => (
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
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#09090B] px-3 text-sm font-bold text-white transition hover:bg-[#27272A] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]"
            >
              <Plus size={17} />
              <span className="hidden sm:inline">{mainPin ? "Đổi vị trí ghim" : "Ghim vị trí"}</span>
            </button>
          )}

          {/* Nút X chỉ hiện khi đang có pin được chọn/hiển thị */}
          {!panelDismissed && focusedPin && (
            <button
              type="button"
              onClick={() => {
                setPanelDismissed(true);
                setSelectedPin(null);
              }}
              className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--sidebar-hover-bg)]"
              aria-label="Bỏ chọn trận đánh"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <div className={cn(
        "grid min-h-0 flex-1 gap-0 overflow-y-auto bg-[var(--bg-content-decorated)]",
        panelDismissed
          ? "grid-rows-1 lg:grid-cols-1 lg:grid-rows-1 lg:overflow-hidden"
          : "grid-rows-[minmax(200px,35%)_1fr] lg:grid-cols-[minmax(0,1fr)_390px] lg:grid-rows-1 lg:overflow-hidden",
      )}>
        <main className="relative min-h-0 min-w-0 overflow-hidden border-r border-[var(--border-default)]">
          <LeafletMap
            battle={activeEvent}
            pins={visiblePins}
            selectedPinId={focusedPin?.pinId ?? null}
            panelDismissed={panelDismissed}
            onSelectPin={(pin) => {
              setSelectedPin(pin);
              setPanelDismissed(false);
              setIsAdding(false);
              setDraftCoordinates(null);
            }}
            onMapClick={isAdding ? setDraftCoordinates : undefined}
          />


          <div className="absolute left-14 top-4 z-[500] max-w-[calc(100%-72px)] rounded-lg border border-white/70 bg-white/90 p-3 shadow-[0_16px_42px_rgba(9,9,11,0.12)] backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-black text-[#09090B]">
              <Sparkles size={14} className="text-[var(--accent-gold)]" />
              {activeEvent ? activeEvent.title : "Bản đồ lịch sử"}
            </div>
            <p className="mt-1 text-xs font-semibold text-[var(--text-tertiary)]">
              {pinsLoading ? "Đang tải điểm ghim..." : mainPin ? `1 vị trí ghim · ${formatYear(activeYear)}` : "Chưa có vị trí ghim"}
            </p>
          </div>

          {pinsFetching && !pinsLoading && (
            <StatusPill className="right-4 top-4">
              <Loader2 className="animate-spin" size={14} /> Đang cập nhật
            </StatusPill>
          )}

          {isAdding && !draftCoordinates && (
            <StatusPill className="left-1/2 top-4 -translate-x-1/2 bg-[#09090B] text-white">
              <LocateFixed size={16} /> Chọn một vị trí trên bản đồ
            </StatusPill>
          )}

          {(eventsError || pinsError) && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(390px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 text-center shadow-[0_20px_48px_rgba(9,9,11,0.16)]">
              <AlertCircle className="mx-auto text-[var(--accent-danger)]" size={28} />
              <p className="mt-2 text-sm font-bold">Không tải được dữ liệu bản đồ</p>
              <button
                type="button"
                onClick={() => void (eventsError ? refetchEvents() : refetchPins())}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#09090B] px-3 py-2 text-xs font-bold text-white"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}

          {!pinsLoading && !pinsError && !mainPin && !isAdding && activeContextId && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(390px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-default)] bg-white/92 p-5 text-center shadow-[0_20px_48px_rgba(9,9,11,0.14)] backdrop-blur">
              <MapPin className="mx-auto text-[var(--accent-gold)]" size={30} />
              <p className="mt-2 text-sm font-bold">Trận đánh này chưa có vị trí ghim</p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
                Admin sẽ ghim đúng một điểm đại diện cho bối cảnh này.
              </p>
            </div>
          )}
        </main>

        {!panelDismissed && (
          <aside className="min-h-0 overflow-y-auto bg-[var(--bg-surface)]">
            {isAdding ? (
              <CreatePinPanel
                key={activeContextId}
                battleTitle={activeEvent?.title ?? ""}
                coordinates={draftCoordinates}
                year={activeYear}
                isSubmitting={createPin.isPending || deletePin.isPending}
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
                isAdmin={isAdmin}
                canDelete={canDeleteSelected}
                isDeleting={deletePin.isPending}
                onDelete={handleDelete}
                onStartAdding={startAdding}
                onOpenDetail={() => { setDetailCharacterId(undefined); if (activeEvent) setViewMode("detail"); }}
                onOpenCharacter={(id) => { setDetailCharacterId(id); if (activeEvent) setViewMode("detail"); }}
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
    <div className={cn("absolute z-[500] flex items-center gap-2 rounded-lg bg-white/92 px-3 py-2 text-xs font-bold text-[var(--text-secondary)] shadow-[0_12px_32px_rgba(9,9,11,0.16)] backdrop-blur", className)}>
      {children}
    </div>
  );
}

function BattleContextPanel({
  event,
  pin,
  characters,
  isAdmin,
  canDelete,
  isDeleting,
  onDelete,
  onStartAdding,
  onOpenDetail,
  onOpenCharacter,
}: {
  event?: HistoricalEvent;
  pin: BattlePin | null;
  characters: Character[];
  isAdmin: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onDelete: () => Promise<void>;
  onStartAdding: () => void;
  onOpenDetail: () => void;
  onOpenCharacter: (id: string) => void;
}) {
  return (
    <div className={cn("flex min-h-full flex-col lg:h-full", styles.contextPanel)}>
      <div className="relative h-32 shrink-0 overflow-hidden bg-[#09090B] lg:h-[clamp(80px,17vh,160px)]">
        <Image
          src={event?.imageUrl || HISTORICAL_MAP_IMAGE}
          alt=""
          fill
          sizes="430px"
          className={cn("object-cover", styles.contextImage)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090B]/86 via-[#09090B]/18 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <p className="text-xs font-bold text-[var(--accent-gold-soft)]">{event ? formatYear(event.year) : "Bản đồ lịch sử"}</p>
          <h2 className="mt-1 text-lg font-black leading-tight">{event?.title ?? "Chọn một bối cảnh"}</h2>
        </div>
      </div>

      <div className="min-h-0 space-y-3 px-4 py-3 lg:flex-1 lg:overflow-y-auto">
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <MapPin size={16} className="text-[var(--accent-gold)]" />
            Địa điểm trận đánh
          </div>
          {pin ? (
            <div className="border-b border-[var(--border-default)] pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-tertiary)]">
                    {event?.location ? `${event.location} · ` : ""}{pin.latitude.toFixed(4)}, {pin.longitude.toFixed(4)}
                  </p>
                </div>
                <span className="rounded-md bg-[var(--accent-gold-active-bg)] px-2 py-1 text-xs font-black text-[var(--gold-on-light)]">
                  {formatYear(pin.pinYear)}
                </span>
              </div>
              {pin.description && (
                <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-[var(--text-secondary)]" title={pin.description}>{pin.description}</p>
              )}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--bg-main)] p-4 text-sm leading-6 text-[var(--text-tertiary)]">
              Chưa có vị trí ghim. Admin chỉ cần ghim một điểm đại diện cho trận đánh.
            </p>
          )}
        </section>

        {event && (
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-black">
              <BookOpen size={16} className="text-[var(--accent-gold)]" />
              Bối cảnh
            </div>
            <p className="line-clamp-4 text-sm leading-5 text-[var(--text-secondary)]" title={event.summary}>
              {event.summary || "Bối cảnh này chưa có phần mô tả."}
            </p>
          </section>
        )}

        <section>
          <div className="mb-2 flex items-center gap-2 text-sm font-black">
            <MessageCircle size={16} className="text-[var(--accent-gold)]" />
            Gặp nhân vật lịch sử
          </div>
          <div className={styles.characterList}>
            {characters.slice(0, 5).map((character) => (
              <button key={character.id} type="button" onClick={() => onOpenCharacter(character.id)} title={`Trò chuyện với ${character.name}`} className={styles.characterLink}>
                <span className={styles.contextAvatar}>
                  {character.avatarUrl ? <Image src={character.avatarUrl} alt="" fill sizes="64px" className="object-cover" /> : character.name.charAt(0)}
                </span>
                <span className={styles.characterLinkText}><strong>{character.name}</strong><span>Trò chuyện <ArrowUpRight size={13} /></span></span>
              </button>
            ))}
            {characters.length === 0 && <p className="text-sm text-[var(--text-tertiary)]">Đang cập nhật nhân vật liên quan.</p>}
          </div>
        </section>
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-[var(--border-default)] px-4 py-3">
        <button
          type="button"
          onClick={onOpenDetail}
          disabled={!event}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#09090B] text-sm font-black text-white transition hover:bg-[#27272A] disabled:opacity-45"
        >
          <BookOpen size={17} /> Khám phá trận đánh <ArrowUpRight size={16} />
        </button>
        {isAdmin && (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={onStartAdding} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] text-sm font-bold hover:bg-[var(--sidebar-hover-bg)]">
              <LocateFixed size={16} /> {pin ? "Đổi ghim" : "Ghim mới"}
            </button>
            <button
              type="button"
              onClick={() => void onDelete()}
              disabled={!canDelete || isDeleting}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[var(--status-danger-border)] text-sm font-bold text-[var(--accent-danger)] hover:bg-[var(--status-danger-bg)] disabled:opacity-45"
            >
              {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Xóa ghim
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


interface CreatePinPanelProps {
  battleTitle: string;
  coordinates: Coordinates | null;
  year: number;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateMapPinRequest) => Promise<void>;
}

function CreatePinPanel({ battleTitle, coordinates, year, isSubmitting, onCancel, onSubmit }: CreatePinPanelProps) {
  const [label, setLabel] = useState(battleTitle);
  const [description, setDescription] = useState("");
  const [pinType, setPinType] = useState<MapPinType>("ALLIED_FORCE");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinates || !label.trim()) return;
    await onSubmit({
      label: label.trim(),
      description: description.trim() || undefined,
      pinType,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      pinYear: year,
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col">
      <div className="border-b border-[var(--border-default)] p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black">Ghim vị trí trận đánh</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-tertiary)]">
              {coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)} · ${formatYear(year)}` : "Bấm lên bản đồ để chọn một vị trí duy nhất."}
            </p>
          </div>
          <button type="button" onClick={onCancel} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg hover:bg-[var(--sidebar-hover-bg)]" aria-label="Hủy ghim">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-5 p-5">
        {!coordinates && (
          <div className="flex items-start gap-3 rounded-lg bg-[var(--accent-gold-active-bg)] p-4 text-sm text-[var(--gold-on-light)]">
            <LocateFixed className="mt-0.5 shrink-0" size={18} />
            <span>Chọn vị trí trung tâm của trận đánh trên bản đồ trước khi nhập thông tin.</span>
          </div>
        )}

        <fieldset>
          <legend className="mb-2 text-xs font-bold text-[var(--text-tertiary)]">Loại vị trí</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["ALLIED_FORCE", "ENEMY_FORCE"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setPinType(type)}
                className={cn(
                  "flex min-h-10 items-center justify-center gap-2 rounded-lg border px-2 text-xs font-bold transition",
                  pinType === type
                    ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]",
                )}
              >
                <Shield size={15} />{type === "ALLIED_FORCE" ? "Quân ta" : "Đối phương"}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[var(--text-tertiary)]">Tiêu đề *</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={200}
            required
            disabled={!coordinates}
            placeholder="Ví dụ: Trung tâm trận Bạch Đằng"
            className="h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 text-base outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold-glow)] disabled:bg-[var(--bg-deep)]"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[var(--text-tertiary)]">Thông tin khi bấm vào ghim</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={!coordinates}
            rows={6}
            placeholder="Tóm tắt bối cảnh, vai trò của vị trí này, hoặc lời dẫn để người học xem chi tiết."
            className="w-full resize-none rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 text-base leading-relaxed outline-none focus:border-[var(--accent-gold)] focus:ring-2 focus:ring-[var(--accent-gold-glow)] disabled:bg-[var(--bg-deep)]"
          />
        </label>
      </div>

      <div className="flex gap-2 border-t border-[var(--border-default)] p-4">
        <button type="button" onClick={onCancel} className="h-10 flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-sm font-bold text-[var(--text-secondary)]">
          Hủy
        </button>
        <button type="submit" disabled={!coordinates || !label.trim() || isSubmitting} className="inline-flex h-10 flex-[1.4] items-center justify-center gap-2 rounded-lg bg-[#09090B] text-sm font-bold text-white disabled:opacity-45">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />} Lưu vị trí
        </button>
      </div>
    </form>
  );
}
