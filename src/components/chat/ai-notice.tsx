"use client";

import { useState, useSyncExternalStore } from "react";
import { AlertTriangle, Flag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const AI_FEEDBACK_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeRil6ykImcwwFkgnV0lzFHWo8NLgOrOKNjTHNqq8Tt0-XMEQ/viewform?usp=dialog";

const ACK_KEY_PREFIX = "historytalk:ai-notice-ack";

const readAck = (key: string) => {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeAck = (key: string) => {
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage blocked (private mode) — the notice will just show again next time.
  }
};

const subscribeStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

/** One-line reminder that stays under the chat input at all times. */
export function AiDisclaimerFooter({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-center justify-center gap-1 px-4 pb-2 text-center text-[10px] leading-snug text-content-muted",
        className,
      )}
    >
      <AlertTriangle className="h-3 w-3 shrink-0 text-(--status-warning)" aria-hidden="true" />
      <span>
        Nhân vật do AI nhập vai và có thể sai. Hãy đối chiếu với sách giáo khoa, tư liệu chính thống.{" "}
        <a
          href={AI_FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold underline underline-offset-2 hover:text-content-text"
        >
          Báo lỗi
        </a>
      </span>
    </p>
  );
}

/**
 * Shown once per user per character before the first conversation, so the student
 * explicitly acknowledges they are talking to an AI role-play, not the real person.
 */
export function AiFirstChatNotice({
  characterId,
  characterName,
  userId,
}: {
  characterId: string;
  characterName: string;
  userId?: string | null;
}) {
  const storageKey = `${ACK_KEY_PREFIX}:${userId ?? "guest"}:${characterId}`;
  // Server snapshot = "acknowledged" so SSR never renders the dialog (no hydration mismatch).
  const acknowledged = useSyncExternalStore(
    subscribeStorage,
    () => readAck(storageKey),
    () => true,
  );
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const open = !acknowledged && dismissedKey !== storageKey;

  const acknowledge = () => {
    writeAck(storageKey);
    setDismissedKey(storageKey);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && acknowledge()}>
      <DialogContent className="rounded-sm border border-border-card bg-bg-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="archive-title is-plain flex items-center gap-2 text-xl">
            <AlertTriangle className="h-5 w-5 shrink-0 text-(--status-warning)" aria-hidden="true" />
            Trước khi trò chuyện
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-content-text">
            Bạn sắp trò chuyện với <strong className="text-content-heading">AI nhập vai {characterName}</strong>,
            không phải nhân vật thật.
          </DialogDescription>
        </DialogHeader>

        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-content-text">
          <li>Lời thoại do AI tạo ra để phục vụ học tập, không phải phát ngôn hay quan điểm thật của nhân vật.</li>
          <li>AI có thể sai về sự kiện, mốc thời gian, số liệu hoặc cách đánh giá.</li>
          <li>Ưu tiên câu trả lời có nguồn trích dẫn và luôn đối chiếu với sách giáo khoa.</li>
          <li>Không chia sẻ thông tin cá nhân (số điện thoại, địa chỉ, mật khẩu) trong cuộc trò chuyện.</li>
          <li>Thấy câu trả lời sai hoặc không phù hợp? Bấm biểu tượng cờ dưới câu trả lời để báo lỗi.</li>
        </ul>

        <DialogFooter>
          <button
            type="button"
            onClick={acknowledge}
            className="w-full rounded-sm border border-accent-gold bg-accent-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:border-accent-bronze hover:bg-accent-bronze"
          >
            Tôi đã hiểu, bắt đầu trò chuyện
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Per-answer report button. The feedback form has no prefill fields wired up, so we
 * copy the answer to the clipboard and open the form for the student to paste it in.
 */
export function ReportAnswerButton({
  characterName,
  content,
}: {
  characterName: string;
  content: string;
}) {
  const handleClick = async () => {
    const snippet = `[${characterName}] ${content}`.slice(0, 2000);
    let copied = false;
    try {
      await navigator.clipboard.writeText(snippet);
      copied = true;
    } catch {
      copied = false;
    }
    window.open(AI_FEEDBACK_FORM_URL, "_blank", "noopener,noreferrer");
    toast.info(
      copied
        ? "Đã sao chép câu trả lời. Hãy dán vào form để báo lỗi."
        : "Hãy dán hoặc mô tả câu trả lời bị sai vào form.",
    );
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Báo lỗi câu trả lời này"
      title="Báo lỗi câu trả lời này"
      className="inline-flex items-center gap-1 text-[10px] tracking-[0.06em] text-content-muted transition-colors hover:text-(--status-warning)"
    >
      <Flag className="h-3 w-3" aria-hidden="true" />
      Báo lỗi
    </button>
  );
}
