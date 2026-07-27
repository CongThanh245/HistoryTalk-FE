"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Send, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// ── Web Speech API types (chưa có trong lib dom mặc định) ──
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare const SpeechRecognition: {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
};

interface ChatInputProps {
  onSend: (content: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  characterName?: string;
  isTokenExhausted?: boolean;
}

export function ChatInput({
  onSend,
  isLoading,
  disabled,
  characterName,
  isTokenExhausted,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      !!(window.SpeechRecognition ?? window.webkitSpeechRecognition),
  );
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Kiểm tra browser support
  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, isLoading, disabled, onSend]);

  const MAX_LENGTH = 200;
  const isOverLimit = text.length > MAX_LENGTH;
  const remainingChars = MAX_LENGTH - text.length;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isOverLimit) handleSend();
    }
  };

  // ── Voice Input (Toggled via Click) ───────────────────
  const transcriptRef = useRef("");

  const startRecording = useCallback(() => {
    if (disabled || isLoading) return;

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.interimResults = true; // hiện text tạm thời khi đang nói
    recognition.continuous = false;

    transcriptRef.current = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("");
      setText(transcript);
      transcriptRef.current = transcript;
    };

    recognition.onend = () => {
      setIsRecording(false);
      recognitionRef.current = null;

      const finalVal = transcriptRef.current.trim();
      if (finalVal && !disabled && !isLoading) {
        onSend(finalVal);
        setText("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
      }
      transcriptRef.current = "";
    };

    recognition.onerror = () => {
      setIsRecording(false);
      recognitionRef.current = null;
      transcriptRef.current = "";
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  }, [disabled, isLoading, onSend]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleMicClick = useCallback(() => {
    if (disabled || isLoading) return;

    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [disabled, isLoading, isRecording, startRecording, stopRecording]);

  return (
    <div
      className="sticky bottom-0 z-10 px-4 py-3 border-t border-border-default shrink-0 pb-[calc(env(safe-area-inset-bottom)+12px)] bg-bg-main"
    >
      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span
            className="w-2 h-2 rounded-full animate-pulse bg-red-500"
          />
          <span className="text-xs text-content-text">
            Đang nghe... bấm mic lần nữa để dừng và gửi
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isTokenExhausted
              ? "Bạn đã hết token. Vui lòng nâng cấp gói để tiếp tục chat."
              : isRecording
                ? "Đang nhận giọng nói..."
                : `Nhắn tin với ${characterName ?? "nhân vật"}...`
          }
          disabled={disabled || isRecording}
          maxLength={MAX_LENGTH + 20}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-xl px-4 py-2.5 text-sm outline-none leading-normal min-h-12 max-h-40",
            "transition-all placeholder:text-content-text",
            "disabled:opacity-60 overflow-hidden bg-bg-elevated text-content-heading",
            isRecording ? "border border-red-500/40" : "border border-border-default",
          )}
        />

        {/* Mic button (click-to-toggle) — chỉ hiện khi browser support */}
        {isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled || isLoading}
            aria-label={isRecording ? "Dừng ghi âm và gửi" : "Bắt đầu ghi âm"}
            title={isRecording ? "Bấm lần nữa để dừng và gửi" : "Bấm để nói"}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-xl",
              "transition-all active:scale-95 select-none",
              "disabled:opacity-30 disabled:cursor-not-allowed shrink-0",
              isRecording
                ? "bg-red-500/15 border border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                : "bg-bg-elevated border border-border-default",
            )}
          >
            <Mic
              className={cn(
                "w-4 h-4 transition-colors",
                isRecording ? "text-red-500" : "text-content-text",
              )}
            />
          </button>
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || isLoading || disabled || isOverLimit}
          aria-label="Gửi tin nhắn"
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-xl",
            "transition-all hover:brightness-110 active:scale-95",
            "disabled:opacity-30 disabled:cursor-not-allowed shrink-0",
            "border border-border-default",
            text.trim()
              ? "bg-gradient-to-br from-accent-gold to-(--truffle)"
              : "bg-bg-elevated",
          )}
        >
          {isLoading ? (
            <div
              className="w-4 h-4 rounded-full border-2 border-accent-gold border-t-transparent animate-spin"
            />
          ) : (
            <Send
              className={cn(
                "w-4 h-4",
                text.trim() ? "text-bg-deep" : "text-content-text",
              )}
            />
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-1.5 px-1">
        <p
          className="text-[10px] text-content-text/92"
        >
          Enter để gửi · Shift+Enter xuống dòng
          {isSupported ? " · Bấm mic để nói, bấm lần nữa để dừng" : ""}
        </p>
        <div
          className={cn(
            "flex items-center gap-1 text-[10px]",
            isOverLimit
              ? "text-accent-danger"
              : remainingChars <= 20
                ? "text-accent-gold"
                : "text-content-text/92",
          )}
        >
          {isOverLimit && <AlertTriangle className="w-3 h-3" />}
          <span>
            {isOverLimit
              ? `Vượt quá ${text.length - MAX_LENGTH} ký tự`
              : `${remainingChars} ký tự còn lại`}
          </span>
        </div>
      </div>
    </div>
  );
}
