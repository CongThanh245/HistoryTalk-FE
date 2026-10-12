"use client";

import { create } from "zustand";
import type { CredentialRecord } from "@/components/saas/accounts-utils";
import type { ImportedStudentAccount, StudentImportResult } from "@/services/school.service";

/**
 * Last student import of this browser tab (memory only, never persisted), so the Students page can reopen the
 * one-time credentials (CSV, print sheet) after the wizard closes. Passwords are kept only until reload / clear.
 */
export interface ImportSession {
  result: StudentImportResult;
  fileName: string;
  importedAt: string;
  defaultInitialToken: number;
  /** Original file line of each row sent to the backend (backend rowNumber n → sentLines[n - 2]). */
  sentLines: number[];
  /** Rows dropped by the client-side check before sending. */
  skippedRows: number;
}

interface ImportSessionState {
  last: ImportSession | null;
  setLast: (s: ImportSession) => void;
  clear: () => void;
}

export const useImportSession = create<ImportSessionState>()((set) => ({
  last: null,
  setLast: (last) => set({ last }),
  clear: () => set({ last: null }),
}));

export function studentCredentials(accounts: ImportedStudentAccount[]): CredentialRecord[] {
  return accounts.map((a) => ({
    id: a.uid,
    fullName: a.fullName,
    login: a.email,
    userName: a.userName,
    password: a.initialPassword,
    roleLabel: "Học sinh",
    studentCode: a.studentCode,
  }));
}

/** The backend leaves `totalTokensAllocated` at 0; fall back to the sum of the accounts. */
export const tokensAllocated = (r: StudentImportResult) =>
  r.totalTokensAllocated || r.successfulAccounts.reduce((sum, a) => sum + (a.allocatedToken ?? 0), 0);

/** Original file line for a backend row number. */
export const originalLine = (s: Pick<ImportSession, "sentLines">, rowNumber: number) => s.sentLines[rowNumber - 2] ?? rowNumber;
