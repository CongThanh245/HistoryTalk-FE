"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getWebSpeechTTS, WebSpeechTTS } from "@/lib/web-speech-tts";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoiceRestStatus =
  | "idle"              // chưa bắt đầu
  | "recording"         // đang ghi âm
  | "processing_stt"    // đang nhận dạng giọng nói (STT)
  | "processing_chat"   // đang chờ AI trả lời
  | "processing_tts"    // đang tổng hợp giọng nói
  | "speaking"          // đang phát TTS
  | "error";

export interface VoiceRestMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface UseVoiceChatRestOptions {
  sessionId: string;
  characterId: string;
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

  // ── Web Speech API fallback ─────────────────────────────────────────────────
  const webSpeechRef = useRef<WebSpeechTTS | null>(null);
  
  const playWithFallback = useCallback(
    async (buffer: ArrayBuffer | null, text: string): Promise<void> => {
      // Thử phát audio từ API trước
      if (buffer && buffer.byteLength > 0) {
        try {
          await playAudio(buffer);
          return;
        } catch (e) {
          console.warn('[VoiceChat] API audio failed, trying Web Speech:', e);
        }
      }

      // Fallback to Web Speech API
      try {
        if (!webSpeechRef.current) {
          webSpeechRef.current = getWebSpeechTTS();
        }
        
        if (webSpeechRef.current?.isSupported()) {
          console.log('[VoiceChat] Using Web Speech API fallback');
          await webSpeechRef.current.speak(text);
        } else {
          throw new Error('Web Speech API không khả dụng');
        }
      } catch (e) {
        console.error('[VoiceChat] Web Speech fallback failed:', e);
        throw e;
      }
    },
    [playAudio],
  );

  // ── Gửi audio lên server, nhận về audio TTS ─────────────────────────────────
  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      setStatus("processing_stt");
      
      let assistantTranscript = ""; // Khai báo ở ngoài để catch block dùng được

      try {
        const useInternal =
          process.env.NEXT_PUBLIC_VOICE_USE_INTERNAL === "true";

        const token = useAuthStore.getState().tokens?.accessToken;
        const headers: HeadersInit = {};
        if (token) {
          (headers as Record<string, string>).Authorization = `Bearer ${token}`;
        }

        let userTranscript = "";

        // ── Step 1: STT ─ Hiển thị user text NGAY sau khi nhận dạng ─────────────
        if (useInternal) {
          const sttFormData = new FormData();
          sttFormData.append("audio", audioBlob, "recording.webm");

          const sttRes = await fetch("/api/voice/stt", {
            method: "POST",
            headers,
            body: sttFormData,
          });

          if (!sttRes.ok) {
            const errJson = await sttRes.json().catch(() => ({}));
            throw new Error(
              (errJson as { message?: string }).message ?? `STT Error ${sttRes.status}`,
            );
          }

          const sttData = await sttRes.json();
          userTranscript = sttData.transcript?.trim() ?? "";
        }

        // Hiển thị user text NGAY LẬP TỨC sau STT
        if (userTranscript) {
          setMessages((prev) => [
            ...prev,
            { role: "user", text: userTranscript, timestamp: new Date() },
          ]);
        }

        // ── Step 2: Chat + TTS ─ Hiển thị AI thinking ───────────────────────────
        setStatus("processing_chat");

        const chatFormData = new FormData();
        chatFormData.append("audio", audioBlob, "recording.webm");
        chatFormData.append("sessionId", sessionId);
        chatFormData.append("characterId", characterId);

        const endpoint = useInternal
          ? "/api/voice/chat"
          : `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"}/voice/chat`;

        const res = await fetch(endpoint, {
          method: "POST",
          headers,
          body: chatFormData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(
            (errJson as { message?: string }).message ?? `HTTP ${res.status}`,
          );
        }

        // Đọc assistant transcript từ header
        assistantTranscript = decodeURIComponent(
          res.headers.get("X-Assistant-Transcript") ?? "",
        );

        // Giả lập delay tự nhiên để UX mượt
        await new Promise(r => setTimeout(r, 300 + Math.random() * 300));

        // Hiển thị AI response
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

        // Giả lập đang chuẩn bị phát âm thanh
        setStatus("processing_tts");
        await new Promise(r => setTimeout(r, 200));

        setStatus("speaking");
        await playWithFallback(audioBuffer.byteLength > 0 ? audioBuffer : null, assistantTranscript);
        setStatus("idle");
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "Lỗi không xác định";
        console.error("[VoiceChatRest] sendAudio error:", err);
        
        // Thử Web Speech API khi API lỗi hoàn toàn (nhưng vẫn có transcript)
        if (assistantTranscript) {
          try {
            if (!webSpeechRef.current) {
              webSpeechRef.current = getWebSpeechTTS();
            }
            if (webSpeechRef.current?.isSupported()) {
              console.log('[VoiceChat] Fallback to Web Speech API');
              setStatus("speaking");
              await webSpeechRef.current.speak(assistantTranscript);
              setStatus("idle");
              return;
            }
          } catch (e) {
            console.error('[VoiceChat] Final fallback failed:', e);
          }
        }
        
        onError?.(msg);
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }
    },
    [sessionId, characterId, playAudio, onError],
  );

  // ── Bắt đầu ghi âm ─────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    if (isRecording || status === "speaking" || status.startsWith("processing")) return;

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
      // Only close if not already closed to avoid InvalidStateError
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
      webSpeechRef.current?.cancel();
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
