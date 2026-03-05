import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ── Types ─────────────────────────────────────────────────

export interface ChatCharacter {
  id: string;
  name: string;
  title: string;
  description: string;
  imageUrl: string;       // vd: /ngo-quyen.jpg
  era: string;
  side?: string;
}

export interface ChatSession {
  id: string;
  characterId: string;
  eventId: string;
  title: string;          // tên cuộc trò chuyện (tự generate hoặc user đặt)
  lastMessage: string;
  lastMessageAt: string;  // ISO date
  messageCount: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ChatEvent {
  id: string;
  title: string;          // vd: "Trận Bạch Đằng 938"
  year: number;
  characters: ChatCharacter[];
}

export interface SendMessagePayload {
  sessionId: string;
  characterId: string;
  eventId: string;
  content: string;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

// ── Service ──────────────────────────────────────────────

export const chatService = {
  // Lấy thông tin sự kiện + nhân vật theo eventId
  getEvent: async (eventId: string): Promise<ChatEvent> => {
    const res = await axios.get(`${API_URL}/events/${eventId}`);
    return res.data;
  },

  // Lấy thông tin nhân vật
  getCharacter: async (characterId: string): Promise<ChatCharacter> => {
    const res = await axios.get(`${API_URL}/characters/${characterId}`);
    return res.data;
  },

  // Lấy danh sách session của user theo eventId + characterId
  getSessions: async (eventId: string, characterId: string): Promise<ChatSession[]> => {
    const res = await axios.get(`${API_URL}/chat/sessions`, {
      params: { eventId, characterId },
    });
    return res.data;
  },

  // Lấy messages của 1 session
  getMessages: async (sessionId: string): Promise<ChatMessage[]> => {
    const res = await axios.get(`${API_URL}/chat/sessions/${sessionId}/messages`);
    return res.data;
  },

  // Tạo session mới
  createSession: async (eventId: string, characterId: string): Promise<ChatSession> => {
    const res = await axios.post(`${API_URL}/chat/sessions`, { eventId, characterId });
    return res.data;
  },

  // Gửi tin nhắn
  sendMessage: async (payload: SendMessagePayload): Promise<SendMessageResponse> => {
    const res = await axios.post(`${API_URL}/chat/messages`, payload);
    return res.data;
  },
};