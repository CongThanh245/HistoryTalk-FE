"use client";

import { useEffect, useRef } from "react";
import { HelpCircle } from "lucide-react";

export function FactTriggerButton({ onClick }: { onClick: () => void }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      if (!btnRef.current) return;
      gsap.to(btnRef.current, {
        y: -4,
        duration: 1.6,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    });
  }, []);

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      title="Khám phá sự thật lịch sử"
      className="group fixed bottom-7 right-7 z-[1000] flex items-center gap-2.5 px-5 py-3 rounded-[2px] bg-[var(--text-primary)] border border-[var(--text-primary)] shadow-[var(--shadow-soft)] cursor-pointer text-[var(--text-inverse)] transition-colors duration-[180ms] whitespace-nowrap hover:bg-[var(--accent-gold)] hover:border-[var(--accent-gold)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent-gold)]"
    >
      <span className="text-xl leading-none text-[var(--accent-on-ink)] group-hover:text-white">
        <HelpCircle />
      </span>
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-xs font-extrabold leading-none uppercase tracking-[0.08em]">
          +1 Kiến thức về lịch sử
        </span>
        <span className="text-[9px] opacity-80 font-normal tracking-[0.06em]">
          Mỗi ngày biết thêm 1 sự thật về lịch sử chiến tranh
        </span>
      </div>
    </button>
  );
}
