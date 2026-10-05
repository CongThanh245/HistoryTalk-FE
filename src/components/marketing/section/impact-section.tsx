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
      className="relative flex min-h-svh items-start overflow-hidden border-t border-(--text-primary) bg-(--bg-main) py-7 md:items-center md:py-16 lg:py-0"
    >
      <div className="relative z-10 w-full py-7 md:py-16 lg:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-6 md:gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div className="min-w-0 px-2 md:px-0">
              <h2 data-reveal="fast" className="archive-title mb-3 break-words text-[1.5rem] md:mb-4 md:text-[2rem] lg:text-[2.5rem]">
                Điều còn lại không phải đáp án, <em>mà là hiểu biết</em>
              </h2>
              <p className="max-w-[320px] border-t border-(--text-primary) pt-3 text-sm leading-relaxed text-(--text-secondary) lg:text-base">
                History Talk giúp bạn hiểu lịch sử thông qua bối cảnh và lựa chọn của những người đã sống.
              </p>
            </div>

            <div className="-mx-2 overflow-hidden px-2 md:-mx-4 md:px-4">
              <div className="grid border-l border-t border-(--text-primary) md:grid-cols-3">
            {impacts.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <div
                  key={impact.title}
                  data-reveal="float"
                  data-motion-card
                  className="border-b border-r border-(--text-primary) bg-(--bg-surface) p-4 md:p-6"
                >
                  <div className="mb-3 flex items-center justify-between md:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[2px] bg-(--text-primary) text-(--text-inverse) md:h-11 md:w-11">
                      <Icon className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <span className="font-display text-[15px] font-extrabold text-(--accent-gold)">
                      [{String(index + 1).padStart(2, "0")}]
                    </span>
                  </div>
                  <h3 className="archive-title is-plain text-[18px] md:text-[20px]">{impact.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-(--text-secondary) md:mt-3 md:text-sm">{impact.description}</p>
                </div>
              );
            })}
          </div>

              <div data-reveal="block" className="mt-6 border-(--accent-gold) pl-4 md:mt-8 md:pl-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <Sparkles className="mt-1 h-5 w-5 shrink-0 text-(--accent-gold) md:h-6 md:w-6" />
                  <p className="max-w-3xl text-lg font-semibold leading-relaxed text-(--text-primary) md:text-xl lg:text-2xl">
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
