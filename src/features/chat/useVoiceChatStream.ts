/**
 * useVoiceChatStream - Streaming voice chat with sentence-based TTS
 * Phát audio ngay khi nhận được chunk, không chờ full response
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAuthStore } from "@/store/auth.store";
import { getWebSpeechTTS, WebSpeechTTS } from "@/lib/web-speech-tts";

export type VoiceStreamStatus =
  | "idle"
  | "recording"
  | "processing_stt"
  | "thinking"      // AI đang suy nghĩ, đã hiện user text
  | "speaking"      // Đang phát audio streaming
  | "error";

export type VoiceMessage = {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
};

export type UseVoiceChatStreamOptions = {
  sessionId: string;
  characterId: string;
  contextId: string;
  onError?: (msg: string) => void;
};

// Audio chunk queue for seamless playback
class AudioQueue {
  private queue: ArrayBuffer[] = [];
  private isPlaying = false;
  private audioCtx: AudioContext;
  private analyser: AnalyserNode;
  private gainNode: GainNode;
  private onAnalyserUpdate: (analyser: AnalyserNode | null) => void;

  constructor(
    audioCtx: AudioContext,
    onAnalyserUpdate: (analyser: AnalyserNode | null) => void
  ) {
    this.audioCtx = audioCtx;
    this.onAnalyserUpdate = onAnalyserUpdate;
    this.analyser = audioCtx.createAnalyser();
    this.analyser.fftSize = 64;
    this.analyser.smoothingTimeConstant = 0.7;
    this.gainNode = audioCtx.createGain();
    this.gainNode.connect(audioCtx.destination);
  }

  addChunk(audioData: ArrayBuffer) {
    this.queue.push(audioData);
    if (!this.isPlaying) {
      this.playNext();
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.onAnalyserUpdate(null);
      return;
    }

    this.isPlaying = true;
    const chunk = this.queue.shift()!;

    try {
      const buffer = await this.audioCtx.decodeAudioData(chunk.slice(0));
      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;

      // Connect to analyser for lip-sync
      source.connect(this.analyser);
      this.analyser.connect(this.gainNode);
      this.onAnalyserUpdate(this.analyser);

      source.onended = () => {
        this.playNext();
      };

      source.start();
    } catch (err) {
      console.error("[AudioQueue] Error playing chunk:", err);
      this.playNext(); // Skip and continue
    }
  }

  clear() {
    this.queue = [];
    this.isPlaying = false;
  }
}

export function useVoiceChatStream({
  sessionId,
  characterId,
  contextId,
  onError,
}: UseVoiceChatStreamOptions) {
  const [status, setStatus] = useState<VoiceStreamStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [ttsAnalyser, setTtsAnalyser] = useState<AnalyserNode | null>(null);
  const [currentSentence, setCurrentSentence] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const abortRef = useRef<boolean>(false);
  const assistantTextRef = useRef<string[]>([]);
  const webSpeechRef = useRef<WebSpeechTTS | null>(null);
  const hasReceivedAudioRef = useRef(false);

  // Init audio context
  const ensureAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  // Cancel streaming
  const cancel = useCallback(() => {
    abortRef.current = true;
    audioQueueRef.current?.clear();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setIsRecording(false);
    setStatus("idle");
    setCurrentSentence("");
  }, []);

  // Stop recording and start streaming
  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      setIsRecording(false);
      setStatus("processing_stt");
      abortRef.current = false;
      assistantTextRef.current = [];

      const token = useAuthStore.getState().tokens?.accessToken;
      const audioCtx = ensureAudioCtx();

      // Create audio queue for streaming playback
      audioQueueRef.current = new AudioQueue(audioCtx, (analyser) => {
        setTtsAnalyser(analyser);
      });

      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      formData.append("sessionId", sessionId);
      formData.append("characterId", characterId);
      formData.append("contextId", contextId);

      hasReceivedAudioRef.current = false;
      
      // Safety timeout: đảm bảo không bị stuck quá 45s
      const safetyTimeout = setTimeout(() => {
        console.warn('[VoiceChatStream] Safety timeout triggered');
        abortRef.current = true;
        onError?.("Quá thời gian chờ phản hồi từ server");
        setStatus("error");
        setTimeout(() => setStatus("idle"), 2000);
      }, 45000);
      
      try {
        const res = await fetch("/api/voice/stream", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        // Read streaming response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          if (abortRef.current) break;

          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case "userTranscript":
                  // Hiển thị user text NGAY sau STT
                  setMessages((prev) => [
                    ...prev,
                    { role: "user", text: data.text, timestamp: new Date() },
                  ]);
                  setStatus("thinking");
                  break;

                case "assistantSentence":
                  // Lưu câu trả lời để hiển thị
                  assistantTextRef.current[data.index] = data.text;
                  setCurrentSentence(data.text);
                  break;

                case "audioChunk":
                  // Chuyển sang speaking khi có audio đầu tiên
                  setStatus("speaking");
                  hasReceivedAudioRef.current = true;

                  // Decode and queue audio
                  const audioData = Uint8Array.from(atob(data.data), (c) =>
                    c.charCodeAt(0)
                  );
                  audioQueueRef.current?.addChunk(audioData.buffer);

                  // Hiển thị assistant text khi bắt đầu phát
                  if (data.index === 0) {
                    const fullText = assistantTextRef.current.join(" ");
                    setMessages((prev) => [
                      ...prev,
                      {
                        role: "assistant",
                        text: fullText,
                        timestamp: new Date(),
                      },
                    ]);
                  }

                  if (data.isLast) {
                    // Wait for queue to finish
                    setTimeout(() => {
                      setStatus("idle");
                      setCurrentSentence("");
                    }, 500);
                  }
                  break;

                case "error":
                  // Check for API key errors - need to exit and fallback
                  const isApiKeyError = data.message?.includes("API key") || 
                                        data.message?.includes("API_KEY") ||
                                        data.message?.includes("quota") ||
                                        data.message?.includes("exhausted");
                  if (isApiKeyError) {
                    console.warn('[VoiceChatStream] API key error, triggering fallback');
                    throw new Error(data.message); // Exit loop to trigger fallback
                  }
                  throw new Error(data.message);

                case "done":
                  break;
              }
            } catch (e) {
              console.error("[Stream] Parse error:", e);
            }
          }
        }
        
        // Check nếu không nhận được audio nào nhưng có text → trigger fallback
        if (!hasReceivedAudioRef.current) {
          if (assistantTextRef.current.length > 0) {
            throw new Error("No audio received");
          }
          // Không có cả audio lẫn text → server error
          throw new Error("Không nhận được phản hồi từ server");
        }
      } catch (err: any) {
        if (abortRef.current) return;
        console.error("[VoiceChatStream] Error:", err);
        
        // Check for API key errors
        const isApiKeyError = err.message?.includes("API key") || 
                              err.message?.includes("API_KEY") ||
                              err.message?.includes("quota") ||
                              err.message?.includes("exhausted");
        
        // Fallback to Web Speech API nếu: 
        // 1. Có text nhưng không có audio, HOẶC
        // 2. Lỗi API key (cần fallback hoàn toàn)
        const shouldFallback = (!hasReceivedAudioRef.current && assistantTextRef.current.length > 0) || isApiKeyError;
        
        if (shouldFallback && assistantTextRef.current.length > 0) {
          const fullText = assistantTextRef.current.join(" ");
          try {
            if (!webSpeechRef.current) {
              webSpeechRef.current = getWebSpeechTTS();
            }
            if (webSpeechRef.current?.isSupported()) {
              console.log('[VoiceChatStream] Falling back to Web Speech API');
              setStatus("speaking");
              await webSpeechRef.current.speak(fullText);
              setStatus("idle");
              
              // Thông báo user đang dùng chế độ fallback
              if (isApiKeyError) {
                console.warn('[VoiceChatStream] API key expired/quota exceeded - using free Web Speech');
              }
              return;
            }
          } catch (e) {
            console.error('[VoiceChatStream] Web Speech fallback failed:', e);
          }
        }
        
        // Nếu là lỗi API key và không có text -> không thể fallback
        if (isApiKeyError && assistantTextRef.current.length === 0) {
          onError?.("API key hết hạn hoặc quota đã hết. Vui lòng liên hệ admin hoặc thử lại sau.");
        } else {
          onError?.(err.message);
        }
        
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      } finally {
        clearTimeout(safetyTimeout);
      }
    },
    [sessionId, characterId, contextId, ensureAudioCtx, onError]
  );

  // Start recording
  const startRecording = useCallback(async () => {
    if (isRecording || status !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
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
    } catch (err: any) {
      onError?.("Không thể truy cập microphone");
    }
  }, [isRecording, status, sendAudio, onError]);

  // Stop recording
  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancel();
      // Only close if not already closed to avoid InvalidStateError
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => {});
      }
      webSpeechRef.current?.cancel();
    };
  }, [cancel]);

  return {
    status,
    isRecording,
    messages,
    currentSentence,
    ttsAnalyserRef: { current: ttsAnalyser },
    startRecording,
    stopRecording,
    cancel,
  };
}
