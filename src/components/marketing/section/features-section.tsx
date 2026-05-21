"use client";

import { useRef, useState } from "react";
import { Container } from "../container";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";
import { InteractivePreview } from "./interactive-preview";

const BLOCKS = [
  {
    label: "Tính năng",
    title: "Trò chuyện với nhân vật lịch sử",
    reverse: false,
    bg: "bg-[var(--bg-deep)]",
    features: [
      { id: 0, step: "01", title: "Tạo tài khoản của bạn", body: "Bắt đầu hành trình khám phá lịch sử theo cách của riêng bạn.", image: "" },
      { id: 1, step: "02", title: "Chọn một trận đánh hoặc thời kỳ lịch sử", body: "Khám phá các sự kiện lịch sử quan trọng qua góc nhìn con người.", image: "" },
      { id: 2, step: "03", title: "Trò chuyện với các anh hùng lịch sử", body: "Đặt câu hỏi và nghe câu chuyện trực tiếp từ những nhân vật đã sống trong thời đại đó. Không chỉ đọc lịch sử — mà là trò chuyện với lịch sử.", image: "" },
    ],
  },
  {
    label: "Ôn tập",
    title: "Làm quiz để ôn tập ngay",
    reverse: true,
    bg: "bg-[var(--bg-main)]",
    features: [
      { id: 0, step: "01", title: "Làm quiz sau khi trò chuyện", body: "Ôn lại kiến thức ngay sau khi bạn khám phá một trận đánh hoặc nhân vật.", image: "" },
      { id: 1, step: "02", title: "Bộ câu hỏi riêng để ôn tập", body: "Mỗi chủ đề đều có bộ câu hỏi giúp bạn kiểm tra lại những gì đã học.", image: "" },
      { id: 2, step: "03", title: "Chuỗi học hàng ngày", body: "Duy trì thói quen học lịch sử mỗi ngày với các bài quiz ngắn và dễ làm.", image: "" },
    ],
  },
];

type Feature = { id: number; step: string; title: string; body: string; image: string };

function FeatureBlock({ label, title, features, reverse, bg, blockIndex }: {
  label: string; title: string; features: Feature[]; reverse: boolean; bg: string; blockIndex: number;
}) {
  const [active, setActive] = useState(0);
  const blockRef = useRef<HTMLDivElement>(null);
  useRevealAnimation(blockRef);

  return (
    <div ref={blockRef} className={`py-14 sm:py-20 lg:py-28 border-t border-[var(--border-default)] ${bg}`}>
      <Container>
        <div className="mb-10 lg:mb-14">
          <span data-reveal="block" className="inline-block text-[0.65rem] font-semibold tracking-[0.2em] uppercase text-[var(--accent-gold)] opacity-80 mb-3">
            {label}
          </span>
          <h2 data-reveal="fast" className="text-2xl lg:text-4xl font-bold uppercase tracking-wide text-[var(--text-primary)] leading-tight max-w-xl">
            {title}
          </h2>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center ${reverse ? "lg:[direction:rtl]" : ""}`}>
          <div className={reverse ? "[direction:ltr]" : ""}>
            <div className="flex flex-col">
              {features.map((f, i) => {
                const isActive = active === i;
                return (
                  <button key={f.id} onClick={() => setActive(i)} className="text-left group" data-reveal="block">
                    <div className={`h-px w-full transition-colors duration-300 ${isActive ? "bg-[var(--accent-gold)]" : "bg-[var(--border-default)]"}`} />
                    <div className={`flex gap-5 px-1 py-5 transition-opacity duration-300 ${isActive ? "opacity-100" : "opacity-40 hover:opacity-60"}`}>
                      <span className={`text-xs font-semibold tracking-widest pt-[3px] shrink-0 transition-colors duration-300 ${isActive ? "text-[var(--accent-gold)]" : "text-[var(--text-muted)]"}`}>
                        {f.step}
                      </span>
                      <div>
                        <h3 className={`text-sm lg:text-base font-bold uppercase tracking-wide mb-1.5 leading-snug transition-colors duration-300 ${isActive ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>
                          {f.title}
                        </h3>
                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isActive ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}>
                          <p className="text-xs lg:text-sm text-[var(--text-secondary)] leading-relaxed pt-1">{f.body}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="h-px w-full bg-[var(--border-default)]" />
            </div>
          </div>

          <div data-reveal="block" className={`relative rounded-[var(--radius-lg)] overflow-hidden bg-[var(--bg-surface)] border border-[var(--border-default)] aspect-[4/3] flex flex-col justify-between ${reverse ? "[direction:ltr]" : ""}`}>
            <InteractivePreview blockIndex={blockIndex} stepIndex={active} />
          </div>
        </div>
      </Container>
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section>
      {BLOCKS.map((block, idx) => (
        <FeatureBlock key={block.label} blockIndex={idx} {...block} />
      ))}
    </section>
  );
}