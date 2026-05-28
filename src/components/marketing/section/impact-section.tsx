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
      className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-deep)] py-20 md:py-32"
    >
      <Container>
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <span data-reveal="block" className="mb-4 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              Sau hành trình
            </span>
            <h2 data-reveal="fast" className="mx-auto max-w-3xl text-3xl font-bold uppercase leading-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Điều còn lại không phải là đáp án, mà là sự hiểu biết
            </h2>
          </div>

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

          <div data-reveal="block" className="mt-12 border-l-2 border-[var(--accent-gold)]/50 pl-6">
            <div className="flex items-start gap-4">
              <SparkleIcon className="mt-1 h-6 w-6 shrink-0 text-[var(--accent-gold)]" />
              <p className="max-w-3xl text-xl font-semibold leading-relaxed text-[var(--text-secondary)] md:text-2xl">
                History Talk không dạy người học phải nghĩ gì. Nó giúp họ có đủ bối cảnh để tự hiểu vì sao lịch sử đã diễn ra như vậy.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
