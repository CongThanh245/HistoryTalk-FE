"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useCallback, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock,
  ImageIcon,
  Loader2,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Send,
  SquarePen,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import styles from "./battle-experience.module.css";
import { useChatMessages, useChatSessions, useCreateSession, useSendMessage } from "@/features/chat/hooks";
import { MarkdownMessage } from "@/components/chat/MarkdownMessage";
import { splitAssistantContent } from "@/lib/utils/helpers";
import { isTokenExhaustionError } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils/cn";
import { queryKeys } from "@/shared/query-key";
import type { GetMessagesResponse } from "@/services/chat.service";
import type { Character } from "@/services/character.service";
import type { HistoricalEvent } from "@/services/event.service";
import type { MapPin } from "@/services/map-pin.service";

// ── Audio narration hook (Web Speech API) ─────────────────────
function useBattleNarration(script: string) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    setIsPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const play = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis || !script) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.lang = "vi-VN";
    utterance.rate = 0.82;
    utterance.pitch = 1;

    // Ước tính thời gian: ~85ms/ký tự với giọng tiếng Việt
    durationRef.current = script.length * 85;
    startTimeRef.current = Date.now();

    utterance.onstart = () => {
      setIsPlaying(true);
      const tick = () => {
        const elapsed = Date.now() - startTimeRef.current;
        const pct = Math.min(elapsed / durationRef.current, 1);
        setProgress(pct * 100);
        const ci = Math.floor(pct * script.length);
        const lo = Math.max(0, ci - 70);
        const hi = Math.min(script.length, ci + 70);
        setCurrentText(script.slice(lo, hi));
        if (pct < 1) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      setCurrentText("");
      cancelAnimationFrame(rafRef.current);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      cancelAnimationFrame(rafRef.current);
    };

    window.speechSynthesis.speak(utterance);
  }, [script]);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
    setCurrentText("");
  }, [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) stop();
    else { if (progress >= 99) reset(); play(); }
  }, [isPlaying, progress, stop, reset, play]);

  useEffect(() => () => stop(), [stop]);

  return { isPlaying, progress, currentText, toggle, reset, stop };
}

// ── Main component ────────────────────────────────────────────
export function BattleDetailView({
  event,
  pin,
  characters,
  onBack,
  onClose,
  initialCharacterId,
}: {
  event: HistoricalEvent;
  pin: MapPin | null;
  characters: Character[];
  onBack: () => void;
  onClose: () => void;
  initialCharacterId?: string;
}) {
  const [chatOpen, setChatOpen] = useState(!!initialCharacterId);
  const [chatMounted, setChatMounted] = useState(!!initialCharacterId);
  const [characterId, setCharacterId] = useState(initialCharacterId ?? characters[0]?.id ?? "");
  const [chatBusy, setChatBusy] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [muted, setMuted] = useState(false);

  const character = characters.find((item) => item.id === characterId) ?? characters[0];
  const year = event.year < 0 ? `${Math.abs(event.year)} TCN` : String(event.year);

  const narrationScript = muted
    ? ""
    : (event.summary ||
        `Trận ${event.title} diễn ra vào năm ${year}. ${
          event.location ? `Tại ${event.location}. ` : ""
        }Đây là một trong những trận đánh lịch sử quan trọng nhất của dân tộc Việt Nam, để lại dấu ấn sâu đậm trong lòng người dân qua nhiều thế kỷ.`);

  const narration = useBattleNarration(narrationScript);

  const openChat = (question?: string) => {
    if (!character) return;
    if (question && chatBusy) return;
    if (question) setChatDraft(question);
    setChatMounted(true);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
  };

  const handleMuteToggle = () => {
    narration.stop();
    setMuted((m) => !m);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape" && chatOpen) {
        e.stopImmediatePropagation();
        setChatOpen(false);
      }
    };
    window.addEventListener("keydown", h, true);
    return () => window.removeEventListener("keydown", h, true);
  }, [chatOpen]);

  return (
    <div className={cn(styles.immersive, chatOpen && styles.immersiveChatShown)}>
      {/* ── Top navigation bar ── */}
      <header className={styles.immersiveBar}>
        <button
          type="button"
          onClick={onBack}
          className={styles.immersiveNavBtn}
          aria-label="Quay lại bản đồ"
        >
          <ArrowLeft size={18} />
        </button>

        <div className={styles.immersiveMeta}>
          <h1>{event.title}</h1>
          <p>
            <span className={styles.immersiveYearBadge}>{year}</span>
            {event.location && <span>{event.location}</span>}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={styles.immersiveNavBtn}
          aria-label="Đóng"
        >
          <X size={18} />
        </button>
      </header>

      {/* ── Full-screen battle image ── */}
      <div className={styles.immersiveScene}>
        {/* Battle image */}
        <div className={styles.immersiveImg}>
          <Image
            src={event.imageUrl || "/war.jpg"}
            alt={`Tư liệu minh họa: ${event.title}`}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient overlays */}
        <div className={styles.immersiveGradTop} aria-hidden="true" />
        <div className={styles.immersiveGradBottom} aria-hidden="true" />

        {/* Image caption */}
        <span className={styles.immersiveImgLabel} aria-hidden="true">
          <ImageIcon size={11} /> Tư liệu minh họa
        </span>

        {/* Character avatar — bottom right corner */}
        {character && (
          <div className={styles.immersiveCharWrap}>
            <button
              type="button"
              onClick={() => (chatOpen ? closeChat() : openChat())}
              aria-label={`Trò chuyện với ${character.name}`}
              aria-expanded={chatOpen}
              aria-controls="battle-chat"
              className={styles.immersiveCharBtn}
            >
              <span className={styles.immersiveCharAvatar}>
                {character.avatarUrl ? (
                  <Image
                    src={character.avatarUrl}
                    alt=""
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                ) : (
                  <span className={styles.immersiveCharInitial}>
                    {character.name.charAt(0)}
                  </span>
                )}
                {/* Live pulse indicator */}
                <span className={styles.immersiveCharPulse} aria-hidden="true" />
                {/* Chat icon badge */}
                <span className={styles.immersiveCharBadge} aria-hidden="true">
                  <MessageCircle size={13} />
                </span>
              </span>
            </button>
            <p className={styles.immersiveCharName}>{character.name}</p>
            <p className={styles.immersiveCharAction}>
              Trò chuyện <ArrowUpRight size={10} />
            </p>
          </div>
        )}
      </div>

      {/* ── Audio player bar ── */}
      <div className={styles.immersiveAudio}>
        {/* Controls */}
        <div className={styles.audioControls}>
          <button
            type="button"
            onClick={narration.reset}
            className={styles.audioIconBtn}
            title="Nghe lại từ đầu"
            aria-label="Nghe lại từ đầu"
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            onClick={narration.toggle}
            className={styles.audioPlayBtn}
            aria-label={narration.isPlaying ? "Dừng" : "Phát"}
          >
            {narration.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={handleMuteToggle}
            className={styles.audioIconBtn}
            title={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>

        {/* Content */}
        <div className={styles.audioContent}>
          <div className={styles.audioHeader}>
            <span className={styles.audioTitle}>Diễn biến trận đánh</span>
            {narration.isPlaying && (
              <span className={styles.audioLive} aria-live="polite">
                <span className={styles.audioLiveDot} />
                Đang phát
              </span>
            )}
            {!narration.isPlaying && narration.progress === 0 && !muted && (
              <span className={styles.audioHint}>Bấm ▶ để nghe tường thuật</span>
            )}
            {muted && (
              <span className={styles.audioHint}>Âm thanh đang tắt</span>
            )}
          </div>

          {/* Progress track */}
          <div className={styles.audioTrack} role="progressbar" aria-valuenow={Math.round(narration.progress)} aria-valuemin={0} aria-valuemax={100}>
            <div className={styles.audioFill} style={{ width: `${narration.progress}%` }} />
          </div>

          {/* Live caption text */}
          {narration.currentText && (
            <p className={styles.audioCaption} aria-live="polite">
              …{narration.currentText}…
            </p>
          )}
        </div>

        {/* Animated waveform */}
        <div className={styles.audioWave} aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <span
              key={i}
              className={cn(styles.audioBar, narration.isPlaying && styles.audioBarActive)}
              style={{
                animationDelay: `${(i * 43) % 500}ms`,
                height: `${10 + ((i * 17 + 5) % 22)}px`,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Chat drawer ── */}
      {chatMounted && character && (
        <aside
          id="battle-chat"
          aria-label="Trò chuyện với nhân vật"
          className={cn(styles.chatDrawer, !chatOpen && styles.chatHidden)}
        >
          <BattleChat
            key={`${event.id}:${character.id}`}
            character={character}
            characters={characters}
            contextId={event.id}
            onSelectCharacter={(id) => {
              setCharacterId(id);
              setChatDraft("");
            }}
            onClose={closeChat}
            open={chatOpen}
            draft={chatDraft}
            onDraftChange={setChatDraft}
            onBusyChange={setChatBusy}
          />
        </aside>
      )}
    </div>
  );
}

// ── Character avatar helper ───────────────────────────────────
function CharacterAvatar({ character, large = false }: { character?: Character; large?: boolean }) {
  return (
    <span className={cn(styles.avatar, large && styles.avatarLarge)}>
      {character?.avatarUrl ? (
        <Image src={character.avatarUrl} alt="" fill sizes={large ? "112px" : "56px"} className="object-cover" />
      ) : character?.name.charAt(0) ?? (
        <MessageCircle size={22} />
      )}
    </span>
  );
}

// ── Chat component ────────────────────────────────────────────
function BattleChat({
  character,
  characters,
  contextId,
  onSelectCharacter,
  onClose,
  open,
  draft,
  onDraftChange: setDraft,
  onBusyChange,
}: {
  character: Character;
  characters: Character[];
  contextId: string;
  onSelectCharacter: (id: string) => void;
  onClose: () => void;
  open: boolean;
  draft: string;
  onDraftChange: (draft: string) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const qc = useQueryClient();
  const sessions = useChatSessions(character.id, contextId);
  // null = dùng session mới nhất, string = session cụ thể đã chọn
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const sessionId = activeSessionId ?? sessions.data?.[0]?.id ?? null;
  const history = useChatMessages(sessionId);
  const createSession = useCreateSession();
  const sendMessage = useSendMessage();
  const [pendingText, setPendingText] = useState("");
  const [error, setError] = useState("");
  const sendingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const busy = createSession.isPending || sendMessage.isPending;
  const loading = sessions.isPending || (!!sessionId && history.isPending);
  const loadError = sessions.isError || history.isError;
  const sessionList = sessions.data ?? [];
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [history.data, pendingText, open]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sendingRef.current || loading || loadError) return;
    sendingRef.current = true;
    setError("");
    setPendingText(content);
    setDraft("");
    try {
      const id =
        sessionId ??
        (await createSession.mutateAsync({ characterId: character.id, contextId })).id;
      setActiveSessionId(id);
      const result = await sendMessage.mutateAsync({ sessionId: id, content });
      await qc.cancelQueries({ queryKey: queryKeys.chat.messages(id) });
      qc.setQueryData<GetMessagesResponse>(queryKeys.chat.messages(id), (previous) => ({
        messages: [
          ...(previous?.messages ?? []).filter(
            (message) =>
              message.id !== result.userMessage.id &&
              message.id !== result.assistantMessage.id,
          ),
          result.userMessage,
          result.assistantMessage,
        ],
        suggestedQuestions: result.suggestedQuestions ?? [],
      }));
      void qc.invalidateQueries({ queryKey: queryKeys.chat.sessions(character.id, contextId) });
      void qc.invalidateQueries({ queryKey: queryKeys.chat.history });
      void qc.invalidateQueries({ queryKey: queryKeys.chatHistory.all });
    } catch (err) {
      setDraft(content);
      setError(
        isTokenExhaustionError(err)
          ? "Bạn đã hết token. Vui lòng nạp thêm để tiếp tục trò chuyện."
          : "Không gửi được tin nhắn. Vui lòng thử lại.",
      );
    } finally {
      sendingRef.current = false;
      setPendingText("");
    }
  };

  const handleNewSession = async () => {
    if (busy || createSession.isPending) return;
    try {
      const newSession = await createSession.mutateAsync({
        characterId: character.id,
        contextId,
      });
      setActiveSessionId(newSession.id);
      setError("");
      setPendingText("");
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // toast shown by hook
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setError("");
    setPendingText("");
    setHistoryOpen(false);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--bg-surface)]">

      {/* ── Header ── */}
      <header className="flex shrink-0 items-center gap-2 border-b border-[var(--border-default)] px-3 py-2.5">
        <CharacterAvatar character={character} />
        <div className="min-w-0 flex-1">
          {characters.length > 1 ? (
            <select
              aria-label="Nhân vật trò chuyện"
              value={character.id}
              disabled={busy}
              onChange={(e) => onSelectCharacter(e.target.value)}
              className="w-full bg-[var(--bg-surface)] text-sm font-bold"
            >
              {characters.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : (
            <h2 className="text-sm font-bold">{character.name}</h2>
          )}
          <p className="truncate text-xs text-[var(--text-tertiary)]">{character.title}</p>
        </div>

        {/* Lịch sử trò chuyện */}
        {sessionList.length > 0 && (
          <button
            type="button"
            onClick={() => setHistoryOpen((o) => !o)}
            title="Lịch sử trò chuyện"
            aria-label="Lịch sử trò chuyện"
            aria-expanded={historyOpen}
            className={cn(
              "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition",
              historyOpen
                ? "border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]"
                : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)] hover:text-[var(--gold-on-light)]",
            )}
          >
            <Clock size={14} />
          </button>
        )}

        {/* Cuộc trò chuyện mới */}
        <button
          type="button"
          onClick={handleNewSession}
          disabled={busy}
          title="Cuộc trò chuyện mới"
          aria-label="Tạo cuộc trò chuyện mới"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] text-[var(--text-secondary)] transition hover:border-[var(--accent-gold)] hover:bg-[var(--accent-gold-active-bg)] hover:text-[var(--gold-on-light)] disabled:opacity-40"
        >
          {createSession.isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <SquarePen size={14} />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="Thu gọn trò chuyện"
          title="Thu gọn trò chuyện"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition hover:bg-[var(--sidebar-hover-bg)]"
        >
          <X size={18} />
        </button>
      </header>

      {/* ── Dropdown lịch sử (toggle) ── */}
      {historyOpen && sessionList.length > 0 && (
        <div className="shrink-0 border-b border-[var(--border-default)] bg-[var(--bg-main)] animate-[slideDown_180ms_ease-out]">
          <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
            Lịch sử trò chuyện
          </p>
          <div className="flex flex-col overflow-y-auto px-2 pb-2" style={{ maxHeight: 200 }}>
            {sessionList.map((s) => {
              const isActive = s.id === sessionId;
              return (
                <div key={s.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => handleSelectSession(s.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-3 py-2 pr-8 text-left transition-colors",
                      isActive
                        ? "bg-[var(--accent-gold-active-bg)] text-[var(--gold-on-light)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-hover-bg)]",
                    )}
                  >
                    <MessageCircle
                      size={13}
                      className={cn(
                        "mt-0.5 shrink-0",
                        isActive ? "text-[var(--gold-on-light)]" : "text-[var(--text-tertiary)]",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">
                        {s.title || "Cuộc trò chuyện"}
                      </p>
                      {s.lastMessage && (
                        <p className="mt-0.5 truncate text-[10px] opacity-60">{s.lastMessage}</p>
                      )}
                    </div>
                    {s.messageCount > 0 && (
                      <span className="shrink-0 text-[10px] opacity-50 group-hover:opacity-0">{s.messageCount} tin</span>
                    )}
                  </button>
                  {/* Trash — sibling, absolutely positioned, không lồng trong button */}
                  <button
                    type="button"
                    aria-label="Xóa cuộc trò chuyện"
                    title="Xóa cuộc trò chuyện"
                    onClick={() => {
                      if (activeSessionId === s.id) setActiveSessionId(null);
                    }}
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 hidden place-items-center rounded p-1 transition group-hover:grid",
                      isActive
                        ? "text-[var(--gold-on-light)] hover:bg-[rgba(0,0,0,0.12)]"
                        : "text-[var(--text-tertiary)] hover:bg-[rgba(239,68,68,0.1)] hover:text-[#ef4444]",
                    )}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}



      {/* ── Danh sách tin nhắn ── */}
      <div
        role="log"
        aria-label="Tin nhắn"
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4"
      >
        {loading && (
          <p role="status" className="flex items-center gap-2 text-sm">
            <Loader2 size={16} className="animate-spin" /> Đang tải cuộc trò chuyện...
          </p>
        )}
        {loadError && (
          <div role="alert" className="text-sm">
            <p>Không tải được cuộc trò chuyện.</p>
            <button
              type="button"
              onClick={() => void (sessions.isError ? sessions.refetch() : history.refetch())}
              className="mt-2 underline"
            >
              Thử lại
            </button>
          </div>
        )}
        {!loading && !loadError && !history.data?.messages.length && !pendingText && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--accent-gold-active-bg)]">
              <MessageCircle size={20} className="text-[var(--gold-on-light)]" />
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Bắt đầu trò chuyện với <strong>{character.name}</strong> về trận đánh này.
            </p>
          </div>
        )}
        {history.data?.messages.map((message) => {
          const isUser = message.role === "USER";
          const parts = isUser
            ? [message.content]
            : splitAssistantContent(message.content);
          return (
            <div key={message.id} className={cn("flex flex-col gap-1.5", isUser && "items-end")}>
              {parts.map((part, i) => (
                <div
                  key={i}
                  className={cn(
                    "max-w-[90%] min-w-0 overflow-x-auto break-words rounded-lg px-3 py-2 text-sm leading-6",
                    isUser
                      ? "bg-[#09090B] text-white"
                      : "bg-[var(--bg-main)] text-[var(--text-secondary)]",
                  )}
                >
                  <MarkdownMessage text={part} />
                </div>
              ))}
            </div>
          );
        })}
        {pendingText && (
          <>
            <div className="flex justify-end">
              <p className="max-w-[90%] break-words rounded-lg bg-[#09090B] px-3 py-2 text-sm text-white">
                {pendingText}
              </p>
            </div>
            <p role="status" className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
              <Loader2 size={14} className="animate-spin" /> Đang trả lời...
            </p>
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <form onSubmit={send} className="shrink-0 border-t border-[var(--border-default)] p-3">
        {error && (
          <p role="alert" className="mb-2 text-xs text-[var(--accent-danger)]">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2 rounded-lg border border-[var(--border-default)] p-2 focus-within:border-[var(--accent-gold)]">
          <textarea
            ref={inputRef}
            aria-label="Tin nhắn"
            placeholder="Nhập câu hỏi..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            rows={2}
            className="min-w-0 flex-1 resize-none bg-transparent p-1 text-sm outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            type="submit"
            disabled={!draft.trim() || busy || loading || loadError}
            aria-label="Gửi tin nhắn"
            title="Gửi tin nhắn"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#09090B] text-white disabled:opacity-40"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </form>
    </div>
  );
}
