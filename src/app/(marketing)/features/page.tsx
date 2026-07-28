"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Brain,
  MessageCircle,
  Map,
  CircleUser,
  Video,
} from "lucide-react";
import { Container } from "@/components/marketing/container";

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
    icon: CircleUser,
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

const journeySteps = [
  {
    step: "01",
    eyebrow: "Chọn bối cảnh",
    title: "Bắt đầu từ một thời kỳ lịch sử",
    body: "Người học chọn bối cảnh lịch sử để bước vào thế giới của nhân vật, sự kiện và không khí thời đại đó.",
    icon: Map,
    image: "/feature-pic1.png",
  },
  {
    step: "02",
    eyebrow: "Xem video",
    title: "Đắm mình trong không khí lịch sử",
    body: "Video mô tả bối cảnh, địa điểm và diễn biến giúp người học hình dung rõ nét thời khắc lịch sử trước khi bắt đầu cuộc trò chuyện.",
    icon: Video,
    image: "/feature-pic2.png",
  },
  {
    step: "03",
    eyebrow: "Trò chuyện",
    title: "Đối thoại cùng nhân vật lịch sử",
    body: "Người học trò chuyện với nhân vật trong bối cảnh đó để đào sâu nguyên nhân, niềm tin và những quyết định lịch sử.",
    icon: MessageCircle,
    image: "/feature-pic3.png",
  },
  {
    step: "04",
    eyebrow: "Ôn tập",
    title: "Chốt kiến thức bằng quiz sau hành trình",
    body: "Sau khi trò chuyện, người học kiểm tra lại những gì đã hiểu bằng câu hỏi ngắn gắn liền với bối cảnh vừa trải nghiệm.",
    icon: Brain,
    image: "/feature-pic4.png",
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
      Promise.resolve().then(() => {
        setDisplayText(text);
        setIsTyping(false);
      });
      completedRef.current = true;
      return;
    }

    if (!isActive) {
      Promise.resolve().then(() => {
        setDisplayText("");
        setIsTyping(false);
      });
      return;
    }

    Promise.resolve().then(() => {
      setIsTyping(true);
    });
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
        <span className="animate-pulse text-(--accent-gold)">|</span>
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
      className={`flex gap-3 ${isCharacter ? "flex-row" : "flex-row-reverse"} ${isActive ? "opacity-100" : "opacity-0"
        } transition-all duration-500`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {isCharacter ? (
          <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-(--accent-gold)/30">
            <Image
              src={message.avatar || ""}
              alt={message.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--accent-gold)/10 text-(--accent-gold)">
            {Icon && <Icon className="h-5 w-5" />}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isCharacter ? "text-left" : "text-right"}`}>
        <div className="mb-0.5 text-xs font-medium text-(--text-muted)">{message.name}</div>
        <div
          className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${isCharacter
            ? "rounded-tl-none bg-(--bg-surface) text-muted-foreground"
            : "rounded-tr-none bg-(--accent-gold)/10 text-(--accent-gold) border border-(--accent-gold)/20"
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

export default function FeaturePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const visualTrackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [activeMessage, setActiveMessage] = useState(0);
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(new Set());

  const handleNavigateToHome = () => {
    router.push("/home");
  };

  const handleMessageComplete = (messageIndex: number) => {
    setCompletedMessages((prev) => new Set(prev).add(messageIndex));
    if (messageIndex < chatMessages.length - 1) {
      setTimeout(() => {
        setActiveMessage(messageIndex + 1);
      }, 800);
    }
  };

  const handleRestart = () => {
    setActiveMessage(0);
    setCompletedMessages(new Set());
  };

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;
    let matchMediaCleanup: (() => void) | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!pageRef.current) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-hero-copy]",
          { y: 34, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.12 },
        );

        gsap.fromTo(
          heroVisualRef.current,
          { y: 44, opacity: 0, rotateX: 8 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.95, ease: "power3.out", delay: 0.15 },
        );

        gsap.fromTo(
          "[data-visual-card]",
          {
            clipPath: "inset(18% 12% 18% 12% round 16px)",
            y: 80,
            opacity: 0,
            rotate: -2,
          },
          {
            clipPath: "inset(0% 0% 0% 0% round 16px)",
            y: 0,
            opacity: 1,
            rotate: 0,
            duration: 1,
            ease: "power4.out",
            stagger: 0.18,
            scrollTrigger: {
              trigger: "[data-visual-section]",
              start: "top 70%",
            },
          },
        );

        if (visualTrackRef.current) {
          const mm = gsap.matchMedia();

          mm.add("(min-width: 1024px)", () => {
            gsap.fromTo(
              visualTrackRef.current,
              { xPercent: 18 },
              {
                xPercent: -18,
                ease: "none",
                scrollTrigger: {
                  trigger: "[data-visual-section]",
                  start: "top 75%",
                  end: "bottom top",
                  scrub: 1,
                },
              },
            );
          });

          mm.add("(max-width: 1023px)", () => {
            gsap.fromTo(
              "[data-visual-card]",
              { x: 52 },
              {
                x: 0,
                ease: "power3.out",
                duration: 0.8,
                stagger: 0.12,
                scrollTrigger: {
                  trigger: "[data-visual-section]",
                  start: "top 70%",
                },
              },
            );
          });

          matchMediaCleanup = () => mm.revert();
        }

        gsap.fromTo(
          "[data-feature-card]",
          { y: 42, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: "[data-feature-grid]",
              start: "top 75%",
            },
          },
        );

        gsap.fromTo(
          "[data-capability-row]",
          { x: -28, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: "[data-capability-list]",
              start: "top 78%",
            },
          },
        );

        if (progressRef.current) {
          gsap.fromTo(
            progressRef.current,
            { scaleX: 0 },
            {
              scaleX: 1,
              transformOrigin: "left",
              ease: "none",
              scrollTrigger: {
                trigger: pageRef.current,
                start: "top top",
                end: "bottom bottom",
                scrub: true,
              },
            },
          );
        }

        // Animate full-screen timeline sections
        const journeySections = gsap.utils.toArray<HTMLElement>("[data-journey-step]");
        const journeyWrapper = document.querySelector("[data-journey-wrapper]");

        // Global progress bar - fills continuously through all sections
        const globalProgressBar = document.querySelector("[data-journey-progress]");
        if (globalProgressBar && journeyWrapper) {
          gsap.fromTo(
            globalProgressBar,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: "top",
              ease: "none",
              scrollTrigger: {
                trigger: journeyWrapper,
                start: "top center",
                end: "bottom center",
                scrub: true,
              },
            },
          );
        }

        journeySections.forEach((section, index) => {
          const content = section.querySelector(".max-w-lg");
          const image = section.querySelector('[class*="aspect-"]');
          const stepIndicator = section.querySelector("[data-step-indicator]");

          // Content entrance animation - slow and gradual
          if (content) {
            gsap.fromTo(
              content,
              { x: index % 2 === 0 ? -120 : 120, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                duration: 1.5,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 85%",
                  end: "top 40%",
                  scrub: 1,
                },
              },
            );
          }

          // Image entrance animation - slow and gradual
          if (image) {
            gsap.fromTo(
              image,
              { scale: 0.8, opacity: 0, y: 60 },
              {
                scale: 1,
                opacity: 1,
                y: 0,
                duration: 1.8,
                ease: "power2.out",
                scrollTrigger: {
                  trigger: section,
                  start: "top 80%",
                  end: "top 35%",
                  scrub: 1,
                },
              },
            );
          }

          // Step indicator animation - slow pop in
          if (stepIndicator) {
            gsap.fromTo(
              stepIndicator,
              { scale: 0.3, opacity: 0 },
              {
                scale: 1,
                opacity: 1,
                duration: 1.2,
                ease: "back.out(2)",
                scrollTrigger: {
                  trigger: section,
                  start: "top 70%",
                  end: "top 50%",
                  scrub: 1,
                },
              },
            );
          }
        });
      }, pageRef);
    };

    init();
    return () => {
      matchMediaCleanup?.();
      ctx?.revert();
    };
  }, []);



  return (
    <main ref={pageRef} className="relative overflow-hidden bg-(--bg-deep) text-muted-foreground">
      <div className="fixed inset-x-0 top-0 z-50 h-0.5 bg-white/5">
        <div ref={progressRef} className="h-full origin-left bg-(--accent-gold) shadow-[0_0_18px_rgba(255,146,21,0.65)]" />
      </div>

      <section className="relative min-h-[calc(100svh-80px)] overflow-hidden pb-20 pt-32">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_72%_26%,rgba(143,179,200,0.18),transparent_34%),radial-gradient(circle_at_16%_72%,rgba(255,146,21,0.12),transparent_30%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] bg-size-[72px_72px]" />

        <Container className="relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <div>
              <h1 data-hero-copy className="text-hero uppercase tracking-wide text-muted-foreground mb-4">
                Bộ tính năng giúp lịch sử <span className="text-(--accent-gold) font-title">trở thành một cuộc đối thoại</span>
              </h1>
              <p data-hero-copy className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground lg:text-lg">
                History Talk kết hợp nhân vật AI, bối cảnh sự kiện và quiz ôn tập để biến mỗi chủ đề thành một hành trình học có mạch.
              </p>
            </div>

            <div ref={heroVisualRef} className="relative min-h-107.5">
              <div className="absolute -inset-2 rounded-2xl bg-linear-to-r from-(--accent-gold)/10 to-[#8fb3c8]/10 opacity-50 blur-2xl" />

              <div className="relative flex h-107.5 w-full flex-col overflow-hidden rounded-lg border border-(--border-default) bg-[#0d1627] shadow-2xl">
                {/* Chat Header */}
                <div className="flex h-12 shrink-0 items-center justify-between border-b border-(--border-default) bg-[#111c2e] px-4">
                  <div className="flex items-center gap-2">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full border border-(--accent-gold)/30">
                      <Image
                        src="/ngo-quyen-chan-dung.png"
                        alt="Ngô Quyền"
                        fill
                        className="object-cover"
                        sizes="32px"
                      />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-(--text-primary)">Ngô Quyền</div>
                      <div className="flex items-center gap-1 text-xs text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Đang trò chuyện
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRestart}
                    className="rounded-md px-3 py-1 text-xs font-medium text-(--text-muted) transition-colors hover:bg-(--bg-surface) hover:text-(--accent-gold)"
                  >
                    Xem lại
                  </button>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-hidden bg-(--bg-surface) p-3">
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
                <div className="flex h-11 shrink-0 items-center gap-2 border-t border-(--border-default) bg-[#111c2e] px-3">
                  <button
                    onClick={handleNavigateToHome}
                    className="flex-1 rounded-full bg-(--bg-surface) px-3 py-1.5 text-left text-sm text-(--text-muted) transition-colors hover:bg-(--bg-surface)/80 hover:text-muted-foreground"
                  >
                    Nhập câu hỏi của bạn...
                  </button>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-(--accent-gold)/10 text-(--accent-gold)">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {[
                  "Hỏi đáp theo nhân vật",
                  "Bối cảnh theo sự kiện",
                  "Quiz sau hội thoại",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-(--border-default) bg-white/3 px-4 py-3 text-sm font-medium text-muted-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Full-screen Timeline Sections - wrapped for progress bar */}
      <div data-journey-wrapper className="relative">
        {/* Global Progress Bar - spans all journey sections */}
        <div className="absolute left-6 top-0 z-10 h-full w-0.5 bg-(--border-default) sm:left-8 lg:left-1/2 lg:-translate-x-1/2">
          <div
            data-journey-progress
            className="h-full w-0.5 origin-top bg-(--accent-gold)"
          />
        </div>

        {journeySteps.map((item, index) => {
          const Icon = item.icon;
          const isEven = index % 2 === 0;

          return (
            <section
              key={item.step}
              data-journey-step
              className="relative min-h-[auto] overflow-hidden border-t border-(--border-default) bg-(--bg-main) py-16 sm:py-20 lg:min-h-screen lg:py-0"
            >
              {/* Step Number Indicator - positioned within section */}
              <div className="absolute left-6 top-16 z-10 -translate-x-1/2 sm:left-8 sm:top-20 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2" data-step-indicator>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-(--accent-gold) bg-(--accent-gold) text-(--bg-deep) shadow-lg sm:h-12 sm:w-12">
                  <span className="text-sm font-bold">{item.step}</span>
                </div>
              </div>

              <Container className="relative z-10 flex min-h-0 items-center pl-16 sm:pl-20 lg:h-screen lg:pl-6">
                <div className={`grid w-full items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-20 ${isEven ? '' : 'lg:grid-flow-col-dense'}`}>
                  {/* Content */}
                  <div className={`${isEven ? '' : 'lg:col-start-2'}`}>
                    <div className="max-w-lg">
                      <span className="mb-4 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-(--accent-gold)">
                        {item.eyebrow}
                      </span>
                      <h2 className="mb-4 text-2xl font-bold uppercase leading-tight text-(--text-primary) sm:mb-6 sm:text-3xl lg:text-4xl">
                        {item.title}
                      </h2>
                      <p className="mb-6 text-base leading-relaxed text-muted-foreground sm:mb-8 sm:text-lg">
                        {item.body}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-(--accent-gold)/30 bg-(--accent-gold)/10 text-(--accent-gold)">
                          <Icon className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-(--text-primary)">Bước {item.step}</p>
                          <p className="text-xs text-(--text-muted)">Hành trình học lịch sử</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image */}
                  <div className={`${isEven ? '' : 'lg:col-start-1'}`}>
                    <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-(--border-default) bg-(--bg-surface) shadow-2xl sm:rounded-2xl">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 50vw, 100vw"
                      />
                    </div>
                  </div>
                </div>
              </Container>

            </section>
          );
        })}
      </div>
    </main>
  );
}
