import type { GetEventsParams } from "@/services/event.service";
import { GetQuizSetsParams } from "@/services/scenario.service";

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
    create: ["events", "create"] as const, // ← thêm
    update: (id: string) => ["events", "update", id] as const, // ← thêm
    delete: (id: string) => ["events", "delete", id] as const, // ← thêm
  },

  characters: {
    all: ["characters"] as const,
    list: (params?: { search?: string; page?: number; limit?: number }) =>
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
    sessions: (contextId: string, characterId: string) =>
      ["chat", "sessions", contextId, characterId] as const,
    messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
    history: ["chat", "history"] as const,
    character: (characterId: string) =>
      ["chat", "character", characterId] as const,
  },
  chatHistory: {
    all: ["chatHistory"] as const,
    list: () => ["chatHistory", "list"] as const,
  },

  quizzes: {
    all: ["quizzes"] as const,
    list: (params?: GetQuizSetsParams) =>
      ["quizzes", "list", params ?? {}] as const,
    detail: (id: string) => ["quizzes", "detail", id] as const,
    myResults: ["quizzes", "results", "me"] as const,
  },
} as const;
