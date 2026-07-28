"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Play, SkipForward, Timer, MapPin, FileText, ChevronDown, ChevronUp, Trophy, ChevronRight } from "lucide-react";
import type { HistoricalEvent } from "@/services/event.service";
import {
  CharacterCarouselCard,
  CharacterCompactCard,
} from "@/components/commons/character-card";
import { characterService, type Character } from "@/services/character.service";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { usePublicContextDocuments } from "@/features/documents/hooks";

// ── Mock ──────────────────────────────────────────────────
// TODO: fetch từ API /events/:id/characters

// ── Fake Video Player ─────────────────────────────────────
function FakeVideoPlayer({
  event,
  onFinish,
}: {
  event: HistoricalEvent;
  onFinish: () => void;
}) {
  const hasVideo = !!event.videoUrl;
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = () => {
    if (!hasVideo) {
      onFinish();
      return;
    }
    setPlaying(true);
    videoRef.current?.play();
  };

  const skip = () => {
    onFinish();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {hasVideo && (
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            src={event.videoUrl ?? undefined}
            controls={playing}
            onEnded={onFinish}
          />
        )}

        {/* Overlay gradient — chỉ hiện khi chưa play để không chặn controls video */}
        {!playing && (
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(0,0,0,0.35)_0%,transparent_25%,transparent_55%,rgba(0,0,0,0.75)_100%)]" />
        )}

        {/* Letterbox */}
        {!playing && (
          <>
            <div className="absolute top-0 left-0 right-0 h-8 bg-black pointer-events-none" />
            <div className="absolute bottom-12 left-0 right-0 h-8 bg-black pointer-events-none" />
          </>
        )}

        {/* Play button — chỉ hiện khi chưa play */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <button
              onClick={start}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer bg-white/[0.12] backdrop-blur-[12px] border-2 border-white/25"
            >
              <Play className="w-8 h-8 text-white ml-1.5 fill-white" />
            </button>
            <p className="text-white/70 text-sm font-medium tracking-wide">
              {hasVideo ? "Xem video giới thiệu" : "Chưa có video giới thiệu"}
            </p>
          </div>
        )}

        {/* Skip button */}
        {playing && (
          <button
            onClick={skip}
            className="absolute top-10 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-white/20 transition-all bg-black/50 backdrop-blur-[8px] text-white/85 border border-white/15"
          >
            <SkipForward className="w-3.5 h-3.5" /> Bỏ qua
          </button>
        )}

        {!playing && (
          <div className="absolute bottom-8 left-0 right-0 px-6 pointer-events-none">
            <p className="text-white/50 text-micro font-bold uppercase tracking-[0.2em] mb-1">
              Video giới thiệu
            </p>
            <p className="text-white text-xl font-bold leading-snug drop-shadow-lg">
              {event.title}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar bỏ đi vì dùng video player thật */}
    </div>
  );
}

// ── Characters Reveal — card dọc giống carousel ───────────

function CharactersReveal({
  event,
  characters,
  onSelect,
}: {
  event: HistoricalEvent;
  characters: Character[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[var(--abyssal-blue)]">
      {/* Background mờ */}
      <div className="absolute inset-0">
        <Image
          src="/war.jpg"
          alt=""
          fill
          className="object-cover opacity-10"
          sizes="60vw"
        />
        <div
          className="absolute inset-0 bg-[var(--abyssal-blue)]"
        />
      </div>

      {/* Letterbox */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black z-10" />

      <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-10 gap-5">
        {/* Header */}
        <div className="shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5 text-accent-gold-soft">
            Nhân vật trong sự kiện
          </p>
          <h3 className="text-lg font-bold leading-snug text-[var(--text-on-dark)]">
            {event.title}
          </h3>
        </div>

        {/* Cards dọc — dùng CharacterCarouselCard thu nhỏ */}
        <div className="flex-1 flex flex-row gap-5 items-center justify-center min-h-0">
          {characters.map((char, i) => (
            <div
              key={char.id}
              className="h-full max-h-[408px] flex-1 max-w-[288px]"
              style={{
                animation: `fadeSlideUp 0.4s ease ${i * 100}ms both`,
              }}
            >
              <CharacterCarouselCard
                character={char}
                priority={i === 0}
                onClick={onSelect}
              />
            </div>
          ))}
        </div>

        <p className="shrink-0 text-center text-[11px] font-medium text-[var(--text-on-dark)]">
          Chọn nhân vật để bắt đầu trò chuyện
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── Document Row — click để mở rộng xem nội dung ──────────

function DocumentRow({ title, content }: { title: string; content: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border overflow-hidden bg-card-light-bg border-card-light-border">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
      >
        <FileText className="w-4 h-4 shrink-0 text-content-subtle" />
        <span className="flex-1 text-sm font-medium truncate text-content-text">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0 text-content-subtle" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 shrink-0 text-content-subtle" />
        )}
      </button>
      {isOpen && (
        <p className="px-3 pb-3 text-xs leading-relaxed whitespace-pre-wrap text-content-subtle">
          {content}
        </p>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────

interface EventDetailModalProps {
  event?: HistoricalEvent | null;
  onClose?: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const [finishedEventId, setFinishedEventId] = useState<string | null>(null);

  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery({
    queryKey: queryKeys.characters.byContext(event?.id ?? ""),
    queryFn: () => characterService.getByContext(event!.id),
    enabled: !!event?.id, // chỉ fetch khi có event
  });

  // Tài liệu tham khảo của bối cảnh — không phải context nào cũng có, nên chỉ hiện khi có dữ liệu
  const { data: documents = [] } = usePublicContextDocuments(event?.id);

  if (!event) return null;

  const videoFinished = finishedEventId === event.id;
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  const handleSelectChar = (charId: string) => {
    navigateWithAuth(`/chat/${charId}?contextId=${event.id}`);
  };

  return (
    <>
      {authRequiredDialog}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div className="relative flex flex-col md:flex-row w-full h-full shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:top-8 md:right-8 z-50 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:rotate-90 active:scale-95 group bg-bg-elevated border border-border-default shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
          >
            <X className="w-5 h-5 transition-colors text-content-heading" />
          </button>

          {/* ── Left 60% ── */}
          <div className="w-full md:w-[60%] shrink-0 h-[55dvh] md:h-full">
            {videoFinished ? (
              <CharactersReveal
                event={event}
                characters={characters}
                onSelect={handleSelectChar}
              />
            ) : (
              <FakeVideoPlayer
                event={event}
                onFinish={() => setFinishedEventId(event.id)}
              />
            )}
          </div>

          {/* ── Right 40% ── */}
          <div className="flex-1 flex flex-col h-[45dvh] md:h-full overflow-hidden bg-[var(--palladian)] border-l border-l-card-light-border">
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-accent-gold to-transparent" />

            <div className="px-5 md:px-8 py-4 md:py-6 border-b shrink-0 border-b-card-light-border">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-accent-gold/10 text-accent-gold">
                  {yearLabel}
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-snug text-content-heading">
                {event.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-6 space-y-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Timer className="w-4 h-4 shrink-0 text-accent-gold" />
                  <span className="text-sm text-content-text">
                    {yearLabel}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0 text-content-subtle" />
                    <span className="text-sm text-content-text">
                      {event.location}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => router.push(`/quiz?contextId=${event.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer hover:-translate-y-0.5 bg-accent-gold/10 border-accent-gold/25"
              >
                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-accent-gold/15">
                  <Trophy className="w-5 h-5 text-accent-gold" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold text-content-heading">
                    Kiểm tra kiến thức
                  </p>
                  <p className="text-xs text-content-muted">
                    Làm bộ câu hỏi liên quan đến giai đoạn này
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-accent-gold" />
              </button>
              <div className="h-px bg-card-light-border" />
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-content-subtle">
                  Bối cảnh lịch sử
                </h4>
                <p className="text-sm leading-relaxed text-content-text">
                  {event.summary}
                </p>
              </div>
              <div className="h-px bg-card-light-border" />
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-content-subtle">
                  Nhân vật liên quan
                </h4>
                <div className="space-y-2">
                  {isLoadingCharacters ? (
                    // Skeleton khi đang loading
                    <>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border animate-pulse bg-card-light-bg border-card-light-border"
                        >
                          <div className="w-8 h-8 rounded-lg shrink-0 bg-card-light-border" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-2/3 rounded bg-card-light-border" />
                            <div className="h-2.5 w-1/2 rounded bg-card-light-border" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : characters.length === 0 ? (
                    <p className="text-center text-xs py-4 text-content-subtle">
                      Chưa có nhân vật nào
                    </p>
                  ) : (
                    characters.map((char) => (
                      <CharacterCompactCard
                        key={char.id}
                        character={char}
                        onClick={handleSelectChar}
                      />
                    ))
                  )}
                </div>
              </div>

              {documents.length > 0 && (
                <>
                  <div className="h-px bg-card-light-border" />
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3 text-content-subtle">
                      Tài liệu tham khảo
                    </h4>
                    <div className="space-y-2">
                      {documents.map((doc) => (
                        <DocumentRow key={doc.id} title={doc.title} content={doc.content} />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
