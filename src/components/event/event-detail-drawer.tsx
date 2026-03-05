"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Play, SkipForward, MessageSquare, Clock, MapPin } from "lucide-react";
import type { HistoricalEvent, EventCategory } from "@/services/event.service";

// ── Types ─────────────────────────────────────────────────

export interface RelatedCharacter {
  id: string;
  name: string;
  role: string;       // vd: "Chỉ huy quân đội"
  avatarUrl?: string; // TODO: ảnh thật từ API
  side?: string;      // vd: "Đại Việt" | "Quân Nguyên"
}

// TODO: fetch từ API /events/:id/characters
const MOCK_CHARACTERS: Record<string, RelatedCharacter[]> = {
  default: [
    { id: "ngo-quyen",     name: "Ngô Quyền",      role: "Chỉ huy quân Đại Việt", side: "Đại Việt"   },
    { id: "liu-hongcao",   name: "Lưu Hoằng Tháo", role: "Thống soái quân Nam Hán", side: "Nam Hán"  },
    { id: "duong-dinh-nghe", name: "Dương Đình Nghệ", role: "Tiên liệt Đại Việt",  side: "Đại Việt" },
  ],
};

const CATEGORY_COLOR: Record<EventCategory, string> = {
  war:      "var(--accent-danger)",
  politics: "var(--accent-gold)",
  culture:  "var(--accent-blue)",
  science:  "var(--accent-teal)",
  religion: "var(--accent-bronze)",
  other:    "var(--content-muted)",
};

// ── Fake Video Player ─────────────────────────────────────

const FAKE_DURATION = 8; // giây — fake video

interface VideoPlayerProps {
  event: HistoricalEvent;
  onFinish: () => void;
}

function FakeVideoPlayer({ event, onFinish }: VideoPlayerProps) {
  const [playing, setPlaying]     = useState(false);
  const [progress, setProgress]   = useState(0);  // 0-100
  const [elapsed, setElapsed]     = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPlay = () => {
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 0.1;
        setProgress((next / FAKE_DURATION) * 100);
        if (next >= FAKE_DURATION) {
          clearInterval(intervalRef.current!);
          setPlaying(false);
          onFinish();
        }
        return next;
      });
    }, 100);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const formatTime = (s: number) => `${Math.floor(s)}:${String(Math.floor((s % 1) * 10)).padStart(2, "0")}`;

  return (
    <div className="relative w-full h-full flex flex-col bg-black rounded-l-2xl overflow-hidden">

      {/* "Video" frame — ảnh + overlay giả lập video */}
      <div className="relative flex-1 overflow-hidden">
        <Image
          src="/war.jpg"
          alt={event.title}
          fill
          className={`object-cover transition-all duration-700 ${playing ? "scale-105" : "scale-100"}`}
          sizes="60vw"
        />

        {/* Dark cinematic overlay */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 60%, rgba(0,0,0,0.7) 100%)" }} />

        {/* Grain texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />

        {/* Scan lines giả lập màn hình cũ */}
        {playing && (
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)" }}
          />
        )}

        {/* Play button khi chưa play */}
        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <button
              onClick={startPlay}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "2px solid rgba(255,255,255,0.3)" }}
            >
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </button>
            <p className="text-white text-sm font-medium opacity-80">Xem video giới thiệu</p>
          </div>
        )}

        {/* Skip button khi đang play */}
        {playing && (
          <button
            onClick={() => { clearInterval(intervalRef.current!); onFinish(); }}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-150 hover:bg-white/20"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <SkipForward className="w-3.5 h-3.5" />
            Bỏ qua
          </button>
        )}

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white text-xs font-semibold opacity-60 uppercase tracking-widest mb-1">Video giới thiệu</p>
          <p className="text-white text-base font-bold leading-snug drop-shadow-lg">{event.title}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#0a0a0a" }}>
        <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
          {formatTime(elapsed)}
        </span>
        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.12)" }}>
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            }}
          />
        </div>
        <span className="text-xs tabular-nums" style={{ color: "rgba(255,255,255,0.4)" }}>
          {formatTime(FAKE_DURATION)}
        </span>
      </div>
    </div>
  );
}

// ── Character Card ────────────────────────────────────────

function CharacterCard({ char, onSelect }: { char: RelatedCharacter; onSelect: (id: string) => void }) {
  return (
    <button
      onClick={() => onSelect(char.id)}
      className="group flex items-center gap-3 w-full rounded-xl p-3 border text-left transition-all duration-150 cursor-pointer hover:-translate-y-0.5"
      style={{
        background: "var(--card-light-bg)",
        borderColor: "var(--card-light-border)",
      }}
    >
      {/* Avatar */}
      <div
        className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative"
        style={{ background: "var(--card-light-border)" }}
      >
        {/* TODO: thay bằng char.avatarUrl khi có API */}
        <div
          className="w-full h-full flex items-center justify-center text-lg font-bold"
          style={{
            background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)",
            color: "var(--bg-deep)",
          }}
        >
          {char.name.charAt(0)}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--content-heading)" }}>
          {char.name}
        </p>
        <p className="text-[11px] truncate" style={{ color: "var(--content-muted)" }}>
          {char.role}
        </p>
        {char.side && (
          <span
            className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5"
            style={{ background: "rgba(201,162,77,0.10)", color: "var(--accent-gold)" }}
          >
            {char.side}
          </span>
        )}
      </div>

      {/* Chat icon */}
      <MessageSquare
        className="w-4 h-4 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--accent-gold)" }}
      />
    </button>
  );
}

// ── Characters panel (xuất hiện sau video) ────────────────

function CharactersReveal({ event, characters, onSelectChar }: {
  event: HistoricalEvent;
  characters: RelatedCharacter[];
  onSelectChar: (id: string) => void;
}) {
  return (
    <div className="relative w-full h-full flex flex-col rounded-l-2xl overflow-hidden">
      {/* Thumbnail mờ làm nền */}
      <div className="absolute inset-0">
        <Image src="/war.jpg" alt="" fill className="object-cover opacity-20" sizes="60vw" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, var(--bg-deep) 0%, var(--abyssal-blue) 100%)" }} />
      </div>

      <div className="relative z-10 flex flex-col h-full p-6 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--accent-gold-soft)", opacity: 0.7 }}>
            Nhân vật trong sự kiện
          </p>
          <h3 className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
            {event.title}
          </h3>
        </div>

        <div className="flex-1 flex flex-col justify-center gap-3">
          {characters.map((char) => (
            <CharacterCard key={char.id} char={char} onSelect={onSelectChar} />
          ))}
        </div>

        <p className="text-center text-[11px]" style={{ color: "var(--text-on-dark-muted)" }}>
          Chọn nhân vật để bắt đầu trò chuyện
        </p>
      </div>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────

interface EventDetailModalProps {
  event: HistoricalEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const [videoFinished, setVideoFinished] = useState(false);

  // Reset state khi mở event mới
  useEffect(() => {
    setVideoFinished(false);
  }, [event?.id]);

  if (!event) return null;

  const color = CATEGORY_COLOR[event.category];
  const yearLabel = event.yearLabel ?? `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;

  // TODO: fetch characters theo event.id từ API
  const characters = MOCK_CHARACTERS[event.id] ?? MOCK_CHARACTERS.default;

  const handleSelectChar = (charId: string) => {
    // TODO: navigate sang /chat/[charId]
    router.push(`/chat/${charId}`);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <div
          className="relative flex w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
          style={{
            height: "min(600px, 90vh)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Left 60% — Video / Characters ── */}
          <div className="w-[60%] shrink-0">
            {videoFinished ? (
              <CharactersReveal
                event={event}
                characters={characters}
                onSelectChar={handleSelectChar}
              />
            ) : (
              <FakeVideoPlayer event={event} onFinish={() => setVideoFinished(true)} />
            )}
          </div>

          {/* ── Right 40% — Event info ── */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{ background: "var(--palladian)", borderLeft: "1px solid var(--card-light-border)" }}
          >
            {/* Header */}
            <div className="p-5 border-b" style={{ borderColor: "var(--card-light-border)" }}>
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${color}18`, color }}
                >
                  {yearLabel}
                </span>
              </div>
              <h2 className="text-base font-bold leading-snug mb-1" style={{ color: "var(--content-heading)" }}>
                {event.title}
              </h2>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Meta */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                  <span className="text-xs" style={{ color: "var(--content-text)" }}>{yearLabel}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--content-subtle)" }} />
                    <span className="text-xs" style={{ color: "var(--content-text)" }}>{event.location}</span>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: "var(--card-light-border)" }} />

              {/* Summary */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--content-subtle)" }}>
                  Bối cảnh lịch sử
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: "var(--content-text)" }}>
                  {event.summary}
                </p>
              </div>

              {/* Characters list nhỏ (luôn hiện ở bên phải) */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--content-subtle)" }}>
                  Nhân vật liên quan
                </h4>
                <div className="space-y-1.5">
                  {characters.map((char) => (
                    <button
                      key={char.id}
                      onClick={() => handleSelectChar(char.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 cursor-pointer hover:border-[var(--accent-gold)] group"
                      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background: "linear-gradient(135deg, var(--accent-gold) 0%, var(--truffle) 100%)", color: "var(--bg-deep)" }}
                      >
                        {char.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--content-heading)" }}>{char.name}</p>
                        <p className="text-[10px] truncate" style={{ color: "var(--content-muted)" }}>{char.role}</p>
                      </div>
                      <MessageSquare className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" style={{ color: "var(--accent-gold)" }} />
                    </button>
                  ))}
                </div>
              </div>

              {/* TODO: thêm field khi có API */}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}