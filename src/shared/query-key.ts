import type { GetEventsParams } from "@/services/event.service";

export const queryKeys = {
  auth: {
    login: ["auth", "login"] as const,
    register: ["auth", "register"] as const,
  },

  events: {
    all: ["events"] as const,
    list: (params?: GetEventsParams) =>
      ["events", "list", params ?? {}] as const,
    detail: (id: string) => ["events", "detail", id] as const,
  },

  characters: {
    all: ["characters"] as const,
    list: (params?: { search?: string; page?: number }) =>
      ["characters", "list", params ?? {}] as const,
    detail: (id: string) => ["characters", "detail", id] as const,
    byContext: (
      contextId: string, // ← thêm
    ) => ["characters", "context", contextId] as const,
  },

  home: {
    recentQuiz: ["home", "recent-quiz"] as const,
    suggestedQuiz: ["home", "suggested-quiz"] as const,
  },

  chat: {
    event: (eventId: string) => ["chat", "event", eventId] as const,
    character: (characterId: string) =>
      ["chat", "character", characterId] as const,
    sessions: (eventId: string, characterId: string) =>
      ["chat", "sessions", eventId, characterId] as const,
    messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
  },
} as const;
