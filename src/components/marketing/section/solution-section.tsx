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
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-[var(--accent-gold)]/30">
            <Image
              src={message.avatar || ""}
              alt={message.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
            {Icon && <Icon className="h-5 w-5" />}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isCharacter ? "text-left" : "text-right"}`}>
        <div className="mb-0.5 text-xs font-medium text-[var(--text-muted)]">{message.name}</div>
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
            isCharacter
              ? "rounded-tl-none bg-[var(--bg-surface)] text-[var(--text-secondary)]"
              : "rounded-tr-none bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] border border-[var(--accent-gold)]/20"
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
          backgroundImage: `radial-gradient(circle, rgba(231,221,200,0.07) 1px, transparent 1px)`,
          backgroundSize: "30px 30px",
          maskImage: "radial-gradient(ellipse at 55% 50%, black 20%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 55% 50%, black 20%, transparent 80%)",
        }}
      />

      {/* Ambient colour washes */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute left-1/4 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--accent-gold) 6%, transparent)" }}
        />
        <div className="absolute right-1/4 bottom-1/4 h-80 w-80 rounded-full bg-[#8fb3c8]/5 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-16">

          {/* ── Left column ── */}
          <div className="space-y-8 px-2 md:px-0">

            {/* Heading */}
            <div data-reveal="fast">
              <h2 className="text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] font-bold leading-tight text-muted-foreground">
                Bước vào góc nhìn của{" "}
                <span className="text-(--accent-gold) font-title">người làm nên lịch sử</span>
              </h2>
              <p className="mt-3 max-w-[320px] text-sm leading-relaxed text-muted-foreground">
                History Talk biến những dòng chữ tĩnh thành cuộc đối thoại có bối cảnh, ký ức và phản hồi.
              </p>
            </div>

            {/* Vertical timeline steps */}
            <div data-reveal="fast" className="relative pl-1">
              {/* Gradient connector line */}
              <div
                className="absolute left-4.5 top-4 h-[calc(100%-2rem)] w-px"
                style={{
                  background:
                    "linear-gradient(to bottom, color-mix(in srgb, var(--accent-gold) 40%, transparent), color-mix(in srgb, var(--accent-gold) 10%, transparent), transparent)",
                }}
              />

              {solutions.map((item, index) => (
                <div key={item.title} className="relative flex gap-5 pb-8 last:pb-0">
                  {/* Glowing step number */}
                  <div
                    className="relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-(--accent-gold)/50 bg-(--bg-main) text-micro font-bold text-(--accent-gold)"
                    style={{
                      boxShadow:
                        "0 0 0 4px color-mix(in srgb, var(--accent-gold) 8%, transparent), 0 0 14px -2px color-mix(in srgb, var(--accent-gold) 35%, transparent)",
                    }}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-(--text-primary)">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right column — Chat ── */}
          <div ref={chatRef} data-reveal="block" className="relative">
            {/* Diffuse backdrop glow */}
            <div
              className="absolute -inset-6 rounded-3xl opacity-50 blur-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 40% 40%, color-mix(in srgb, var(--accent-gold) 18%, transparent), rgba(143,179,200,0.08) 60%, transparent)",
              }}
            />

            {/* Glowing border ring */}
            <div
              className="absolute -inset-px rounded-xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, color-mix(in srgb, var(--accent-gold) 25%, transparent) 0%, transparent 45%)",
              }}
            />

            <div
              data-motion-card
              className="relative flex h-75 w-full flex-col overflow-hidden rounded-xl shadow-2xl md:h-105 bg-[#0d1627]"
              style={{
                border: "1px solid color-mix(in srgb, var(--accent-gold) 22%, var(--border-default))",
              }}
            >
              {/* Chat Header */}
              <div
                className="flex h-10 md:h-12 shrink-0 items-center justify-between border-b px-3 md:px-4 bg-[#111c2e]"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent-gold) 15%, var(--border-default))",
                }}
              >
                <div className="flex items-center gap-2">
                  <div className="relative h-7 w-7 md:h-8 md:w-8 overflow-hidden rounded-full border border-[var(--accent-gold)]/30">
                    <Image
                      src="/ngo-quyen-chan-dung.png"
                      alt="Ngô Quyền"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-semibold text-[var(--text-primary)]">Ngô Quyền</div>
                    <div className="flex items-center gap-1 text-[0.65rem] md:text-xs text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Đang trò chuyện
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleRestart}
                  className="rounded-md px-3 py-1 text-xs font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)] hover:text-[var(--accent-gold)]"
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
                className="flex h-9 md:h-11 shrink-0 items-center gap-2 border-t px-2 md:px-3 bg-[#111c2e]"
                style={{
                  borderColor: "color-mix(in srgb, var(--accent-gold) 12%, var(--border-default))",
                }}
              >
                <button
                  onClick={handleNavigateToHome}
                  className="flex-1 rounded-full bg-[var(--bg-surface)] px-2 md:px-3 py-1 md:py-1.5 text-left text-xs md:text-sm text-[var(--text-muted)] transition-colors hover:text-muted-foreground"
                >
                  Nhập câu hỏi của bạn...
                </button>
                <div className="flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
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
