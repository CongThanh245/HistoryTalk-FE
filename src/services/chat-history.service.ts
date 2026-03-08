// src/services/chat-history.service.ts
// Re-export để các component cũ không cần đổi import path

export type {
  ChatHistoryGroup,
  ChatHistorySession as ChatHistoryItem,
} from "./chat.service";

export { chatService as chatHistoryService } from "./chat.service";
