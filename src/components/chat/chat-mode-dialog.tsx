"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, MessagesSquare, ScrollText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuthRequiredNavigation } from "@/features/auth/use-auth-required-navigation";
import { CHAT_MODE_LABELS } from "@/services/chat.service";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";
import { ExamStartDialog } from "./exam-start-dialog";

export interface ChatModeTarget {
  id: string;
  name: string;
  title?: string | null;
  imageUrl?: string | null;
  /** Event the conversation is about; the chat page picks the character's first one when absent. */
  contextId?: string | null;
}

/** Popup target for a character from the character list or an event. */
export function chatModeTargetOf(
  character: { id: string; name: string; title?: string | null; role?: string | null; imageUrl?: string | null; avatarUrl?: string | null },
  contextId?: string | null,
): ChatModeTarget {
  return {
    id: character.id,
    name: character.name,
    title: character.role || character.title,
    imageUrl: isValidUrl(character.imageUrl) ? character.imageUrl : character.avatarUrl,
    contextId,
  };
}

/** Chat page link that opens straight into a mode: an interview, or an exam with `questions` questions. */
export function chatModeHref(target: ChatModeTarget, mode: "chat" | "exam", questions?: number) {
  const params = new URLSearchParams({ mode });
  if (target.contextId) params.set("contextId", target.contextId);
  if (mode === "exam" && questions) params.set("questions", String(questions));
  return `/chat/${target.id}?${params}`;
}

/**
 * Popup asking Phỏng vấn (the learner asks) or Vấn đáp (the character asks and grades) before the chat page opens.
 * Vấn đáp then asks how many questions.
 */
export function ChatModeDialog({
  target,
  onOpenChange,
}: {
  /** The character to talk to; null closes the popup. */
  target: ChatModeTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [examFor, setExamFor] = useState<ChatModeTarget | null>(null);

  const cards = target
    ? [
        {
          key: "interview",
          icon: MessagesSquare,
          title: CHAT_MODE_LABELS.CHAT,
          who: `Bạn hỏi, ${target.name} trả lời`,
          body: "Đặt bất cứ câu hỏi nào về cuộc đời, trận đánh hay quyết định của nhân vật. Câu trả lời dựa trên tư liệu và có trích dẫn nguồn.",
          action: "Vào phỏng vấn",
          onClick: () => {
            onOpenChange(false);
            router.push(chatModeHref(target, "chat"));
          },
        },
        {
          key: "exam",
          icon: GraduationCap,
          title: CHAT_MODE_LABELS.EXAM,
          who: `${target.name} hỏi, bạn trả lời`,
          body: "Nhân vật hỏi lần lượt từng câu, nhận xét ngay sau mỗi câu trả lời và cho điểm trên thang 10 khi xong.",
          action: "Chọn số câu",
          onClick: () => {
            setExamFor(target);
            onOpenChange(false);
          },
        },
      ]
    : [];

  return (
    <>
      <Dialog open={!!target} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
          {target && (
            <>
              <DialogHeader className="min-w-0 flex-row items-center gap-4 text-left">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-sm border border-border-card bg-[var(--bg-deep)]">
                  {isValidUrl(target.imageUrl) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- character images come from several storage hosts
                    <img src={target.imageUrl!} alt="" className="h-full w-full object-cover object-top" />
                  ) : (
                    <span className="grid h-full w-full place-items-center">
                      <ScrollText className="h-6 w-6 text-content-muted" aria-hidden="true" />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  {target.title && (
                    <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-content-muted">{target.title}</p>
                  )}
                  <DialogTitle className="archive-title is-plain truncate text-[22px]">Gặp {target.name}</DialogTitle>
                  <DialogDescription className="text-sm text-content-text">Bạn muốn trò chuyện theo cách nào?</DialogDescription>
                </div>
              </DialogHeader>

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                {cards.map((card) => (
                  <button
                    key={card.key}
                    type="button"
                    onClick={card.onClick}
                    className={cn(
                      "group flex min-w-0 flex-col gap-3 rounded-sm border border-[var(--text-primary)] bg-[var(--bg-surface)] p-4 text-left transition-colors",
                      "hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-gold)]",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-sm border border-current">
                        <card.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[15px] font-bold uppercase tracking-[0.08em]">{card.title}</span>
                        <span className="block text-xs opacity-75">{card.who}</span>
                      </span>
                    </span>
                    <span className="text-sm leading-relaxed opacity-85">{card.body}</span>
                    <span className="mt-auto pt-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--accent-gold)] group-hover:text-[var(--text-inverse)]">
                      {card.action} →
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ExamStartDialog
        open={!!examFor}
        characterName={examFor?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setExamFor(null);
        }}
        onStart={(questions) => {
          if (!examFor) return;
          const href = chatModeHref(examFor, "exam", questions);
          setExamFor(null);
          router.push(href);
        }}
      />
    </>
  );
}

/** Opens the mode popup for a character, or the sign-in prompt when nobody is signed in. */
export function useChatModePicker(authPrompt?: Parameters<typeof useAuthRequiredNavigation>[0]) {
  const { authRequiredDialog, runWithAuth } = useAuthRequiredNavigation(authPrompt);
  const [target, setTarget] = useState<ChatModeTarget | null>(null);

  const openChatModes = useCallback((next: ChatModeTarget) => runWithAuth(() => setTarget(next)), [runWithAuth]);

  const chatModeDialog = (
    <>
      {authRequiredDialog}
      <ChatModeDialog target={target} onOpenChange={(open) => !open && setTarget(null)} />
    </>
  );

  return { openChatModes, chatModeDialog };
}
