import { AuthTokens, User } from "@/features/auth/type";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setTokens: (tokens: AuthTokens) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  /** Đồng bộ một phần thông tin user (avatar, tên, tier…) từ /users/me lên store */
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, tokens: null, isAuthenticated: false }),

      setTokens: (tokens) => set((state) => ({ ...state, tokens })),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
    }),
    {
      name: "auth-storage",
      // Chỉ persist tokens, không persist derived state
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

// Keep Zustand auth state in sync across browser tabs so a rotated refreshToken
// in one tab does not leave stale tokens in other open tabs.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key !== "auth-storage" || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as {
        state?: {
          user?: User | null;
          tokens?: AuthTokens | null;
          isAuthenticated?: boolean;
        };
      };
      if (parsed?.state) {
        useAuthStore.setState({
          user: parsed.state.user ?? null,
          tokens: parsed.state.tokens ?? null,
          isAuthenticated: Boolean(parsed.state.isAuthenticated),
        });
      }
    } catch {
      // Ignore malformed storage payload
    }
  });
}
