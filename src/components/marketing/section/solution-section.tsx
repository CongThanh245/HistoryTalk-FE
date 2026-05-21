"use client";

import { useRef } from "react";
import { Container } from "../container";
import { SectionHeading } from "../section-heading";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";
import { ChatTextIcon, UsersIcon, CompassIcon, SparkleIcon, ShieldCheckIcon } from "@phosphor-icons/react";

const solutions = [
  {
    title: "Từ người đọc thành người đối thoại",
    description:
      "Thay vì chỉ đọc về các sự kiện, bạn có thể bước vào một cuộc trò chuyện với những người đã sống trong thời kỳ đó.",
    icon: ChatTextIcon,
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    title: "Từ sự kiện thành con người",
    description:
      "Lịch sử không chỉ là những gì đã xảy ra, mà là những con người đã tạo nên nó. Hiểu họ giúp bạn hiểu câu chuyện phía sau.",
    icon: UsersIcon,
    iconBg: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  },
  {
    title: "Từ ghi nhớ thành thấu hiểu",
    description:
      "Khi nhìn lịch sử từ góc nhìn của nhân vật, các sự kiện trở nên dễ hiểu và có ý nghĩa hơn.",
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
      className="relative py-24 md:py-32 bg-[var(--bg-main)] border-t border-[var(--border-default)] overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div 
        className="absolute inset-0 pointer-events-none z-0" 
        style={{
          background: `
            radial-gradient(circle at 20% 50%, rgba(143, 179, 200, 0.04) 0%, transparent 60%),
            radial-gradient(circle at 90% 80%, rgba(201, 162, 77, 0.04) 0%, transparent 60%)
          `
        }}
      />

      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* LEFT */}
          <div className="space-y-10">
            <div data-reveal="fast" className="text-left">
              <SectionHeading
                centered={false}
                className="!mb-6 text-left"
                title="Bước vào góc nhìn của người làm nên lịch sử"
                subtitle="History Talk biến lịch sử từ những dòng chữ tĩnh thành cuộc trò chuyện với các nhân vật đã tạo nên quá khứ."
              />
            </div>

            <div className="space-y-6">
              {solutions.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    data-reveal="block"
                    className="flex gap-4 p-4 rounded-xl border border-transparent hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)]/30 transition-all duration-300 group"
                  >
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${item.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5 transition-colors duration-300 group-hover:text-[var(--accent-gold)]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT - PREMIUM DEVICE MOCKUP */}
          <div data-reveal="block" className="relative group">
            {/* Ambient Background Glow behind device */}
            <div className="absolute -inset-2 bg-gradient-to-r from-[var(--accent-gold)]/10 to-[#8fb3c8]/10 rounded-2xl blur-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Device Container */}
            <div className="relative w-full h-[260px] sm:h-[340px] lg:h-[420px] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[#0d1627] flex flex-col overflow-hidden shadow-2xl transition-all duration-300 group-hover:border-[var(--accent-gold)]/30">
              
              {/* Browser Header Bar */}
              <div className="h-9 border-b border-[var(--border-default)] bg-[#111c2e] px-4 flex items-center justify-between shrink-0">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f87171]/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#34d399]/40" />
                </div>
                <div className="bg-[#1a2436] rounded-md h-5 px-8 flex items-center justify-center text-[10px] text-zinc-500 font-mono w-[60%] border border-white/5 truncate">
                  historytalk.vn/app/chat
                </div>
                <div className="w-6" /> {/* Spacer */}
              </div>

              {/* Main Content Area */}
              <div className="flex-1 relative overflow-hidden bg-[var(--bg-surface)]">
                <img
                  src="/history-talk-ui.png"
                  alt="History Talk UI"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                
                {/* Overlay Vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070d18]/40 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

      

          </div>
        </div>
      </Container>
    </section>
  );
}
