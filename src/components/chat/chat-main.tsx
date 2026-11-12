"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createStreamingSpeechPlayer,
  findEarlyBreak,
  openCharacterSpeechStream,
  splitSpeechSegments,
} from "@/lib/character-speech";
import { Phone, ScrollText, Menu, Info, Coins, PhoneCall, Video, Lock, AlertTriangle, X, RotateCcw, GraduationCap, ArrowLeft } from "lucide-react";
import type {
  ChatCharacter,
  ChatMessage,
  ExamVerdict,
  GetMessagesResponse,
} from "@/services/chat.service";
import { MessageBubble, MessageQuotes, TypingIndicator } from "./chat-message-bubble";
import { MarkdownMessage } from "./MarkdownMessage";
import { ChatInput } from "./chat-input";
import {
  useChatMessages,
  useCreateSession,
} from "@/features/chat/hooks";
import { chatService } from "@/services/chat.service";
import { useQueryClient } from "@tanstack/react-query";
import { recordStudyActivity } from "@/features/gamification/study-check-in";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { queryKeys } from "@/shared/query-key";
import { Avatar3DModal } from "./Avatar3DModal";
import type { VoiceRestMessage } from "@/features/chat/useVoiceChatRest";
import { cn } from "@/lib/utils/cn";
import { isValidUrl } from "@/lib/utils/url";
import { UpgradeProDialog } from "@/components/layouts/sidebar/upgrade-pro-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useEntitlements } from "@/features/saas/entitlements";
import { useTodayQuota } from "@/features/saas/quota-bonus";
import { isSchoolPoolEmptyForStudent } from "@/features/saas/school-pool";
import { hasPlusAccess, hasProAccess } from "@/services/user.service";
import { getApiErrorMessage, isTokenExhaustionError } from "@/lib/utils/api-error";
import { handlePlatformLockError } from "@/lib/utils/school-lock";
import { TokenBoostRequestDialog } from "@/components/saas/token-boost-request-dialog";
import { TeacherTicketDialog } from "@/components/saas/token-boost-ui";
import { useSidebar } from "@/components/layouts/sidebar/sidebar-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { inappropriateMessageFromError } from "@/lib/utils/content-policy";
import { ContentWarningDialog } from "./content-warning-dialog";
import { ExamStartDialog } from "./exam-start-dialog";
import { AI_FEEDBACK_FORM_URL, AiDisclaimerFooter, AiFirstChatNotice } from "./ai-notice";

const EXAM_VERDICT_LABELS: Record<ExamVerdict, { label: string; className: string }> = {
  CORRECT: { label: "Đúng", className: "text-(--status-success) border-(--status-success)" },
  PARTIAL: { label: "Đúng một phần", className: "text-(--status-warning) border-(--status-warning)" },
  INCORRECT: { label: "Chưa đúng", className: "text-accent-danger border-accent-danger" },
};

/** Exam replies put feedback and the next question either side of "---"; it should not be read aloud. */
const stripExamSeparator = (text: string) => text.replace(/\s*\n?-{3,}\n?\s*/g, "\n");

const isVoiceMessage = (message: ChatMessage) =>
  message.messageType?.toUpperCase() === "VOICE";

const toMessageType = (value?: string): ChatMessage["messageType"] =>
  value?.toUpperCase() === "VOICE" ? "VOICE" : "TEXT";

const VOICE_CALL_GAP_MS = 2 * 60 * 1000;

type VoiceCallGroup = {
  id: string;
  startedAt: string;
  messages: ChatMessage[];
};

type ChatDisplayItem =
  | { type: "message"; message: ChatMessage }
  | { type: "voice-call"; call: VoiceCallGroup };

const parseApiDate = (value: string) => {
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  return new Date(hasTimezone ? value : `${value}Z`);
};

const formatVietnamTime = (value: string) =>
  parseApiDate(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

const vietnamDayKey = (value: string) =>
  parseApiDate(value).toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

/** "Hôm nay" / "Hôm qua" / "Thứ Hai, 27/10/2026" for the separator between days. */
const formatDayLabel = (value: string) => {
  const key = vietnamDayKey(value);
  const today = vietnamDayKey(new Date().toISOString());
  const yesterday = vietnamDayKey(new Date(Date.now() - 86_400_000).toISOString());
  if (key === today) return "Hôm nay";
  if (key === yesterday) return "Hôm qua";
  return parseApiDate(value).toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  });
};

const displayItemDate = (item: ChatDisplayItem) => (item.type === "voice-call" ? item.call.startedAt : item.message.createdAt);

const groupChatDisplayItems = (messages: ChatMessage[]): ChatDisplayItem[] => {
  const items: ChatDisplayItem[] = [];
  let currentCall: VoiceCallGroup | null = null;
  let previousVoiceAt = 0;

  messages.forEach((message) => {
    if (!isVoiceMessage(message)) {
      if (currentCall) {
        items.push({ type: "voice-call", call: currentCall });
        currentCall = null;
        previousVoiceAt = 0;
      }

      items.push({ type: "message", message });
      return;
    }

    const messageTime = parseApiDate(message.createdAt).getTime();
    const shouldStartNewCall =
      !currentCall || messageTime - previousVoiceAt > VOICE_CALL_GAP_MS;

    if (shouldStartNewCall) {
      if (currentCall) {
        items.push({ type: "voice-call", call: currentCall });
      }

      currentCall = {
        id: `voice-call-${message.id}`,
        startedAt: message.createdAt,
        messages: [message],
      };
    } else if (currentCall) {
      currentCall.messages.push(message);
    }

    previousVoiceAt = messageTime;
  });

  if (currentCall) {
    items.push({ type: "voice-call", call: currentCall });
  }

  return items;
};

interface ChatMainProps {
  character: ChatCharacter;
  contextId: string;
  sessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  /** Starts an exam about this chat's conversation. */
  onStartExamFromChat?: (questionCount: number) => void;
  /** Set on an exam started from a chat: the chat the learner can go back to. */
  returnToSessionId?: string;
  onReturnToSession?: (sessionId: string) => void;
  toggleRightPanel?: () => void;
  isRightOpen?: boolean;
  /** Overrides the "initializing conversation" message shown while sessionId is null. */
  initializingLabel?: string;
  onOpenCitation?: (quote: string) => void;
  isTokenExhausted?: boolean;
  onTokenExhausted?: () => void;
}

export function ChatMain({
  character,
  contextId,
  sessionId,
  onSessionCreated,
  onStartExamFromChat,
  returnToSessionId,
  onReturnToSession,
  toggleRightPanel,
  isRightOpen = false,
  initializingLabel,
  onOpenCitation,
  isTokenExhausted: isTokenExhaustedFromParent = false,
  onTokenExhausted,
}: ChatMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toggleMobileSidebar } = useSidebar();
  const user = useAuthStore((s) => s.user);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessage[]>(
    [],
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [streamingMessageType, setStreamingMessageType] = useState<"TEXT" | "VOICE">("TEXT");
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isVoice2DOpen, setIsVoice2DOpen] = useState(false);
  const [isVoice3DOpen, setIsVoice3DOpen] = useState(false);
  const [selectedVoiceCall, setSelectedVoiceCall] = useState<VoiceCallGroup | null>(null);
  const [voiceCallDraftMessages, setVoiceCallDraftMessages] = useState<ChatMessage[]>([]);
  const [isLocalTokenExhausted, setIsLocalTokenExhausted] = useState(false);
  const isTokenExhausted = isTokenExhaustedFromParent || isLocalTokenExhausted;
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  // Teacher / School Student tokens come from the school's daily quota; they cannot buy plans.
  const entitlements = useEntitlements();
  const isSchoolAccount = entitlements.mode === "B2B";
  const canUpgrade = entitlements.canPurchase;
  // School students out of today's limit can ask their teacher for more (Sprint 7 daily boost).
  const canRequestBoost = user?.role === "SCHOOL_STUDENT";
  // Teachers have their own daily limit (Sprint 7); when it is used up they ask the School Admin.
  const canRequestTeacherQuota = user?.role === "TEACHER";
  // Student with limit left but nothing usable: the school pool is empty. Requests still go up, so the School Admin
  // sees the demand and arranges a top-up.
  const qc = useQueryClient();
  const todayQuota = useTodayQuota();
  const schoolPoolEmpty = canRequestBoost && isSchoolPoolEmptyForStudent(todayQuota);
  const [isBoostOpen, setIsBoostOpen] = useState(false);
  /** Out-of-tokens toast with the next step for this account: buy more, or ask the teacher / School Admin. */
  const notifyTokenExhausted = (what = "tiếp tục chat") => {
    // Refresh today's numbers so the banner can tell a used-up limit from an empty school pool.
    if (canRequestBoost) void qc.invalidateQueries({ queryKey: queryKeys.dashboard.student });
    if (schoolPoolEmpty) {
      toast.error("Quỹ token chung của trường đã hết nên tạm thời chưa trò chuyện AI được.", {
        description: "Gửi yêu cầu để thầy cô và nhà trường biết bạn cần thêm token.",
        action: { label: "Xin thêm token", onClick: () => setIsBoostOpen(true) },
        duration: 8000,
      });
    } else if (canUpgrade) {
      toast.error(`Bạn đã hết token. Vui lòng nạp thêm để ${what}.`, {
        action: { label: "Nạp thêm", onClick: () => setIsUpgradeOpen(true) },
        duration: 8000,
      });
    } else if (canRequestTeacherQuota) {
      toast.error("Bạn đã dùng hết hạn mức token hôm nay (gồm cả phần đã cấp cho học sinh).", {
        action: { label: "Xin thêm hạn mức", onClick: () => setIsBoostOpen(true) },
        duration: 8000,
      });
    } else if (canRequestBoost) {
      toast.error("Bạn đã dùng hết hạn mức token AI hôm nay. Các tính năng khác vẫn dùng bình thường.", {
        action: { label: "Xin thêm token", onClick: () => setIsBoostOpen(true) },
        duration: 8000,
      });
    } else {
      toast.error("Bạn đã dùng hết hạn mức token hôm nay do trường cấp. Hạn mức làm mới lúc 00:00.", { duration: 8000 });
    }
  };
  const [aiWarningVisible, setAiWarningVisible] = useState(false);
  const [aiWarningLeaving, setAiWarningLeaving] = useState(false);
  const dismissedCallModeRef = useRef<"2d" | "3d" | null>(null);
  const [lastTokenUsage, setLastTokenUsage] = useState<{
    remainingTokens: number;
    promptTokens: number;
    completionTokens: number;
    messageType?: "TEXT" | "VOICE";
  } | null>(null);
  const speechAudioCtxRef = useRef<AudioContext | null>(null);
  const [headerAvatarBroken, setHeaderAvatarBroken] = useState(false);

  useEffect(() => {
    setHeaderAvatarBroken(false);
  }, [character.imageUrl]);

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [contentWarning, setContentWarning] = useState<string | null>(null);

  const { data, isLoading } = useChatMessages(sessionId);
  const createSession = useCreateSession();
  const getSpeechContext = useCallback(async (): Promise<AudioContext> => {
    if (!speechAudioCtxRef.current || speechAudioCtxRef.current.state === "closed") {
      const AudioContextCtor = window.AudioContext || (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error("AudioContext khong kha dung");
      }

      speechAudioCtxRef.current = new AudioContextCtor();
    }

    const audioContext = speechAudioCtxRef.current;
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    return audioContext;
  }, []);

  const speechPlayer = useMemo(
    () =>
      createStreamingSpeechPlayer({
        getContext: getSpeechContext,
        getDestination: (context) => context.destination,
        open: (text, signal) => openCharacterSpeechStream(character.id, text, signal),
      }),
    [character.id, getSpeechContext],
  );

  const stopSpeech = useCallback(() => {
    speechPlayer.stop();
    setSpeakingMessageId(null);
  }, [speechPlayer]);

  /** Đọc lại một tin nhắn: từng câu được đọc ngay khi có âm thanh, giọng giống trên mọi thiết bị. */
  const speakMessage = useCallback(
    async (rawText: string, messageId: string): Promise<void> => {
      const text =
        rawText
          .replace(/!\[[^\]]*\](?:\([^)]*\)?)?/g, "")
          .replace(/!\[[^\]]*(?:\([^)]*)?/g, "")
          .replace(/\/historical-images\/\S+/gi, "")
          .replace(/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)\)?/gi, "")
          .replace(/\{\{IMG_\d+\}\}/g, "")
          .replace(/https?:\/\/\S+/g, "")
          .replace(/\(\s*\)/g, "")
          .replace(/\[\s*\]/g, "")
          .replace(/\s{2,}/g, " ")
          .trim() || rawText;
      stopSpeech();
      setSpeakingMessageId(messageId);
      const segments = splitSpeechSegments(text, { earlyFirst: true });
      const finished = segments.map((segment) => speechPlayer.enqueue(segment));
      await Promise.all(finished);
      setSpeakingMessageId((current) => (current === messageId ? null : current));
    },
    [speechPlayer, stopSpeech],
  );

  const speak = useCallback((text: string, messageId: string) => {
    if (speakingMessageId === messageId) {
      stopSpeech();
      return;
    }
    void speakMessage(text, messageId);
  }, [speakingMessageId, speakMessage, stopSpeech]);

  useEffect(() => {
    return () => {
      stopSpeech();
      if (speechAudioCtxRef.current && speechAudioCtxRef.current.state !== "closed") {
        speechAudioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopSpeech]);

  const messages = useMemo(
    () => {
      // BE luu ca tin tra loi rong khi AI loi giua chung: an di, khong ve bong bong trong.
      const persistedMessages = (data?.messages ?? []).filter((m) => m.role !== "ASSISTANT" || isVoiceMessage(m) || !!m.content?.trim());
      const pendingVoiceDrafts = voiceCallDraftMessages.filter(
        (draft) =>
          !persistedMessages.some(
            (message) =>
              isVoiceMessage(message) &&
              message.role === draft.role &&
              message.content === draft.content,
          ),
      );

      return [...persistedMessages, ...pendingVoiceDrafts, ...optimisticMessages];
    },
    [data?.messages, voiceCallDraftMessages, optimisticMessages],
  );
  const displayItems = useMemo(() => groupChatDisplayItems(messages), [messages]);
  // Questions the character never answered (the AI failed and the backend kept an empty reply, or none). Without a
  // marker they just sat there, looking like the chat ignored the learner.
  const unansweredIds = useMemo(() => {
    const ids = new Set<string>();
    const text = messages.filter((m) => !isVoiceMessage(m));
    text.forEach((message, index) => {
      if (message.role !== "USER" || message.id.startsWith("temp-")) return;
      const next = text[index + 1];
      if (next?.role === "ASSISTANT") return;
      if (!next && isStreaming) return;
      ids.add(message.id);
    });
    return ids;
  }, [messages, isStreaming]);
  const lastItem = displayItems[displayItems.length - 1];
  // Exam sessions: the character asks and grades, so there are no suggestions and no calls.
  const exam = data?.exam;
  const isExam = !!exam;
  const isExamFinished = !!exam?.finished;
  const [isExamFromChatOpen, setIsExamFromChatOpen] = useState(false);
  const showSuggestions =
    !isExam && suggestedQuestions.length > 0 && !isStreaming && lastItem?.type !== "voice-call" && lastItem?.message.role === "ASSISTANT";
  const userTextMessageCount = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.role === "USER" &&
          !isVoiceMessage(message) &&
          message.content.trim().length > 0,
      ).length,
    [messages],
  );
  const accessUser = useMemo(
    () =>
      user
        ? {
            tierId: user.tierId ?? null,
            tierTitle: user.tierTitle ?? null,
          }
        : null,
    [user],
  );
  const showVoiceNudge =
    userTextMessageCount >= 2 &&
    userTextMessageCount <= 3 &&
    !isStreaming &&
    !isTokenExhausted &&
    !!sessionId &&
    (isSchoolAccount ? entitlements.voiceCall : hasPlusAccess(accessUser));
  const sessionIdRef = useRef(sessionId);
  const isStaffOrAdmin = user?.role === "CONTENT_ADMIN" || user?.role === "SYSTEM_ADMIN";
  // Customers unlock calls with their personal tier; school accounts with the school package.
  const canUseVoiceCall =
    isStaffOrAdmin || (isSchoolAccount ? entitlements.voiceCall : hasPlusAccess(accessUser));
  const canUseVideoCall =
    isStaffOrAdmin || (isSchoolAccount ? entitlements.videoCall : hasProAccess(accessUser));
  const isConversationInitializing = !sessionId;
  const requestedCallMode = searchParams.get("call");

  const replaceCallModeInUrl = useCallback(
    (mode: "2d" | "3d" | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (mode) {
        params.set("call", mode);
      } else {
        params.delete("call");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const handleLockedFeatureClick = useCallback(() => {
    if (!canUpgrade) {
      toast.info(entitlements.upgradeHint || "Tính năng này chưa có trong gói trường học của bạn.");
      return;
    }
    setIsUpgradeOpen(true);
  }, [canUpgrade, entitlements.upgradeHint]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    setOptimisticMessages([]);
    setSuggestedQuestions(data?.suggestedQuestions ?? []);
  }, [sessionId]);

  const dismissAiWarning = useCallback(() => {
    setAiWarningLeaving(true);
    window.setTimeout(() => setAiWarningVisible(false), 300);
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    setAiWarningVisible(true);
    setAiWarningLeaving(false);

    const leaveTimer = window.setTimeout(() => setAiWarningLeaving(true), 5000);
    const hideTimer = window.setTimeout(() => setAiWarningVisible(false), 5300);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [sessionId]);

  useEffect(() => {
    if (data?.suggestedQuestions) {
      setSuggestedQuestions(data.suggestedQuestions);
    }
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming, streamingMessage]);


  const handleVoiceMessagesChange = useCallback(
    (voiceMessages: VoiceRestMessage[]) => {
      setVoiceCallDraftMessages(
        voiceMessages.map((message, index) => ({
          id: `voice-draft-${sessionId}-${message.timestamp.getTime()}-${index}`,
          sessionId: sessionId!,
          role: message.role === "user" ? "USER" : "ASSISTANT",
          content: message.text,
          messageType: "VOICE",
          createdAt: message.timestamp.toISOString(),
          quotes: message.quotes,
        })),
      );
    },
    [sessionId],
  );

  const handleOpenVoice2DCall = useCallback(() => {
    if (!sessionId || isTokenExhausted) return;
    if (!canUseVoiceCall) {
      handleLockedFeatureClick();
      return;
    }
    setVoiceCallDraftMessages([]);
    dismissedCallModeRef.current = null;
    setIsVoice2DOpen(true);
    replaceCallModeInUrl("2d");
  }, [canUseVoiceCall, handleLockedFeatureClick, isTokenExhausted, replaceCallModeInUrl, sessionId]);

  const handleCloseVoice2DCall = useCallback(() => {
    dismissedCallModeRef.current = "2d";
    replaceCallModeInUrl(null);
    setIsVoice2DOpen(false);
    qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    if (sessionId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(sessionId) });
    }
  }, [qc, replaceCallModeInUrl, sessionId]);

  const handleOpenVoice3DCall = useCallback(() => {
    if (!sessionId || isTokenExhausted) return;
    if (!canUseVideoCall) {
      handleLockedFeatureClick();
      return;
    }
    setVoiceCallDraftMessages([]);
    dismissedCallModeRef.current = null;
    setIsVoice3DOpen(true);
    replaceCallModeInUrl("3d");
  }, [canUseVideoCall, handleLockedFeatureClick, isTokenExhausted, replaceCallModeInUrl, sessionId]);

  const handleCloseVoice3DCall = useCallback(() => {
    dismissedCallModeRef.current = "3d";
    replaceCallModeInUrl(null);
    setIsVoice3DOpen(false);
    qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    if (sessionId) {
      qc.invalidateQueries({ queryKey: queryKeys.chat.messages(sessionId) });
    }
  }, [qc, replaceCallModeInUrl, sessionId]);

  useEffect(() => {
    if (!sessionId || isVoice2DOpen || isVoice3DOpen) return;
    if (requestedCallMode !== "2d" && requestedCallMode !== "3d") {
      dismissedCallModeRef.current = null;
      return;
    }
    if (dismissedCallModeRef.current === requestedCallMode) return;

    let timeoutId: number | undefined;

    if (requestedCallMode === "2d") {
      timeoutId = window.setTimeout(handleOpenVoice2DCall, 0);
    } else if (requestedCallMode === "3d") {
      timeoutId = window.setTimeout(handleOpenVoice3DCall, 0);
    }

    return () => {
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    handleOpenVoice2DCall,
    handleOpenVoice3DCall,
    isVoice2DOpen,
    isVoice3DOpen,
    requestedCallMode,
    sessionId,
  ]);

  const enqueueSpeech = (rawText: string) => {
    const text =
      rawText
        .replace(/!\[[^\]]*\](?:\([^)]*\)?)?/g, "")
        .replace(/!\[[^\]]*(?:\([^)]*)?/g, "")
        .replace(/\/historical-images\/\S+/gi, "")
        .replace(/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)\)?/gi, "")
        .replace(/\{\{IMG_\d+\}\}/g, "")
        .replace(/https?:\/\/\S+/g, "")
        .replace(/\(\s*\)/g, "")
        .replace(/\[\s*\]/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
    if (!text) return;
    for (const segment of splitSpeechSegments(text)) {
      void speechPlayer.enqueue(segment);
    }
  };

  /**
   * Exam answers stream like normal chat: first the feedback, then "---" and the next question, which the
   * character writes from this answer. The grade and progress arrive with the last event.
   * Resolves false when the answer was not graded; the toast then offers to send it again.
   */
  const sendExamAnswer = (examSessionId: string, content: string): Promise<boolean> => {
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: examSessionId,
      role: "USER",
      content,
      messageType: "TEXT",
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, tempUserMsg]);
    setStreamingMessageType("TEXT");
    setStreamingMessage("");
    setIsStreaming(true);

    // Each sentence is read as soon as it is complete; the "---" between feedback and question is not read.
    let sentenceBuffer = "";
    let spokeFirstPhrase = false;
    const speakPhrase = (phrase: string) => {
      const text = stripExamSeparator(phrase).trim();
      if (text.length > 1) {
        spokeFirstPhrase = true;
        enqueueSpeech(text);
      }
    };

    return new Promise<boolean>((resolve) => {
      void chatService.sendMessageStream(
        examSessionId,
        content,
        (chunk) => {
          setStreamingMessage((prev) => prev + chunk);

          sentenceBuffer += chunk;
          const match = sentenceBuffer.match(/([.!?\n]+)/);
          const splitIndex =
            match && match.index !== undefined
              ? match.index + match[0].length
              : spokeFirstPhrase
                ? -1
                : findEarlyBreak(sentenceBuffer);
          if (splitIndex > 0) {
            speakPhrase(sentenceBuffer.slice(0, splitIndex));
            sentenceBuffer = sentenceBuffer.slice(splitIndex);
          }
        },
        (resData) => {
          setIsStreaming(false);
          setOptimisticMessages([]);
          speakPhrase(sentenceBuffer);

          const assistantMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            sessionId: examSessionId,
            role: "ASSISTANT",
            content: resData.fullContent,
            messageType: "TEXT",
            createdAt: new Date().toISOString(),
            quotes: resData.quotesUsed,
            examVerdict: resData.examVerdict,
          };
          if (speechPlayer.isPlaying()) {
            setSpeakingMessageId(assistantMsg.id);
          }

          qc.setQueryData(
            queryKeys.chat.messages(examSessionId),
            (old: GetMessagesResponse | undefined) => ({
              messages: [...(old?.messages ?? []), tempUserMsg, assistantMsg],
              suggestedQuestions: [],
              exam: resData.exam ?? old?.exam,
            }),
          );
          setLastTokenUsage((prev) => ({
            remainingTokens: resData.remainingTokens ?? prev?.remainingTokens ?? 0,
            promptTokens: resData.promptTokens || 0,
            completionTokens: resData.completionTokens || 0,
            messageType: "TEXT",
          }));
          recordStudyActivity(qc);
          qc.invalidateQueries({ queryKey: queryKeys.profile.me });
          resolve(true);
        },
        (err: unknown) => {
          setIsStreaming(false);
          stopSpeech();
          setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
          resolve(false);

          if (handlePlatformLockError(err)) return;

          const blocked = inappropriateMessageFromError(err);
          if (blocked) {
            setContentWarning(blocked);
            return;
          }
          if (isTokenExhaustionError(err)) {
            setIsLocalTokenExhausted(true);
            onTokenExhausted?.();
            notifyTokenExhausted("gửi câu trả lời");
            return;
          }
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 400) {
            // "Buổi vấn đáp này đã kết thúc." Reload the progress so the input locks.
            toast.error(getApiErrorMessage(err, "Không gửi được câu trả lời"));
            qc.invalidateQueries({ queryKey: queryKeys.chat.messages(examSessionId) });
            return;
          }
          // The backend saves nothing when grading fails, so the answer can simply be sent again.
          toast.error(`${character.name} chưa chấm được câu trả lời vì dịch vụ AI đang gặp sự cố.`, {
            action: { label: "Gửi lại", onClick: () => void sendExamAnswer(examSessionId, content) },
            duration: 8000,
          });
        },
      );
    });
  };

  /** Resolves false when the message was not sent and its text should stay in the input box. */
  const handleSend = async (content: string, type?: "TEXT" | "VOICE"): Promise<boolean> => {
    // Cancel any ongoing speech when starting a new message
    stopSpeech();
    // Mở khóa âm thanh ngay trong thao tác của người dùng, vì trình duyệt chặn phát tự động.
    void getSpeechContext().catch(() => {});

    // Wording is checked before the message enters the chat, so a blocked message never shows up there.
    const contentWarning = await chatService.checkContent(content);
    if (contentWarning) {
      setContentWarning(contentWarning);
      return false;
    }
    
    // If not specified, default to VOICE if the 3D avatar modal is open, else TEXT
    const msgType = type || (isVoice3DOpen ? "VOICE" : "TEXT");
    setStreamingMessageType(msgType);

    let currentSessionId = sessionId;

    if (!currentSessionId) {
      if (!contextId) return false;
      try {
        const newSession = await createSession.mutateAsync({
          characterId: character.id,
          contextId,
        });
        currentSessionId = newSession.id;
        onSessionCreated?.(currentSessionId);
      } catch (error) {
        if (isTokenExhaustionError(error)) {
          setIsLocalTokenExhausted(true);
          onTokenExhausted?.();
        }

        return false;
      }
    }

    if (isExam) {
      void sendExamAnswer(currentSessionId, content);
      return true;
    }

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: currentSessionId,
      role: "USER",
      content,
      messageType: msgType,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages((prev) => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingMessage("");

    // Queue for smooth typing effect
    let localQueue = "";
    let isTyping = false;
    let typingInterval: NodeJS.Timeout;

    // Buffer for streaming speech chunk-by-chunk
    let sentenceBuffer = "";
    // Cụm đầu được đọc ngay ở dấu phẩy, không chờ hết câu
    let spokeFirstPhrase = false;
    // Only split on sentence endings (. ! ? \n) to avoid unnatural TTS pauses between commas
    const punctuationRegex = /([.!?\n]+)/;

    const processQueue = () => {
      if (isTyping) return;
      isTyping = true;
      typingInterval = setInterval(() => {
        if (localQueue.length > 0) {
          // If the head of localQueue starts with an image markdown tag, emit it atomically so it pops immediately
          if (localQueue.startsWith("![")) {
            const closeParenIdx = localQueue.indexOf(")");
            if (closeParenIdx !== -1) {
              const imgMarkdown = localQueue.substring(0, closeParenIdx + 1);
              localQueue = localQueue.substring(closeParenIdx + 1);
              setStreamingMessage((prev) => prev + imgMarkdown);
              return;
            }
          }

          // Dynamic typing speed: if queue is large, type faster to catch up
          let charsToTake = 1;
          const nextImgIdx = localQueue.indexOf("![");
          if (nextImgIdx > 0 && nextImgIdx < 8) {
            charsToTake = nextImgIdx;
          } else {
            if (localQueue.length > 40) charsToTake = 2;
            if (localQueue.length > 100) charsToTake = 4;
            if (localQueue.length > 250) charsToTake = 8;
          }
          
          const textToAdd = localQueue.substring(0, charsToTake);
          localQueue = localQueue.substring(charsToTake);
          setStreamingMessage((prev) => prev + textToAdd);
        }
      }, 72); // 72ms delay for 1.25x faster typing effect
    };

    chatService.sendMessageStream(
      currentSessionId,
      content,
      (chunk) => {
        localQueue += chunk;
        processQueue();

        // Streaming voice logic: speak phrases as soon as punctuation is detected
        // Complete image tags are never spoken; drop them first so their "!" and ".jpg" can't act as sentence breaks.
        sentenceBuffer = (sentenceBuffer + chunk).replace(/!\[[^\]]*\]\([^)]*\)/g, " ");
        const isInsideImageTag = sentenceBuffer.lastIndexOf("![") > sentenceBuffer.lastIndexOf(")");
        if (!isInsideImageTag) {
          const match = sentenceBuffer.match(punctuationRegex);
          const earlyBreak = spokeFirstPhrase ? -1 : findEarlyBreak(sentenceBuffer);
          const splitIndex =
            match && match.index !== undefined ? match.index + match[0].length : earlyBreak;
          if (splitIndex > 0) {
            const phraseToSpeak = sentenceBuffer.slice(0, splitIndex).trim();
            sentenceBuffer = sentenceBuffer.slice(splitIndex);
            if (phraseToSpeak.length > 1) { // Avoid speaking stray punctuation
              spokeFirstPhrase = true;
              enqueueSpeech(phraseToSpeak);
            }
          }
        }
      },
      (resData) => {
        // Ensure the remaining queue is flushed quickly before ending
        clearInterval(typingInterval);
        setIsStreaming(false);
        setOptimisticMessages([]);
        setSuggestedQuestions(resData.suggestedQuestions || []);
        // A finished reply is a study activity: check in today's streak (once per day).
        recordStudyActivity(qc);
        
        // Update tokens correctly, using values from resData or defaulting to 0
        setLastTokenUsage((prev) => ({
           remainingTokens: resData.remainingTokens !== undefined ? resData.remainingTokens : (prev?.remainingTokens || 0),
           promptTokens: resData.promptTokens || 0,
           completionTokens: resData.completionTokens || 0,
           messageType: msgType
        }));

        // Speak any remaining buffer when stream finishes
        if (sentenceBuffer.trim().length > 0) {
           enqueueSpeech(sentenceBuffer.trim());
        }

        const newAssistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sessionId: currentSessionId,
          role: "ASSISTANT",
          content: resData.fullContent,
          messageType: toMessageType(resData.messageType),
          createdAt: new Date().toISOString(),
          quotes: resData.quotesUsed,
        };

        if (speechPlayer.isPlaying()) {
          setSpeakingMessageId(newAssistantMsg.id);
        }

        qc.setQueryData(
          queryKeys.chat.messages(currentSessionId!),
          (old: GetMessagesResponse | undefined) => ({
            messages: [
              ...(old?.messages ?? []),
              tempUserMsg,
              newAssistantMsg,
            ],
            suggestedQuestions: resData.suggestedQuestions,
          }),
        );
        qc.invalidateQueries({ queryKey: queryKeys.profile.me });
      },
      (err: unknown) => {
        setIsStreaming(false);
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.id !== tempUserMsg.id),
        );

        const error = err as {
          message?: string;
          response?: {
            status?: number;
            data?: {
              message?: string;
              errorCode?: string | number;
            };
          };
        };

        const serverMessage = error.message || error.response?.data?.message || "";
        const lowerServerMessage = serverMessage.toLowerCase();

        // Check for token exhaustion - broader matching
        const isTokenExhausted =
          lowerServerMessage.includes("hết token") ||
          lowerServerMessage.includes("không đủ token") ||
          (error.response?.status === 400 && lowerServerMessage.includes("token"));
        
        void isTokenExhausted;

        // The stream uses fetch(), so the axios interceptor never sees the whole-school lock.
        if (handlePlatformLockError(err)) return;

        // The send API checks wording again, in case the check before sending was skipped or failed.
        const blocked = inappropriateMessageFromError(err);
        if (blocked) {
          setContentWarning(blocked);
          return;
        }

        if (isTokenExhaustionError(err)) {
          setIsLocalTokenExhausted(true);
          onTokenExhausted?.();
          notifyTokenExhausted();
        } else {
          // Tin nhan cua nguoi dung da bi go khoi khung chat o tren: cho gui lai ngay, khoi go lai.
          const aiDown = (err as { aiUnavailable?: boolean }).aiUnavailable || error.response?.status === 500 || error.response?.status === 503;
          toast.error(
            aiDown
              ? `${character.name} chưa trả lời được vì dịch vụ AI đang gặp sự cố. Thử lại sau ít phút nhé.`
              : "Không gửi được tin nhắn. Kiểm tra kết nối rồi thử lại.",
            { action: { label: "Gửi lại", onClick: () => void handleSend(content, msgType) }, duration: 8000 },
          );
        }
      },
      msgType
    );
    return true;
  };

  return (
    <div className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 md:px-6 py-3.5 border-b border-[var(--text-primary)] flex items-center gap-3 shrink-0 bg-bg-main"
      >
        {/* Mobile hamburger: open website sidebar */}
        <button
          onClick={toggleMobileSidebar}
          className="md:hidden w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer hover:bg-[var(--status-neutral-bg)] active:scale-95 text-content-text"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 overflow-hidden bg-[var(--bg-deep)] border border-border-card"
        >
          {!headerAvatarBroken && isValidUrl(character.imageUrl) ? (
            <img
              src={character.imageUrl!}
              alt={character.name}
              className="w-full h-full object-cover"
              onError={() => setHeaderAvatarBroken(true)}
            />
          ) : (
            <ScrollText
              className="w-6 h-6 text-content-muted"
            />
          )}
        </div>
        {/* Character info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2
              className="archive-title is-plain text-[19px] truncate"
            >
              {character.name}
            </h2>
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Lưu ý: nhân vật do AI nhập vai"
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 border border-[var(--border-strong)] text-content-muted hover:border-[var(--text-primary)] hover:text-[var(--text-primary)]"
                  >
                    <span className="text-[10px] font-bold leading-none">!</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  align="start"
                  sideOffset={10}
                  className="max-w-[min(380px,90vw)] whitespace-normal rounded-sm bg-bg-elevated border border-border-card text-content-heading shadow-(--shadow-soft)"
                >
                  <p className="text-xs font-bold leading-relaxed">Đây là AI nhập vai {character.name}, không phải nhân vật thật.</p>
                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs leading-relaxed">
                    <li>Lời thoại do AI tạo ra để phục vụ học tập, không phải phát ngôn, trích dẫn hay quan điểm thật của nhân vật.</li>
                    <li>AI có thể sai về sự kiện, mốc thời gian, số liệu hoặc cách đánh giá.</li>
                    <li>Hãy đối chiếu với sách giáo khoa và tư liệu chính thống trước khi dùng cho học tập hay trích dẫn.</li>
                  </ul>
                  <a
                    href={AI_FEEDBACK_FORM_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-xs font-semibold underline underline-offset-2 text-(--gold-on-light)"
                  >
                    Báo lỗi qua form
                  </a>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {aiWarningVisible && sessionId ? (
            <div
              className={cn(
                "flex items-center gap-1 h-3.5 text-[11px] transition-opacity duration-300 text-content-text",
                aiWarningLeaving ? "opacity-0" : "opacity-100",
              )}
            >
              <AlertTriangle
                className="w-3 h-3 shrink-0 text-(--status-warning)"
              />
              <span
                className="flex-1 min-w-0 truncate"
                title="Lời thoại do AI tạo ra, không phải phát ngôn thật của nhân vật. Hãy đối chiếu với tư liệu chính thống."
              >
                AI nhập vai, không phải lời thật của nhân vật. Hãy đối chiếu tư liệu chính thống.
              </span>
              <button
                onClick={dismissAiWarning}
                aria-label="Đóng cảnh báo"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] truncate text-content-muted">
              {character.title}
            </p>
          )}
        </div>

        {/* ── Nút Voice Call ── */}
        <button
          onClick={handleOpenVoice2DCall}
          disabled={isConversationInitializing || isExam || (canUseVoiceCall && isTokenExhausted)}
          aria-label={
            canUseVoiceCall
              ? `Gọi thoại với ${character.name}`
              : isSchoolAccount
                ? "Gọi thoại chưa có trong gói của trường"
                : "Mở nâng cấp gói Plus"
          }
          title={
            isExam
              ? "Không gọi được trong buổi vấn đáp"
              : !canUseVoiceCall
              ? isSchoolAccount
                ? "Gọi thoại chưa có trong gói của trường. Bấm để xem hướng dẫn."
                : "Gọi thoại có trong gói Plus. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? isSchoolAccount
                ? "Đã hết hạn mức hôm nay. Hạn mức làm mới lúc 00:00."
                : "Bạn đã hết token. Vui lòng nâng cấp để gọi thoại."
              : sessionId
                ? `Gọi thoại với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "group/call w-8 h-8 flex items-center justify-center rounded-sm transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge",
            canUseVoiceCall
              ? "bg-transparent border border-[var(--text-primary)] hover:bg-[var(--text-primary)]"
              : "bg-transparent border border-[var(--border-strong)] opacity-56",
          )}
        >
          <Phone
            className={cn(
              "w-4 h-4",
              canUseVoiceCall ? "text-[var(--text-primary)] group-hover/call:text-[var(--text-inverse)]" : "text-content-text"
            )}
          />
        </button>

        <button
          onClick={handleOpenVoice3DCall}
          disabled={isConversationInitializing || isExam || (canUseVideoCall && isTokenExhausted)}
          aria-label={
            canUseVideoCall
              ? `Video call 3D với ${character.name}`
              : isSchoolAccount
                ? "Video call 3D chưa có trong gói của trường"
                : "Mở nâng cấp gói Pro"
          }
          title={
            isExam
              ? "Không gọi được trong buổi vấn đáp"
              : !canUseVideoCall
              ? isSchoolAccount
                ? "Video call 3D chưa có trong gói của trường. Bấm để xem hướng dẫn."
                : "Video call có trong gói Pro. Bấm để xem các gói nâng cấp."
              : isTokenExhausted
              ? isSchoolAccount
                ? "Đã hết hạn mức hôm nay. Hạn mức làm mới lúc 00:00."
                : "Bạn đã hết token. Vui lòng nâng cấp để gọi 3D."
              : sessionId
                ? `Video call 3D với ${character.name}`
                : "Đang khởi tạo..."
          }
          className={cn(
            "group/call w-8 h-8 flex items-center justify-center rounded-sm transition-colors active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
            showVoiceNudge && "voice-call-nudge voice-call-nudge--delay",
            canUseVideoCall
              ? "bg-transparent border border-[var(--text-primary)] hover:bg-[var(--text-primary)]"
              : "bg-transparent border border-[var(--border-strong)] opacity-56",
          )}
        >
          <Video
            className={cn(
              "w-4 h-4",
              canUseVideoCall ? "fill-current text-[var(--text-primary)] group-hover/call:text-[var(--text-inverse)]" : "text-content-text"
            )}
          />
        </button>

        {/* Toggle Right Panel: character info, history, other characters, quiz, contexts (Mobile/Tablet) */}
        {toggleRightPanel && (
          <button
            onClick={toggleRightPanel}
            className={cn(
              "md:hidden w-8 h-8 flex items-center justify-center rounded-sm cursor-pointer active:scale-95",
              isRightOpen ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "text-content-text hover:bg-[var(--status-neutral-bg)]",
            )}
            aria-label="Mở bảng điều khiển"
          >
            <Info className="w-5 h-5" />
          </button>
        )}
      </div>

      {exam && sessionId && (
        <div className="px-4 md:px-6 py-2 border-b border-(--border-default) flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0 text-[11px] bg-bg-main">
          <span className="font-bold uppercase tracking-[0.08em] text-[var(--text-primary)]">Vấn đáp</span>
          <span className="tabular-nums text-content-text">
            {exam.finished
              ? `Đã xong ${exam.totalQuestions} câu`
              : `Câu ${Math.min(exam.answeredQuestions + 1, exam.totalQuestions)}/${exam.totalQuestions}`}
          </span>
          {!exam.finished && (
            <span className="font-semibold text-[var(--text-primary)]">
              {exam.totalQuestions - exam.answeredQuestions <= 1
                ? "Câu cuối, trả lời xong là có điểm"
                : `Còn ${exam.totalQuestions - exam.answeredQuestions} câu nữa là có điểm`}
            </span>
          )}
          <span className="tabular-nums text-content-text">
            {exam.finished ? "Điểm" : "Điểm tạm"}{" "}
            <strong className="text-content-heading">{exam.score.toLocaleString("vi-VN")}</strong>/10
          </span>
          <span className="tabular-nums text-content-muted">
            Đúng {exam.correctCount} · Đúng một phần {exam.partialCount} · Sai {exam.incorrectCount}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-5 pb-28 md:pb-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-5 h-5 rounded-full border-2 border-[var(--text-primary)] border-t-transparent animate-spin"
            />
          </div>
        ) : !sessionId ? (
          <>
            {initializingLabel && (
              <p
                className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-center text-content-muted"
              >
                {initializingLabel}
              </p>
            )}
            <TypingIndicator character={character} />
          </>
        ) : (
          <>
            {displayItems.map((item, index) => {
              const at = displayItemDate(item);
              const newDay = index === 0 || vietnamDayKey(at) !== vietnamDayKey(displayItemDate(displayItems[index - 1]));
              const unanswered = item.type === "message" && unansweredIds.has(item.message.id);
              const isLast = index === displayItems.length - 1;
              return (
                <Fragment key={item.type === "voice-call" ? item.call.id : item.message.id}>
                  {newDay && (
                    <div className="flex items-center gap-3 px-4 py-1" role="separator" aria-label={formatDayLabel(at)}>
                      <span className="h-px flex-1 bg-[var(--border-default)]" />
                      <span className="text-[11px] font-semibold text-content-muted first-letter:uppercase">{formatDayLabel(at)}</span>
                      <span className="h-px flex-1 bg-[var(--border-default)]" />
                    </div>
                  )}
              {item.type === "voice-call" ? (
                <VoiceCallBubble
                  key={item.call.id}
                  call={item.call}
                  onOpen={setSelectedVoiceCall}
                  onCallAgain={handleOpenVoice2DCall}
                />
              ) : (
                <MessageBubble
                  key={item.message.id}
                  message={item.message}
                  character={character}
                  speak={(text) => speak(text, item.message.id)}
                  isSpeaking={speakingMessageId === item.message.id}
                  onViewQuote={
                    item.message.role === "ASSISTANT" ? onOpenCitation : undefined
                  }
                />
              )}
                  {item.type === "message" && item.message.examVerdict && EXAM_VERDICT_LABELS[item.message.examVerdict] && (
                    <p className="-mt-2 pl-16 pr-4">
                      <span
                        className={cn(
                          "inline-block rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
                          EXAM_VERDICT_LABELS[item.message.examVerdict].className,
                        )}
                      >
                        Câu trả lời trước: {EXAM_VERDICT_LABELS[item.message.examVerdict].label}
                      </span>
                    </p>
                  )}
                  {unanswered && (
                    <p className="-mt-2 flex items-center justify-end gap-2 pr-16 text-[11px] text-[var(--status-warning)]">
                      <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {character.name} chưa trả lời được câu này.
                      {isLast && !isStreaming && item.type === "message" && (
                        <button
                          type="button"
                          onClick={() => handleSend(item.message.content)}
                          className="inline-flex items-center gap-1 font-semibold text-content-text underline-offset-2 hover:underline"
                        >
                          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Hỏi lại
                        </button>
                      )}
                    </p>
                  )}
                </Fragment>
              );
            })}
            {/* Follow-up suggestions answer the character, so they sit right under its latest reply (aligned with the
                bubble, past the avatar) and only while that reply is the last message — not under a question of the
                user's that is still waiting for, or never got, an answer. */}
            {showSuggestions && (
              <div className="-mt-2 mb-4 flex flex-wrap gap-2 pl-16 pr-4">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className="text-xs text-left px-3 py-1.5 rounded-sm border cursor-pointer transition-colors bg-transparent border-[var(--border-strong)] text-content-text hover:bg-[var(--text-primary)] hover:border-[var(--text-primary)] hover:text-[var(--text-inverse)]"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {isStreaming && streamingMessage && streamingMessageType !== "VOICE" && (
              <MessageBubble
                key="streaming-bubble"
                message={{
                  id: "streaming-bubble",
                  sessionId: sessionId!,
                  role: "ASSISTANT",
                  content: streamingMessage,
                  messageType: "TEXT",
                  createdAt: new Date().toISOString()
                }}
                character={character}
              />
            )}
            {(isStreaming && !streamingMessage && streamingMessageType !== "VOICE") && (
              <>
                {isExam && (
                  <p className="px-4 pl-16 text-[11px] text-content-muted">{character.name} đang chấm bài...</p>
                )}
                <TypingIndicator character={character} />
              </>
            )}
          </>
        )}


        {/* Token usage display */}
        {lastTokenUsage && !isStreaming && (
          <div className="px-4 flex items-center justify-end gap-3 text-[10px] text-content-muted">
            {isStaffOrAdmin ? (
              lastTokenUsage.messageType === "VOICE" ? (
                <span className="tabular-nums">Đã dùng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
              ) : (
                <>
                  <span className="tabular-nums">Prompt: {lastTokenUsage.promptTokens}</span>
                  <span className="tabular-nums">Response: {lastTokenUsage.completionTokens}</span>
                  <span className="tabular-nums">Tổng: {lastTokenUsage.promptTokens + lastTokenUsage.completionTokens}</span>
                </>
              )
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3 h-3 text-content-muted" />
                  <span>Còn lại: <strong className="tabular-nums text-content-text">{lastTokenUsage.remainingTokens.toLocaleString()}</strong></span>
                </div>
                <span className="w-px h-3 bg-(--border-default)" />
                <span className="tabular-nums">Đã dùng: {(lastTokenUsage.promptTokens + lastTokenUsage.completionTokens).toLocaleString()}</span>
              </>
            )}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {isTokenExhausted && (
        <div 
          className="px-4 py-2.5 border-t border-b border-[var(--text-primary)] flex items-center justify-between gap-3 text-xs shrink-0 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 bg-(--accent-gold-active-bg)"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse shrink-0" />
            <span className="text-content-text">
              {canUpgrade
                ? "Bạn đã dùng hết số token giới hạn. Vui lòng nâng cấp gói để tiếp tục cuộc trò chuyện."
                : schoolPoolEmpty
                ? "Quỹ token chung của trường đã hết nên trò chuyện AI tạm dừng cho đến khi nhà trường nạp thêm. Bạn vẫn gửi yêu cầu được để nhà trường biết; quiz, tài liệu và bài tập vẫn dùng bình thường."
                : `Bạn đã dùng hết hạn mức token AI hôm nay${
                    entitlements.dailyQuota ? ` (${entitlements.dailyQuota.toLocaleString("vi-VN")} token)` : ""
                  } hoặc quỹ token của trường đã hết. Hạn mức làm mới lúc 00:00; quiz, tài liệu và bài tập vẫn dùng bình thường.`}
            </span>
          </div>
          {(canRequestBoost || canRequestTeacherQuota) && (
            <button
              onClick={() => setIsBoostOpen(true)}
              className="btn-crimson min-h-0 px-3 py-1.5 text-[11px] active:scale-95 shrink-0 cursor-pointer"
            >
              {canRequestTeacherQuota ? "Xin thêm hạn mức" : "Xin thêm token hôm nay"}
            </button>
          )}
          {canUpgrade && (
            <button
              onClick={() => setIsUpgradeOpen(true)}
              className="btn-crimson min-h-0 px-3 py-1.5 text-[11px] active:scale-95 shrink-0 cursor-pointer"
            >
              Nâng cấp ngay
            </button>
          )}
        </div>
      )}

      {isExamFinished && exam && (
        <div className="px-4 py-3 border-t border-[var(--text-primary)] shrink-0 bg-(--accent-gold-active-bg)">
          <p className="text-sm font-bold text-content-heading">
            Buổi vấn đáp đã kết thúc: {exam.score.toLocaleString("vi-VN")}/10 điểm
          </p>
          <p className="mt-0.5 text-xs text-content-text">
            Đúng {exam.correctCount}, đúng một phần {exam.partialCount}, chưa đúng {exam.incorrectCount} trên{" "}
            {exam.totalQuestions} câu.{" "}
            {returnToSessionId
              ? "Quay lại cuộc trò chuyện để hỏi tiếp, hoặc mở bảng bên phải để vấn đáp lại."
              : "Mở bảng bên phải để vấn đáp lại hoặc trò chuyện tiếp."}
          </p>
          {returnToSessionId && onReturnToSession && (
            <button
              onClick={() => onReturnToSession(returnToSessionId)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border cursor-pointer border-[var(--text-primary)] text-content-text hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Quay lại phỏng vấn
            </button>
          )}
        </div>
      )}

      {/* Once the learner has asked something, they can be quizzed on what the character told them. */}
      {!isExam && sessionId && onStartExamFromChat && userTextMessageCount > 0 && !isStreaming && (
        <div className="px-4 pt-2 flex justify-end shrink-0">
          <button
            onClick={() => setIsExamFromChatOpen(true)}
            disabled={isTokenExhausted}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border cursor-pointer border-[var(--border-strong)] text-content-text hover:bg-[var(--text-primary)] hover:border-[var(--text-primary)] hover:text-[var(--text-inverse)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" /> Vấn đáp về cuộc trò chuyện này
          </button>
        </div>
      )}
      {onStartExamFromChat && (
        <ExamStartDialog
          open={isExamFromChatOpen}
          characterName={character.name}
          onOpenChange={setIsExamFromChatOpen}
          onStart={(questionCount) => {
            setIsExamFromChatOpen(false);
            stopSpeech();
            onStartExamFromChat(questionCount);
          }}
        />
      )}

      <ChatInput
        onSend={handleSend}
        isLoading={isStreaming}
        disabled={isStreaming || isTokenExhausted || isConversationInitializing || isExamFinished}
        characterName={character.name}
        isTokenExhausted={isTokenExhausted}
      />
      <ContentWarningDialog message={contentWarning} onClose={() => setContentWarning(null)} />
      <AiDisclaimerFooter />
      {/* Content authors test their own characters all day; the acknowledgement is for learners and teachers. */}
      {!isStaffOrAdmin && (
        <AiFirstChatNotice characterId={character.id} characterName={character.name} userId={user?.uid} />
      )}

      <style>{`
        .voice-call-nudge {
          animation: voiceCallNudge 1.15s ease-in-out 4;
          box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-gold) 36%, transparent);
          transform-origin: 50% 50%;
        }

        .voice-call-nudge--delay {
          animation-delay: 0.16s;
        }

        @keyframes voiceCallNudge {
          0%, 100% {
            transform: translateX(0) rotate(0deg) scale(1);
            box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent-gold) 0%, transparent);
            filter: brightness(1);
          }
          12% {
            transform: translateX(-1px) rotate(-5deg) scale(1.04);
          }
          24% {
            transform: translateX(1px) rotate(5deg) scale(1.07);
            box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent-gold) 16%, transparent);
            filter: brightness(1.28);
          }
          36% {
            transform: translateX(-1px) rotate(-4deg) scale(1.04);
          }
          52% {
            transform: translateX(1px) rotate(3deg) scale(1.06);
            box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent-gold) 0%, transparent);
            filter: brightness(1.18);
          }
          68% {
            transform: translateX(0) rotate(0deg) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .voice-call-nudge,
          .voice-call-nudge--delay {
            animation: none;
          }
        }
      `}</style>

      {/* ── 3D Avatar Modal ── */}
      {isVoice2DOpen && sessionId && (
        <Avatar3DModal
          variant="2d"
          character={character}
          sessionId={sessionId}
          onClose={handleCloseVoice2DCall}
          onMessagesChange={handleVoiceMessagesChange}
          contextId={contextId}
          onTokenUpdate={(remainingTokens, promptTokens, completionTokens, messageType) => {
            setLastTokenUsage({
              remainingTokens,
              promptTokens: promptTokens || 0,
              completionTokens: completionTokens || 0,
              messageType: messageType || "VOICE"
            });
          }}
        />
      )}

      {isVoice3DOpen && sessionId && (
        <Avatar3DModal
          variant="3d"
          character={character}
          sessionId={sessionId}
          onClose={handleCloseVoice3DCall}
          onMessagesChange={handleVoiceMessagesChange}
          contextId={contextId}
          onTokenUpdate={(remainingTokens, promptTokens, completionTokens, messageType) => {
            setLastTokenUsage({
              remainingTokens,
              promptTokens: promptTokens || 0,
              completionTokens: completionTokens || 0,
              messageType: messageType || "VOICE"
            });
          }}
        />
      )}

      {/* ── Upgrade Pro Dialog ── */}
      <VoiceCallTranscriptDialog
        call={selectedVoiceCall}
        character={character}
        onOpenChange={(open) => !open && setSelectedVoiceCall(null)}
        onOpenCitation={onOpenCitation}
      />

      {canUpgrade && <UpgradeProDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />}
      {canRequestBoost && <TokenBoostRequestDialog open={isBoostOpen} onOpenChange={setIsBoostOpen} />}
      {canRequestTeacherQuota && <TeacherTicketDialog open={isBoostOpen} onOpenChange={setIsBoostOpen} />}
    </div>
  );
}

function VoiceCallBubble({
  call,
  onOpen,
  onCallAgain,
}: {
  call: VoiceCallGroup;
  onOpen: (call: VoiceCallGroup) => void;
  onCallAgain: () => void;
}) {
  return (
    <div className="flex justify-end px-4 mb-4">
      <div
        className="w-[240px] overflow-hidden rounded-sm border bg-bg-surface border-[var(--text-primary)]"
      >
        <button
          type="button"
          onClick={() => onOpen(call)}
          aria-label={`Mở chi tiết cuộc gọi thoại lúc ${formatVietnamTime(call.startedAt)}`}
          className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-[var(--status-neutral-bg)]"
        >
          <div
            className="w-10 h-10 rounded-sm flex items-center justify-center shrink-0 bg-[var(--text-primary)] text-[var(--text-inverse)]"
          >
            <PhoneCall className="w-5 h-5 fill-current" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-heading">
              Cuộc gọi thoại
            </p>
            <p className="text-xs text-content-muted">
              {formatVietnamTime(call.startedAt)}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={onCallAgain}
          aria-label="Gọi lại"
          className="w-full py-2.5 text-[11px] font-bold uppercase tracking-[0.1em] cursor-pointer transition-colors border-t border-[var(--text-primary)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
        >
          Gọi lại
        </button>
      </div>
    </div>
  );
}

function VoiceCallTranscriptDialog({
  call,
  character,
  onOpenChange,
  onOpenCitation,
}: {
  call: VoiceCallGroup | null;
  character: ChatCharacter;
  onOpenChange: (open: boolean) => void;
  onOpenCitation?: (quote: string) => void;
}) {
  return (
    <Dialog open={!!call} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[80vh] overflow-hidden rounded-sm border border-border-card bg-bg-surface"
      >
        <DialogHeader>
          <DialogTitle className="archive-title is-plain text-xl">
            Cuộc gọi thoại - {call ? formatVietnamTime(call.startedAt) : ""}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[56vh] overflow-y-auto space-y-3 pr-1">
          {call?.messages.map((message) => {
            const isUser = message.role === "USER";

            return (
              <div
                key={message.id}
                className={cn("flex flex-col gap-1.5", isUser ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[82%] rounded-sm px-4 py-2.5 text-sm leading-relaxed",
                    isUser
                      ? "bg-accent-gold text-white"
                      : "bg-bg-elevated text-content-heading border border-(--border-strong)",
                  )}
                >
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.08em] opacity-70">
                    {isUser ? "Bạn" : character.name} - {formatVietnamTime(message.createdAt)}
                  </p>
                  {isUser ? <p>{message.content}</p> : <MarkdownMessage text={message.content} />}
                </div>
                {!isUser && message.quotes && message.quotes.length > 0 && (
                  <MessageQuotes quotes={message.quotes} onViewQuote={onOpenCitation} />
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
