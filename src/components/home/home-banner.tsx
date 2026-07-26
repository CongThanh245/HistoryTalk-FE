"use client";

import Link from "next/link";
import Image from "next/image";
import { Landmark, User, ClipboardList, ArrowRight } from "lucide-react";

const bannerLinks = [
  { href: "/events", icon: Landmark, label: "Sự kiện lịch sử" },
  { href: "/characters", icon: User, label: "Nhân vật" },
  { href: "/quiz", icon: ClipboardList, label: "Câu đố lịch sử" },
];

export function HomeBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 sm:p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 md:gap-10 border"
      style={{
        background: "var(--home-banner-bg)",
        borderColor: "var(--home-banner-border)",
        boxShadow: "var(--home-banner-shadow)",
      }}
    >
      {/* Decorative glows */}
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-[100px] pointer-events-none opacity-25"
        style={{ background: "radial-gradient(circle, var(--burning-flame, #D97706) 0%, transparent 70%)" }}
      />
      <div
        className="absolute -bottom-16 left-1/4 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-[0.07]"
        style={{ background: "radial-gradient(circle, var(--accent-blue, #8fb3c8) 0%, transparent 70%)" }}
      />

      <div className="flex-1 z-10 max-w-2xl">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.2em] mb-3 text-accent-gold">
          Lịch sử Việt Nam
        </p>
        <h1
          className="font-title text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold tracking-tight mb-3 md:mb-4 leading-[1.2]"
          style={{ color: "var(--home-banner-title)" }}
        >
          Trò chuyện cùng nhân vật lịch sử, mọi lúc, mọi nơi
        </h1>
        <p
          className="text-sm sm:text-base md:text-lg mb-6 md:mb-8 max-w-xl leading-relaxed opacity-80"
          style={{ color: "var(--home-banner-text)" }}
        >
          Khám phá di sản và tìm hiểu lịch sử trực quan qua góc nhìn của các bậc vĩ nhân và tiền nhân.
        </p>

        <div className="flex flex-wrap gap-3">
          {bannerLinks.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 border hover:-translate-y-0.5 hover:shadow-lg"
              style={{
                background: "var(--home-banner-button-bg)",
                borderColor: "var(--home-banner-button-border)",
                color: "var(--home-banner-button-text)",
              }}
            >
              <Icon size={16} className="text-accent-gold transition-transform duration-200 group-hover:scale-110" />
              {label}
              <ArrowRight size={14} className="opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-60 group-hover:translate-x-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Character illustrations */}
      <div className="hidden md:flex items-end justify-end relative w-[380px] h-[300px] shrink-0">
        <div className="absolute left-8 top-0 z-10 overflow-hidden rounded-3xl border w-[190px] h-[250px] border-white/10 shadow-2xl -rotate-6 bg-gradient-to-br from-white/[0.14] to-white/[0.02] backdrop-blur-sm transition-transform duration-500 hover:-rotate-3 hover:scale-[1.02]">
          <Image
            src="/le_loi.png"
            alt="Lê Lợi"
            fill
            sizes="190px"
            className="object-contain object-bottom p-1 scale-110"
          />
        </div>
        <div className="absolute right-0 bottom-0 z-20 overflow-hidden rounded-3xl border w-[220px] h-[290px] border-white/10 shadow-2xl rotate-3 bg-gradient-to-br from-white/[0.16] to-white/[0.03] backdrop-blur-sm transition-transform duration-500 hover:rotate-1 hover:scale-[1.02]">
          <Image
            src="/ngo_quyen.png"
            alt="Ngô Quyền"
            fill
            sizes="220px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
