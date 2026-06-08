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
