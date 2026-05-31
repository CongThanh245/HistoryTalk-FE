"use client";

import { useRef } from "react";
import { BrainIcon, LinkIcon, ScalesIcon, SparkleIcon } from "@phosphor-icons/react";
import { Container } from "../container";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const impacts = [
  {
    icon: BrainIcon,
    title: "Hiểu thay vì học thuộc",
    description: "Người học nhớ sự kiện thông qua nguyên nhân, bối cảnh và lựa chọn của nhân vật.",
  },
  {
    icon: ScalesIcon,
    title: "Biết đặt câu hỏi",
    description: "Mỗi cuộc trò chuyện mở ra cách nhìn phản biện: vì sao, nếu không, và điều gì xảy ra sau đó.",
  },
  {
    icon: LinkIcon,
    title: "Nối quá khứ với hiện tại",
    description: "Lịch sử trở thành chuỗi quyết định có ảnh hưởng đến thế giới người học đang sống.",
  },
];

export function ImpactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-auto min-h-[600px] items-start overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-deep)] py-16 md:h-svh md:items-center md:py-0"
    >
      <div className="relative z-10 w-full py-16 md:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div className="min-w-0">
              <span className="mb-4 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
                Sau hành trình
              </span>
              <h2 className="vi-heading mb-4 break-words text-[var(--text-secondary)]">
                Điều còn lại không phải đáp án, <span className="font-title text-[var(--accent-gold)]">mà là hiểu biết</span>
              </h2>
              <p className="max-w-[320px] text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
                History Talk giúp bạn hiểu lịch sử thông qua bối cảnh và lựa chọn của những người đã sống.
              </p>
            </div>

            <div className="-mx-4 overflow-hidden px-4">
              <div className="grid gap-4 md:grid-cols-3">
            {impacts.map((impact) => {
              const Icon = impact.icon;
              return (
                <div
                  key={impact.title}
                  data-reveal="block"
                  className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/70 p-6"
                >
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md border border-[var(--accent-gold)]/25 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">{impact.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{impact.description}</p>
                </div>
              );
            })}
          </div>

              <div data-reveal="block" className="mt-8 border-l-2 border-[var(--accent-gold)]/50 pl-6">
                <div className="flex items-start gap-4">
                  <SparkleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--accent-gold)]" />
                  <p className="max-w-3xl text-xl font-semibold leading-relaxed text-[var(--text-secondary)] md:text-2xl">
                    History Talk không dạy người học phải nghĩ gì. Nó giúp họ có đủ bối cảnh để tự hiểu vì sao lịch sử đã diễn ra như vậy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
