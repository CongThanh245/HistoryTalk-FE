"use client";

import { useRef } from "react";
import { Container } from "../container";
import { MagneticButton } from "@/components/commons/MagneticButton";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

export function ClosingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="py-16 md:py-24 bg-[var(--bg-deep)] border-t border-[var(--border-default)]"
    >
      <Container>
        <div className="relative rounded-2xl overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)]">
          {/* Glows */}
          <div className="absolute -top-32 -left-32 w-80 h-80 bg-[var(--accent-gold)] opacity-10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[var(--accent-teal)] opacity-10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch">
            {/* LEFT */}
            <div className="px-10 py-14 md:px-16 md:py-20 flex flex-col justify-center">
              <h2
                data-reveal="fast"
                className="text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-wide text-[var(--text-primary)] leading-[0.9] mb-6"
              >
                Lịch sử không chỉ là{" "}
                <span className="text-[var(--accent-gold)]">quá khứ.</span>
              </h2>

              <p
                data-reveal="block"
                className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-sm mb-10"
              >
                Bước vào cuộc trò chuyện với những người đã tạo nên lịch sử. Đặt câu hỏi, khám phá sự thật, và hiểu về nhân loại theo cách chưa từng có.
              </p>

              <div data-reveal="block" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <MagneticButton href="/app" size="xl" className="shadow-[var(--shadow-strong)]">
                  Bắt đầu miễn phí
                </MagneticButton>
              </div>
            </div>

            {/* RIGHT: Phone mockup */}
            <div
              data-reveal="block"
              className="relative flex items-end justify-center border-t border-[var(--border-default)] lg:border-t-0 overflow-hidden min-h-[280px] lg:min-h-0"
            >
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-[var(--accent-gold)] opacity-5 rounded-full blur-3xl pointer-events-none" />
              <img
                src="https://placehold.co/340x520/1a2436/c9a24d?text=Phone+Mockup"
                alt="HistoryTalk app preview"
                className="relative z-10 h-[300px] lg:h-[400px] w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}