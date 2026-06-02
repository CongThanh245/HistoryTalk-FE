"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChatTextIcon,
  MapTrifoldIcon,
  QuestionIcon,
  VideoCameraIcon,
} from "@phosphor-icons/react";
import { Container } from "../container";
import { cn } from "@/lib/utils/cn";

const journeySteps = [
  {
    step: "01",
    eyebrow: "Chọn bối cảnh",
    title: "Bắt đầu từ một thời kỳ lịch sử",
    body: "Người học chọn bối cảnh lịch sử để bước vào thế giới của nhân vật, sự kiện và không khí thời đại đó.",
    icon: MapTrifoldIcon,
  },
  {
    step: "02",
    eyebrow: "Xem video",
    title: "Đắm mình trong không khí lịch sử",
    body: "Video mô tả bối cảnh, địa điểm và diễn biến giúp người học hình dung rõ nét thời khắc lịch sử trước khi bắt đầu cuộc trò chuyện.",
    icon: VideoCameraIcon,
  },
  {
    step: "03",
    eyebrow: "Trò chuyện",
    title: "Đối thoại cùng nhân vật lịch sử",
    body: "Người học trò chuyện với nhân vật trong bối cảnh đó để đào sâu nguyên nhân, niềm tin và những quyết định lịch sử.",
    icon: ChatTextIcon,
  },
  {
    step: "04",
    eyebrow: "Kiểm tra",
    title: "Chốt kiến thức bằng quiz sau hành trình",
    body: "Sau khi trò chuyện, người học kiểm tra lại những gì đã hiểu bằng câu hỏi ngắn gắn liền với bối cảnh vừa trải nghiệm.",
    icon: QuestionIcon,
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-journey-card]");
        const progress = sectionRef.current?.querySelector("[data-journey-progress]");

        gsap.fromTo(
          cards,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 72%",
            },
          },
        );

        if (progress) {
          gsap.fromTo(
            progress,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              transformOrigin: "top",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 65%",
                end: "bottom 45%",
                scrub: true,
              },
            },
          );
        }
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);


  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-12 md:py-20 lg:py-24"
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(255,146,21,0.06)_0,transparent_28%,transparent_72%,rgba(143,179,200,0.06)_100%)]" />

      <Container className="relative z-10">
        <div className="grid gap-6 md:gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div className="lg:sticky lg:top-28 lg:self-start px-2 md:px-0">
            <h2 className="text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] font-bold leading-tight mb-3 md:mb-4 text-[var(--text-secondary)]">
              Một dòng thời gian, <span className="text-[var(--accent-gold)] font-title">bốn lần chạm</span>
            </h2>
            <p className="text-sm md:text-base max-w-[320px] text-[var(--text-secondary)]">
              Mỗi bước đều dẫn dắt người học từ sự tò mò đến những cuộc đối thoại sâu sắc, và khép lại bằng các bài ôn tập đầy ý nghĩa.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-[19px] top-0 hidden h-full w-px bg-[var(--border-default)] md:block" />
            <div
              data-journey-progress
              className="absolute left-[19px] top-0 hidden h-full w-px origin-top bg-[var(--accent-gold)] md:block"
            />

            <div className="space-y-3">
              {journeySteps.map((item, index) => {
                const Icon = item.icon;
                const isActive = active === index;

                return (
                  <button
                    key={item.step}
                    data-journey-card
                    type="button"
                    onClick={() => setActive(index)}
                    onMouseEnter={() => setActive(index)}
                    className="group grid w-full grid-cols-1 gap-4 text-left md:grid-cols-[40px_1fr]"
                  >
                    <span
                      className={cn(
                        "relative z-10 hidden h-10 w-10 items-center justify-center rounded-full border transition-all md:flex",
                        isActive
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-deep)]"
                          : "border-[var(--border-default)] bg-[var(--bg-main)] text-[var(--text-muted)]",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span
                      className={cn(
                        "block rounded-lg md:rounded-[var(--radius-lg)] border p-3 md:p-4 transition-all duration-300",
                        isActive
                          ? "border-[var(--accent-gold)]/40 bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border-default)] bg-transparent hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/40",
                      )}
                    >
                      <span className="mb-1.5 md:mb-2 flex items-center justify-between gap-4">
                        <span className="text-[0.6rem] md:text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                          {item.eyebrow}
                        </span>
                        <span className="text-[0.7rem] md:text-xs font-bold text-[var(--text-muted)]">{item.step}</span>
                      </span>
                      <span className="block text-sm md:text-base font-bold uppercase leading-snug text-[var(--text-primary)]">
                        {item.title}
                      </span>
                      <span className="mt-1.5 md:mt-2 block text-xs md:text-sm text-[var(--text-secondary)]">
                        {item.body}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
