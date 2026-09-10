// src/services/admin.quest.service.ts
import { axiosClient } from "@/configs/axios.client";

// ─── Types ──────────────────────────────────────────────────────────────────
// type chỉ hỗ trợ 3 giá trị đã wire sẵn ở backend (chat/quiz/đọc bối cảnh) —
// xem docs/GAMIFICATION_CRUD_PLAN.md §2.1.
export type AdminQuestType = "CHAT" | "QUIZ" | "READ_CONTEXT";

export interface AdminQuest {
  id: string;
  questId: string;
  type: AdminQuestType;
  title: string;
  target: number;
  rewardTokens: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Không có Create/Delete — quest được seed sẵn, staff chỉ chỉnh các field này. */
export interface UpdateQuestPayload {
  type?: AdminQuestType;
  title?: string;
  target?: number;
  rewardTokens?: number;
  order?: number;
  isActive?: boolean;
}

// ─── Service ─────────────────────────────────────────────────────────────────

const BASE = "/staff/quests";

export const adminQuestService = {
  /** Toàn bộ quest, kể cả đang tắt (isActive:false) */
  listQuests: async (): Promise<AdminQuest[]> => {
    const res = await axiosClient.get(BASE);
    return (res.data.data ?? res.data) as AdminQuest[];
  },

  /** Không có API tạo/xoá hẳn — dùng payload.isActive=false để ẩn quest khỏi app. */
  updateQuest: async (id: string, payload: UpdateQuestPayload): Promise<AdminQuest> => {
    const res = await axiosClient.put(`${BASE}/${id}`, payload);
    return (res.data.data ?? res.data) as AdminQuest;
  },
};
