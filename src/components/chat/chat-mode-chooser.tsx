"use client";

import { useState } from "react";
import { GraduationCap, Loader2, MessagesSquare, ScrollText } from "lucide-react";
import { CHAT_MODE_LABELS, type ChatCharacter } from "@/services/chat.service";
import { isValidUrl } from "@/lib/utils/url";
import { cn } from "@/lib/utils/cn";
import { ExamStartDialog } from "./exam-start-dialog";

/**
 * Shown when a character is opened: Phỏng vấn (the learner asks) or Vấn đáp (the character asks and grades).
 * Interview resumes the latest interview when there is one.
 */
export function ChatModeChooser({
  character,
  hasInterview,
  busy,
  onInterview,
  onExam,
}: {
  character: ChatCharacter;
  /** An earlier interview with this character exists, so the button resumes it. */
  hasInterview: boolean;
  /** A session is being created. */
  busy?: boolean;
  onInterview: () => void;
  onExam: (questionCount: number) => void;
}) {
  const [examOpen, setExamOpen] = useState(false);
  const cards = [
    {
      key: "interview",
      icon: MessagesSquare,
      title: CHAT_MODE_LABELS.CHAT,
      who: `Bạn hỏi, ${character.name} trả lời`,
      body: "Đặt bất cứ câu hỏi nào về cuộc đời, trận đánh hay quyết định của nhân vật. Câu trả lời dựa trên tư liệu và có trích dẫn nguồn.",
      action: hasInterview ? "Tiếp tục phỏng vấn" : "Bắt đầu phỏng vấn",
      onClick: onInterview,
    },
    {
      key: "exam",
      icon: GraduationCap,
      title: CHAT_MODE_LABELS.EXAM,
      who: `${character.name} hỏi, bạn trả lời`,
      body: "Nhân vật hỏi lần lượt từng câu, nhận xét ngay sau mỗi câu trả lời và cho điểm trên thang 10 khi xong.",
      action: "Chọn số câu và bắt đầu",
      onClick: () => setExamOpen(true),
    },
  ];

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 py-10">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-border-card bg-[var(--bg-deep)]">
            {isValidUrl(character.imageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element -- character images come from several storage hosts
              <img src={character.imageUrl!} alt="" className="h-full w-full object-cover object-top" />
            ) : (
              <span className="grid h-full w-full place-items-center">
                <ScrollText className="h-7 w-7 text-content-muted" aria-hidden="true" />
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-content-muted">{character.title}</p>
            <h2 className="archive-title is-plain truncate text-[26px]">Gặp {character.name}</h2>
            <p className="text-sm text-content-text">Bạn muốn trò chuyện theo cách nào?</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <button
              key={card.key}
              type="button"
              disabled={busy}
              onClick={card.onClick}
              className={cn(
                "group flex flex-col gap-3 rounded-sm border border-[var(--text-primary)] bg-[var(--bg-surface)] p-5 text-left transition-colors",
                "hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)] disabled:cursor-wait disabled:opacity-60",
              )}
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-sm border border-current">
                  <card.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-[15px] font-bold uppercase tracking-[0.08em]">{card.title}</span>
                  <span className="block text-xs opacity-75">{card.who}</span>
                </span>
              </span>
              <span className="text-sm leading-relaxed opacity-85">{card.body}</span>
              <span className="mt-auto inline-flex items-center gap-2 pt-1 text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--accent-gold)] group-hover:text-[var(--text-inverse)]">
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                {card.action} →
              </span>
            </button>
          ))}
        </div>
      </div>

      <ExamStartDialog open={examOpen} characterName={character.name} onOpenChange={setExamOpen} onStart={onExam} />
    </div>
  );
}
