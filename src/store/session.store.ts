import { create } from "zustand";

interface SessionState {
  isExpired: boolean;
  showExpired: () => void;
  hideExpired: () => void;
  isLocked: boolean;
  showLocked: () => void;
  hideLocked: () => void;
  /**
   * Set when the backend answers SCHOOL_SUBSCRIPTION_EXPIRED / _NOT_STARTED: the school year subscription
   * (01/09 – 31/05) has ended or not started, so the whole school is locked. Holds the backend message.
   */
  schoolLock: { code: "SCHOOL_SUBSCRIPTION_EXPIRED" | "SCHOOL_SUBSCRIPTION_NOT_STARTED"; message: string } | null;
  showSchoolLock: (lock: NonNullable<SessionState["schoolLock"]>) => void;
  hideSchoolLock: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isExpired: false,
  showExpired: () => set({ isExpired: true }),
  hideExpired: () => set({ isExpired: false }),
  isLocked: false,
  showLocked: () => set({ isLocked: true }),
  hideLocked: () => set({ isLocked: false }),
  schoolLock: null,
  showSchoolLock: (schoolLock) => set({ schoolLock }),
  hideSchoolLock: () => set({ schoolLock: null }),
}));
