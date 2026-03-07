import { AuthTokens, User } from "@/features/auth/type";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;

  setAuth: (user: User, tokens: AuthTokens) => void;
  clearAuth: () => void;
  setTokens: (tokens: AuthTokens) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setAuth: (user, tokens) => set({ user, tokens, isAuthenticated: true }),

      clearAuth: () =>
        set({ user: null, tokens: null, isAuthenticated: false }),

      setTokens: (tokens) => set((state) => ({ ...state, tokens })),
    }),
    {
      name: "auth-storage",
      // Chỉ persist tokens, không persist derived state
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
