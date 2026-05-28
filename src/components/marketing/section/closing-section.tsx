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
    <section ref={sectionRef} className="bg-[var(--bg-deep)] py-20">
      <Container>
        <div className="relative flex h-auto min-h-[380px] justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] sm:min-h-[520px] lg:h-[600px]">
          <div className="absolute left-1/2 top-0 hidden h-28 w-px -translate-x-1/2 bg-gradient-to-b from-[var(--accent-gold)] to-transparent lg:block" />

          <div className="absolute inset-0 z-10 hidden items-end justify-center pointer-events-none sm:flex">
            <Image
              src="/phone_mock.png"
              alt="History Talk mobile preview"
              width={370}
              height={740}
              className="absolute bottom-0 left-1/2 z-10 w-[clamp(200px,50vw,370px)] -translate-x-1/2 translate-y-[12%] pointer-events-none"
            />
          </div>

          <div className="relative z-20 grid h-full w-full grid-cols-1 gap-8 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-3 lg:gap-0 lg:px-16 lg:py-0">
            <div className="flex items-center">
              <h2 data-reveal="fast" className="text-3xl font-bold text-[var(--text-primary)] sm:text-4xl lg:text-6xl">
                LỊCH SỬ KHÔNG <br /> CHỈ LÀ{" "}
                <span className="text-[var(--accent-gold)]">QUÁ KHỨ.</span>
              </h2>
            </div>

            <div className="hidden lg:block" />

            <div className="flex flex-col items-start justify-center gap-6 text-left lg:items-end lg:text-right">
              <p data-reveal="block" className="max-w-[280px] text-base text-[var(--text-secondary)] lg:text-lg">
                Bước vào cuộc trò chuyện với những người đã tạo nên lịch sử. Đặt câu hỏi, khám phá bối cảnh và hiểu quá khứ qua góc nhìn của nhân vật.
              </p>
              <div data-reveal="block">
                <MagneticButton
                  href="/home"
                  size="lg"
                  className="!rounded-full px-10 py-5"
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
