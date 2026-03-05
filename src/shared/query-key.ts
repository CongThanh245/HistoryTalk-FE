import type { GetEventsParams } from "@/services/event.service";

export const QUERY_KEY = {
  Auth: {
    Login: "login",
    Register: "register",
  },
};
// Thêm vào src/lib/react-query/query-keys.ts

// Paste 2 dòng này vào object queryKeys hiện có:
//
//   homeRecentQuiz:    ["home", "recent-quiz"],
//   homeSuggestedQuiz: ["home", "suggested-quiz"],
//
// Ví dụ kết quả:
//
// export const queryKeys = {
//   characters:        ["characters"],
//   character:         (id: string) => ["character", id],
//   homeRecentQuiz:    ["home", "recent-quiz"],      ← thêm
//   homeSuggestedQuiz: ["home", "suggested-quiz"],   ← thêm
// };

export const homeQueryKeys = {
  recentQuiz: ["home", "recent-quiz"] as const,
  suggestedQuiz: ["home", "suggested-quiz"] as const,
};

// Thêm vào src/lib/react-query/query-keys.ts
//
// events:  ["events"],
// event:   (id: string) => ["events", id],

// Thêm vào src/lib/react-query/query-keys.ts
export const eventQueryKeys = {
  all: ["events"] as const,
  list: (params?: GetEventsParams) => ["events", "list", params ?? {}] as const,
  detail: (id: string) => ["events", "detail", id] as const,
};
export const chatQueryKeys = {
  event: (eventId: string) => ["chat", "event", eventId] as const,
  character: (characterId: string) =>
    ["chat", "character", characterId] as const,
  sessions: (eventId: string, characterId: string) =>
    ["chat", "sessions", eventId, characterId] as const,
  messages: (sessionId: string) => ["chat", "messages", sessionId] as const,
};
