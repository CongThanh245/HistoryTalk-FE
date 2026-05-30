"use client";

import Link from "next/link";
import Image from "next/image";
import { BankIcon, UserIcon, ClipboardTextIcon } from "@phosphor-icons/react";

const bannerLinks = [
  {
    href: "/events",
    icon: BankIcon,
    label: "Sự kiện lịch sử",
    color: "var(--accent-gold, #EA7A0A)",
    shadow: "0 6px 16px rgba(255, 146, 21, 0.15)",
  },
  {
    href: "/characters",
    icon: UserIcon,
    label: "Nhân vật",
    color: "var(--accent-bronze, #c46a2f)",
    shadow: "0 6px 16px rgba(196, 106, 47, 0.15)",
  },
  {
    href: "/quiz",
    icon: ClipboardTextIcon,
    label: "Trắc nghiệm",
    color: "var(--burning-flame, #FAB95B)",
    shadow: "0 6px 16px rgba(248, 146, 74, 0.15)",
  },
];

export function HomeBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border"
      style={{
        background: "var(--home-banner-bg)",
        borderColor: "var(--home-banner-border)",
        boxShadow: "var(--home-banner-shadow)",
        minHeight: "260px",
      }}
    >
      <div
        className="absolute top-0 right-0 w-100 h-100 rounded-full blur-[100px] pointer-events-none opacity-30"
        style={{
          background: "radial-gradient(circle, var(--burning-flame, #72383D) 0%, transparent 70%)",
          transform: "translate(50px, -50px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[250px] h-[250px] rounded-full blur-[70px] pointer-events-none opacity-10"
        style={{
          background: "radial-gradient(circle, var(--accent-blue, #8fb3c8) 0%, transparent 70%)",
        }}
      />

      <div className="flex-1 z-10 max-w-2xl text-left">
        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3"
          style={{ color: "var(--home-banner-title)", lineHeight: 1.25 }}
        >
          Trò chuyện cùng nhân vật lịch sử, <br className="hidden sm:inline" />
          mọi lúc, mọi nơi
        </h1>
        <p
          className="text-sm md:text-base mb-6 font-normal"
          style={{ color: "var(--home-banner-text)", lineHeight: 1.5 }}
        >
          Khám phá di sản và tìm hiểu lịch sử trực quan qua góc nhìn của các bậc vĩ nhân và tiền nhân.
        </p>

        <div className="flex flex-wrap gap-3">
          {bannerLinks.map(({ href, icon: Icon, label, color, shadow }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 border hover:-translate-y-0.5"
              style={{
                background: "var(--home-banner-button-bg)",
                borderColor: "var(--home-banner-button-border)",
                color: "var(--home-banner-button-text)",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--home-banner-button-hover-bg)";
                e.currentTarget.style.borderColor = "var(--home-banner-button-hover-border)";
                e.currentTarget.style.boxShadow = shadow;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--home-banner-button-bg)";
                e.currentTarget.style.borderColor = "var(--home-banner-button-border)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
              }}
            >
              <Icon size={18} style={{ color }} />
              <span className="text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-end justify-end relative w-100 h-75 shrink-0">
        <div
          className="absolute z-20"
          style={{
            width: "280px",
            height: "280px",
            filter: "drop-shadow(0 14px 22px rgba(50, 45, 41, 0.26))",
            transform: "translate(80px, 40px)",
          }}
        >
          <Image
            src="/ngo_quyen.png"
            alt="HistoryTalk banner character"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
