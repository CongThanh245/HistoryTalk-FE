"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Play, SkipForward, MapPin, FileText, ChevronDown, ChevronUp, Trophy, ChevronRight } from "lucide-react";
import type { HistoricalEvent } from "@/services/event.service";
import {
  CharacterCarouselCard,
  CharacterCompactCard,
} from "@/components/commons/character-card";
import { characterService, type Character } from "@/services/character.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { recordStudyActivity } from "@/features/gamification/study-check-in";
import { queryKeys } from "@/shared/query-key";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { usePublicContextDocuments } from "@/features/documents/hooks";
import { getYouTubeEmbedUrl } from "@/lib/utils/video-url";
import { ERA_CONFIG, getEraFromYear, mapEraLabel } from "@/constants/eras";

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
  const youtubeEmbedUrl = getYouTubeEmbedUrl(event.videoUrl, { autoplay: playing });
  const isYouTubeVideo = !!youtubeEmbedUrl;

  const start = () => {
    if (!hasVideo) {
      onFinish();
      return;
    }
    setPlaying(true);
    if (!isYouTubeVideo) {
      videoRef.current?.play();
    }
  };

  const skip = () => {
    onFinish();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {hasVideo && isYouTubeVideo && playing && (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={youtubeEmbedUrl}
            title={`${event.title} video`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        )}

        {hasVideo && !isYouTubeVideo && (
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
              className="w-[72px] h-[72px] rounded-[2px] flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer bg-[var(--accent-gold)] hover:bg-[var(--accent-bronze)]"
            >
              <Play className="w-8 h-8 text-white ml-1.5 fill-white" />
            </button>
            <p className="text-white/75 text-[11px] font-bold uppercase tracking-[0.16em]">
              {hasVideo ? "Xem video giới thiệu" : "Chưa có video giới thiệu"}
            </p>
          </div>
        )}

        {/* Skip button */}
        {playing && (
          <button
            onClick={skip}
            className="absolute top-10 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] text-[11px] font-bold uppercase tracking-[0.1em] cursor-pointer hover:bg-white hover:text-black transition-colors bg-black/60 text-white/90 border border-white/40"
          >
            <SkipForward className="w-3.5 h-3.5" /> Bỏ qua
          </button>
        )}

        {!playing && (
          <div className="absolute bottom-8 left-0 right-0 px-6 pointer-events-none">
            <p className="text-white/50 text-micro font-bold uppercase tracking-[0.2em] mb-1">
              Video giới thiệu
            </p>
            <p className="font-display text-white text-[28px] font-bold leading-[1.1] drop-shadow-lg">
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
          <h3 className="font-display text-[26px] font-bold leading-[1.1] text-[var(--text-on-dark)]">
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
    <div className="border-b border-[var(--border-default)]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="group w-full flex items-center gap-2.5 py-3 text-left cursor-pointer"
      >
        <FileText className="w-4 h-4 shrink-0 text-accent-gold" />
        <span className="flex-1 text-sm font-semibold truncate text-content-heading group-hover:underline underline-offset-4">
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-content-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-content-muted" />
        )}
      </button>
      {isOpen && (
        <div className="mb-4 max-h-[320px] overflow-y-auto border-[var(--accent-gold)] bg-[var(--bg-elevated)] px-4 py-3">
          <p className="text-[13.5px] leading-7 whitespace-pre-wrap text-content-text">
            {content}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────

const SECTION_HEADING =
  "mb-3 pb-2 border-b border-[var(--text-primary)] text-[11px] font-bold uppercase tracking-[0.14em] text-content-heading";

interface EventDetailModalProps {
  event?: HistoricalEvent | null;
  onClose?: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const { authRequiredDialog, navigateWithAuth } = useAuthRequiredNavigation();
  const [finishedEventId, setFinishedEventId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (event?.id) recordStudyActivity(queryClient);
  }, [event?.id, queryClient]);

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
  const yearSuffix = event.year < 0 ? "TCN" : "SCN";
  const yearNumber = event.yearLabel
    ? event.yearLabel.replace(/\s*(SCN|TCN)$/i, "")
    : String(Math.abs(event.year));
  const eraLabel = mapEraLabel(event.era) || ERA_CONFIG[getEraFromYear(event.year)].label;

  const handleSelectChar = (charId: string) => {
    navigateWithAuth(`/chat/${charId}?contextId=${event.id}`);
  };

  return (
    <>
      {authRequiredDialog}
      <div
        className="fixed inset-0 z-40 bg-black/70"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div className="relative flex flex-col md:flex-row w-full h-full">
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="absolute top-4 right-4 md:top-7 md:right-7 z-50 w-10 h-10 flex items-center justify-center rounded-[2px] transition-colors duration-200 cursor-pointer active:scale-95 group bg-[var(--bg-surface)] border border-[var(--text-primary)] hover:bg-[var(--text-primary)]"
          >
            <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90 text-content-heading group-hover:text-[var(--text-inverse)]" />
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
          <div className="flex-1 flex flex-col h-[45dvh] md:h-full overflow-hidden bg-[var(--bg-surface)] border-t md:border-t-0 md:border-l border-[var(--text-primary)]">
            <div className="h-[3px] w-full shrink-0 bg-accent-gold" />

            <div className="px-5 md:px-8 pt-4 md:pt-6 pb-4 border-b shrink-0 border-[var(--text-primary)]">
              <div className="mt-2 flex items-end gap-4 pr-12">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[44px] md:text-[52px] font-extrabold leading-[0.9] text-accent-gold">
                    {yearNumber}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-content-muted">
                    {yearSuffix}
                  </span>
                </div>
                {/* 史 — "sử", history */}
                <span className="archive-seal live-stamp hidden sm:inline-grid ml-auto w-[44px] h-[44px] text-[19px] mb-1" aria-hidden="true">史</span>
              </div>
              <h2 className="archive-title is-plain live-ink mt-2 text-[26px] md:text-[30px]">
                {event.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-8 py-5 md:py-6 space-y-7">
              <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.08em]">
                <dt className="font-semibold text-accent-brass">Thời kỳ</dt>
                <dd className="font-bold text-content-text">{eraLabel}</dd>
                <dt className="font-semibold text-accent-brass">Năm</dt>
                <dd className="font-bold text-content-text">{yearLabel}</dd>
                {event.location && (
                  <>
                    <dt className="font-semibold text-accent-brass">Địa điểm</dt>
                    <dd className="flex items-center gap-1.5 min-w-0 font-bold text-content-text">
                      <MapPin className="w-3 h-3 shrink-0 text-accent-gold" />
                      <span>{event.location}</span>
                    </dd>
                  </>
                )}
              </dl>

              <button
                type="button"
                onClick={() => router.push(`/quiz?contextId=${event.id}`)}
                className="group w-full flex items-center gap-3 px-4 py-3 rounded-[2px] border border-[var(--text-primary)] transition-colors duration-200 cursor-pointer hover:bg-[var(--bg-elevated)]"
              >
                <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-[2px] bg-accent-gold">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-display text-[19px] font-bold leading-tight text-content-heading">
                    Kiểm tra kiến thức
                  </p>
                  <p className="text-xs text-content-muted">
                    Làm bộ câu hỏi liên quan đến giai đoạn này
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 shrink-0 text-accent-gold transition-transform group-hover:translate-x-0.5" />
              </button>

              <section>
                <h4 className={SECTION_HEADING}>Bối cảnh lịch sử</h4>
                <p className="text-[15px] leading-7 text-content-text">
                  {event.summary}
                </p>
              </section>

              <section>
                <h4 className={SECTION_HEADING}>Nhân vật liên quan</h4>
                <div className="space-y-2">
                  {isLoadingCharacters ? (
                    // Skeleton khi đang loading
                    <>
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[2px] border animate-pulse bg-[var(--bg-surface)] border-[var(--border-strong)]"
                        >
                          <div className="w-8 h-8 rounded-[2px] shrink-0 bg-card-light-border" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-2/3 rounded bg-card-light-border" />
                            <div className="h-2.5 w-1/2 rounded bg-card-light-border" />
                          </div>
                        </div>
                      ))}
                    </>
                  ) : characters.length === 0 ? (
                    <p className="py-3 text-xs text-content-muted">
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
              </section>

              {documents.length > 0 && (
                <section>
                  <h4 className={SECTION_HEADING}>Tài liệu tham khảo</h4>
                  <div>
                    {documents.map((doc) => (
                      <DocumentRow key={doc.id} title={doc.title} content={doc.content} />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
