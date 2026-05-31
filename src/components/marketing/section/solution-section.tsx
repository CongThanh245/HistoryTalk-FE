"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserCircleIcon } from "@phosphor-icons/react";
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
    icon: UserCircleIcon,
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
      return;
    }

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

    return () => clearInterval(interval);
  }, [text, isActive, onComplete, hasCompleted]);

  return (
    <span>
      {displayText}
      {isTyping && (
        <span className="animate-pulse text-[var(--accent-gold)]">|</span>
      )}
    </span>
  );
}

function ChatBubble({
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
}

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeMessage, setActiveMessage] = useState(0);
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
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
            setIsAnimating(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(chatElement);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || activeMessage >= chatMessages.length) return;
    setIsAnimating(true);
  }, [activeMessage, hasStarted]);

  const handleMessageComplete = (messageIndex: number) => {
    setCompletedMessages((prev) => new Set(prev).add(messageIndex));
    if (messageIndex < chatMessages.length - 1) {
      setTimeout(() => {
        setActiveMessage(messageIndex + 1);
      }, 800);
    } else {
      setIsAnimating(false);
    }
  };

  const handleRestart = () => {
    setActiveMessage(0);
    setCompletedMessages(new Set());
    setIsAnimating(true);
  };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-center overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-12 md:py-16"
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(143, 179, 200, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(201, 162, 77, 0.04) 0%, transparent 60%)
          `,
        }}
      />

      <Container className="relative z-10">
        {/* Cards - Full width at top */}
        <div data-reveal="block" className="mb-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {solutions.map((item) => (
              <div
                key={item.title}
                className="group rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]/50 p-3 transition-all duration-300 hover:border-[var(--accent-gold)]/40 hover:bg-[var(--bg-surface)]"
              >
                <h3 className="mb-1 text-sm font-bold text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent-gold)]">
                  {item.title}
                </h3>
                <p className="vi-text text-xs text-[var(--text-secondary)]">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.4fr] lg:gap-12">
          {/* Left Column */}
          <div className="space-y-4">
            <div data-reveal="fast" className="text-left">
              <h2 className="vi-heading mb-2 text-[clamp(2rem,4vw,4rem)] font-bold uppercase tracking-wide text-[var(--text-secondary)]">
                Bước vào
                <br />
                góc nhìn của
                <br />
                <span className="text-[var(--accent-gold)] font-title">người làm nên lịch sử</span>
              </h2>
              <p className="vi-text max-w-[320px] text-sm text-[var(--text-secondary)]">
                History Talk biến những dòng chữ tĩnh thành cuộc đối thoại có bối cảnh, ký ức và phản hồi.
              </p>
            </div>
          </div>

          {/* Right Column - Chat Animation */}
          <div ref={chatRef} data-reveal="block" className="relative">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[var(--accent-gold)]/10 to-[#8fb3c8]/10 opacity-50 blur-2xl" />

            <div className="relative flex h-[380px] w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#0d1627] shadow-2xl">
              {/* Chat Header */}
              <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[#111c2e] px-4">
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full border border-[var(--accent-gold)]/30">
                    <Image
                      src="/ngo-quyen-chan-dung.png"
                      alt="Ngô Quyền"
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">Ngô Quyền</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-400">
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
              <div className="flex-1 overflow-hidden bg-[var(--bg-surface)] p-3">
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

              {/* Chat Input Placeholder */}
              <div className="flex h-11 shrink-0 items-center gap-2 border-t border-[var(--border-default)] bg-[#111c2e] px-3">
                <button
                  onClick={handleNavigateToHome}
                  className="flex-1 rounded-full bg-[var(--bg-surface)] px-3 py-1.5 text-left text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-surface)]/80 hover:text-[var(--text-secondary)]"
                >
                  Nhập câu hỏi của bạn...
                </button>
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
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
