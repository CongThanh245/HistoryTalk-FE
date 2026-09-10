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
      className="fixed bottom-7 right-7 z-[1000] flex items-center gap-2.5 px-5 py-3 rounded-[50px] bg-gradient-to-br from-[#2d1f08] to-[#1a1209] border border-accent-gold/40 shadow-[0_8px_28px_rgba(0,0,0,0.38),0_0_0_1px_rgba(201,162,77,0.07),inset_0_1px_0_rgba(201,162,77,0.14)] cursor-pointer text-accent-gold/[0.92] transition-[border,box-shadow] duration-[180ms] whitespace-nowrap hover:border-accent-gold/65 hover:shadow-[0_10px_36px_rgba(0,0,0,0.44),0_0_28px_rgba(201,162,77,0.13),inset_0_1px_0_rgba(201,162,77,0.22)]"
    >
      <span className="text-xl leading-none">
        <HelpCircle />
      </span>
      <div className="flex flex-col items-start gap-0.5">
        <span className="text-xs font-extrabold leading-none tracking-[0.04em]">
          +1 Kiến thức về lịch sử
        </span>
        <span className="text-[9px] opacity-80 font-normal tracking-[0.06em]">
          Mỗi ngày biết thêm 1 sự thật về lịch sử chiến tranh
        </span>
      </div>
    </button>
  );
}
