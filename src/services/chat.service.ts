import { axiosClient } from "@/configs/axios.client";

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

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "USER" | "ASSISTANT";
  content: string;
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
}
// ── Service ──────────────────────────────────────────────

export const chatService = {
  getSessions: async (
    contextId: string,
    characterId: string,
  ): Promise<ChatSession[]> => {
    const res = await axiosClient.get("/chat/sessions", {
      params: { contextId, characterId },
      timeout: 90000, 
    });
    return res.data.data;
  },

  createSession: async (
    contextId: string,
    characterId: string,
  ): Promise<ChatSession> => {
    const res = await axiosClient.post(
      "/chat/sessions",
      {
        contextId,
        characterId,
      },
      {
        timeout: 90000,
      },
    );
    const sessionData = res.data.data.session;
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
      },
      {
        timeout: 90000,
      },
    );
    return res.data.data;
  },

  getHistory: async (): Promise<ChatHistoryGroup[]> => {
    const res = await axiosClient.get("/chat/history");
    return res.data.data;
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
    // Handle multiple API response formats for contextId
    const contextId =
      raw.context?.contextId ??
      raw.context?.id ??
      raw.contextId ??
      raw.contextIds?.[0]?.contextId ??
      raw.contexts?.[0]?.contextId ??
      null;
    return {
      id: raw.characterId,
      name: raw.name,
      title: raw.title,
      description: raw.background,
      imageUrl: raw.image || raw.imageUrl || null,
      modelUrl: raw.modelUrl || null,
      side: raw.side,
      contextId,
    };
  },
};
