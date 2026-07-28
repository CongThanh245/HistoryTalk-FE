import { create } from "zustand";

interface SessionState {
  isExpired: boolean;
  showExpired: () => void;
  hideExpired: () => void;
  isLocked: boolean;
  showLocked: () => void;
  hideLocked: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isExpired: false,
  showExpired: () => set({ isExpired: true }),
  hideExpired: () => set({ isExpired: false }),
  isLocked: false,
  showLocked: () => set({ isLocked: true }),
  hideLocked: () => set({ isLocked: false }),
}));
