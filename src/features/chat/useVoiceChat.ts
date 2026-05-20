"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "ended";

export interface VoiceMessage {
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

interface UseVoiceChatOptions {
  sessionId: string;
  characterId: string;
  contextId: string;
  onTranscript?: (text: string, role: "user" | "assistant") => void;
  onError?: (error: string) => void;
}

interface UseVoiceChatReturn {
  status: VoiceStatus;
  messages: VoiceMessage[];
  isMuted: boolean;
  currentTranscript: string;
  callDuration: number;
  startCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  /** AnalyserNode đang phân tích audio TTS (để lip-sync) */
  ttsAnalyserRef: React.RefObject<AnalyserNode | null>;
  /** AudioContext đang dùng để phát TTS */
  audioContextRef: React.RefObject<AudioContext | null>;
}
import { buildVoiceWsUrl } from "@/configs/websocket.config";

export function useVoiceChat({
  sessionId,
  characterId,
  contextId,
  onTranscript,
  onError,
}: UseVoiceChatOptions): UseVoiceChatReturn {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [callDuration, setCallDuration] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);   // VAD (mic)
  const ttsAnalyserRef = useRef<AnalyserNode | null>(null); // TTS (lip-sync)
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ── Cleanup ───────────────────────────────────────────
  const cleanup = useCallback(() => {
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    wsRef.current?.close();
    audioContextRef.current?.close();

    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (vadIntervalRef.current) clearInterval(vadIntervalRef.current);

    wsRef.current = null;
    mediaRecorderRef.current = null;
    streamRef.current = null;
    audioContextRef.current = null;
    ttsAnalyserRef.current = null;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  }, []);

  // ── Lấy / tạo AudioContext & TTS AnalyserNode ────────
  const getAudioContext = useCallback((): AudioContext => {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      const ctx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = ctx;

      // Tạo AnalyserNode dùng chung cho toàn bộ TTS stream
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      ttsAnalyserRef.current = analyser;

      // Kết nối analyser → destination để vừa phân tích vừa phát ra loa
      analyser.connect(ctx.destination);
    }
    return audioContextRef.current!;
  }, []);

  // ── Play audio queue (PCM/MP3 từ server) ─────────────
  const playNextInQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setStatus("speaking");

    const buffer = audioQueueRef.current.shift()!;

    try {
      const ctx = getAudioContext();

      // Resume context nếu bị suspended (autoplay policy)
      if (ctx.state === "suspended") await ctx.resume();

      const decoded = await ctx.decodeAudioData(buffer.slice(0));
      const source = ctx.createBufferSource();
      source.buffer = decoded;

      // source → ttsAnalyser → destination
      // Analyser đã được connect tới destination ở trên rồi
      if (ttsAnalyserRef.current) {
        source.connect(ttsAnalyserRef.current);
      } else {
        source.connect(ctx.destination);
      }

      source.onended = () => {
        isPlayingRef.current = false;
        if (audioQueueRef.current.length > 0) {
          playNextInQueue();
        } else {
          setStatus("listening");
          startRecording(); // auto bắt đầu nghe lại sau khi nhân vật nói xong
        }
      };

      source.start();
    } catch (err) {
      console.error("Audio decode error:", err);
      isPlayingRef.current = false;
      setStatus("listening");
    }
  }, [getAudioContext]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── VAD (Voice Activity Detection) đơn giản ──────────
  const startVAD = useCallback((stream: MediaStream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    let silentFrames = 0;
    const SILENCE_THRESHOLD = 10;
    const SILENCE_FRAMES_TO_SEND = 40; // ~800ms silence

    vadIntervalRef.current = setInterval(() => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;

      if (avg < SILENCE_THRESHOLD) {
        silentFrames++;
        if (silentFrames >= SILENCE_FRAMES_TO_SEND) {
          silentFrames = 0;
          // Flush chunk hiện tại để server xử lý
          if (
            mediaRecorderRef.current?.state === "recording" &&
            wsRef.current?.readyState === WebSocket.OPEN
          ) {
            mediaRecorderRef.current.requestData();
          }
        }
      } else {
        silentFrames = 0;
      }
    }, 20);
  }, []);

  // ── Bắt đầu recording ────────────────────────────────
  const startRecording = useCallback(async () => {
    if (!streamRef.current) return;
    if (mediaRecorderRef.current?.state === "recording") return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType,
      audioBitsPerSecond: 16000,
    });

    recorder.ondataavailable = (e) => {
      if (
        e.data.size > 0 &&
        wsRef.current?.readyState === WebSocket.OPEN &&
        !isMuted
      ) {
        e.data.arrayBuffer().then((buf) => {
          wsRef.current?.send(buf);
        });
      }
    };

    // Gửi chunks mỗi 250ms
    recorder.start(250);
    mediaRecorderRef.current = recorder;
    setStatus("listening");
  }, [isMuted]);

  // ── Kết nối WebSocket & khởi động call ───────────────
  const startCall = useCallback(async () => {
    try {
      setStatus("connecting");
      setMessages([]);
      setCallDuration(0);

      // Xin quyền mic
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

      // Khởi tạo AudioContext + TTS analyser ngay
      getAudioContext();

      // Kết nối WebSocket
      // URL pattern: ws://host/ws/voice/{sessionId}?characterId=...&contextId=...
      const wsUrl = buildVoiceWsUrl(sessionId, characterId, contextId);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.binaryType = "arraybuffer";

      ws.onopen = () => {
        setStatus("connected");

        // Gửi greeting event để server biết bắt đầu call
        ws.send(
          JSON.stringify({
            type: "start_call",
            sessionId,
            characterId,
            contextId,
          }),
        );

        // Bắt đầu đếm thời gian
        durationIntervalRef.current = setInterval(() => {
          setCallDuration((d) => d + 1);
        }, 1000);
      };

      ws.onmessage = (event) => {
        // Binary = audio chunk từ TTS
        if (event.data instanceof ArrayBuffer) {
          audioQueueRef.current.push(event.data);
          playNextInQueue();
          return;
        }

        // Text = control messages
        try {
          const msg = JSON.parse(event.data as string);

          switch (msg.type) {
            case "transcript_user":
              // Server đã transcribe xong tiếng người dùng
              setCurrentTranscript(msg.text);
              setStatus("processing");
              setMessages((prev) => [
                ...prev,
                { role: "user", text: msg.text, timestamp: new Date() },
              ]);
              onTranscript?.(msg.text, "user");
              break;

            case "transcript_assistant":
              // Server đã có response text (trước khi có audio)
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  text: msg.text,
                  timestamp: new Date(),
                },
              ]);
              onTranscript?.(msg.text, "assistant");
              setCurrentTranscript("");
              break;

            case "audio_start":
              setStatus("speaking");
              break;

            case "audio_end":
              // Server báo hết audio → nếu queue rỗng thì listen lại
              if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
                setStatus("listening");
              }
              break;

            case "greeting_ready":
              // Server đã tạo greeting của nhân vật → bắt đầu phát
              break;

            case "error":
              setStatus("error");
              onError?.(msg.message ?? "Voice error");
              break;
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setStatus("error");
        onError?.("Không thể kết nối voice. Vui lòng thử lại.");
        cleanup();
      };

      ws.onclose = () => {
        if (status !== "ended") setStatus("ended");
        cleanup();
      };

      // Bắt đầu VAD + recording sau khi WS connect
      ws.addEventListener("open", () => {
        startVAD(stream);
        // Delay nhỏ để nhân vật có thời gian nói lời chào
        setTimeout(() => startRecording(), 2000);
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi không xác định";
      if (message.includes("Permission")) {
        onError?.("Vui lòng cấp quyền microphone để dùng tính năng này.");
      } else {
        onError?.(message);
      }
      setStatus("error");
      cleanup();
    }
  }, [
    sessionId,
    characterId,
    contextId,
    getAudioContext,
    playNextInQueue,
    startVAD,
    startRecording,
    cleanup,
    onTranscript,
    onError,
  ]);

  // ── Kết thúc call ────────────────────────────────────
  const endCall = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: "end_call" }));
    setStatus("ended");
    cleanup();
  }, [cleanup]);

  // ── Toggle mute ──────────────────────────────────────
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
      return next;
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    messages,
    isMuted,
    currentTranscript,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    ttsAnalyserRef,
    audioContextRef,
  };
}
