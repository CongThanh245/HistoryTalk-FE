"use client";

import { useEffect, useRef } from "react";
import { Container } from "../container";

const problems = [
  {
    id: 1,
    tag: "VẤN ĐỀ 01",
    title: "ÁP LỰC THI CỬ VÀ HỆ QUẢ CỦA LỐI HỌC VẸT",
    body: "Thay vì khơi gợi sự thấu hiểu về dòng chảy thời đại, giáo dục lịch sử hiện nay thường bị đóng khung trong việc ghi nhớ máy móc các cột mốc để đối phó với những kỳ thi căng thẳng.",
    rotate: "-2.5deg",
  },
  {
    id: 2,
    tag: "VẤN ĐỀ 02",
    title: "SỰ THIẾU HỤT CÁC NỀN TẢNG TỰ HỌC TƯƠNG TÁC VÀ CHUẨN XÁC",
    body: "Trong khi các công cụ học tập chính thống còn hạn chế, các phương tiện giải trí như TikTok, điện ảnh và trò chơi điện tử đang trở thành những nguồn kênh chính, trực tiếp nhào nặn nên thế giới quan lịch sử của giới trẻ nhưng lại thiếu đi sự kiểm chứng.",
    rotate: "1.5deg",
  },
  {
    id: 3,
    tag: "VẤN ĐỀ 03",
    title: "SỰ ĐỨT GÃY CẢM XÚC VỚI PHƯƠNG PHÁP GIÁO DỤC TRUYỀN THỐNG",
    body: "Lối trình bày khô khan trong sách giáo khoa—vốn quá chú trọng vào những con số thống kê và kết quả sự kiện—đang vô tình triệt tiêu sự kết nối tâm hồn giữa người học và những giá trị nhân văn của quá khứ.",
    rotate: "-1deg",
  },
];

export function ProblemSection() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const didInit = useRef(false);

  useEffect(() => {
    let ctx: { revert: () => void } | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (didInit.current) return;
      didInit.current = true;

      ctx = gsap.context(() => {
        // Set trạng thái ban đầu
        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          gsap.set(card, { x: "120%", opacity: 0, rotate: problems[i].rotate });
        });

        const tl = gsap.timeline({
          scrollTrigger: {
            // Trigger là wrapper div (cao 400vh), KHÔNG phải section
            trigger: wrapperRef.current,
            start: "top top",
            end: () => wrapperRef.current!.offsetHeight,
            scrub: 1.2,
            once: true,
            // Không dùng pin/pinSpacing → không có spacer bug
            onLeave: () => {
              if (!wrapperRef.current) return;

              const oldHeight = wrapperRef.current.offsetHeight;
              const scrollY = window.scrollY;

              requestAnimationFrame(() => {
                wrapperRef.current!.style.height = "100vh";

                const newHeight = wrapperRef.current!.offsetHeight;
                const diff = oldHeight - newHeight;

                ScrollTrigger.refresh();

                window.scrollTo(0, scrollY - diff);
              });
            },
          },
        });

        cardsRef.current.forEach((card, i) => {
          if (!card) return;
          tl.to(
            card,
            {
              x: 0,
              opacity: 1,
              rotate: problems[i].rotate,
              duration: 0.7,
              ease: "power3.out",
            },
            i === 0 ? 0 : ">-0.2",
          );
        });
      });
    };

    init();
    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    // Wrapper cao 400vh — tạo scroll space cho animation
    <div ref={wrapperRef} style={{ height: "400vh" }}>
      {/* Section sticky bằng CSS — không cần GSAP pin */}
      <section
        ref={sectionRef}
        className="sticky top-0 relative flex items-center h-svh min-h-[600px] overflow-hidden bg-[var(--bg-deep)]"
      >
        <div className="absolute top-0 inset-x-0 h-px bg-[var(--border-default)]" />

        <div className="relative z-10 w-full py-16">
          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 lg:gap-16 items-center">
              {/* LEFT: Heading */}
              <div>
                <div className="w-[3px] h-12 mb-5 rounded-full bg-gradient-to-b from-[var(--accent-gold)] to-transparent" />
                <h2 className="text-[clamp(2.5rem,6vw,6rem)] leading-[0.88] tracking-wide font-bold uppercase text-[var(--text-primary)] mb-4">
                  Vấn đề
                  <br />
                  học <span className="text-[var(--accent-gold)]">lịch sử</span>
                  <br />
                  ngày nay
                </h2>
                <p className="text-sm lg:text-base text-[var(--text-secondary)] max-w-[340px] leading-relaxed">
                  Ba rào cản lớn đang ngăn cách thế hệ trẻ khỏi việc thực sự
                  hiểu và cảm nhận chiều sâu của lịch sử dân tộc.
                </p>
              </div>

              {/* RIGHT: Cards */}
              <div className="overflow-hidden px-4 -mx-4">
                <div className="flex flex-col gap-[14px]">
                  {problems.map((problem, i) => (
                    <div
                      key={problem.id}
                      ref={(el) => {
                        cardsRef.current[i] = el;
                      }}
                      className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-strong)] px-6 py-5 transition-colors duration-200 hover:bg-[var(--bg-elevated)] hover:border-[var(--border-strong)] will-change-transform"
                    >
                      <span className="block text-[0.62rem] font-semibold tracking-[0.18em] uppercase text-[var(--accent-gold)] opacity-80 mb-2">
                        {problem.tag}
                      </span>
                      <h3 className="text-[0.95rem] lg:text-[1.05rem] font-bold uppercase tracking-wide text-[var(--text-primary)] mb-2.5 leading-snug">
                        {problem.title}
                      </h3>
                      <div className="w-7 h-[1.5px] bg-[var(--accent-gold)] opacity-30 mb-2.5" />
                      <p className="text-[0.82rem] lg:text-[0.88rem] leading-relaxed text-[var(--text-secondary)]">
                        {problem.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-px bg-[var(--border-default)]" />
      </section>
    </div>
  );
}
