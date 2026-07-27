/**
 * useVoiceChatWebSpeech - Web Speech STT + Azure TTS mode
 * 
 * 100% client-side, không gọi cloud API:
 * - STT: Web Speech Recognition (miễn phí, không giới hạn)
 * - Chat: Gửi text xuống BE (nhận text response)
 * - TTS: Web Speech Synthesis (miễn phí, không giới hạn)
 * 
 * Trade-offs:
 * ✅ Không lo quota/API key hết hạn
 * ✅ Không cần audio blob upload → nhanh hơn
 * ⚠️ Chất lượng giọng kém hơn Azure
 * ⚠️ STT tiếng Việt không chính xác bằng
 * ⚠️ Không streaming TTS (phải đợi full response)
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getWebSpeechTTS, WebSpeechTTS } from "@/lib/web-speech-tts";
import { getWebSpeechSTT, WebSpeechSTT } from "@/lib/web-speech-stt";
import { SimulatedAnalyserNode, createSimulatedAnalyser } from "@/lib/text-lipsync";
import type { AnalyserLike } from "@/components/chat/FBXCharacterViewer";

export type WebSpeechVoiceStatus =
  | "idle"
  | "listening"     // Đang nghe (STT active)
  | "processing"    // Đã có text, gửi đi xử lý
  | "thinking"      // BE Hãy đợi tôi 1 chút, tôi đang đào lại quá khứ
  | "speaking"      // Đang phát âm (TTS)
  | "error";

export type WebSpeechMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  quotes?: string[];
};

export type UseVoiceChatWebSpeechOptions = {
  sessionId: string;
  characterId: string;
  onError?: (msg: string) => void;
  onProfileRefresh?: () => void;
  onTokenUpdate?: (remainingTokens: number, promptTokens?: number, completionTokens?: number, messageType?: "TEXT" | "VOICE") => void;
};

export function useVoiceChatWebSpeech({
  sessionId,
  characterId,
  onError,
  onProfileRefresh,
  onTokenUpdate,
}: UseVoiceChatWebSpeechOptions) {
  const [status, setStatus] = useState<WebSpeechVoiceStatus>("idle");
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);
  
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<WebSpeechMessage[]>([]);
  const [interimText, setInterimText] = useState(""); // Text tạm thời khi đang nói

  const sttRef = useRef<WebSpeechSTT | null>(null);
  const ttsRef = useRef<WebSpeechTTS | null>(null);
  const abortRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isHoldingRef = useRef(false);
  const shouldSendOnStopRef = useRef(false);
  const restartListeningRef = useRef<() => void>(() => {});
  const sendTextToChatRef = useRef<(text: string) => Promise<void>>(async () => {});
  const finalTranscriptRef = useRef(""); // Lưu transcript khi stop
  const transcriptBaseRef = useRef("");
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null);
  const activeTtsAnalyserRef = useRef<AnalyserLike | null>(null);
  const azureSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Simulated analyser cho lip-sync (vì Web Speech API không cung cấp audio data)
  const simulatedAnalyserRef = useRef<SimulatedAnalyserNode | null>(null);
  
  // Khởi tạo simulated analyser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      simulatedAnalyserRef.current = createSimulatedAnalyser();
      activeTtsAnalyserRef.current = simulatedAnalyserRef.current;
    }
    return () => {
      simulatedAnalyserRef.current?.stop();
      activeTtsAnalyserRef.current = null;
    };
  }, []);

  // Init Web Speech instances
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sttRef.current = getWebSpeechSTT();
      ttsRef.current = getWebSpeechTTS();
    }
    
    return () => {
      sttRef.current?.abort();
      ttsRef.current?.cancel();
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const ensureAudioContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      const AudioContextCtor = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error("AudioContext khong kha dung");
      }

      const audioContext = new AudioContextCtor();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.connect(audioContext.destination);
      audioCtxRef.current = audioContext;
      ttsAnalyserRef.current = analyser;
      activeTtsAnalyserRef.current = analyser;
    }

    return audioCtxRef.current;
  }, []);

  const playAzureTts = useCallback(
    async (text: string, signal?: AbortSignal): Promise<void> => {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, characterId }),
        signal,
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Azure TTS failed: ${res.status}`);
      }

      const audioBuffer = await res.arrayBuffer();
      if (!audioBuffer.byteLength) {
        throw new Error("Azure TTS khong tra ve audio");
      }

      // Cuộc gọi đã bị hủy trong lúc tải/giải mã audio — đừng phát nữa.
      if (abortRef.current) return;

      const audioContext = ensureAudioContext();
      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }

      const decodedAudio = await audioContext.decodeAudioData(audioBuffer.slice(0));

      if (abortRef.current) return;

      await new Promise<void>((resolve, reject) => {
        const source = audioContext.createBufferSource();
        source.buffer = decodedAudio;
        source.playbackRate.value = 1.25;
        source.connect(ttsAnalyserRef.current ?? audioContext.destination);
        azureSourceRef.current = source;
        activeTtsAnalyserRef.current = ttsAnalyserRef.current;
        source.onended = () => {
          if (azureSourceRef.current === source) {
            azureSourceRef.current = null;
          }
          resolve();
        };
        source.start();
      });
    },
    [characterId, ensureAudioContext],
  );

  const speakWithAzureFallback = useCallback(
    async (text: string, signal?: AbortSignal): Promise<void> => {
      try {
        await playAzureTts(text, signal);
        return;
      } catch (err) {
        if (abortRef.current) return;
        console.warn("[VoiceChatWebSpeech] Azure TTS failed, using Web Speech:", err);
      }

      if (abortRef.current) return;

      if (!ttsRef.current) {
        ttsRef.current = getWebSpeechTTS();
      }

      if (!ttsRef.current?.isSupported()) {
        throw new Error("Web Speech API khong kha dung");
      }

      activeTtsAnalyserRef.current = simulatedAnalyserRef.current;
      simulatedAnalyserRef.current?.start(text, 4.5);
      try {
        await ttsRef.current.speak(text, {
          rate: 1.25,
          pitch: 1,
          volume: 1,
        });
      } finally {
        simulatedAnalyserRef.current?.stop();
      }
    },
    [playAzureTts],
  );

  /**
   * Bắt đầu nghe (STT)
   * Flow: Listening → [Stop] → Send to BE → Receive response → TTS
   */
  const startListening = useCallback(async () => {
    if (!sttRef.current?.isSupported()) {
      onError?.("Trình duyệt không hỗ trợ Web Speech");
      return;
    }

    if (
      isListening ||
      (statusRef.current !== "idle" && statusRef.current !== "listening")
    ) {
      return;
    }

    // Helper: Process text and send to chat
    async function processAndSend(text: string) {
      // Hiển thị user message
      setMessages((prev) => [
        ...prev,
        { role: "user", text: text, timestamp: new Date() },
      ]);
      setInterimText("");
      finalTranscriptRef.current = "";

      // Gửi xuống BE
      await sendTextToChatRef.current(text);
    }

    try {
      const isFreshStart = statusRef.current === "idle";
      isHoldingRef.current = true;
      shouldSendOnStopRef.current = false;
      setIsListening(true);
      setStatus("listening");
      setInterimText("");
      if (isFreshStart) {
        finalTranscriptRef.current = "";
        transcriptBaseRef.current = "";
      } else {
        transcriptBaseRef.current = finalTranscriptRef.current.trim();
      }
      abortRef.current = false;

      // Callback cho interim results (hiển thị real-time)
      sttRef.current.onInterimResult = (text) => {
        const transcript = `${transcriptBaseRef.current} ${text}`.trim();
        setInterimText(transcript);
        finalTranscriptRef.current = transcript; // Lưu vào ref để dùng khi stop
      };

      // Bắt đầu nhận dạng. Browser có thể tự onend khi ngắt hơi, nên chỉ gửi khi user thả nút.
      const transcript = await sttRef.current.start({
        continuous: true,
        interimResults: true,
        lang: "vi-VN",
        maxDuration: 60000, // Max 60s
      });

      if (abortRef.current) {
        // Nếu bị abort nhưng có transcript trong ref → vẫn gửi
        const savedText = finalTranscriptRef.current;
        if (savedText.trim()) {
          setIsListening(false); // ← Dừng trạng thái "recording" trước khi gọi API
          await processAndSend(savedText);
        }
        return;
      }

      const finalText = transcript.trim() || finalTranscriptRef.current.trim();

      if (isHoldingRef.current && !shouldSendOnStopRef.current) {
        if (finalText) {
          finalTranscriptRef.current = finalText;
        }
        setIsListening(false);
        if (statusRef.current === "listening") {
          window.setTimeout(() => {
            if (isHoldingRef.current && statusRef.current === "listening") {
              restartListeningRef.current();
            }
          }, 120);
        }
        return;
      }

      // Có transcript từ STT → xử lý
      if (finalText) {
        setIsListening(false); // ← Dừng trạng thái "recording" trước khi gọi API
        await processAndSend(finalText);
      }
    } catch (err: unknown) {
      if (abortRef.current) return;
      const message = err instanceof Error ? err.message : "";
      
      // Bỏ qua lỗi "no-speech" (user không nói gì)
      if (message.includes("No speech")) {
        if (isHoldingRef.current && !shouldSendOnStopRef.current) {
          setIsListening(false);
          setStatus("listening");
          window.setTimeout(() => {
            if (isHoldingRef.current && statusRef.current === "listening") {
              restartListeningRef.current();
            }
          }, 120);
          return;
        }
        setStatus("idle");
        return;
      }
      
      onError?.(message || "Lỗi nhận dạng giọng nói");
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      if (!isHoldingRef.current) {
        setIsListening(false);
      }
    }
  }, [isListening, onError]);

  useEffect(() => {
    restartListeningRef.current = () => {
      void startListening();
    };
  }, [startListening]);

  /**
   * Gửi text xuống BE, nhận response, rồi TTS
   */
  const sendTextToChat = useCallback(async (text: string) => {
    setStatus("processing");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = useAuthStore.getState().tokens?.accessToken;

      // BE chỉ cần sessionId và content
      const endpoint = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? ""}${process.env.NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"}/chat/messages`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          content: text,
          messageType: "VOICE",
        }),
        signal: controller.signal,
      });

      // Cuộc gọi đã bị hủy (hangup) trong lúc chờ mạng — bỏ luôn phản hồi trễ này,
      // không hiện tin nhắn/không phát TTS cho một cuộc gọi đã đóng.
      if (abortRef.current) return;

      if (!res.ok) {
        const errorText = await res.text();
        let userFriendlyError = "Lỗi kết nối máy chủ";
        
        try {
          const errorJson = JSON.parse(errorText);
          const beMessage = errorJson.message || "";
          
          // Phân loại lỗi để hiển thị message phù hợp
          if (beMessage.includes("Connection refused") || beMessage.includes("I/O error")) {
            userFriendlyError = "Dịch vụ AI đang bảo trì. Vui lòng thử lại sau.";
          } else if (res.status === 503) {
            userFriendlyError = "Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.";
          } else if (res.status === 429) {
            userFriendlyError = "Quá nhiều yêu cầu. Vui lòng đợi một chút.";
          } else if (res.status === 401) {
            userFriendlyError = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
          } else if (beMessage) {
            userFriendlyError = beMessage;
          }
        } catch {
          // Không parse được JSON, dùng status code
          if (res.status === 500) {
            userFriendlyError = "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.";
          }
        }
        
        throw new Error(userFriendlyError);
      }

      if (abortRef.current) return;

      const resData = await res.json();
      // Response: { success, data: { assistantMessage: { content } } }
      const apiData = resData.data || resData;
      const aiResponse = apiData.assistantMessage?.content || apiData.message || apiData.content || apiData.text || "";
      const quotes: string[] = apiData.assistantMessage?.quotes || [];
      const remainingTokens = apiData.remainingTokens ?? resData.remainingTokens;
      const promptTokens = apiData.promptTokens ?? resData.promptTokens;
      const completionTokens = apiData.completionTokens ?? resData.completionTokens;

      if (typeof remainingTokens === "number") {
        onTokenUpdate?.(remainingTokens, promptTokens, completionTokens, "VOICE");
      }
      onProfileRefresh?.();

      if (!aiResponse) {
        throw new Error("Không nhận được phản hồi từ AI");
      }

      if (abortRef.current) return;

      // Hiển thị AI message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: aiResponse, timestamp: new Date(), quotes },
      ]);

      if (abortRef.current) return;

      // TTS with Azure first, then Web Speech fallback.
      setStatus("speaking");
      await speakWithAzureFallback(aiResponse, controller.signal);
      if (abortRef.current) return;
      setStatus("idle");
    } catch (err: unknown) {
      // Hủy có chủ đích (hangup) — không phải lỗi thật, đừng hiện toast lỗi.
      if (abortRef.current || (err instanceof DOMException && err.name === "AbortError")) {
        return;
      }
      const errorMsg = err instanceof Error ? err.message : "Lỗi kết nối";
      onError?.(errorMsg);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  }, [sessionId, onError, onProfileRefresh, onTokenUpdate, speakWithAzureFallback]);

  useEffect(() => {
    sendTextToChatRef.current = sendTextToChat;
  }, [sendTextToChat]);

  /**
   * Dừng nghe và gửi transcript đã thu được
   */
  const stopListening = useCallback(async () => {
    isHoldingRef.current = false;
    shouldSendOnStopRef.current = true;
    // Không abort ngay, để STT trả về transcript và startListening gửi đúng một lần.
    sttRef.current?.stop();
  }, []);

  /**
   * Hủy toàn bộ (nghe + đang phát)
   */
  const cancel = useCallback(() => {
    abortRef.current = true;
    abortControllerRef.current?.abort();
    sttRef.current?.abort();
    ttsRef.current?.cancel();
    azureSourceRef.current?.stop();
    azureSourceRef.current = null;
    simulatedAnalyserRef.current?.stop();
    setIsListening(false);
    setInterimText("");
    setStatus("idle");
  }, []);

  return {
    status,
    isListening,
    isRecording: isListening, // Alias cho compatibility
    messages,
    interimText,      // Text đang nói (real-time)
    currentSentence: interimText, // Alias cho streaming mode
    // Alias để match interface của các hook khác
    startRecording: startListening,
    stopRecording: stopListening,
    cancel,
    ttsAnalyserRef: activeTtsAnalyserRef,
    // Check support
    isSupported: typeof window !== 'undefined' && 
      ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) &&
      'speechSynthesis' in window,
  };
}
