import type { GetEventsParams } from "@/services/event.service";
import { GetLandmarksParams } from "@/services/landmark.service";
import { GetQuizSetsParams } from "@/services/quiz.service";
import { GetStaffQuizzesParams } from "@/services/staff.quiz.service";

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
    sessions: (characterId: string) =>
      ["chat", "sessions", characterId] as const,
    messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
    history: ["chat", "history"] as const,
    character: (characterId: string) =>
      ["chat", "character", characterId] as const,
  },
  chatHistory: {
    all: ["chatHistory"] as const,
    list: () => ["chatHistory", "list"] as const,
  },

  documents: {
    all: ["documents"] as const,
    characterAll: ["documents", "character"] as const,
    characterDetail: (docId: string) =>
      ["documents", "character", "detail", docId] as const,
    characterSearch: (keyword: string) =>
      ["documents", "character", "search", keyword] as const,
    historicalByContext: (contextId: string) =>
      ["documents", "historical", "context", contextId] as const,
    characterByCharacter: (characterId: string) =>
      ["documents", "character", "character", characterId] as const,
  },

  quizzes: {
    all: ["quizzes"] as const,
    list: (params?: GetQuizSetsParams) =>
      ["quizzes", "list", params ?? {}] as const,
    detail: (id: string) => ["quizzes", "detail", id] as const,
    myResults: ["quizzes", "results", "me"] as const,
  },
  landmarks: {
    all: ["landmarks"] as const,
    list: (params?: GetLandmarksParams) =>
      ["landmarks", "list", params ?? {}] as const,
    detail: (id: string) => ["landmarks", "detail", id] as const,
    events: (contextIds: string[]) =>
      ["landmarks", "events", contextIds] as const,
  },

  staffQuizzes: {
    all: ["staff", "quizzes"] as const,
    list: (params?: GetStaffQuizzesParams) =>
      ["staff", "quizzes", "list", params ?? {}] as const,
    detail: (id: string) => ["staff", "quizzes", "detail", id] as const,
  },

  payments: {
    tiers: ["payments", "tiers"] as const,
    history: ["payments", "history"] as const,
    myHistory: ["payments", "me"] as const,
  },

  profile: {
    me: ["profile", "me"] as const,
  },

  trash: {
    quizzes: ["trash", "quizzes"] as const,
    contexts: ["trash", "historical-contexts"] as const,
    characters: ["trash", "characters"] as const,
  },
} as const;
