"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChatTextIcon, CompassIcon, UsersIcon } from "@phosphor-icons/react";
import { Container } from "../container";
import { SectionHeading } from "../section-heading";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

const solutions = [
  {
    title: "Từ người đọc thành người đối thoại",
    description:
      "Thay vì chỉ đọc về sự kiện, bạn bước vào một cuộc trò chuyện với nhân vật đã sống trong thời kỳ đó.",
    icon: ChatTextIcon,
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    title: "Từ sự kiện thành con người",
    description:
      "Lịch sử không chỉ là điều đã xảy ra, mà là những con người, lựa chọn và hoàn cảnh đã tạo nên nó.",
    icon: UsersIcon,
    iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    title: "Từ ghi nhớ thành thấu hiểu",
    description:
      "Khi nhìn sự kiện từ góc nhìn nhân vật, người học dễ kết nối nguyên nhân, hậu quả và ý nghĩa hơn.",
    icon: CompassIcon,
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
];

export function SolutionSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-t border-[var(--border-default)] bg-[var(--bg-main)] py-24 md:py-32"
    >
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(143, 179, 200, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(201, 162, 77, 0.04) 0%, transparent 60%)
          `,
        }}
      />

      <Container className="relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="space-y-10">
            <div data-reveal="fast" className="text-left">
              <SectionHeading
                centered={false}
                className="!mb-6 text-left"
                title="Bước vào góc nhìn của người làm nên lịch sử"
                subtitle="History Talk biến những dòng chữ tĩnh thành cuộc đối thoại có bối cảnh, ký ức và phản hồi."
              />
            </div>

            <div className="space-y-6">
              {solutions.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    data-reveal="block"
                    className="group flex gap-4 rounded-xl border border-transparent p-4 transition-all duration-300 hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)]/30"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-transform duration-300 group-hover:scale-105 ${item.iconBg}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1.5 text-lg font-bold text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[var(--accent-gold)]">
                        {item.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div data-reveal="block" className="group relative">
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-[var(--accent-gold)]/10 to-[#8fb3c8]/10 opacity-50 blur-2xl transition-opacity duration-500 pointer-events-none group-hover:opacity-100" />

            <div className="relative flex h-[260px] w-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#0d1627] shadow-2xl transition-all duration-300 group-hover:border-[var(--accent-gold)]/30 sm:h-[340px] lg:h-[420px]">
              <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--border-default)] bg-[#111c2e] px-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f87171]/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#fbbf24]/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#34d399]/40" />
                </div>
                <div className="flex h-5 w-[60%] items-center justify-center truncate rounded-md border border-white/5 bg-[#1a2436] px-8 font-mono text-[10px] text-zinc-500">
                  historytalk.vn/app/chat
                </div>
                <div className="w-6" />
              </div>

              <div className="relative flex-1 overflow-hidden bg-[var(--bg-surface)]">
                <Image
                  src="/history-talk-ui.png"
                  alt="History Talk chat interface"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#070d18]/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
