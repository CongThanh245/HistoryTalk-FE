"use client";

import { useEffect, useRef } from "react";
import { Container } from "../container";

const journeySteps = [
  {
    step: "01",
    eyebrow: "Chọn bối cảnh",
    title: "Bắt đầu từ một thời kỳ lịch sử",
    body: "Người học chọn bối cảnh lịch sử để bước vào thế giới của nhân vật, sự kiện và không khí thời đại đó.",
  },
  {
    step: "02",
    eyebrow: "Xem video",
    title: "Đắm mình trong không khí lịch sử",
    body: "Video mô tả bối cảnh, địa điểm và diễn biến giúp người học hình dung rõ nét thời khắc lịch sử trước khi bắt đầu cuộc trò chuyện.",
  },
  {
    step: "03",
    eyebrow: "Trò chuyện",
    title: "Đối thoại cùng nhân vật lịch sử",
    body: "Người học trò chuyện với nhân vật trong bối cảnh đó để đào sâu nguyên nhân, niềm tin và những quyết định lịch sử.",
  },
  {
    step: "04",
    eyebrow: "Kiểm tra",
    title: "Chốt kiến thức bằng quiz sau hành trình",
    body: "Sau khi trò chuyện, người học kiểm tra lại những gì đã hiểu bằng câu hỏi ngắn gắn liền với bối cảnh vừa trải nghiệm.",
  },
];

const CARD_THRESHOLDS = [0.05, 0.3, 0.55, 0.8];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let rafId = 0;

    const applyProgress = (progress: number) => {
      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        const visible = progress >= CARD_THRESHOLDS[i];
        card.style.opacity = visible ? "1" : "0";
        card.style.transform = visible ? "translateY(0px)" : "translateY(36px)";
      });
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        const scrollable = rect.height - viewH;
        if (scrollable <= 0) return;
        const progress = Math.min(1, Math.max(0, -rect.top / scrollable));
        applyProgress(progress);
      });
    };

    // Hide all cards instantly before transitions are active
    cardRefs.current.forEach((card) => {
      if (!card) return;
      card.style.transition = "none";
      card.style.opacity = "0";
      card.style.transform = "translateY(36px)";
    });

    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0) {
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.opacity = "1";
        card.style.transform = "translateY(0px)";
      });
      return;
    }

    requestAnimationFrame(() => {
      cardRefs.current.forEach((card) => {
        if (!card) return;
        card.style.transition = "opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)";
      });
      onScroll();
    });

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative border-t border-(--text-primary) h-[480vh]"
    >
      <div className="sticky top-0 h-svh overflow-hidden bg-(--bg-main)">
        <span
          aria-hidden="true"
          className="archive-seal pointer-events-none absolute right-6 top-24 hidden lg:inline-grid"
        >
          國史
        </span>

        <Container className="relative z-10 flex h-full flex-col justify-center py-16 md:py-24 lg:py-32">
          {/* Header */}
          <div className="mb-10 grid gap-4 border-b border-(--text-primary) pb-4 lg:mb-14 lg:grid-cols-2 lg:items-end lg:gap-16">
            <div>
              <h2 className="archive-title text-subtitle md:text-title lg:text-[2.5rem]">
                Một dòng thời gian, <em>bốn lần chạm</em>
              </h2>
            </div>
            <p className="text-sm text-(--text-secondary) md:text-base lg:max-w-sm">
              Mỗi bước đều dẫn dắt người học từ sự tò mò đến những cuộc đối thoại sâu sắc, và khép lại bằng các bài ôn tập đầy ý nghĩa.
            </p>
          </div>

          {/* Cards — ruled grid */}
          <div className="grid grid-cols-1 border-l border-t border-(--text-primary) md:grid-cols-2">
            {journeySteps.map((item, index) => (
              <div
                key={item.step}
                ref={(el) => { cardRefs.current[index] = el; }}
                className="relative overflow-hidden border-b border-r border-(--text-primary) bg-(--bg-surface) p-6"
              >
                {/* Watermark number */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-1 -top-3 select-none font-display text-[6rem] font-extrabold leading-none text-(--text-primary) opacity-[0.06]"
                >
                  {item.step}
                </span>

                {/* Step badge + eyebrow */}
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="font-display text-[15px] font-extrabold text-(--accent-gold)">
                    [{item.step}]
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-(--text-tertiary)">
                    {item.eyebrow}
                  </span>
                </div>

                {/* Title */}
                <h3 className="archive-title is-plain mb-3 text-[18px] lg:text-[21px]">
                  {item.title}
                </h3>

                {/* Divider */}
                <div className="mb-3 h-px w-7 bg-(--accent-gold)" />

                {/* Body */}
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
