import {
  CircleHelp,
  Flag,
  GitBranch,
  MessageSquareText,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { Expression, StoryNodeKind } from "./types";

export type KindMeta = {
  label: string;
  /** One line shown in the palette. */
  hint: string;
  icon: LucideIcon;
  /** CSS colour (a token defined in story.css). */
  color: string;
  /** Keyboard shortcut to add this kind (palette). */
  shortcut?: string;
};

export const KIND_META: Record<StoryNodeKind, KindMeta> = {
  start: { label: "Bắt đầu", hint: "Điểm vào của câu chuyện", icon: Flag, color: "var(--story-start)" },
  line: {
    label: "Lời thoại",
    hint: "Nhân vật nói hoặc người dẫn truyện kể",
    icon: MessageSquareText,
    color: "var(--story-line)",
    shortcut: "1",
  },
  choice: {
    label: "Lựa chọn",
    hint: "Người học chọn nhánh câu chuyện",
    icon: GitBranch,
    color: "var(--story-choice)",
    shortcut: "2",
  },
  quiz: {
    label: "Câu hỏi",
    hint: "Kiểm tra nhanh, sai thì đi nhánh giải thích",
    icon: CircleHelp,
    color: "var(--story-quiz)",
    shortcut: "3",
  },
  end: {
    label: "Kết thúc",
    hint: "Tổng kết, cộng XP, mở khóa nhân vật",
    icon: Trophy,
    color: "var(--story-end)",
    shortcut: "4",
  },
};

/** Kinds that can be added from the palette (the start node is unique). */
export const ADDABLE_KINDS: Exclude<StoryNodeKind, "start">[] = ["line", "choice", "quiz", "end"];

export const EXPRESSIONS: { id: Expression; label: string; emoji: string }[] = [
  { id: "neutral", label: "Bình thường", emoji: "🙂" },
  { id: "happy", label: "Vui", emoji: "😄" },
  { id: "serious", label: "Nghiêm", emoji: "😐" },
  { id: "sad", label: "Buồn", emoji: "😔" },
  { id: "angry", label: "Giận", emoji: "😠" },
  { id: "surprised", label: "Ngạc nhiên", emoji: "😮" },
];

export const NARRATOR_LABEL = "Người dẫn truyện";
