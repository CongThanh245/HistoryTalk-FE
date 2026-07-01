import { axiosClient } from "@/configs/axios.client";
import { useAuthStore } from "@/store/auth.store";
import { normalizeChatHistoryGroups } from "./chat-history.mapper";

// ── Types theo API response ───────────────────────────────

export interface ChatSession {
  id: string;
  characterId: string;
  contextId: string; // ← đổi từ eventId
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  messageCount: number;
}

export type MessageType = "TEXT" | "VOICE";

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  messageType: MessageType;
  createdAt: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  suggestedQuestions: string[];
  remainingTokens: number;
  promptTokens: number;
  completionTokens: number;
}

export interface GetMessagesResponse {
  messages: ChatMessage[];
  suggestedQuestions: string[];
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
}

export interface ChatHistoryGroup {
  contextId: string;
  contextName: string; // ← đổi từ eventTitle
  sessions: ChatHistorySession[];
}

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
  ): Promise<ChatSession> => {
    const res = await axiosClient.post(
      "/chat/sessions",
      {
        characterId,
        contextId,
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
    onDone: (data: { remainingTokens?: number, suggestedQuestions?: string[], fullContent: string, promptTokens?: number, completionTokens?: number, messageType?: "TEXT" | "VOICE" }) => void,
    onError: (error: unknown) => void,
    messageTypeParam: "TEXT" | "VOICE" = "TEXT"
  ) => {
    try {
      let messageType = messageTypeParam;
      const token = useAuthStore.getState().tokens?.accessToken;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
      const basePath = process.env.NEXT_PUBLIC_API_BASE_PATH || '/Historical-tell/api/v1';
      
      const response = await fetch(`${baseUrl}${basePath}/chat/messages/stream`, {
        method: "POST",
        headers,
        body: JSON.stringify({ sessionId, content, messageType }),
      });

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

      let fullContent = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data:")) {
              try {
                const dataStr = line.substring(line.indexOf(":") + 1).trim();
                if (!dataStr) continue;
                const parsed = JSON.parse(dataStr);
                
                if (parsed.type === "text") {
                  fullContent += parsed.data;
                  onData(parsed.data);
                } else if (parsed.type === "metadata") {
                   suggestedQuestions = parsed.data?.suggestedQuestions;
                   promptTokens = parsed.data?.promptTokens;
                   completionTokens = parsed.data?.completionTokens;
                } else if (parsed.type === "done") {
                   remainingTokens = parsed.remainingTokens;
                   if (parsed.messageType) {
                     messageType = parsed.messageType;
                   }
                }
              } catch {
                console.warn("Failed to parse SSE data line", line);
              }
            }
          }
        }
      }
      onDone({ remainingTokens, suggestedQuestions, fullContent, promptTokens, completionTokens, messageType });
    } catch (err) {
      onError(err);
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
