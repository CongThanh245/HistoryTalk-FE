"use client";

import * as React from "react";
import { Loader2, SendHorizontal, UserRound } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Inline mock chat with a local character. Replies are canned answers built from the character's
 * biography and dates (rotating, with a few keyword hooks) until the school AI chat API exists.
 */

export interface MockChatCharacter {
  name: string;
  title: string;
  biography: string;
  persona?: string;
  bornYear?: number;
  deathYear?: number;
  imageUrl?: string;
}

interface ChatMessage {
  id: number;
  from: "me" | "character";
  text: string;
}

const firstSentence = (text: string) => (text.match(/^[^.!?…]+[.!?…]?/)?.[0] ?? text).trim();

function buildReplies(c: MockChatCharacter) {
  const lifespan =
    c.bornYear && c.deathYear
      ? `Ta sinh năm ${c.bornYear}, mất năm ${c.deathYear}.`
      : c.bornYear
        ? `Ta sinh năm ${c.bornYear}.`
        : "Năm tháng của ta sử sách còn ghi chép chưa đủ.";
  const rotating = [
    `Con hỏi hay lắm. ${firstSentence(c.biography)} Mỗi việc ta làm đều vì bà con, vì quê hương.`,
    `Chuyện đời ta kể ra thì dài, nhưng tóm lại thế này: ${c.biography}`,
    "Con thử đặt mình vào hoàn cảnh lúc ấy xem: đất nước bị chiếm, dân chúng cực khổ. Con sẽ chọn đứng ngoài hay đứng lên?",
    "Ta mong thế hệ các con hiểu rằng độc lập, tự do không tự nhiên mà có. Nó được đổi bằng mồ hôi và máu của bao người.",
    `Người đời nhớ đến ta là "${c.title}". Nhưng ta chỉ là một người con của mảnh đất này mà thôi.`,
  ];
  const keyword: { test: RegExp; reply: string }[] = [
    { test: /(vì sao|tại sao|lý do|nguyên nhân)/i, reply: `Lý do ư? ${firstSentence(c.biography)} Thấy cảnh nước mất nhà tan, ta không thể ngồi yên.` },
    { test: /(năm|khi nào|bao giờ|sinh|mất|hy sinh)/i, reply: `${lifespan} ${firstSentence(c.biography)}` },
    { test: /(tổ chức|nghĩa quân|quân|chiến thuật|đánh)/i, reply: "Ta tập hợp bà con thành từng toán nhỏ, mỗi toán có người đứng đầu, giữ liên lạc kín đáo và hẹn ngày giờ cùng nổi dậy. Muốn thắng phải được lòng dân trước đã." },
    { test: /(cảm ơn|cám ơn|tạm biệt)/i, reply: "Không có chi. Con học cho giỏi, nhớ về cội nguồn là ta vui rồi." },
  ];
  return { rotating, keyword };
}

export function StudentMockChat({
  character,
  onStudentMessage,
  disabled,
  disabledReason,
  className,
}: {
  character: MockChatCharacter;
  /** Called after each message the student sends (e.g. to bump the assignment's message counter). */
  onStudentMessage?: () => void;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
}) {
  const replies = React.useMemo(() => buildReplies(character), [character]);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => [
    { id: 0, from: "character", text: `Chào con, ta là ${character.name} (${character.title}). Con muốn hỏi ta điều gì?` },
  ]);
  const [draft, setDraft] = React.useState("");
  const [typing, setTyping] = React.useState(false);
  const turn = React.useRef(0);
  const nextId = React.useRef(1);
  const listRef = React.useRef<HTMLDivElement>(null);
  const timers = React.useRef<number[]>([]);

  React.useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  React.useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  function send() {
    const text = draft.trim();
    if (!text || disabled || typing) return;
    setMessages((m) => [...m, { id: nextId.current++, from: "me", text }]);
    setDraft("");
    onStudentMessage?.();
    setTyping(true);
    const hit = replies.keyword.find((k) => k.test.test(text));
    const reply = hit ? hit.reply : replies.rotating[turn.current++ % replies.rotating.length];
    const t = window.setTimeout(() => {
      setMessages((m) => [...m, { id: nextId.current++, from: "character", text: reply }]);
      setTyping(false);
    }, 650);
    timers.current.push(t);
  }

  return (
    <section
      className={cn("flex flex-col rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)]", className)}
      aria-label={`Trò chuyện với ${character.name}`}
    >
      <header className="flex items-center gap-3 border-b border-[var(--border-default)] px-4 py-3">
        {character.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- teacher-provided URL of any host
          <img src={character.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-[2px] object-cover" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-white" aria-hidden="true">
            <UserRound className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold uppercase leading-tight text-content-text">{character.name}</p>
          <p className="truncate text-[12px] text-content-muted">{character.title}</p>
        </div>
        <span className="ml-auto shrink-0 rounded-[2px] border border-[var(--border-strong)] px-2 py-0.5 text-[11px] font-bold text-content-muted">
          Mô phỏng
        </span>
      </header>

      <div ref={listRef} className="max-h-[420px] min-h-[260px] flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-[2px] px-3 py-2 text-[14px] leading-relaxed",
                m.from === "me"
                  ? "bg-[var(--accent-gold)] text-white"
                  : "border border-[var(--border-default)] bg-[var(--bg-elevated)] text-content-text",
              )}
            >
              {m.text}
            </p>
          </div>
        ))}
        {typing && (
          <div className="flex items-center gap-2 text-[13px] text-content-muted">
            <Loader2 className="h-3.5 w-3.5 motion-safe:animate-spin" aria-hidden="true" />
            {character.name} đang trả lời...
          </div>
        )}
      </div>

      <form
        className="flex items-end gap-2 border-t border-[var(--border-default)] p-3"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="mock-chat-input" className="sr-only">
          Tin nhắn
        </label>
        <textarea
          id="mock-chat-input"
          rows={1}
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={disabled ? (disabledReason ?? "Không thể gửi tin nhắn") : `Hỏi ${character.name}...`}
          className="max-h-32 min-h-[42px] flex-1 resize-none rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[14px] text-content-text outline-none focus-visible:border-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button type="submit" className="btn-crimson shrink-0 px-4 disabled:cursor-not-allowed disabled:opacity-50" disabled={disabled || typing || !draft.trim()} aria-label="Gửi">
          <SendHorizontal className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>
    </section>
  );
}
