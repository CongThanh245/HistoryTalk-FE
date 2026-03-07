"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Play, SkipForward, Clock, MapPin } from "lucide-react";
import type {
  HistoricalEvent,
  EventCategoryLower,
} from "@/services/event.service";
import {
  CharacterCarouselCard,
  CharacterCompactCard,
} from "@/components/commons/character-card";
import { characterService, type Character } from "@/services/character.service";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";

// ── Mock ──────────────────────────────────────────────────
// TODO: fetch từ API /events/:id/characters

const CATEGORY_COLOR: Record<EventCategoryLower, string> = {
  war: "var(--accent-danger)",
  politics: "var(--accent-gold)",
  culture: "var(--accent-blue)",
  science: "var(--accent-teal)",
  religion: "var(--accent-bronze)",
  other: "var(--content-muted)",
};

// ── Fake Video Player ─────────────────────────────────────
// Thay thế toàn bộ FakeVideoPlayer component
function extractYoutubeId(url?: string): string {
  if (!url) return "RS9qAwnDa2k"; // fallback
  const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/);
  return match?.[1] ?? "RS9qAwnDa2k";
}

function FakeVideoPlayer({
  event,
  onFinish,
}: {
  event: HistoricalEvent;
  onFinish: () => void;
}) {
  const youtubeId = extractYoutubeId(event.videoUrl);
  const [playing, setPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const start = () => {
    setPlaying(true);
    // Gửi lệnh play tới YouTube iframe
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "playVideo" }),
      "*",
    );
  };

  const skip = () => {
    onFinish();
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        {/* YouTube iframe thay thế Image */}
        <iframe
          ref={iframeRef}
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1&autoplay=0&controls=0&modestbranding=1&rel=0`}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />

        {/* Overlay giữ nguyên */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.75) 100%)",
          }}
        />

        {/* Letterbox */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-black" />
        <div className="absolute bottom-12 left-0 right-0 h-8 bg-black" />

        {/* Play button — chỉ hiện khi chưa play */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <button
              onClick={start}
              className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.12)",
                backdropFilter: "blur(12px)",
                border: "2px solid rgba(255,255,255,0.25)",
              }}
            >
              <Play className="w-8 h-8 text-white ml-1.5" fill="white" />
            </button>
            <p className="text-white/70 text-sm font-medium tracking-wide">
              Xem video giới thiệu
            </p>
          </div>
        )}

        {/* Skip button */}
        {playing && (
          <button
            onClick={skip}
            className="absolute top-10 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-white/20 transition-all"
            style={{
              background: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <SkipForward className="w-3.5 h-3.5" /> Bỏ qua
          </button>
        )}

        <div className="absolute bottom-8 left-0 right-0 px-6 pointer-events-none">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">
            Video giới thiệu
          </p>
          <p className="text-white text-xl font-bold leading-snug drop-shadow-lg">
            {event.title}
          </p>
        </div>
      </div>

      {/* Progress bar bỏ đi vì dùng YouTube player thật */}
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
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
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
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(7,13,24,0.97) 0%, rgba(27,38,50,0.95) 100%)",
          }}
        />
      </div>

      {/* Letterbox */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black z-10" />

      <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-10 gap-4">
        {/* Header */}
        <div className="shrink-0">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
            style={{ color: "var(--accent-gold)", opacity: 0.7 }}
          >
            Nhân vật trong sự kiện
          </p>
          <h3
            className="text-lg font-bold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            {event.title}
          </h3>
        </div>

        {/* Cards dọc — dùng CharacterCarouselCard thu nhỏ */}
        <div className="flex-1 flex flex-row gap-4 items-center justify-center min-h-0">
          {characters.map((char, i) => (
            <div
              key={char.id}
              className="h-full max-h-[340px] flex-1"
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

        <p
          className="shrink-0 text-center text-[11px]"
          style={{ color: "var(--text-on-dark-muted)" }}
        >
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

// ── Main Modal ────────────────────────────────────────────

interface EventDetailModalProps {
  event?: HistoricalEvent | null;
  onClose?: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const [videoFinished, setVideoFinished] = useState(false);

  const { data: characters = [] } = useQuery({
    queryKey: queryKeys.characters.byContext(event?.id ?? ""),
    queryFn: () => characterService.getByContext(event!.id),
    enabled: !!event?.id, // chỉ fetch khi có event
  });

  useEffect(() => {
    setVideoFinished(false);
  }, [event?.id]);

  if (!event) return null;

  const color = CATEGORY_COLOR[event.category];
  const yearLabel =
    event.yearLabel ??
    `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  const handleSelectChar = (charId: string) => {
    router.push(`/chat/${charId}`);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div
          className="relative flex w-full h-full"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-50 w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer hover:rotate-90 active:scale-95 group"
            style={{
              background: "var(--bg-elevated)", // Sử dụng màu nền nổi hơn
              border: "1px solid var(--border-default)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <X
              className="w-5 h-5 transition-colors"
              style={{ color: "var(--text-primary)" }}
            />
          </button>

          {/* ── Left 60% ── */}
          <div className="w-[60%] shrink-0 h-full">
            {videoFinished ? (
              <CharactersReveal
                event={event}
                characters={characters}
                onSelect={handleSelectChar}
              />
            ) : (
              <FakeVideoPlayer
                event={event}
                onFinish={() => setVideoFinished(true)}
              />
            )}
          </div>

          {/* ── Right 40% ── */}
          <div
            className="flex-1 flex flex-col h-full overflow-hidden"
            style={{
              background: "var(--palladian)",
              borderLeft: "1px solid var(--card-light-border)",
            }}
          >
            <div
              className="h-1 w-full shrink-0"
              style={{
                background: `linear-gradient(90deg, ${color}, transparent)`,
              }}
            />

            <div
              className="px-8 py-6 border-b shrink-0"
              style={{ borderColor: "var(--card-light-border)" }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${color}18`, color }}
                >
                  {yearLabel}
                </span>
              </div>
              <h2
                className="text-2xl font-bold leading-snug"
                style={{ color: "var(--content-heading)" }}
              >
                {event.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0" style={{ color }} />
                  <span
                    className="text-sm"
                    style={{ color: "var(--content-text)" }}
                  >
                    {yearLabel}
                  </span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin
                      className="w-4 h-4 shrink-0"
                      style={{ color: "var(--content-subtle)" }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: "var(--content-text)" }}
                    >
                      {event.location}
                    </span>
                  </div>
                )}
              </div>

              <div
                style={{ height: 1, background: "var(--card-light-border)" }}
              />

              <div>
                <h4
                  className="text-[11px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--content-subtle)" }}
                >
                  Bối cảnh lịch sử
                </h4>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--content-text)" }}
                >
                  {event.summary}
                </p>
              </div>

              <div
                style={{ height: 1, background: "var(--card-light-border)" }}
              />

              <div>
                <h4
                  className="text-[11px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: "var(--content-subtle)" }}
                >
                  Nhân vật liên quan
                </h4>
                <div className="space-y-2">
                  {characters.map((char) => (
                    <CharacterCompactCard
                      key={char.id}
                      character={char}
                      onClick={handleSelectChar}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
