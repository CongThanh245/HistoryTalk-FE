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
