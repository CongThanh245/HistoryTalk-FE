"use client";

/* eslint-disable @next/next/no-img-element -- portraits are arbitrary-size cut-outs */
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  FastForward,
  History,
  MessageCircle,
  RotateCcw,
  Trophy,
  Unplug,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import { findBackground } from "@/features/story/mock-data";
import { useStoryEngine } from "@/features/story/use-story-engine";
import type { StoryCharacter, StoryFlowEdge, StoryFlowNode } from "@/features/story/types";
import "@/features/story/story.css";

const CHAR_MS = 26;

function useTypewriter(text: string, key: string | null) {
  const [count, setCount] = useState(0);
  const [prevKey, setPrevKey] = useState(key);
  if (prevKey !== key) {
    setPrevKey(key);
    setCount(0);
  }
  useEffect(() => {
    if (count >= text.length) return;
    const t = window.setTimeout(() => setCount((c) => Math.min(text.length, c + 1)), CHAR_MS);
    return () => window.clearTimeout(t);
  }, [count, text]);
  return { shown: text.slice(0, count), done: count >= text.length, complete: () => setCount(text.length) };
}

/** Reads a line aloud with the browser's Vietnamese voice (stand-in for the TTS server). */
function useSpeech(enabled: boolean, text: string | null, key: string, onEnd: () => void) {
  const onEndRef = useRef(onEnd);
  useEffect(() => {
    onEndRef.current = onEnd;
  });
  useEffect(() => {
    if (!enabled || !text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const synth = window.speechSynthesis;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    const vi = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith("vi"));
    if (vi) u.voice = vi;
    u.rate = 1.05;
    u.onend = () => onEndRef.current();
    synth.cancel();
    synth.speak(u);
    return () => synth.cancel();
  }, [enabled, text, key]);
}

function ControlButton({ label, active, highlight, onClick, children }: { label: string; active?: boolean; highlight?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-9 cursor-pointer items-center gap-1.5 rounded-sm border px-2.5 text-[12px] font-semibold backdrop-blur-md transition-colors",
        active
          ? "border-[#F5F2EA] bg-[#F5F2EA] text-[#111]"
          : highlight
            ? "border-[#D9B25C] bg-[#D9B25C]/90 text-[#111] hover:bg-[#D9B25C]"
            : "border-white/25 bg-black/35 text-[#F5F2EA] hover:border-white/60 hover:bg-black/55",
      )}
    >
      {children}
    </button>
  );
}

function Portrait({ character, expression, talking }: { character: StoryCharacter | null; expression: string; talking: boolean }) {
  if (!character) return null;
  return (
    <div
      key={character.id}
      className="story-portrait-in pointer-events-none absolute bottom-0 left-[4%] z-10 h-[86%] max-md:left-1/2 max-md:h-[62%] max-md:-translate-x-1/2"
    >
      <div className="story-portrait h-full" data-talking={talking}>
        {character.portraitUrl ? (
          <img
            src={character.portraitUrl}
            alt={character.name}
            data-expression={expression}
            className="story-portrait-img h-full w-auto object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
          />
        ) : (
          <div
            data-expression={expression}
            className="story-portrait-img flex h-full aspect-[3/4] items-end justify-center"
          >
            {/* Silhouette for characters without art yet. */}
            <svg viewBox="0 0 120 160" className="h-[70%] w-auto drop-shadow-[0_16px_30px_rgba(0,0,0,0.6)]">
              <defs>
                <linearGradient id={`sil-${character.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={character.accent} stopOpacity="0.95" />
                  <stop offset="1" stopColor={character.accent} stopOpacity="0.35" />
                </linearGradient>
              </defs>
              <circle cx="60" cy="44" r="24" fill={`url(#sil-${character.id})`} stroke="rgba(245,242,234,0.35)" strokeWidth="1" />
              <path d="M14 160 C18 106 38 84 60 84 C82 84 102 106 106 160 Z" fill={`url(#sil-${character.id})`} stroke="rgba(245,242,234,0.25)" strokeWidth="1" />
              <text x="60" y="51" textAnchor="middle" fontSize="18" fontWeight="700" fill="#F5F2EA">
                {character.name
                  .split(" ")
                  .slice(-2)
                  .map((w) => w[0]?.toUpperCase())
                  .join("")}
              </text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function NamePlate({ name, accent }: { name: string; accent?: string }) {
  return (
    <span
      className="absolute -top-4 left-5 rounded-sm px-3 py-1 font-display text-[15px] font-bold uppercase tracking-[0.08em] text-[#F5F2EA] shadow-lg"
      style={{ background: accent ?? "#2E2C29" }}
    >
      {name}
    </span>
  );
}

export function StoryPlayer({
  nodes,
  edges,
  title,
  startAt,
  onClose,
  onNodeChange,
  onOpenChat,
}: {
  nodes: StoryFlowNode[];
  edges: StoryFlowEdge[];
  title: string;
  startAt?: string | null;
  onClose?: () => void;
  onNodeChange?: (id: string | null) => void;
  /**
   * Opens the existing chat with a character. Free questions are not a story
   * step: the learner can ask whoever is on screen at any time, then come back.
   */
  onOpenChat?: (character: StoryCharacter) => void;
}) {
  const engine = useStoryEngine(nodes, edges, startAt);
  const { node, speaker, speakerName } = engine;
  const d = node?.data ?? null;

  const [auto, setAuto] = useState(false);
  const [voice, setVoice] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  // The character to chat with: whoever spoke last (the end screen has no speaker).
  const [chatCharacter, setChatCharacter] = useState<StoryCharacter | null>(speaker);
  if (speaker && speaker.id !== chatCharacter?.id) setChatCharacter(speaker);

  const openChat = () => {
    if (!chatCharacter) return;
    setAuto(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    if (onOpenChat) onOpenChat(chatCharacter);
    else toast.info(`Bản thật sẽ mở khung chat với ${chatCharacter.name}`, { description: "Đóng chat là quay lại đúng đoạn đang xem." });
  };

  const lineText = d?.kind === "line" ? d.text : d?.kind === "choice" ? d.prompt : d?.kind === "quiz" ? d.question : "";
  const stepKey = `${node?.id}-${engine.steps}`;
  const typer = useTypewriter(lineText, stepKey);
  const [spoken, setSpoken] = useState<string | null>(null);
  useSpeech(voice, lineText || null, stepKey, () => setSpoken(stepKey));

  useEffect(() => {
    onNodeChange?.(node?.id ?? null);
  }, [node?.id, onNodeChange]);

  // Auto-play: after the line is fully shown (and read, when the voice is on), move on.
  const speechDone = !voice || spoken === stepKey;
  useEffect(() => {
    if (!auto || d?.kind !== "line" || !typer.done || !speechDone || logOpen) return;
    const t = window.setTimeout(engine.advance, voice ? 500 : 900 + lineText.length * 18);
    return () => window.clearTimeout(t);
  }, [auto, d?.kind, typer.done, speechDone, logOpen, voice, lineText.length, engine.advance]);

  useEffect(() => {
    if (logOpen) logEndRef.current?.scrollIntoView({ block: "end" });
  }, [logOpen, engine.log.length]);

  const proceed = () => {
    if (d?.kind !== "line") return;
    if (!typer.done) typer.complete();
    else engine.advance();
  };

  // Keyboard: Space/Enter/→ advance, number keys pick, A auto, L log, Esc close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea")) return;
      if (e.key === "Escape") {
        if (logOpen) setLogOpen(false);
        else onClose?.();
        return;
      }
      if (e.key === "l" || e.key === "L") return setLogOpen((v) => !v);
      if (e.key === "a" || e.key === "A") return setAuto((v) => !v);
      if (e.key === "h" || e.key === "H") return openChat();
      if (logOpen) return;
      if ([" ", "Enter", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        if (d?.kind === "line") proceed();
        else if (d?.kind === "quiz" && engine.quiz) engine.continueAfterQuiz();
        else if (!typer.done) typer.complete();
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= 9 && typer.done) {
        if (d?.kind === "choice" && d.options[n - 1]) engine.choose(d.options[n - 1].id);
        if (d?.kind === "quiz" && !engine.quiz && d.answers[n - 1]) engine.answerQuiz(d.answers[n - 1].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const bg = findBackground(engine.background);
  const expression = d?.kind === "line" ? d.expression : "neutral";
  const showDialogue = d && d.kind !== "end";

  return (
    <div className="relative h-full w-full select-none overflow-hidden bg-black text-[#F5F2EA]" onClick={proceed}>
      {/* Scene */}
      <div className="story-stage-bg absolute inset-0" style={{ background: bg.css }} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

      <Portrait character={speaker} expression={expression} talking={d?.kind === "line" && !typer.done} />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-30 flex items-center gap-2 p-3 md:p-4">
        <div className="min-w-0 rounded-sm bg-black/35 px-3 py-1.5 backdrop-blur-md">
          <p className="truncate text-[11px] font-bold uppercase tracking-[0.14em] text-white/60">Kể chuyện</p>
          <p className="truncate text-[13px] font-semibold">{title}</p>
        </div>
        <div className="ml-auto flex flex-wrap justify-end gap-1.5">
          {chatCharacter && (
            <ControlButton label={`Hỏi ${chatCharacter.name} trong khung chat (H)`} highlight onClick={openChat}>
              <MessageCircle className="size-4" />
              <span className="max-sm:hidden">Hỏi {chatCharacter.name}</span>
            </ControlButton>
          )}
          <ControlButton label="Tự động chạy (A)" active={auto} onClick={() => setAuto((v) => !v)}>
            <FastForward className="size-4" />
            <span className="max-sm:hidden">Tự động</span>
          </ControlButton>
          <ControlButton label="Đọc lời thoại" active={voice} onClick={() => setVoice((v) => !v)}>
            {voice ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            <span className="max-sm:hidden">Giọng đọc</span>
          </ControlButton>
          <ControlButton label="Nhật ký lời thoại (L)" active={logOpen} onClick={() => setLogOpen((v) => !v)}>
            <History className="size-4" />
          </ControlButton>
          <ControlButton label="Xem lại từ đầu" onClick={engine.restart}>
            <RotateCcw className="size-4" />
          </ControlButton>
          {onClose && (
            <ControlButton label="Đóng (Esc)" onClick={onClose}>
              <X className="size-4" />
            </ControlButton>
          )}
        </div>
      </div>

      {/* Dialogue box */}
      {showDialogue && (
        // Above the choice/quiz dimmer so the question stays readable.
        <div className="absolute inset-x-3 bottom-3 z-[25] md:inset-x-[6%] md:bottom-6 md:left-[30%]">
          <div
            key={stepKey}
            className="story-fade-in relative min-h-[132px] rounded-md border border-white/15 bg-[rgba(14,12,11,0.82)] px-5 pb-5 pt-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md md:px-7"
          >
            <NamePlate name={speakerName} accent={speaker?.accent} />
            <p
              className={cn(
                "text-[16px] leading-[1.65] md:text-[18px]",
                !speaker && "italic text-[#E8E2D4]",
              )}
            >
              {typer.shown}
              {!typer.done && <span className="story-caret ml-0.5 inline-block h-[1.1em] w-[2px] translate-y-[3px] bg-current" />}
            </p>
            {d?.kind === "line" && typer.done && (
              <ChevronDown className="story-next-hint absolute bottom-3 right-4 size-5 text-[#D9B25C]" />
            )}
          </div>
        </div>
      )}

      {/* Choice */}
      {d?.kind === "choice" && typer.done && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 p-4 pb-48" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md space-y-2.5">
            {d.options.map((o, i) => (
              <button
                key={o.id}
                type="button"
                onClick={() => engine.choose(o.id)}
                style={{ animationDelay: `${i * 70}ms` }}
                className="story-fade-in group flex w-full cursor-pointer items-center gap-3 rounded-md border border-[#D9B25C]/50 bg-[rgba(14,12,11,0.85)] px-4 py-3.5 text-left text-[15px] font-semibold backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#D9B25C] hover:bg-[#D9B25C] hover:text-[#111]"
              >
                <span className="grid size-6 shrink-0 place-items-center rounded-sm border border-current text-[12px]">{i + 1}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quiz */}
      {d?.kind === "quiz" && typer.done && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-4 pb-48" onClick={(e) => e.stopPropagation()}>
          <div className="story-fade-in w-full max-w-md space-y-2.5">
            {d.answers.map((a, i) => {
              const picked = engine.quiz?.pickedId === a.id;
              const isCorrect = a.id === d.correctId;
              const reveal = !!engine.quiz;
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={reveal}
                  onClick={() => engine.answerQuiz(a.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border px-4 py-3 text-left text-[15px] font-semibold backdrop-blur-md transition-all",
                    !reveal && "cursor-pointer border-white/30 bg-[rgba(14,12,11,0.85)] hover:-translate-y-0.5 hover:border-white",
                    reveal && isCorrect && "border-[#7FB0A6] bg-[#3D6B63] text-white",
                    reveal && picked && !isCorrect && "border-[#E0644A] bg-[#7A1F12] text-white",
                    reveal && !picked && !isCorrect && "border-white/10 bg-[rgba(14,12,11,0.7)] opacity-50",
                  )}
                >
                  <span className="grid size-6 shrink-0 place-items-center rounded-sm border border-current text-[12px]">
                    {reveal && isCorrect ? <Check className="size-3.5" strokeWidth={3} /> : reveal && picked ? <X className="size-3.5" strokeWidth={3} /> : String.fromCharCode(65 + i)}
                  </span>
                  {a.label}
                </button>
              );
            })}
            {engine.quiz && (
              <div className="story-fade-in rounded-md border border-white/15 bg-[rgba(14,12,11,0.9)] p-4 backdrop-blur-md">
                <p className={cn("mb-1 text-[13px] font-bold uppercase tracking-wider", engine.quiz.correct ? "text-[#7FB0A6]" : "text-[#F08C74]")}>
                  {engine.quiz.correct ? "Chính xác!" : "Chưa đúng"}
                </p>
                {d.explanation && <p className="text-[14px] leading-relaxed text-white/85">{d.explanation}</p>}
                <button
                  type="button"
                  autoFocus
                  onClick={engine.continueAfterQuiz}
                  className="mt-3 w-full cursor-pointer rounded-sm bg-[#F5F2EA] py-2.5 text-[14px] font-bold text-[#111] hover:bg-white"
                >
                  Tiếp tục
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* End */}
      {d?.kind === "end" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/55 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="story-fade-in w-full max-w-md rounded-md border border-[#D9B25C]/40 bg-[rgba(14,12,11,0.92)] p-6 text-center shadow-2xl">
            <span className="mx-auto mb-3 grid size-14 place-items-center rounded-full bg-[#D9B25C] text-[#111]">
              <Trophy className="size-7" />
            </span>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/55">Hoàn thành câu chuyện</p>
            <h2 className="mt-1 font-display text-[28px] font-extrabold leading-tight">{d.title}</h2>
            {d.summary && <p className="mt-3 text-[14.5px] leading-relaxed text-white/80">{d.summary}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-sm border border-white/10 py-2.5">
                <p className="font-display text-[22px] font-bold text-[#D9B25C]">+{d.xp}</p>
                <p className="text-[11px] uppercase tracking-wider text-white/50">XP</p>
              </div>
              <div className="rounded-sm border border-white/10 py-2.5">
                <p className="font-display text-[22px] font-bold">
                  {engine.score.total ? `${engine.score.correct}/${engine.score.total}` : "–"}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-white/50">Câu đúng</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={engine.restart} className="flex-1 cursor-pointer rounded-sm border border-white/30 py-2.5 text-[14px] font-semibold hover:border-white">
                Xem lại
              </button>
              {d.unlockCharacters && chatCharacter && (
                <button
                  type="button"
                  onClick={openChat}
                  className="flex-1 cursor-pointer rounded-sm bg-[#F5F2EA] py-2.5 text-[14px] font-bold text-[#111] hover:bg-white"
                >
                  Trò chuyện ngay
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dead end (preview only: an unlinked branch) */}
      {engine.isDeadEnd && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 p-4" onClick={(e) => e.stopPropagation()}>
          <div className="story-fade-in w-full max-w-sm rounded-md border border-white/15 bg-[rgba(14,12,11,0.92)] p-6 text-center">
            <Unplug className="mx-auto mb-3 size-8 text-[#F08C74]" />
            <p className="text-[16px] font-bold">Nhánh này chưa được nối tiếp</p>
            <p className="mt-1.5 text-[13.5px] text-white/70">Học sinh sẽ bị kẹt ở đây. Hãy nối bước này tới một bước khác trên khung vẽ.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={engine.restart} className="flex-1 cursor-pointer rounded-sm border border-white/30 py-2 text-[13.5px] font-semibold hover:border-white">
                Chạy lại
              </button>
              {onClose && (
                <button type="button" onClick={onClose} className="flex-1 cursor-pointer rounded-sm bg-[#F5F2EA] py-2 text-[13.5px] font-bold text-[#111]">
                  Về chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backlog */}
      {logOpen && (
        <div className="absolute inset-0 z-40 flex justify-end bg-black/50" onClick={(e) => { e.stopPropagation(); setLogOpen(false); }}>
          <div className="story-fade-in flex h-full w-[min(440px,100%)] flex-col border-l border-white/10 bg-[rgba(14,12,11,0.95)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4">
              <History className="size-4" />
              <p className="font-bold">Nhật ký lời thoại</p>
              <button type="button" aria-label="Đóng" onClick={() => setLogOpen(false)} className="ml-auto cursor-pointer rounded-sm p-1 hover:bg-white/10">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5 select-text">
              {engine.log.length === 0 && <p className="text-[13.5px] text-white/50">Chưa có lời thoại nào.</p>}
              {engine.log.map((entry) => (
                <div key={entry.id}>
                  <p className={cn("text-[11px] font-bold uppercase tracking-wider", entry.speaker === "Bạn" ? "text-[#D9B25C]" : "text-white/55")}>{entry.speaker}</p>
                  <p className={cn("mt-0.5 text-[14.5px] leading-relaxed", entry.tone === "question" && "italic text-white/75")}>{entry.text}</p>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
