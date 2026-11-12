import { axiosClient, refreshAccessToken } from "@/configs/axios.client";
import { useAuthStore } from "@/store/auth.store";
import { normalizeChatHistoryGroups } from "./chat-history.mapper";
import { inappropriateMessageFromError } from "@/lib/utils/content-policy";

// ── Types theo API response ───────────────────────────────

/** EXAM: the character asks and grades, the learner answers (chat_exam_mode_api_contract.md). */
export type ChatSessionMode = "CHAT" | "EXAM";

/** Names of the two modes in the UI: the learner interviews the character, or the character examines the learner. */
export const CHAT_MODE_LABELS: Record<ChatSessionMode, string> = { CHAT: "Phỏng vấn", EXAM: "Vấn đáp" };

export const EXAM_QUESTION_COUNT = { min: 3, max: 10, default: 5 } as const;

export interface ChatSession {
  id: string;
  characterId: string;
  contextId: string; // ← đổi từ eventId
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  mode?: ChatSessionMode;
  /** Only on EXAM sessions. */
  examQuestionCount?: number;
  /** Only on an exam started from a chat: the chat to go back to afterwards. */
  sourceSessionId?: string;
}

/** Grade of the answer just given. */
export type ExamVerdict = "CORRECT" | "PARTIAL" | "INCORRECT";

/** Progress of an exam session. Only present on EXAM sessions. */
export interface ExamProgress {
  totalQuestions: number;
  answeredQuestions: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  /** Out of 10, rounded to one decimal. */
  score: number;
  /** All questions answered: the input is locked and the last reply is a summary. */
  finished: boolean;
}

export type MessageType = "TEXT" | "VOICE";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  messageType: MessageType;
  createdAt: string;
  /** Đoạn trích nguồn AI dựa vào để trả lời. Chỉ có ở message tạo qua /messages/stream. */
  quotes?: string[];
  /** Exam sessions: grade of the answer this reply responds to. */
  examVerdict?: ExamVerdict;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  suggestedQuestions: string[];
  remainingTokens: number;
  promptTokens: number;
  completionTokens: number;
  exam?: ExamProgress;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  suggestedQuestions: string[];
  exam?: ExamProgress;
}

// History types
export interface ChatHistorySession {
  id: string;
  characterId: string;
  characterName: string;
  characterTitle: string;
  characterImage: string; // ← đổi từ characterImageUrl
  contextId: string;
  contextName: string; // ← đổi từ eventTitle/eventId
  sessionTitle: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
  mode?: ChatSessionMode;
}

export interface ChatHistoryGroup {
  contextId: string;
  contextName: string; // ← đổi từ eventTitle
  sessions: ChatHistorySession[];
}

/**
 * A character together with a historical context it took part in: the valid pairs for
 * POST /chat/sessions (GET /chat/scenarios). School accounts also get their school's local pairs.
 */
export interface ChatScenario {
  scenarioId: string;
  characterId: string;
  characterName: string;
  characterTitle?: string | null;
  characterAvatar?: string | null;
  characterPersonality?: string | null;
  contextId: string;
  contextName: string;
  contextEra?: string | null;
  contextYear?: number | null;
  contextImage?: string | null;
  contextSummary?: string | null;
  scope: "GLOBAL" | "SCHOOL" | string;
}

/** Most scenarios fetched per request; every page is fetched. */
const SCENARIO_PAGE_SIZE = 100;

export interface ChatCharacter {
  id: string;
  name: string;
  title: string;
  description?: string;
  imageUrl?: string | null;
  modelUrl?: string | null;
  side?: string;
  contextId?: string; // character thuộc context nào
  contexts?: { contextId: string; name: string }[];
}
// ── Service ──────────────────────────────────────────────

export const chatService = {
  getSessions: async (
    characterId: string,
    contextId: string,
  ): Promise<ChatSession[]> => {
    const res = await axiosClient.get("/chat/sessions", {
      params: { characterId, contextId },
      timeout: 90000, 
    });
    return res.data.data;
  },

  createSession: async (
    characterId: string,
    contextId: string,
    exam?: { questionCount: number; sourceSessionId?: string | null },
  ): Promise<ChatSession> => {
    const res = await axiosClient.post(
      "/chat/sessions",
      {
        characterId,
        contextId,
        // An exam session opens with question 1 already asked, so creating it calls the AI.
        ...(exam ? { mode: "EXAM", examQuestionCount: exam.questionCount } : {}),
        // Asks about what was said in that chat instead of any document of the character.
        ...(exam?.sourceSessionId ? { sourceSessionId: exam.sourceSessionId } : {}),
      },
      {
        timeout: 90000,
      },
    );
    const sessionData = res.data.data?.session ?? res.data.data;
    if (!sessionData) {
      throw new Error("Invalid response: session data is undefined");
    }
    return {
      ...sessionData,
      id: sessionData.id || sessionData._id, // Use id if exists, otherwise use _id
    };
  },

  getMessages: async (sessionId: string): Promise<GetMessagesResponse> => {
    const res = await axiosClient.get(`/chat/sessions/${sessionId}/messages`);
    return res.data.data;
  },

  /**
   * POST /chat/messages/check: checks wording before the message is shown. Saves nothing and costs no tokens.
   * Resolves the warning to show when blocked, or null when the message may be sent. A network or server
   * error also resolves null, since the send APIs check again.
   */
  checkContent: async (content: string): Promise<string | null> => {
    try {
      await axiosClient.post("/chat/messages/check", { content }, { timeout: 8000 });
      return null;
    } catch (error) {
      return inappropriateMessageFromError(error);
    }
  },

  sendMessage: async (
    sessionId: string,
    content: string,
  ): Promise<SendMessageResponse> => {
    const res = await axiosClient.post(
      "/chat/messages",
      {
        sessionId,
        content,
        messageType: "TEXT",
      },
      {
        timeout: 90000,
      },
    );
    return res.data.data;
  },

  sendMessageStream: async (
    sessionId: string,
    content: string,
    onData: (chunk: string) => void,
    onDone: (data: { remainingTokens?: number, suggestedQuestions?: string[], fullContent: string, promptTokens?: number, completionTokens?: number, messageType?: "TEXT" | "VOICE", quotesUsed?: string[], exam?: ExamProgress, examVerdict?: ExamVerdict }) => void,
    onError: (error: unknown) => void,
    messageTypeParam: "TEXT" | "VOICE" = "TEXT"
  ) => {
    try {
      let messageType = messageTypeParam;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const basePath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/Historical-tell/api/v1';
      const url = `${baseUrl}${basePath}/chat/messages/stream`;
      const body = JSON.stringify({ sessionId, content, messageType });

      const doFetch = (accessToken?: string) => {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
        return fetch(url, { method: "POST", headers, body });
      };

      let response = await doFetch(useAuthStore.getState().tokens?.accessToken);

      // Request fetch() thô không đi qua axios interceptor nên phải tự xử lý refresh token khi 401
      if (response.status === 401) {
        const newAccessToken = await refreshAccessToken();
        response = await doFetch(newAccessToken);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error: Error & {
          response?: { status: number; data: unknown };
        } = new Error(errorData?.message || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      if (!response.body) {
        throw new Error("ReadableStream not yet supported in this browser.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let remainingTokens: number | undefined;
      let suggestedQuestions: string[] | undefined;
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;
      let quotesUsed: string[] | undefined;
      let exam: ExamProgress | undefined;
      let examVerdict: ExamVerdict | undefined;

      let fullContent = "";
      let streamError: string | null = null;

      const handleLine = (line: string) => {
        if (!line.startsWith("data:")) return;
        try {
          const dataStr = line.substring(line.indexOf(":") + 1).trim();
          if (!dataStr) return;
          const parsed = JSON.parse(dataStr);

          if (parsed.type === "text") {
            fullContent += parsed.data;
            onData(parsed.data);
          } else if (parsed.type === "metadata") {
            suggestedQuestions = parsed.data?.suggestedQuestions;
            promptTokens = parsed.data?.promptTokens;
            completionTokens = parsed.data?.completionTokens;
            quotesUsed = parsed.data?.quotes_used;
            // Chi co o session van dap.
            exam = parsed.data?.exam ?? undefined;
            examVerdict = parsed.data?.examVerdict ?? undefined;
          } else if (parsed.type === "error") {
            // AI loi giua chung: BE van tra 200 + su kien "error" roi "done".
            streamError = typeof parsed.message === "string" ? parsed.message : "AI error";
          } else if (parsed.type === "done") {
            remainingTokens = parsed.remainingTokens;
            if (parsed.messageType) {
              messageType = parsed.messageType;
            }
          }
        } catch {
          console.warn("Failed to parse SSE data line", line);
        }
      };

      // Mot lan doc co the cat ngang mot dong, nen phan chua co "\n" duoc giu lai cho lan doc sau.
      let pendingLine = "";
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          pendingLine += decoder.decode(value, { stream: true });
          const lines = pendingLine.split("\n");
          pendingLine = lines.pop() ?? "";
          lines.forEach(handleLine);
        }
      }
      pendingLine += decoder.decode();
      if (pendingLine) handleLine(pendingLine);

      // BE khong luu cau tra loi loi, nen ca khi da nhan mot phan chu cung phai bao loi.
      if (streamError) {
        const error: Error & { response?: { status: number; data: unknown }; aiUnavailable?: boolean } = new Error(streamError);
        error.response = { status: 503, data: { message: streamError } };
        error.aiUnavailable = true;
        throw error;
      }
      onDone({ remainingTokens, suggestedQuestions, fullContent, promptTokens, completionTokens, messageType, quotesUsed, exam, examVerdict });
    } catch (err) {
      onError(err);
    }
  },

  /**
   * Every scenario (all pages). The API pages with `page` (1-based) and `size`; it ignores `limit`.
   * Optional `search` matches the character or context name.
   */
  getScenarios: async (params: { search?: string } = {}): Promise<ChatScenario[]> => {
    const all: ChatScenario[] = [];
    for (let page = 1; ; page++) {
      const res = await axiosClient.get("/chat/scenarios", {
        params: { page, size: SCENARIO_PAGE_SIZE, search: params.search || undefined },
      });
      const items = (res.data?.data ?? []) as ChatScenario[];
      all.push(...items);
      const totalPages = Number(res.data?.pagination?.totalPages) || 1;
      if (page >= totalPages || items.length === 0) return all;
    }
  },

  getHistory: async (): Promise<ChatHistoryGroup[]> => {
    const res = await axiosClient.get("/chat/history");
    return normalizeChatHistoryGroups(res.data.data);
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await axiosClient.delete(`/chat/sessions/${sessionId}`);
  },

  softDeleteSession: async (sessionId: string): Promise<void> => {
    await axiosClient.patch(`/chat/sessions/${sessionId}/soft-delete`);
  },
  getCharacter: async (characterId: string): Promise<ChatCharacter> => {
    const res = await axiosClient.get(`/characters/${characterId}`);
    const raw = res.data.data;
    // Handle multiple API response formats for contextId (including populated objects from Mongoose)
    const resolveId = (val: unknown): string | undefined => {
      if (typeof val === "string") return val || undefined;
      if (val && typeof val === "object") {
        const o = val as Record<string, unknown>;
        const id = o.id ?? o._id ?? o.contextId;
        return typeof id === "string" ? id : undefined;
      }
      return undefined;
    };
    const contextId =
      resolveId(raw.context?.contextId) ??
      raw.context?.id ??
      resolveId(raw.contextId) ??
      resolveId(raw.contextIds?.[0]?.contextId) ??
      resolveId(raw.contexts?.[0]?.contextId) ??
      null;
    return {
      id: raw.characterId ?? raw.id ?? characterId,
      name: raw.name,
      title: raw.title,
      description: raw.background,
      imageUrl: raw.image || raw.imageUrl || null,
      modelUrl: raw.modelUrl || null,
      side: raw.side,
      contextId,
      contexts: raw.contexts || (raw.context ? [raw.context] : []),
    };
  },
};
