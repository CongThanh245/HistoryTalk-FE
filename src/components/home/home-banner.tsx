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
    label: "Câu đố lịch sử",
    color: "var(--burning-flame, #FAB95B)",
    shadow: "0 6px 16px rgba(248, 146, 74, 0.15)",
  },
];

export function HomeBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-8 border"
      style={{
        background: "var(--home-banner-bg)",
        borderColor: "var(--home-banner-border)",
        boxShadow: "var(--home-banner-shadow)",
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
          className="text-[21px] sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 md:mb-3"
          style={{ color: "var(--home-banner-title)", lineHeight: 1.25 }}
        >
          Trò chuyện cùng nhân vật lịch sử, <br className="hidden sm:inline" />
          mọi lúc, mọi nơi
        </h1>
        <p
          className="text-[13px] sm:text-sm md:text-base mb-4 md:mb-6 font-normal max-w-xl"
          style={{ color: "var(--home-banner-text)", lineHeight: 1.5 }}
        >
          Khám phá di sản và tìm hiểu lịch sử trực quan qua góc nhìn của các bậc vĩ nhân và tiền nhân.
        </p>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2.5 md:gap-3">
          {bannerLinks.map(({ href, icon: Icon, label, color, shadow }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center sm:justify-start gap-2 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 border hover:-translate-y-0.5"
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
              <Icon size={17} style={{ color }} />
              <span className="text-[13px] md:text-sm font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden md:flex items-end justify-end relative w-[420px] h-[330px] shrink-0">
        <div
          className="absolute left-10 top-0 z-10 overflow-hidden rounded-[28px] border"
          style={{
            width: "210px",
            height: "270px",
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03))",
            borderColor: "rgba(50, 45, 41, 0.08)",
            boxShadow: "0 14px 24px rgba(50, 45, 41, 0.1)",
            transform: "rotate(-7deg)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Image
            src="/le_loi.png"
            alt="Lê Lợi"
            fill
            sizes="210px"
            className="object-contain object-bottom p-1 scale-110"
          />
        </div>
        <div
          className="absolute right-0 bottom-0 z-20 overflow-hidden rounded-[28px] border"
          style={{
            width: "245px",
            height: "315px",
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04))",
            borderColor: "rgba(50, 45, 41, 0.08)",
            boxShadow: "0 16px 28px rgba(50, 45, 41, 0.12)",
            transform: "rotate(5deg)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Image
            src="/ngo_quyen.png"
            alt="Ngô Quyền"
            fill
            sizes="245px"
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
