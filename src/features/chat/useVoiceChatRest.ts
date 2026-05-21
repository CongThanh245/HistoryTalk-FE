"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceRestStatus =
  | "idle"       // chưa bắt đầu
  | "recording"  // đang ghi âm
  | "loading"    // đang gửi + chờ server
  | "speaking"   // đang phát TTS
  | "error";

export interface VoiceRestMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface UseVoiceChatRestOptions {
  sessionId: string;
  characterId: string;
  contextId: string;
  onError?: (msg: string) => void;
}

interface UseVoiceChatRestReturn {
  status: VoiceRestStatus;
  messages: VoiceRestMessage[];
  /** Bắt đầu ghi âm (giữ nút) */
  startRecording: () => Promise<void>;
  /** Dừng ghi âm → gửi lên server */
  stopRecording: () => void;
  /** AnalyserNode đang phân tích audio TTS → dùng cho lip-sync */
  ttsAnalyserRef: React.RefObject<AnalyserNode | null>;
  /** AudioContext hiện tại */
  audioCtxRef: React.RefObject<AudioContext | null>;
  /** Có đang recording không */
  isRecording: boolean;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useVoiceChatRest({
  sessionId,
  characterId,
  contextId,
  onError,
}: UseVoiceChatRestOptions): UseVoiceChatRestReturn {
  const [status, setStatus] = useState<VoiceRestStatus>("idle");
  const [messages, setMessages] = useState<VoiceRestMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Audio playback + analyser (cho lip-sync)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);

  // ── Lấy / tạo AudioContext & TTS AnalyserNode ──────────────────────────────
  const ensureAudioCtx = useCallback((): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate: 24000 });
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      // analyser → destination: vừa phân tích vừa phát ra loa
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      ttsAnalyserRef.current = analyser;
    }
    return audioCtxRef.current!;
  }, []);

  // ── Phát audio ArrayBuffer qua Web Audio API ────────────────────────────────
  const playAudio = useCallback(
    async (buffer: ArrayBuffer): Promise<void> => {
      const ctx = ensureAudioCtx();
      if (ctx.state === "suspended") await ctx.resume();

      const decoded = await ctx.decodeAudioData(buffer);
      const source = ctx.createBufferSource();
      source.buffer = decoded;

      // source → analyser (đã nối tới destination)
      if (ttsAnalyserRef.current) {
        source.connect(ttsAnalyserRef.current);
      } else {
        source.connect(ctx.destination);
      }

      return new Promise((resolve) => {
        source.onended = () => resolve();
        source.start();
      });
    },
    [ensureAudioCtx],
  );

  // ── Gửi audio lên server, nhận về audio TTS ─────────────────────────────────
  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      setStatus("loading");

      try {
        const useInternal =
          process.env.NEXT_PUBLIC_VOICE_USE_INTERNAL === "true";

        // Internal: Next.js Route Handler (không cần BE, không lộ API key)
        // External: Spring Boot backend
        const endpoint = useInternal
          ? "/api/voice/chat"
          : `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"}/voice/chat`;

        const token = useAuthStore.getState().tokens?.accessToken;

        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("sessionId", sessionId);
        formData.append("characterId", characterId);
        formData.append("contextId", contextId);

        const headers: HeadersInit = {};
        // Internal route giờ cũng cần token để forward sang Spring Boot
        if (token) {
          (headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            (errJson as { message?: string }).message ?? `HTTP ${res.status}`,
          );
        }

        // Đọc transcript từ header (URL-encoded để tránh lỗi ký tự Unicode)
        const userTranscript = decodeURIComponent(
          res.headers.get("X-User-Transcript") ?? "",
        );
        const assistantTranscript = decodeURIComponent(
          res.headers.get("X-Assistant-Transcript") ?? "",
        );

        if (userTranscript) {
          setMessages((prev) => [
            ...prev,
            { role: "user", text: userTranscript, timestamp: new Date() },
          ]);
        }
        if (assistantTranscript) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              text: assistantTranscript,
              timestamp: new Date(),
            },
          ]);
        }

        // Nhận audio binary
        const audioBuffer = await res.arrayBuffer();

        setStatus("speaking");
        await playAudio(audioBuffer);
        setStatus("idle");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Lỗi không xác định";
        console.error("[VoiceChatRest] sendAudio error:", err);
        onError?.(msg);
        setStatus("error");
        // Reset về idle sau 2s
        setTimeout(() => setStatus("idle"), 2000);
      }
    },
    [sessionId, characterId, contextId, playAudio, onError],
  );

  // ── Bắt đầu ghi âm ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording || status === "loading" || status === "speaking") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        sendAudio(blob);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setStatus("recording");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi mic";
      if (msg.toLowerCase().includes("permission")) {
        onError?.("Vui lòng cấp quyền microphone.");
      } else {
        onError?.(msg);
      }
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  }, [isRecording, status, sendAudio, onError]);

  // ── Dừng ghi âm → trigger onstop → sendAudio ───────────────────────────────
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // ── Cleanup ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, []);

  return {
    status,
    messages,
    startRecording,
    stopRecording,
    ttsAnalyserRef,
    audioCtxRef,
    isRecording,
  };
}
