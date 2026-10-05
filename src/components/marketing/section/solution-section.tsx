"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { Container } from "../container";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const solutions = [
  {
    title: "Từ người đọc thành người đối thoại",
    description: "Thay vì chỉ đọc về sự kiện, bạn bước vào một cuộc trò chuyện với nhân vật.",
  },
  {
    title: "Từ sự kiện thành con người",
    description: "Lịch sử không chỉ là điều đã xảy ra, mà là những con người, lựa chọn và hoàn cảnh.",
  },
  {
    title: "Từ ghi nhớ thành thấu hiểu",
    description: "Khi nhìn sự kiện từ góc nhìn nhân vật, người học dễ kết nối nguyên nhân và ý nghĩa.",
  },
];

const chatMessages = [
  {
    id: 1,
    sender: "character",
    name: "Ngô Quyền",
    avatar: "/ngo-quyen-chan-dung.png",
    text: "Ta đã cắm cọc trên sông Bạch Đằng, dòng sông đã trở thành vũ khí của quân ta",
  },
  {
    id: 2,
    sender: "user",
    name: "Người học",
    icon: UserCircle,
    text: "Tại sao lại chọn sông Bạch Đằng ạ?",
  },
  {
    id: 3,
    sender: "character",
    name: "Ngô Quyền",
    avatar: "/ngo-quyen-chan-dung.png",
    text: "Đây là con đường thủy huyết mạch và ngắn nhất để quân Bắc tiến vào Đại La. Nơi đây lòng sông rộng, triều lên xuống mạnh mẽ, hai bên bờ lại nhiều gò bãi, rạch sâu, cây cối um tùm, chính là địa thế trời cho để ta đặt bẫy cọc ngầm và mai phục đại quân!",
  },
];

function TypingText({
  text,
  onComplete,
  isActive,
  hasCompleted,
}: {
  text: string;
  onComplete?: () => void;
  isActive: boolean;
  hasCompleted: boolean;
}) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const completedRef = useRef(hasCompleted);
  const prevIsActiveRef = useRef(isActive);

  useEffect(() => {
    if (!hasCompleted && completedRef.current) {
      completedRef.current = false;
      prevIsActiveRef.current = false;
    }
  }, [hasCompleted]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    // If already completed before, show full text immediately
    if (hasCompleted || completedRef.current) {
      setDisplayText(text);
      setIsTyping(false);
      completedRef.current = true;
      return;
    }

    if (!isActive) {
      setDisplayText("");
      setIsTyping(false);
      prevIsActiveRef.current = isActive;
      return;
    }

    // Only start typing when isActive changes from false to true
    if (isActive && !prevIsActiveRef.current && !completedRef.current) {
      setIsTyping(true);
      let index = 0;
      const interval = setInterval(() => {
        if (index < text.length) {
          setDisplayText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(interval);
          setIsTyping(false);
          completedRef.current = true;
          onComplete?.();
        }
      }, 30);

      prevIsActiveRef.current = isActive;
      return () => clearInterval(interval);
    }

    prevIsActiveRef.current = isActive;
  }, [text, isActive, onComplete, hasCompleted]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <span>
      {displayText}
      {isTyping && (
        <span className="animate-pulse text-[var(--accent-gold)]">|</span>
      )}
    </span>
  );
}

const ChatBubble = React.memo(function ChatBubble({
  message,
  isActive,
  onComplete,
  hasCompleted,
}: {
  message: (typeof chatMessages)[0];
  isActive: boolean;
  onComplete?: () => void;
  hasCompleted: boolean;
}) {
  const isCharacter = message.sender === "character";
  const Icon = message.icon;

  return (
    <div
      className={`flex gap-3 ${isCharacter ? "flex-row" : "flex-row-reverse"} ${
        isActive ? "opacity-100" : "opacity-0"
      } transition-all duration-500`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isCharacter ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border border-[var(--text-primary)]">
            <Image
              src={message.avatar || ""}
              alt={message.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            {Icon && <Icon className="h-5 w-5" />}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isCharacter ? "text-left" : "text-right"}`}>
        <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">{message.name}</div>
        <div
          className={`rounded-[2px] border px-3 py-2 text-xs leading-relaxed ${
            isCharacter
              ? "border-[var(--border-strong)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
              : "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
          }`}
        >
          <TypingText
            text={message.text}
            isActive={isActive}
            onComplete={onComplete}
            hasCompleted={hasCompleted}
          />
        </div>
      </div>
    </div>
  );
});

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeMessage, setActiveMessage] = useState(-1);
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(new Set());
  const [hasStarted, setHasStarted] = useState(false);
  useRevealAnimation(sectionRef);

  const handleNavigateToHome = () => {
    router.push("/home");
  };

  // Intersection Observer to start animation when scrolled into view
  useEffect(() => {
    const chatElement = chatRef.current;
    if (!chatElement) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
            setActiveMessage(0);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(chatElement);
    return () => observer.disconnect();
  }, [hasStarted]);

  const handleMessageComplete = useCallback((messageIndex: number) => {
    setCompletedMessages((prev) => new Set(prev).add(messageIndex));
    if (messageIndex < chatMessages.length - 1) {
      setTimeout(() => {
        setActiveMessage(messageIndex + 1);
      }, 800);
    } else {
    }
  }, []);

  const handleRestart = useCallback(() => {
    setActiveMessage(0);
    setCompletedMessages(new Set());
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-center overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-16 md:py-24"
    >
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, color-mix(in srgb, var(--text-primary) 12%, transparent) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          maskImage: "radial-gradient(ellipse at 55% 50%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 55% 50%, black 20%, transparent 80%)",
        }}
      />

      <Container className="relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-16">

          {/* ── Left column ── */}
          <div className="space-y-8 px-2 md:px-0">

            {/* Heading */}
            <div data-reveal="fast">
              <h2 className="archive-title text-[28px] md:text-[36px] lg:text-[44px]">
                Bước vào góc nhìn của{" "}
                <em>người làm nên lịch sử</em>
              </h2>
              <p className="mt-3 max-w-[360px] text-sm leading-relaxed text-[var(--text-secondary)]">
                History Talk biến những dòng chữ tĩnh thành cuộc đối thoại có bối cảnh, ký ức và phản hồi.
              </p>
            </div>

            {/* Vertical timeline steps */}
            <div data-reveal="fast" className="relative border-t border-[var(--text-primary)]">
              {solutions.map((item, index) => (
                <div key={item.title} className="relative flex gap-5 border-b border-[var(--border-default)] py-4 last:border-[var(--text-primary)]">
                  {/* Step number */}
                  <div className="mt-0.5 w-10 shrink-0 font-display text-[18px] font-extrabold leading-none text-[var(--accent-gold)]">
                    [{String(index + 1).padStart(2, "0")}]
                  </div>

                  <div>
                    <h3 className="archive-title is-plain text-[19px]">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — Chat ── */}
          <div ref={chatRef} data-reveal="block" className="relative">
            <div
              data-motion-card
              className="relative flex h-75 w-full flex-col overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] md:h-105"
            >
              {/* Chat Header */}
              <div
                className="flex h-10 md:h-12 shrink-0 items-center justify-between border-b border-[var(--text-primary)] bg-[var(--bg-elevated)] px-3 md:px-4"
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 md:h-8 md:w-8 overflow-hidden rounded-full border border-[var(--text-primary)]">
                    <Image
                      src="/ngo-quyen-chan-dung.png"
                      alt="Ngô Quyền"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <div className="archive-title is-plain text-sm md:text-base">Ngô Quyền</div>
                    <div className="flex items-center gap-1 text-[0.65rem] md:text-xs text-[var(--status-success)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-success)]" />
                      Đang trò chuyện
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRestart}
                  className="rounded-[2px] border border-[var(--text-primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-primary)] transition-colors hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]"
                >
                  Xem lại
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-hidden bg-[var(--bg-surface)] p-2 md:p-3">
                <div className="space-y-3">
                  {chatMessages.map((message, index) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      isActive={index <= activeMessage}
                      onComplete={() => handleMessageComplete(index)}
                      hasCompleted={completedMessages.has(index)}
                    />
                  ))}
                </div>
              </div>

              {/* Chat Input */}
              <div
                className="flex h-9 md:h-11 shrink-0 items-center gap-2 border-t border-[var(--text-primary)] bg-[var(--bg-elevated)] px-2 md:px-3"
              >
                <button
                  onClick={handleNavigateToHome}
                  className="flex-1 rounded-[2px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 md:px-3 py-1 md:py-1.5 text-left text-xs md:text-sm text-[var(--text-muted)] transition-colors hover:border-[var(--text-primary)] hover:text-[var(--text-secondary)]"
                >
                  Nhập câu hỏi của bạn...
                </button>
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-[2px] bg-[var(--accent-gold)] text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}
