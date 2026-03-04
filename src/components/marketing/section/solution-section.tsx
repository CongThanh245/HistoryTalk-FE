"use client";

import { useRef } from "react";
import { Container } from "../container";
import { SectionHeading } from "../section-heading";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const solutions = [
  {
    title: "Từ người đọc thành người đối thoại",
    description:
      "Thay vì chỉ đọc về các sự kiện, bạn có thể bước vào một cuộc trò chuyện với những người đã sống trong thời kỳ đó.",
  },
  {
    title: "Từ sự kiện thành con người",
    description:
      "Lịch sử không chỉ là những gì đã xảy ra, mà là những con người đã tạo nên nó. Hiểu họ giúp bạn hiểu câu chuyện phía sau.",
  },
  {
    title: "Từ ghi nhớ thành thấu hiểu",
    description:
      "Khi nhìn lịch sử từ góc nhìn của nhân vật, các sự kiện trở nên dễ hiểu và có ý nghĩa hơn.",
  },
];

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="py-24 md:py-32 bg-[var(--bg-main)] border-t border-[var(--border-default)]"
    >
      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div>
            <div data-reveal="fast">
              <SectionHeading
                title="Bước vào góc nhìn của người làm nên lịch sử"
                subtitle="History Talk biến lịch sử từ những dòng chữ tĩnh thành cuộc trò chuyện với các nhân vật đã tạo nên quá khứ."
              />
            </div>

            <div className="space-y-8 mt-10">
              {solutions.map((item, index) => (
                <div
                  key={index}
                  data-reveal="block"
                  className="border-l-2 border-[var(--accent-gold)] pl-6"
                >
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    {item.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div data-reveal="block" className="relative">
            <div className="w-full h-[420px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] flex items-center justify-center">
              <img
                src="/history-talk-ui.png"
                alt="History Talk UI"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
