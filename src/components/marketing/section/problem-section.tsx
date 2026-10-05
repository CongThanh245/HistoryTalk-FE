"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "../container";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const problems = [
  {
    id: 1,
    title: "Áp lực thi cử và hệ quả của lối học vẹt",
    body: "Thay vì khơi gợi sự thấu hiểu về dòng chảy thời đại, lịch sử thường bị đóng khung thành những mốc thời gian cần ghi nhớ để vượt qua bài kiểm tra.",
    rotate: "-2.5deg",
  },
  {
    id: 2,
    title: "Thiếu nền tảng tự học tương tác và đáng tin cậy",
    body: "Người học dễ tìm thấy video ngắn, phim ảnh hay trò chơi, nhưng lại thiếu một nơi giúp đặt câu hỏi, kiểm chứng bối cảnh và hiểu sâu hơn sau mỗi câu chuyện.",
    rotate: "1.5deg",
  },
  {
    id: 3,
    title: "Đứt gãy cảm xúc với phương pháp truyền thống",
    body: "Khi lịch sử chỉ còn là kết quả sự kiện, người học khó cảm nhận được con người, niềm tin, xung đột và cái giá nằm phía sau mỗi quyết định.",
    rotate: "-1deg",
  },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const [isReady, setIsReady] = useState(false);
  useRevealAnimation(sectionRef);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        const scrollRoot = sectionRef.current?.closest<HTMLElement>("[data-marketing-scroll]");
        const scroller =
          scrollRoot && ["scroll", "auto"].includes(getComputedStyle(scrollRoot).overflowY)
            ? scrollRoot
            : undefined;

        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          gsap.set(card, { x: "120%", opacity: 0, rotate: problems[i].rotate });
        });

        const tl = gsap.timeline({ paused: true });

        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          tl.to(
            card,
            {
              x: 0,
              opacity: 1,
              rotate: problems[i].rotate,
              duration: 0.6,
              ease: "power3.out",
            },
            i === 0 ? 0 : ">-0.15",
          );
        });

        ScrollTrigger.create({
          trigger: sectionRef.current,
          scroller,
          start: "45% 80%",
          once: true,
          onEnter: () => tl.play(),
        });
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, [isReady]);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-svh items-start overflow-hidden bg-(--bg-main) md:items-center"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-(--text-primary)" />

      <div className="relative z-10 w-full py-7 md:py-16 lg:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-6 md:gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:gap-20">
            <div className="px-2 md:px-0">
              <h2
                data-reveal="fast"
                className="archive-title mb-3 text-[1.75rem] md:mb-4 md:text-[2.25rem] lg:text-[2.75rem]"
              >
                Vấn đề học <em>lịch sử</em> ngày nay
              </h2>
              <p
                data-reveal="block"
                className="max-w-[320px] border-t border-(--text-primary) pt-3 text-sm text-(--text-secondary) md:text-base"
              >
                Ba rào cản lớn đang ngăn người học chạm vào chiều sâu của lịch
                sử: bối cảnh, cảm xúc và khả năng tự đặt câu hỏi.
              </p>
            </div>

            <div className="-mx-2 px-2 md:-mx-4 md:px-4">
              <div className="flex flex-col gap-4 md:gap-6">
                {problems.map((problem, i) => (
                  <div
                    key={problem.id}
                    ref={(el) => {
                      cardsRef.current[i] = el;
                    }}
                    data-motion-card
                    className="group flex gap-4 rounded-[2px] border border-(--text-primary) bg-(--bg-surface) px-4 py-4 transition-colors duration-200 will-change-transform hover:bg-(--bg-elevated) md:gap-6 md:px-6 md:py-5"
                  >
                    <span className="shrink-0 font-display text-[1.5rem] font-extrabold leading-none text-(--accent-gold) md:text-[2rem]">
                      [{String(problem.id).padStart(2, "0")}]
                    </span>
                    <div className="min-w-0">
                      <h3 className="archive-title is-plain mb-2 text-[17px] md:mb-2.5 md:text-[20px] lg:text-[22px]">
                        {problem.title}
                      </h3>
                      <p className="border-t border-(--border-default) pt-2 text-[0.85rem] leading-relaxed text-(--text-secondary) md:pt-2.5 md:text-[0.9rem] lg:text-[0.95rem]">
                        {problem.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-(--text-primary)" />
    </section>
  );
}
