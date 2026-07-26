"use client";

import { useRef } from "react";
import { Brain, Link, Scale, Sparkles } from "lucide-react";
import { Container } from "../container";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const impacts = [
  {
    icon: Brain,
    title: "Hiểu thay vì học thuộc",
    description: "Người học nhớ sự kiện thông qua nguyên nhân, bối cảnh và lựa chọn của nhân vật.",
  },
  {
    icon: Scale,
    title: "Biết đặt câu hỏi",
    description: "Mỗi cuộc trò chuyện mở ra cách nhìn phản biện: vì sao, nếu không, và điều gì xảy ra sau đó.",
  },
  {
    icon: Link,
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
      className="relative flex min-h-svh items-start overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-deep)] py-7 md:py-16 lg:py-0 md:items-center"
    >
      <div className="relative z-10 w-full py-7 md:py-16 lg:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-6 md:gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div className="min-w-0 px-2 md:px-0">
              <h2 data-reveal="fast" className="text-[1.5rem] md:text-[2rem] lg:text-[2.5rem] font-bold leading-tight mb-3 md:mb-4 break-words text-[var(--text-secondary)]">
                Điều còn lại không phải đáp án, <span className="font-title text-[var(--accent-gold)]">mà là hiểu biết</span>
              </h2>
              <p className="max-w-[320px] text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
                History Talk giúp bạn hiểu lịch sử thông qua bối cảnh và lựa chọn của những người đã sống.
              </p>
            </div>

            <div className="-mx-2 md:-mx-4 overflow-hidden px-2 md:px-4">
              <div className="grid gap-3 md:gap-4 md:grid-cols-3">
            {impacts.map((impact) => {
              const Icon = impact.icon;
              return (
                <div
                  key={impact.title}
                  data-reveal="float"
                  data-motion-card
                  className="rounded-lg md:rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/70 p-4 md:p-6"
                >
                  <div className="mb-3 md:mb-5 flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-md border border-[var(--accent-gold)]/25 bg-[var(--accent-gold)]/10 text-[var(--accent-gold)]">
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">{impact.title}</h3>
                  <p className="mt-2 md:mt-3 text-xs md:text-sm leading-relaxed text-[var(--text-secondary)]">{impact.description}</p>
                </div>
              );
            })}
          </div>

              <div data-reveal="block" className="mt-6 md:mt-8 border-l-2 border-[var(--accent-gold)]/50 pl-4 md:pl-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <Sparkles className="mt-1 h-5 w-5 md:h-6 md:w-6 shrink-0 text-[var(--accent-gold)]" />
                  <p className="max-w-3xl text-lg md:text-xl lg:text-2xl font-semibold leading-relaxed text-[var(--text-secondary)]">
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
