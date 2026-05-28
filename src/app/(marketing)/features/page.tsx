"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  BookOpenTextIcon,
  BrainIcon,
  ChatTextIcon,
  CheckCircleIcon,
  CompassIcon,
  MapTrifoldIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react";
import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/utils/cn";

const featureGroups = [
  {
    label: "Đối thoại AI",
    title: "Trò chuyện với nhân vật lịch sử",
    body: "Đặt câu hỏi tự nhiên, nhận phản hồi theo bối cảnh và đào sâu động cơ phía sau từng quyết định.",
    icon: ChatTextIcon,
    accent: "text-amber-300",
    glow: "from-amber-500/20",
    bullets: ["Ngữ cảnh nhân vật", "Câu hỏi mở", "Phản hồi theo mạch hội thoại"],
  },
  {
    label: "Bối cảnh",
    title: "Khám phá sự kiện như một dòng thời gian",
    body: "Mỗi sự kiện được đặt trong chuỗi nguyên nhân, diễn biến và hệ quả để người học không bị rơi vào học thuộc rời rạc.",
    icon: MapTrifoldIcon,
    accent: "text-sky-300",
    glow: "from-sky-500/20",
    bullets: ["Mốc thời gian", "Bối cảnh địa lý", "Liên kết nhân vật"],
  },
  {
    label: "Ôn tập",
    title: "Quiz ngắn sau mỗi hành trình",
    body: "Kiểm tra lại điều vừa hiểu bằng câu hỏi có giải thích, giúp kiến thức được neo lại đúng lúc.",
    icon: BrainIcon,
    accent: "text-emerald-300",
    glow: "from-emerald-500/20",
    bullets: ["Câu hỏi theo chủ đề", "Giải thích đáp án", "Theo dõi tiến độ"],
  },
];

const visualChapters = [
  {
    title: "Chọn nhân vật",
    body: "Bắt đầu từ một con người cụ thể, không phải một đoạn văn khô.",
    image: "/ngo-quyen.jpg",
    alt: "Ngô Quyền illustration",
  },
  {
    title: "Bước vào hội thoại",
    body: "Câu hỏi mở kéo người học vào bối cảnh và lựa chọn của nhân vật.",
    image: "/history-talk-ui.png",
    alt: "History Talk chat interface",
  },
  {
    title: "Ôn lại trên thiết bị cá nhân",
    body: "Mỗi hành trình khép lại bằng phần ôn tập ngắn, dễ quay lại.",
    image: "/phone_mock.png",
    alt: "History Talk mobile interface",
  },
];

const capabilityRows = [
  {
    title: "Lưu lại cuộc trò chuyện quan trọng",
    body: "Các đoạn học có giá trị được giữ lại để người học quay về ôn tập sau.",
    icon: BookOpenTextIcon,
  },
  {
    title: "Gợi ý hướng khám phá tiếp theo",
    body: "Sau mỗi chủ đề, hệ thống đề xuất nhân vật, sự kiện hoặc câu hỏi liên quan.",
    icon: CompassIcon,
  },
  {
    title: "Ưu tiên độ tin cậy và bối cảnh",
    body: "Thiết kế trải nghiệm theo hướng giải thích rõ, hạn chế cảm giác trả lời rời rạc.",
    icon: ShieldCheckIcon,
  },
];

export default function FeaturePage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const heroVisualRef = useRef<HTMLDivElement>(null);
  const visualTrackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

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
          gsap.to(visualTrackRef.current, {
            xPercent: -18,
            ease: "none",
            scrollTrigger: {
              trigger: "[data-visual-section]",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          });
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
      }, pageRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  const ActiveIcon = featureGroups[activeFeature].icon;

  return (
    <main ref={pageRef} className="relative overflow-hidden bg-[var(--bg-deep)] text-[var(--text-secondary)]">
      <div className="fixed inset-x-0 top-0 z-50 h-[2px] bg-white/5">
        <div ref={progressRef} className="h-full origin-left bg-[var(--accent-gold)] shadow-[0_0_18px_rgba(255,146,21,0.65)]" />
      </div>

      <section className="relative min-h-[calc(100svh-80px)] overflow-hidden pb-20 pt-32">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_72%_26%,rgba(143,179,200,0.18),transparent_34%),radial-gradient(circle_at_16%_72%,rgba(255,146,21,0.12),transparent_30%)]" />
        <div className="absolute inset-0 pointer-events-none opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:72px_72px]" />

        <Container className="relative z-10">
          <div className="grid items-center gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16">
            <div>
              <h1 data-hero-copy className="max-w-3xl text-4xl font-bold leading-[1.08] text-[var(--text-primary)] sm:text-5xl lg:text-6xl">
                Bộ tính năng giúp lịch sử trở thành một cuộc đối thoại
              </h1>
              <p data-hero-copy className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)] lg:text-lg">
                History Talk kết hợp nhân vật AI, bối cảnh sự kiện và quiz ôn tập để biến mỗi chủ đề thành một hành trình học có mạch.
              </p>

              <div data-hero-copy className="mt-8 flex flex-wrap gap-3">
                {["AI hội thoại", "Dòng thời gian", "Quiz theo chủ đề"].map((item) => (
                  <span key={item} className="rounded-full border border-[var(--border-default)] bg-white/[0.03] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-secondary)]">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div ref={heroVisualRef} className="relative min-h-[430px] perspective-[1200px]">
              <div className="absolute inset-4 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--accent-gold)]/20 via-transparent to-[#8fb3c8]/20 blur-2xl" />
              <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#101a2c] shadow-[var(--shadow-strong)]">
                <div className="flex h-10 items-center justify-between border-b border-[var(--border-default)] bg-[#111c2e] px-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/45" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300/45" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300/45" />
                  </div>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    historytalk.vn/features
                  </span>
                </div>
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/history-talk-ui.png"
                    alt="History Talk interface preview"
                    fill
                    priority
                    sizes="(min-width: 1024px) 52vw, 100vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070d18]/75 via-transparent to-transparent" />
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
                    className="rounded-md border border-[var(--border-default)] bg-white/[0.03] px-4 py-3 text-sm font-medium text-[var(--text-secondary)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section data-visual-section className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-20 md:py-28">
        <Container>
          <div className="mb-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Tính năng nên được nhìn thấy trước khi được giải thích
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[var(--text-secondary)] lg:ml-auto">
              Trang này dùng hình ảnh như các lát cắt của sản phẩm: người học chọn nhân vật, bước vào hội thoại, rồi ôn lại kiến thức trên thiết bị cá nhân.
            </p>
          </div>

          <div ref={visualTrackRef} className="grid gap-5 lg:grid-cols-3 lg:will-change-transform">
            {visualChapters.map((chapter, index) => (
              <article
                key={chapter.title}
                data-visual-card
                className={cn(
                  "group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]",
                  index === 1 && "lg:translate-y-10",
                )}
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={chapter.image}
                    alt={chapter.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#070d18]/75 via-transparent to-transparent" />
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{chapter.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{chapter.body}</p>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      <section className="relative border-t border-[var(--border-default)] bg-[var(--bg-main)] py-20 md:py-28">
        <Container>
          <div className="mb-12 max-w-3xl">
            <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Ba lớp trải nghiệm nối thành một hành trình
            </h2>
          </div>

          <div data-feature-grid className="grid gap-5 lg:grid-cols-3">
            {featureGroups.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = activeFeature === index;

              return (
                <button
                  key={feature.title}
                  data-feature-card
                  type="button"
                  onClick={() => setActiveFeature(index)}
                  onMouseEnter={() => setActiveFeature(index)}
                  className={cn(
                    "group relative overflow-hidden rounded-[var(--radius-lg)] border p-6 text-left transition-all duration-300",
                    isActive
                      ? "border-[var(--accent-gold)]/45 bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]"
                      : "border-[var(--border-default)] bg-transparent hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/40",
                  )}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100", feature.glow)} />
                  <div className="relative z-10">
                    <div className={cn("mb-6 flex h-12 w-12 items-center justify-center rounded-md border border-white/10 bg-white/[0.04]", feature.accent)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="mb-3 block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                      {feature.label}
                    </span>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{feature.title}</h3>
                    <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">{feature.body}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#101a2c]">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="border-b border-[var(--border-default)] p-6 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[var(--accent-gold)]/30 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <ActiveIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">{featureGroups[activeFeature].title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{featureGroups[activeFeature].body}</p>
              </div>

              <div className="grid gap-3 p-6 sm:grid-cols-3">
                {featureGroups[activeFeature].bullets.map((bullet) => (
                  <div key={bullet} className="flex items-start gap-2 rounded-md border border-[var(--border-default)] bg-white/[0.03] p-3 text-sm text-[var(--text-secondary)]">
                    <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span>{bullet}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="relative border-t border-[var(--border-default)] bg-[var(--bg-deep)] py-20 md:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <h2 className="text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-4xl">
                Không chỉ có AI chat, mà là một hệ sinh thái học
              </h2>
            </div>

            <div data-capability-list className="space-y-4">
              {capabilityRows.map((row) => {
                const Icon = row.icon;
                return (
                  <div key={row.title} data-capability-row className="grid gap-4 border-b border-[var(--border-default)] pb-5 sm:grid-cols-[52px_1fr]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--accent-gold)]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{row.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{row.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
