import { create } from "zustand";

interface SessionState {
  isExpired: boolean;
  showExpired: () => void;
  hideExpired: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isExpired: false,
  showExpired: () => set({ isExpired: true }),
  hideExpired: () => set({ isExpired: false }),
}));
