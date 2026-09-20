"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Info, List,
  Loader2, LocateFixed, LogIn, Map, MapPin as MapPinIcon, Pause, Play, Plus,
  RefreshCw, Shield, Swords, Trash2, UserRound, Users, X,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useEvents } from "@/features/events/hooks";
import { useCreateMapPin, useDeleteMapPin, useMapPins } from "@/features/map-pins/hooks";
import { useAuthStore } from "@/store/auth.store";
import type { CreateMapPinRequest, MapPin, MapPinType } from "@/services/map-pin.service";
import type { HistoricalEvent } from "@/services/event.service";
import type { Character } from "@/services/character.service";
import type { QuizSet } from "@/services/quiz.service";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { useEventCharacters } from "@/features/landmark/hooks";
import { useQuizSets } from "@/features/quiz/hooks";

type PinFilter = "ALL" | "ALLIED_FORCE" | "ENEMY_FORCE" | "USER";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((module) => module.LeafletMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-[#efe1bd]">
        <Loader2 className="animate-spin text-[#7a3d25]" size={30} />
      </div>
    ),
  },
);

interface HistoricalMapModalProps { isOpen: boolean; onClose: () => void }
type Coordinates = { latitude: number; longitude: number };
const DEFAULT_YEAR = new Date().getFullYear();

function eventYear(event?: { year?: number; startYear?: number }) {
  return event?.year ?? event?.startYear ?? DEFAULT_YEAR;
}

function formatYear(year: number) {
  return year < 0 ? `${Math.abs(year)} TCN` : `${year}`;
}

function pinLabel(pin: MapPin) {
  if (pin.pinOwnerType === "USER") return "Ghi chú của tôi";
  return pin.pinType === "ENEMY_FORCE" ? "Quân đối phương" : "Quân ta / đồng minh";
}

export function HistoricalMapModal({ isOpen, onClose }: HistoricalMapModalProps) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
  const { authRequiredDialog, isAuthenticated, runWithAuth } = useAuthRequiredNavigation({
    title: "Đăng nhập để tạo ghi chú bản đồ",
    description: "Các điểm lịch sử của quản trị viên luôn công khai. Khi đăng nhập, bạn có thể thêm và quản lý ghi chú riêng tại từng bối cảnh, từng mốc năm.",
  });
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useEvents({ page: 1, limit: 200 });
  const events = useMemo(
    () => (eventsData?.content ?? []).filter((event) => Boolean(event.id)),
    [eventsData?.content],
  );

  const [contextId, setContextId] = useState<string | null>(null);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [selectedPin, setSelectedPin] = useState<MapPin | null>(null);
  const [draftCoordinates, setDraftCoordinates] = useState<Coordinates | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showPinList, setShowPinList] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [pinFilter, setPinFilter] = useState<PinFilter>("ALL");
  const [isPlaying, setIsPlaying] = useState(false);

  const activeContextId = contextId ?? events[0]?.id ?? null;
  const activeYear = contextId ? year : eventYear(events[0]);
  const activeEvent = events.find((event) => event.id === activeContextId);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selectedPin || isAdding || showPinList || showOverview) {
        setSelectedPin(null);
        setDraftCoordinates(null);
        setIsAdding(false);
        setShowPinList(false);
        setShowOverview(false);
      } else onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isAdding, isOpen, onClose, selectedPin, showOverview, showPinList]);

  const {
    data: pins = [], isLoading: pinsLoading, isFetching: pinsFetching,
    isError: pinsError, refetch: refetchPins,
  } = useMapPins(activeContextId, activeYear);
  const createPin = useCreateMapPin(activeContextId, activeYear);
  const deletePin = useDeleteMapPin(activeContextId, activeYear);
  const { data: characters = [] } = useEventCharacters(activeContextId);
  const { data: quizData } = useQuizSets(activeContextId ? { contextId: activeContextId } : undefined);
  const quizzes = quizData?.content ?? [];
  const filteredPins = pins.filter((pin) => {
    if (pinFilter === "ALL") return true;
    if (pinFilter === "USER") return pin.pinOwnerType === "USER";
    return pin.pinOwnerType === "ADMIN" && pin.pinType === pinFilter;
  });

  const canDeleteSelected = Boolean(
    selectedPin && ((isAdmin && selectedPin.pinOwnerType === "ADMIN") ||
      (!isAdmin && selectedPin.pinOwnerType === "USER" && selectedPin.createdBy === user?.uid)),
  );

  const chooseContext = (nextContextId: string) => {
    const nextEvent = events.find((event) => event.id === nextContextId);
    setContextId(nextContextId);
    setYear(eventYear(nextEvent));
    setSelectedPin(null);
    setDraftCoordinates(null);
    setIsAdding(false);
    setShowPinList(false);
    setShowOverview(false);
    setPinFilter("ALL");
    setIsPlaying(false);
  };

  const chooseYear = (nextYear: number) => {
    if (!Number.isFinite(nextYear)) return;
    setIsPlaying(false);
    setContextId(activeContextId);
    setYear(Math.trunc(nextYear));
    setSelectedPin(null);
    setDraftCoordinates(null);
  };

  const handleCreate = async (payload: CreateMapPinRequest) => {
    try {
      await createPin.mutateAsync(payload);
      setDraftCoordinates(null);
      setIsAdding(false);
    } catch {
      // The mutation displays the API message and keeps the draft intact.
    }
  };

  const handleDelete = async () => {
    if (!selectedPin) return;
    try {
      await deletePin.mutateAsync(selectedPin.pinId);
      setSelectedPin(null);
    } catch {
      // Keep the detail panel open so the user can retry.
    }
  };

  const timelineStart = activeEvent?.startYear ?? activeEvent?.year ?? activeYear;
  const timelineEnd = activeEvent?.endYear ?? activeEvent?.year ?? activeYear;
  const hasTimeline = timelineEnd > timelineStart;

  useEffect(() => {
    if (!isPlaying || !hasTimeline) return;
    const timer = window.setInterval(() => {
      setContextId(activeContextId);
      setYear((current) => current >= timelineEnd ? timelineStart : current + 1);
      setSelectedPin(null);
    }, 1600);
    return () => window.clearInterval(timer);
  }, [activeContextId, hasTimeline, isPlaying, timelineEnd, timelineStart]);

  const panelOpen = Boolean(selectedPin || showPinList || showOverview || (isAdding && draftCoordinates));

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8f3e7] text-[#2c2118]">
      {authRequiredDialog}
      <header className="z-10 shrink-0 border-b border-[#decbaa] bg-[#fff8e8] px-3 py-3 shadow-[0_8px_24px_rgba(71,49,25,0.10)] md:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#7a3d25] text-[#ffe9ba] shadow-[0_8px_18px_rgba(96,55,25,0.20)]">
            <Map size={20} />
          </div>
          <div className="mr-auto min-w-[180px]">
            <h1 className="text-base font-black leading-tight md:text-lg">Bản đồ lịch sử Việt Nam</h1>
            <p className="mt-0.5 text-xs text-[#6d5a45]">
              {pinsLoading ? "Đang tải dữ liệu..." : `${pins.length} điểm tại mốc ${formatYear(activeYear)}`}
            </p>
          </div>

          <label className="relative min-w-0 flex-1 md:max-w-[360px]">
            <span className="sr-only">Chọn bối cảnh lịch sử</span>
            <select
              value={activeContextId ?? ""}
              onChange={(event) => chooseContext(event.target.value)}
              disabled={eventsLoading || events.length === 0}
              className="h-10 w-full appearance-none rounded-md border border-[#d7bd8b] bg-white py-0 pl-3 pr-9 text-sm font-semibold text-[#3c2d20] outline-none transition focus:border-[#8a4b2b] focus:ring-2 focus:ring-[#8a4b2b]/20 disabled:opacity-60"
            >
              {events.length === 0 ? <option value="">Không có bối cảnh khả dụng</option> :
                events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7a6045]" size={16} />
          </label>

          <div className="flex h-10 items-center rounded-md border border-[#d7bd8b] bg-white">
            <button type="button" onClick={() => chooseYear(activeYear - 1)} className="grid h-full w-9 place-items-center text-[#745b3e] hover:bg-[#f4e3c1]" aria-label="Năm trước">
              <ChevronLeft size={15} />
            </button>
            <label className="flex h-full items-center gap-2 border-x border-[#e2cfab] px-2">
              <span className="text-xs font-bold text-[#745b3e]">Năm</span>
            <input
              type="number" value={activeYear} onChange={(event) => chooseYear(Number(event.target.value))}
              className="w-20 bg-transparent text-sm font-black tabular-nums text-[#7a3d25] outline-none"
              aria-label="Năm hiển thị trên bản đồ"
            />
            </label>
            <button type="button" onClick={() => chooseYear(activeYear + 1)} className="grid h-full w-9 place-items-center text-[#745b3e] hover:bg-[#f4e3c1]" aria-label="Năm sau">
              <ChevronRight size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => { setShowOverview(true); setShowPinList(false); setSelectedPin(null); setIsAdding(false); setDraftCoordinates(null); }}
            disabled={!activeEvent}
            className="grid h-10 w-10 place-items-center rounded-md border border-[#d7bd8b] bg-white text-[#5d4a35] transition hover:bg-[#f4e3c1] disabled:opacity-45"
            aria-label="Xem thông tin bối cảnh"
          >
            <Info size={18} />
          </button>

          <button
            type="button"
            onClick={() => { setShowPinList(true); setShowOverview(false); setSelectedPin(null); setIsAdding(false); setDraftCoordinates(null); }}
            disabled={!activeContextId}
            className="relative grid h-10 w-10 place-items-center rounded-md border border-[#d7bd8b] bg-white text-[#5d4a35] transition hover:bg-[#f4e3c1] disabled:opacity-45"
            aria-label={`Mở danh sách ${pins.length} điểm`}
          >
            <List size={18} />
            {pins.length > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#7a3d25] px-1 text-center text-[10px] font-bold leading-5 text-white">{pins.length}</span>}
          </button>

          <button
            type="button"
            onClick={() => runWithAuth(() => { setSelectedPin(null); setShowPinList(false); setShowOverview(false); setDraftCoordinates(null); setIsAdding(true); })}
            disabled={!activeContextId || isAdding}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#7a3d25] px-3 text-sm font-bold text-white transition hover:bg-[#66311e] disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a3d25]"
          >
            {isAuthenticated ? <Plus size={17} /> : <LogIn size={17} />}
            <span className="hidden sm:inline">{isAuthenticated ? "Thêm điểm" : "Đăng nhập để ghi chú"}</span>
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <main className={cn("relative min-w-0 flex-1", panelOpen && "hidden md:block")}>
          <LeafletMap
            pins={filteredPins}
            selectedPinId={selectedPin?.pinId ?? null}
            onSelectPin={(pin) => { setSelectedPin(pin); setShowPinList(false); setShowOverview(false); setIsAdding(false); setDraftCoordinates(null); }}
            onMapClick={isAdding ? setDraftCoordinates : undefined}
          />
          {!isAdding && (
            <div className="absolute left-4 top-4 z-[500] flex max-w-[calc(100%-32px)] gap-1 overflow-x-auto rounded-md bg-[#fff8e8]/95 p-1 shadow-[0_8px_20px_rgba(70,44,18,0.18)]" aria-label="Lọc điểm bản đồ">
              {([
                ["ALL", "Tất cả"],
                ["ALLIED_FORCE", "Quân ta"],
                ["ENEMY_FORCE", "Đối phương"],
                ["USER", "Ghi chú"],
              ] as const).filter(([value]) => value !== "USER" || !isAdmin).map(([value, label]) => (
                <button key={value} type="button" onClick={() => { setPinFilter(value); setSelectedPin(null); }} className={cn(
                  "h-8 shrink-0 rounded px-2.5 text-xs font-bold transition",
                  pinFilter === value ? "bg-[#7a3d25] text-white" : "text-[#5d4a35] hover:bg-[#ecd9b6]",
                )}>{label}</button>
              ))}
            </div>
          )}
          {eventsError && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(380px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#fff8e8] p-5 text-center shadow-[0_18px_40px_rgba(70,44,18,0.22)]">
              <AlertCircle className="mx-auto text-[#9f2f2f]" size={28} />
              <p className="mt-2 text-sm font-bold">Không tải được bối cảnh lịch sử</p>
              <p className="mt-1 text-xs text-[#6d5a45]">Cần tải bối cảnh trước khi truy vấn các điểm bản đồ.</p>
              <button type="button" onClick={() => void refetchEvents()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#7a3d25] px-3 py-2 text-xs font-bold text-white">
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}
          {pinsFetching && !pinsLoading && (
            <div className="absolute right-4 top-4 z-[500] flex items-center gap-2 rounded-md bg-[#fff8e8] px-3 py-2 text-xs font-semibold text-[#6d5a45] shadow-[0_8px_20px_rgba(70,44,18,0.18)]">
              <Loader2 className="animate-spin" size={14} /> Đang cập nhật
            </div>
          )}
          {isAdding && !draftCoordinates && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-md bg-[#2c2118] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(44,33,24,0.28)]">
              <LocateFixed size={16} /> Chọn một vị trí trên bản đồ
            </div>
          )}
          {pinsError && (
            <div className="absolute left-1/2 top-1/2 z-[500] w-[min(360px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#fff8e8] p-5 text-center shadow-[0_18px_40px_rgba(70,44,18,0.22)]">
              <AlertCircle className="mx-auto text-[#9f2f2f]" size={28} />
              <p className="mt-2 text-sm font-bold">Không tải được các điểm bản đồ</p>
              <button type="button" onClick={() => void refetchPins()} className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#7a3d25] px-3 py-2 text-xs font-bold text-white">
                <RefreshCw size={14} /> Thử lại
              </button>
            </div>
          )}
          {!pinsLoading && !pinsError && pins.length === 0 && !isAdding && activeContextId && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-[500] w-[min(380px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-[#fff8e8]/95 p-5 text-center shadow-[0_18px_40px_rgba(70,44,18,0.20)]">
              <MapPinIcon className="mx-auto text-[#8a4b2b]" size={30} />
              <p className="mt-2 text-sm font-bold">Chưa có điểm tại mốc {formatYear(activeYear)}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#6d5a45]">Đổi năm hoặc thêm điểm đầu tiên cho bối cảnh này.</p>
            </div>
          )}
          <div className="absolute bottom-4 left-4 z-[500] flex flex-wrap gap-2" aria-label="Chú giải bản đồ">
            <Legend variant="allied" label="Quân ta / đồng minh" />
            <Legend variant="enemy" label="Quân đối phương" />
            {!isAdmin && <Legend variant="personal" label="Ghi chú của tôi" />}
          </div>
          {hasTimeline && !isAdding && (
            <div className="absolute bottom-16 left-1/2 z-[500] flex w-[min(520px,calc(100%-32px))] -translate-x-1/2 items-center gap-3 rounded-md bg-[#fff8e8]/95 px-3 py-2 shadow-[0_10px_28px_rgba(70,44,18,0.20)]">
              <button type="button" onClick={() => setIsPlaying((value) => !value)} className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#7a3d25] text-white" aria-label={isPlaying ? "Tạm dừng diễn biến" : "Phát diễn biến"}>
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <input type="range" min={timelineStart} max={timelineEnd} value={Math.min(Math.max(activeYear, timelineStart), timelineEnd)} onChange={(event) => chooseYear(Number(event.target.value))} className="min-w-0 flex-1 accent-[#7a3d25]" aria-label="Dòng thời gian bối cảnh" />
              <span className="min-w-14 text-right text-sm font-black tabular-nums text-[#7a3d25]">{formatYear(activeYear)}</span>
            </div>
          )}
        </main>

        <aside className={cn(
          "shrink-0 overflow-hidden border-[#decbaa] bg-[#fffaf0] transition-[width] duration-300",
          panelOpen ? "w-full border-l md:w-[390px]" : "w-0 border-l-0",
        )}>
          <div className="h-full w-full overflow-y-auto md:w-[390px]">
            {isAdding ? (
              <CreatePinPanel coordinates={draftCoordinates} year={activeYear} isAdmin={isAdmin}
                isSubmitting={createPin.isPending}
                onCancel={() => { setIsAdding(false); setDraftCoordinates(null); }}
                onSubmit={handleCreate} />
            ) : selectedPin ? (
              <PinDetailPanel pin={selectedPin} canDelete={canDeleteSelected}
                isDeleting={deletePin.isPending} onClose={() => setSelectedPin(null)} onDelete={handleDelete} />
            ) : showPinList ? (
              <PinListPanel
                pins={pins}
                year={activeYear}
                isAuthenticated={isAuthenticated}
                onClose={() => setShowPinList(false)}
                onSelect={(pin) => { setSelectedPin(pin); setShowPinList(false); }}
                onAdd={() => runWithAuth(() => { setShowPinList(false); setIsAdding(true); })}
              />
            ) : showOverview && activeEvent ? (
              <ContextOverviewPanel
                event={activeEvent}
                characters={characters}
                quizzes={quizzes}
                isAdmin={isAdmin}
                onClose={() => setShowOverview(false)}
                onOpenEvent={() => router.push(`/events?event=${activeEvent.id}`)}
                onOpenCharacter={(characterId) => runWithAuth(() => router.push(`/chat/${characterId}`))}
                onOpenQuiz={(quizId) => router.push(`/quiz/${quizId}`)}
              />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function ContextOverviewPanel({ event, characters, quizzes, isAdmin, onClose, onOpenEvent, onOpenCharacter, onOpenQuiz }: {
  event: HistoricalEvent;
  characters: Character[];
  quizzes: QuizSet[];
  isAdmin: boolean;
  onClose: () => void;
  onOpenEvent: () => void;
  onOpenCharacter: (characterId: string) => void;
  onOpenQuiz: (quizId: string) => void;
}) {
  return (
    <div className="flex min-h-full flex-col">
      {event.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden">
          <Image src={event.imageUrl} alt="" fill sizes="390px" className="object-cover" />
        </div>
      )}
      <div className="border-b border-[#decbaa] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#8a6a3e]">{event.yearLabel ?? formatYear(event.year)}</p>
            <h2 className="mt-1 break-words text-xl font-black leading-snug">{event.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-md hover:bg-[#f1e2c5]" aria-label="Đóng thông tin bối cảnh"><X size={17} /></button>
        </div>
        {event.location && <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-[#6d5a45]"><MapPinIcon size={13} />{event.location}</p>}
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#4f3b29]">{event.summary || "Bối cảnh này chưa có phần giới thiệu."}</p>
      </div>

      {!isAdmin && (
        <div className="flex-1 space-y-5 p-4">
          <button type="button" onClick={onOpenEvent} className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#7a3d25] text-sm font-bold text-white">
            <BookOpen size={16} /> Xem đầy đủ bối cảnh
          </button>

          <LearningGroup icon={<Users size={15} />} title="Nhân vật liên quan" empty="Chưa có nhân vật được liên kết.">
            {characters.slice(0, 4).map((character) => (
              <button key={character.id} type="button" onClick={() => onOpenCharacter(character.id)} className="flex w-full items-center gap-3 rounded-md border border-[#ddc9a5] bg-white p-2.5 text-left hover:bg-[#fff8e8]">
                <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#ead8b9] text-sm font-black text-[#7a3d25]">
                  {character.avatarUrl ? <Image src={character.avatarUrl} alt="" fill sizes="36px" className="object-cover" /> : character.name.charAt(0)}
                </span>
                <span className="min-w-0"><span className="block truncate text-sm font-bold">{character.name}</span><span className="block truncate text-xs text-[#75634f]">{character.title}</span></span>
              </button>
            ))}
          </LearningGroup>

          <LearningGroup icon={<Swords size={15} />} title="Quiz của bối cảnh" empty="Chưa có quiz cho bối cảnh này.">
            {quizzes.slice(0, 3).map((quiz) => (
              <button key={quiz.quizId} type="button" onClick={() => onOpenQuiz(quiz.quizId)} className="flex w-full items-center justify-between gap-3 rounded-md border border-[#ddc9a5] bg-white p-3 text-left hover:bg-[#fff8e8]">
                <span className="min-w-0 truncate text-sm font-bold">{quiz.title}</span><ChevronRight className="shrink-0 text-[#9a8064]" size={15} />
              </button>
            ))}
          </LearningGroup>
        </div>
      )}
    </div>
  );
}

function LearningGroup({ icon, title, empty, children }: { icon: ReactNode; title: string; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-xs font-black text-[#5d4a35]">{icon}{title}</h3>
      {hasChildren ? <div className="space-y-2">{children}</div> : <p className="rounded-md bg-[#f1e7d4] px-3 py-4 text-center text-xs text-[#75634f]">{empty}</p>}
    </section>
  );
}

function Legend({ variant, label }: { variant: "allied" | "enemy" | "personal"; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-[#fff8e8]/95 px-2.5 py-1.5 text-[11px] font-bold text-[#4f3b29] shadow-[0_6px_16px_rgba(70,44,18,0.16)]">
      <span className={cn("h-2.5 w-2.5 rounded-full", {
        "bg-[#316a48]": variant === "allied",
        "bg-[#9f2f2f]": variant === "enemy",
        "bg-[#2563a6]": variant === "personal",
      })} />{label}
    </span>
  );
}

function PinListPanel({ pins, year, isAuthenticated, onClose, onSelect, onAdd }: {
  pins: MapPin[];
  year: number;
  isAuthenticated: boolean;
  onClose: () => void;
  onSelect: (pin: MapPin) => void;
  onAdd: () => void;
}) {
  const adminPins = pins.filter((pin) => pin.pinOwnerType === "ADMIN");
  const personalPins = pins.filter((pin) => pin.pinOwnerType === "USER");

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex items-start justify-between border-b border-[#decbaa] p-5">
        <div>
          <h2 className="text-lg font-black">Các điểm trên bản đồ</h2>
          <p className="mt-1 text-xs text-[#6d5a45]">Mốc {formatYear(year)} · {pins.length} điểm đang hiển thị</p>
        </div>
        <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#f1e2c5]" aria-label="Đóng danh sách điểm"><X size={17} /></button>
      </div>

      <div className="flex-1 space-y-5 p-4">
        <PinGroup title="Điểm lịch sử công khai" pins={adminPins} onSelect={onSelect} />
        {isAuthenticated && <PinGroup title="Ghi chú riêng của tôi" pins={personalPins} onSelect={onSelect} />}

        {!isAuthenticated && (
          <div className="rounded-lg bg-[#e7eef4] p-4 text-sm text-[#294c67]">
            <div className="flex items-center gap-2 font-bold"><UserRound size={16} /> Ghi chú cá nhân được bảo mật</div>
            <p className="mt-1.5 text-xs leading-relaxed">Đăng nhập để xem, tạo và xóa các ghi chú bản đồ chỉ thuộc tài khoản của bạn.</p>
          </div>
        )}
      </div>

      <div className="border-t border-[#decbaa] p-4">
        <button type="button" onClick={onAdd} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#7a3d25] text-sm font-bold text-white">
          {isAuthenticated ? <Plus size={16} /> : <LogIn size={16} />}
          {isAuthenticated ? "Thêm điểm mới" : "Đăng nhập để tạo ghi chú"}
        </button>
      </div>
    </div>
  );
}

function PinGroup({ title, pins, onSelect }: { title: string; pins: MapPin[]; onSelect: (pin: MapPin) => void }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-black text-[#5d4a35]">{title}</h3>
        <span className="text-xs font-bold tabular-nums text-[#8a6a3e]">{pins.length}</span>
      </div>
      {pins.length === 0 ? (
        <p className="rounded-md bg-[#f1e7d4] px-3 py-4 text-center text-xs text-[#75634f]">Chưa có điểm nào trong nhóm này.</p>
      ) : (
        <div className="space-y-2">
          {pins.map((pin) => (
            <button key={pin.pinId} type="button" onClick={() => onSelect(pin)} className="flex w-full items-start gap-3 rounded-md border border-[#ddc9a5] bg-white p-3 text-left transition hover:border-[#aa8058] hover:bg-[#fff8e8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a3d25]">
              <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", pin.pinOwnerType === "USER" ? "bg-[#2563a6]" : pin.pinType === "ENEMY_FORCE" ? "bg-[#9f2f2f]" : "bg-[#316a48]")} />
              <span className="min-w-0 flex-1">
                <span className="block break-words text-sm font-bold text-[#33251a]">{pin.label}</span>
                <span className="mt-1 block text-xs text-[#75634f]">{pinLabel(pin)}</span>
              </span>
              <ChevronRight className="mt-1 shrink-0 text-[#9a8064]" size={15} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

interface CreatePinPanelProps {
  coordinates: Coordinates | null; year: number; isAdmin: boolean; isSubmitting: boolean;
  onCancel: () => void; onSubmit: (payload: CreateMapPinRequest) => Promise<void>;
}

function CreatePinPanel({ coordinates, year, isAdmin, isSubmitting, onCancel, onSubmit }: CreatePinPanelProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [pinType, setPinType] = useState<MapPinType>("ALLIED_FORCE");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!coordinates || !label.trim()) return;
    await onSubmit({
      label: label.trim(), description: description.trim() || undefined,
      pinType: isAdmin ? pinType : undefined,
      latitude: coordinates.latitude, longitude: coordinates.longitude, pinYear: year,
    });
  };

  return (
    <form onSubmit={submit} className="flex min-h-full flex-col">
      <div className="flex items-start justify-between border-b border-[#decbaa] p-5">
        <div className="min-w-0">
          <h2 className="text-lg font-black">Thêm điểm bản đồ</h2>
          <p className="mt-1 text-xs leading-relaxed text-[#6d5a45]">
            {coordinates ? `${coordinates.latitude.toFixed(5)}, ${coordinates.longitude.toFixed(5)} · ${formatYear(year)}` : "Bấm lên bản đồ để chọn tọa độ."}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#f1e2c5]" aria-label="Hủy thêm điểm"><X size={17} /></button>
      </div>
      <div className="flex-1 space-y-5 p-5">
        {!coordinates && (
          <div className="flex items-start gap-3 rounded-lg bg-[#f1e2c5] p-4 text-sm text-[#5b432c]">
            <LocateFixed className="mt-0.5 shrink-0" size={18} /><span>Chọn vị trí trên bản đồ trước khi nhập thông tin.</span>
          </div>
        )}
        {isAdmin && (
          <fieldset>
            <legend className="mb-2 text-xs font-bold text-[#6d5a45]">Lực lượng</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["ALLIED_FORCE", "ENEMY_FORCE"] as const).map((type) => (
                <button key={type} type="button" onClick={() => setPinType(type)} className={cn(
                  "flex min-h-10 items-center justify-center gap-2 rounded-md border px-2 text-xs font-bold transition",
                  pinType === type ? (type === "ALLIED_FORCE" ? "border-[#316a48] bg-[#e4f0e8] text-[#28583c]" : "border-[#9f2f2f] bg-[#f6e5e1] text-[#832626]") : "border-[#ddc9a5] bg-white text-[#6d5a45]",
                )}>
                  <Shield size={15} />{type === "ALLIED_FORCE" ? "Quân ta" : "Đối phương"}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[#6d5a45]">Tiêu đề *</span>
          <input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={200} required disabled={!coordinates}
            placeholder={isAdmin ? "Ví dụ: Cánh quân phía Đông" : "Ví dụ: Vị trí cần ghi nhớ"}
            className="h-11 w-full rounded-md border border-[#d7bd8b] bg-white px-3 text-base outline-none focus:border-[#8a4b2b] focus:ring-2 focus:ring-[#8a4b2b]/20 disabled:bg-[#eee5d5]" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-bold text-[#6d5a45]">Mô tả</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} disabled={!coordinates} rows={5}
            placeholder={isAdmin ? "Diễn biến hoặc vai trò của vị trí này" : "Ghi chú học tập của riêng bạn"}
            className="w-full resize-none rounded-md border border-[#d7bd8b] bg-white p-3 text-base leading-relaxed outline-none focus:border-[#8a4b2b] focus:ring-2 focus:ring-[#8a4b2b]/20 disabled:bg-[#eee5d5]" />
        </label>
      </div>
      <div className="flex gap-2 border-t border-[#decbaa] p-4">
        <button type="button" onClick={onCancel} className="h-10 flex-1 rounded-md border border-[#d7bd8b] bg-white text-sm font-bold text-[#5d4a35]">Hủy</button>
        <button type="submit" disabled={!coordinates || !label.trim() || isSubmitting} className="inline-flex h-10 flex-[1.4] items-center justify-center gap-2 rounded-md bg-[#7a3d25] text-sm font-bold text-white disabled:opacity-45">
          {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}Lưu điểm
        </button>
      </div>
    </form>
  );
}

function PinDetailPanel({ pin, canDelete, isDeleting, onClose, onDelete }: {
  pin: MapPin; canDelete: boolean; isDeleting: boolean; onClose: () => void; onDelete: () => Promise<void>;
}) {
  const personal = pin.pinOwnerType === "USER";
  return (
    <div className="flex min-h-full flex-col">
      <div className="border-b border-[#decbaa] p-5">
        <div className="flex items-start justify-between gap-4">
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold",
            personal ? "bg-[#e2edf7] text-[#235b8d]" : pin.pinType === "ENEMY_FORCE" ? "bg-[#f6e5e1] text-[#832626]" : "bg-[#e4f0e8] text-[#28583c]",
          )}>
            {personal ? <UserRound size={14} /> : <Shield size={14} />}{pinLabel(pin)}
          </span>
          <button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-[#f1e2c5]" aria-label="Đóng chi tiết điểm"><X size={17} /></button>
        </div>
        <h2 className="mt-4 break-words text-xl font-black leading-snug">{pin.label}</h2>
        <p className="mt-2 text-xs font-semibold text-[#7a6045]">Năm {formatYear(pin.pinYear)} · {pin.latitude.toFixed(5)}, {pin.longitude.toFixed(5)}</p>
      </div>
      <div className="flex-1 p-5">
        {pin.description ? <p className="whitespace-pre-wrap break-words text-sm leading-7 text-[#4f3b29]">{pin.description}</p> : <p className="text-sm italic text-[#7a6a58]">Điểm này chưa có mô tả.</p>}
      </div>
      {canDelete && (
        <div className="border-t border-[#decbaa] p-4">
          <button type="button" onClick={() => void onDelete()} disabled={isDeleting} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#c7766d] bg-white text-sm font-bold text-[#8d2e28] transition hover:bg-[#f8e7e3] disabled:opacity-50">
            {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}Xóa điểm
          </button>
        </div>
      )}
    </div>
  );
}
