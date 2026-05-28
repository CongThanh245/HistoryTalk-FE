"use client";

import { useEffect, useRef } from "react";
import { Container } from "../container";

const problems = [
  {
    id: 1,
    tag: "VẤN ĐỀ 01",
    title: "Áp lực thi cử và hệ quả của lối học vẹt",
    body: "Thay vì khơi gợi sự thấu hiểu về dòng chảy thời đại, lịch sử thường bị đóng khung thành những mốc thời gian cần ghi nhớ để vượt qua bài kiểm tra.",
    rotate: "-2.5deg",
  },
  {
    id: 2,
    tag: "VẤN ĐỀ 02",
    title: "Thiếu nền tảng tự học tương tác và đáng tin cậy",
    body: "Người học dễ tìm thấy video ngắn, phim ảnh hay trò chơi, nhưng lại thiếu một nơi giúp đặt câu hỏi, kiểm chứng bối cảnh và hiểu sâu hơn sau mỗi câu chuyện.",
    rotate: "1.5deg",
  },
  {
    id: 3,
    tag: "VẤN ĐỀ 03",
    title: "Đứt gãy cảm xúc với phương pháp truyền thống",
    body: "Khi lịch sử chỉ còn là kết quả sự kiện, người học khó cảm nhận được con người, niềm tin, xung đột và cái giá nằm phía sau mỗi quyết định.",
    rotate: "-1deg",
  },
];

export function ProblemSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
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
          start: "45% 80%",
          once: true,
          onEnter: () => tl.play(),
        });
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-auto min-h-[600px] items-start overflow-hidden bg-[var(--bg-deep)] md:h-svh md:items-center"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[var(--border-default)]" />

      <div className="relative z-10 w-full py-16 md:py-0">
        <Container>
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <div className="mb-5 h-12 w-[3px] rounded-full bg-gradient-to-b from-[var(--text-secondary)] to-transparent" />
              <h2 className="mb-4 text-[clamp(2.5rem,6vw,6rem)] font-bold uppercase leading-[0.88] tracking-wide text-[var(--text-secondary)]">
                Vấn đề
                <br />
                học <span className="text-[var(--text-primary)]">lịch sử</span>
                <br />
                ngày nay
              </h2>
              <p className="max-w-[340px] text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
                Ba rào cản lớn đang ngăn người học chạm vào chiều sâu của lịch sử: bối cảnh, cảm xúc và khả năng tự đặt câu hỏi.
              </p>
            </div>

            <div className="-mx-4 overflow-hidden px-4">
              <div className="flex flex-col gap-[14px]">
                {problems.map((problem, i) => (
                  <div
                    key={problem.id}
                    ref={(el) => {
                      cardsRef.current[i] = el;
                    }}
                    className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-6 py-5 shadow-[var(--shadow-strong)] transition-colors duration-200 will-change-transform hover:border-[var(--border-strong)] hover:bg-[var(--bg-elevated)]"
                  >
                    <span className="mb-2 block text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-gold)] opacity-80">
                      {problem.tag}
                    </span>
                    <h3 className="mb-2.5 text-[0.95rem] font-bold uppercase leading-snug tracking-wide text-[var(--text-primary)] lg:text-[1.05rem]">
                      {problem.title}
                    </h3>
                    <div className="mb-2.5 h-[1.5px] w-7 bg-[var(--accent-gold)] opacity-30" />
                    <p className="text-[0.82rem] leading-relaxed text-[var(--text-secondary)] lg:text-[0.88rem]">
                      {problem.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-px bg-[var(--border-default)]" />
    </section>
  );
}
