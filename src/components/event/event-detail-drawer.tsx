"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { X, Play, SkipForward, Clock, MapPin } from "lucide-react";
import type { HistoricalEvent, EventCategory } from "@/services/event.service";
import {
  CharacterCarouselCard,
  CharacterCompactCard,
  type Character,
} from "@/components/commons/character-card";

// ── Mock ──────────────────────────────────────────────────
// TODO: fetch từ API /events/:id/characters

const MOCK_CHARACTERS: Record<string, Character[]> = {
  default: [
    { id: "ngo-quyen",        name: "Ngô Quyền",        title: "Danh tướng Đại Việt",  role: "Chỉ huy quân Đại Việt",     era: "899–944", side: "Đại Việt" },
    { id: "liu-hongcao",      name: "Lưu Hoằng Tháo",   title: "Thống soái Nam Hán",   role: "Tổng chỉ huy quân Nam Hán", era: "?–938",   side: "Nam Hán"  },
    { id: "duong-dinh-nghe",  name: "Dương Đình Nghệ",  title: "Tiên liệt Đại Việt",   role: "Thủ lĩnh tiền nhiệm",       era: "?–937",   side: "Đại Việt" },
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

const FAKE_DURATION = 8;

function FakeVideoPlayer({ event, onFinish }: { event: HistoricalEvent; onFinish: () => void }) {
  const [playing, setPlaying]   = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    setPlaying(true);
    timer.current = setInterval(() => {
      setElapsed((p) => {
        const n = p + 0.1;
        setProgress((n / FAKE_DURATION) * 100);
        if (n >= FAKE_DURATION) { clearInterval(timer.current!); setPlaying(false); onFinish(); }
        return n;
      });
    }, 100);
  };

  const skip = () => { if (timer.current) clearInterval(timer.current); onFinish(); };
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const fmt = (s: number) => `${Math.floor(s)}:${String(Math.floor((s % 1) * 10)).padStart(2, "0")}`;

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1 overflow-hidden">
        <Image src="/war.jpg" alt={event.title} fill className={`object-cover transition-transform duration-700 ${playing ? "scale-105" : "scale-100"}`} sizes="60vw" priority />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
        <div aria-hidden className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}
        />
        {playing && (
          <div className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.4) 2px,rgba(0,0,0,0.4) 4px)" }}
          />
        )}
        <div className="absolute top-0 left-0 right-0 h-8 bg-black" />
        <div className="absolute bottom-12 left-0 right-0 h-8 bg-black" />

        {!playing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5">
            <button onClick={start} className="w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "2px solid rgba(255,255,255,0.25)" }}>
              <Play className="w-8 h-8 text-white ml-1.5" fill="white" />
            </button>
            <p className="text-white/70 text-sm font-medium tracking-wide">Xem video giới thiệu</p>
          </div>
        )}

        {playing && (
          <button onClick={skip} className="absolute top-10 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer hover:bg-white/20 transition-all"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <SkipForward className="w-3.5 h-3.5" /> Bỏ qua
          </button>
        )}

        <div className="absolute bottom-8 left-0 right-0 px-6">
          <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Video giới thiệu</p>
          <p className="text-white text-xl font-bold leading-snug drop-shadow-lg">{event.title}</p>
        </div>
      </div>

      <div className="px-5 py-3 flex items-center gap-3" style={{ background: "#080808" }}>
        <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(elapsed)}</span>
        <div className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-100"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, var(--accent-gold) 0%, var(--truffle) 100%)" }} />
        </div>
        <span className="text-[11px] tabular-nums" style={{ color: "rgba(255,255,255,0.35)" }}>{fmt(FAKE_DURATION)}</span>
      </div>
    </div>
  );
}

// ── Characters Reveal — card dọc giống carousel ───────────

function CharactersReveal({ event, characters, onSelect }: {
  event: HistoricalEvent;
  characters: Character[];
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-black">
      {/* Background mờ */}
      <div className="absolute inset-0">
        <Image src="/war.jpg" alt="" fill className="object-cover opacity-10" sizes="60vw" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(7,13,24,0.97) 0%, rgba(27,38,50,0.95) 100%)" }} />
      </div>

      {/* Letterbox */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-black z-10" />

      <div className="relative z-10 flex flex-col h-full px-6 pt-12 pb-10 gap-4">
        {/* Header */}
        <div className="shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: "var(--accent-gold)", opacity: 0.7 }}>
            Nhân vật trong sự kiện
          </p>
          <h3 className="text-lg font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
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

        <p className="shrink-0 text-center text-[11px]" style={{ color: "var(--text-on-dark-muted)" }}>
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
  event: HistoricalEvent | null;
  onClose: () => void;
}

export function EventDetailModal({ event, onClose }: EventDetailModalProps) {
  const router = useRouter();
  const [videoFinished, setVideoFinished] = useState(false);

  useEffect(() => { setVideoFinished(false); }, [event?.id]);

  if (!event) return null;

  const color = CATEGORY_COLOR[event.category];
  const yearLabel = event.yearLabel ?? `${Math.abs(event.year)} ${event.year < 0 ? "TCN" : "SCN"}`;
  const characters = MOCK_CHARACTERS[event.id] ?? MOCK_CHARACTERS.default;

  const handleSelectChar = (charId: string) => {
    router.push(`/chat/${charId}`);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex overflow-hidden">
        <div
          className="relative flex w-full h-full"
          style={{ boxShadow: "0 0 0 1px rgba(255,255,255,0.06)" }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-10 right-[41%] z-30 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer hover:bg-white/10"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <X className="w-4 h-4" />
          </button>

          {/* ── Left 60% ── */}
          <div className="w-[60%] shrink-0 h-full">
            {videoFinished
              ? <CharactersReveal event={event} characters={characters} onSelect={handleSelectChar} />
              : <FakeVideoPlayer event={event} onFinish={() => setVideoFinished(true)} />
            }
          </div>

          {/* ── Right 40% ── */}
          <div
            className="flex-1 flex flex-col h-full overflow-hidden"
            style={{ background: "var(--palladian)", borderLeft: "1px solid var(--card-light-border)" }}
          >
            <div className="h-1 w-full shrink-0" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />

            <div className="px-8 py-6 border-b shrink-0" style={{ borderColor: "var(--card-light-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>
                  {yearLabel}
                </span>
              </div>
              <h2 className="text-2xl font-bold leading-snug" style={{ color: "var(--content-heading)" }}>
                {event.title}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 shrink-0" style={{ color }} />
                  <span className="text-sm" style={{ color: "var(--content-text)" }}>{yearLabel}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: "var(--content-subtle)" }} />
                    <span className="text-sm" style={{ color: "var(--content-text)" }}>{event.location}</span>
                  </div>
                )}
              </div>

              <div style={{ height: 1, background: "var(--card-light-border)" }} />

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--content-subtle)" }}>
                  Bối cảnh lịch sử
                </h4>
                <p className="text-sm leading-relaxed" style={{ color: "var(--content-text)" }}>
                  {event.summary}
                </p>
              </div>

              <div style={{ height: 1, background: "var(--card-light-border)" }} />

              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--content-subtle)" }}>
                  Nhân vật liên quan
                </h4>
                <div className="space-y-2">
                  {characters.map((char) => (
                    <CharacterCompactCard key={char.id} character={char} onClick={handleSelectChar} />
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