"use client";

import { useRef } from "react";
import Image from "next/image";
import { Container } from "../container";
import { MagneticButton } from "@/components/commons/MagneticButton";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

export function ClosingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section ref={sectionRef} className="min-h-svh overflow-hidden bg-(--bg-main) py-7 md:py-20">
      <Container>
        <div data-motion-card className="relative flex min-h-[calc(100svh-3.5rem)] justify-center overflow-hidden rounded-[2px] border border-(--text-primary) bg-(--bg-surface) md:min-h-[380px] sm:min-h-[520px] lg:h-[600px]">
          <div className="absolute left-1/2 top-0 hidden h-28 w-px -translate-x-1/2 bg-(--accent-gold) lg:block" />
          <span aria-hidden="true" className="archive-seal pointer-events-none absolute left-6 top-6 z-20 hidden lg:inline-grid">
            越南
          </span>

          <div className="absolute inset-0 z-10 hidden items-end justify-center pointer-events-none sm:flex">
            <Image
              src="/phone_mock.png"
              alt="History Talk mobile preview"
              width={370}
              height={740}
              className="absolute bottom-0 left-1/2 z-10 w-[clamp(200px,50vw,370px)] -translate-x-1/2 translate-y-[12%] pointer-events-none"
            />
          </div>

          <div className="relative z-20 grid h-full w-full grid-cols-1 gap-6 md:gap-8 px-4 py-8 sm:px-10 sm:py-14 lg:grid-cols-3 lg:gap-0 lg:px-16 lg:py-0">
            <div className="flex items-center">
              <h2 data-reveal="fast" className="archive-title text-[1.75rem] md:text-[2.25rem] lg:text-[3rem]">
                Lịch sử không chỉ là <em>quá khứ.</em>
              </h2>
            </div>

            <div className="hidden lg:block" />

            <div className="flex flex-col items-start justify-center gap-4 md:gap-6 text-left lg:items-end lg:text-right">
              <p data-reveal="block" className="max-w-[280px] border-t border-(--text-primary) pt-3 text-sm text-(--text-secondary) md:text-base lg:text-lg">
                Bước vào cuộc trò chuyện với những người đã tạo nên lịch sử. Đặt câu hỏi, khám phá bối cảnh và hiểu quá khứ qua góc nhìn của nhân vật.
              </p>
              <div data-reveal="block">
                <MagneticButton
                  href="/home"
                  size="md"
                  className="!rounded-[2px] px-6 py-3 md:px-10 md:py-5"
                >
                  Bắt đầu ngay
                </MagneticButton>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
