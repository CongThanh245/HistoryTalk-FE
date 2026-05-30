"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChatTextIcon,
  CheckCircleIcon,
  CompassIcon,
  MapTrifoldIcon,
  QuestionIcon,
} from "@phosphor-icons/react";
import { Container } from "../container";
import { cn } from "@/lib/utils/cn";

const journeySteps = [
  {
    step: "01",
    eyebrow: "Chọn điểm khởi hành",
    title: "Bắt đầu từ một nhân vật hoặc một biến cố",
    body: "Người học chọn thời kỳ, trận đánh hoặc nhân vật để bước vào đúng bối cảnh lịch sử trước khi đặt câu hỏi.",
    icon: MapTrifoldIcon,
    previewTitle: "Bạch Đằng 938",
    previewBody:
      "Ngô Quyền chuẩn bị thế trận cọc gỗ trên sông, chờ thủy triều rút để phản công.",
  },
  {
    step: "02",
    eyebrow: "Đặt câu hỏi",
    title: "Trò chuyện tự nhiên thay vì đọc một chiều",
    body: "Câu hỏi mở giúp người học đào sâu nguyên nhân, niềm tin và lựa chọn của nhân vật trong từng thời khắc.",
    icon: ChatTextIcon,
    previewTitle: "Bạn hỏi",
    previewBody: "Vì sao phải chờ nước triều rút mới tổng tiến công?",
  },
  {
    step: "03",
    eyebrow: "Hiểu bối cảnh",
    title: "Kết nối sự kiện với con người và hệ quả",
    body: "History Talk giúp biến dữ kiện rời rạc thành mạch truyện: ai quyết định, vì sao quyết định và điều gì xảy ra sau đó.",
    icon: CompassIcon,
    previewTitle: "AI phản hồi",
    previewBody:
      "Kế sách phụ thuộc vào con nước. Khi thuyền địch mắc cạn, thế trận mới thật sự khép lại.",
  },
  {
    step: "04",
    eyebrow: "Ôn tập",
    title: "Chốt kiến thức bằng quiz sau hành trình",
    body: "Sau mỗi cuộc trò chuyện, người học kiểm tra lại điều vừa hiểu bằng câu hỏi ngắn, rõ bối cảnh và có giải thích.",
    icon: QuestionIcon,
    previewTitle: "Quiz nhanh",
    previewBody:
      "Chiến thuật nào giúp Ngô Quyền đánh bại quân Nam Hán trên sông Bạch Đằng?",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-journey-card]");
        const progress = sectionRef.current?.querySelector("[data-journey-progress]");

        gsap.fromTo(
          cards,
          { y: 44, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 72%",
            },
          },
        );

        if (progress) {
          gsap.fromTo(
            progress,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              transformOrigin: "top",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 65%",
                end: "bottom 45%",
                scrub: true,
              },
            },
          );
        }
      }, sectionRef);
    };

    init();
    return () => ctx?.revert();
  }, []);

  const activeStep = journeySteps[active];
  const ActiveIcon = activeStep.icon;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-20 md:py-32"
    >
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(255,146,21,0.06)_0,transparent_28%,transparent_72%,rgba(143,179,200,0.06)_100%)]" />

      <Container className="relative z-10">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="mb-4 block text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-gold)]">
              Hành trình học
            </span>
            <h2 className="max-w-xl text-3xl font-bold uppercase leading-tight tracking-wide sm:text-4xl lg:text-5xl bg-gradient-to-r from-[var(--text-primary)] via-[var(--accent-gold)] to-[var(--text-primary)] bg-clip-text text-transparent">
              Một dòng thời gian, bốn lần chạm vào lịch sử
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--text-secondary)] lg:text-base">
              Mỗi bước dẫn người học từ tò mò đến đối thoại, rồi khép lại bằng ôn tập có ý nghĩa.
            </p>

            <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#101a2c] shadow-[var(--shadow-strong)]">
              <div className="border-b border-[var(--border-default)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ActiveIcon className="h-5 w-5 text-[var(--accent-gold)]" />
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                      {activeStep.previewTitle}
                    </span>
                  </div>
                  <span className="text-[0.65rem] font-semibold text-[var(--accent-gold)]">
                    {activeStep.step}/04
                  </span>
                </div>
              </div>
              <div className="min-h-[190px] p-5">
                <div className="mb-4 flex justify-start">
                  <div className="max-w-[88%] rounded-lg rounded-tl-none border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-sm leading-relaxed text-[var(--text-secondary)]">
                    {activeStep.previewBody}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400" />
                  <span>Bối cảnh được giữ trong mạch học, không tách rời thành dữ kiện khô.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[19px] top-0 hidden h-full w-px bg-[var(--border-default)] md:block" />
            <div
              data-journey-progress
              className="absolute left-[19px] top-0 hidden h-full w-px origin-top bg-[var(--accent-gold)] md:block"
            />

            <div className="space-y-5">
              {journeySteps.map((item, index) => {
                const Icon = item.icon;
                const isActive = active === index;

                return (
                  <button
                    key={item.step}
                    data-journey-card
                    type="button"
                    onClick={() => setActive(index)}
                    onMouseEnter={() => setActive(index)}
                    className="group grid w-full grid-cols-1 gap-4 text-left md:grid-cols-[40px_1fr]"
                  >
                    <span
                      className={cn(
                        "relative z-10 hidden h-10 w-10 items-center justify-center rounded-full border transition-all md:flex",
                        isActive
                          ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[var(--bg-deep)]"
                          : "border-[var(--border-default)] bg-[var(--bg-main)] text-[var(--text-muted)]",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <span
                      className={cn(
                        "block rounded-[var(--radius-lg)] border p-5 transition-all duration-300",
                        isActive
                          ? "border-[var(--accent-gold)]/40 bg-[var(--bg-surface)] shadow-[var(--shadow-soft)]"
                          : "border-[var(--border-default)] bg-transparent hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface)]/40",
                      )}
                    >
                      <span className="mb-3 flex items-center justify-between gap-4">
                        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-gold)]">
                          {item.eyebrow}
                        </span>
                        <span className="text-xs font-bold text-[var(--text-muted)]">{item.step}</span>
                      </span>
                      <span className="block text-lg font-bold uppercase leading-snug text-[var(--text-primary)]">
                        {item.title}
                      </span>
                      <span className="mt-3 block text-sm leading-relaxed text-[var(--text-secondary)]">
                        {item.body}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
