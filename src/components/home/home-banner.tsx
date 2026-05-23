"use client";

import Link from "next/link";
import Image from "next/image";
import { BankIcon, UserIcon, ClipboardTextIcon } from "@phosphor-icons/react";

export function HomeBanner() {
  return (
    <div
      className="relative overflow-hidden rounded-3xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 border"
      style={{
        background: "linear-gradient(135deg, #0e1a2b 0%, #16223a 50%, #070d18 100%)",
        borderColor: "rgba(255, 255, 255, 0.08)",
        boxShadow: "0 10px 30px rgba(7, 13, 24, 0.25)",
        minHeight: "260px",
      }}
    >
      {/* Decorative Glow Elements */}
      <div
        className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[80px] pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, var(--accent-gold, #ff9215) 0%, transparent 70%)",
          transform: "translate(100px, -100px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/3 w-[250px] h-[250px] rounded-full blur-[70px] pointer-events-none opacity-10"
        style={{
          background: "radial-gradient(circle, var(--accent-blue, #8fb3c8) 0%, transparent 70%)",
        }}
      />

      {/* Left Column: Text & Action Buttons */}
      <div className="flex-1 z-10 max-w-2xl text-left">
        <h1
          className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-3"
          style={{ lineHeight: 1.25 }}
        >
          Trò chuyện cùng nhân vật lịch sử, <br className="hidden sm:inline" />
          mọi lúc, mọi nơi
        </h1>
        <p
          className="text-sm md:text-base mb-6 font-normal"
          style={{ color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.5 }}
        >
          Khám phá di sản và tìm hiểu lịch sử trực quan qua góc nhìn của các bậc vĩ nhân và tiền nhân.
        </p>

        {/* Quick Navigation Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/events"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 border hover:-translate-y-0.5"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 146, 21, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
          >
            <BankIcon size={18} style={{ color: "var(--accent-gold, #ff9215)" }} />
            <span className="text-sm font-semibold">Sự kiện lịch sử</span>
          </Link>

          <Link
            href="/characters"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 border hover:-translate-y-0.5"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(196, 106, 47, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
          >
            <UserIcon size={18} style={{ color: "var(--accent-bronze, #c46a2f)" }} />
            <span className="text-sm font-semibold">Nhân vật</span>
          </Link>

          <Link
            href="/quiz"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-200 border hover:-translate-y-0.5"
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              borderColor: "rgba(255, 255, 255, 0.1)",
              color: "#ffffff",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.12)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.2)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(248, 146, 74, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
            }}
          >
            <ClipboardTextIcon size={18} style={{ color: "var(--burning-flame, #FAB95B)" }} />
            <span className="text-sm font-semibold">Trắc nghiệm</span>
          </Link>
        </div>
      </div>

      {/* Right Column: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden md:flex items-center justify-center relative w-[280px] h-[200px] shrink-0 mr-4">
        {/* Character Card 1 (Left tilted) */}
        <div
          className="absolute w-[100px] h-[140px] rounded-xl overflow-hidden border shadow-lg transition-transform duration-300"
          style={{
            transform: "rotate(-12deg) translate(-50px, 0px) scale(0.95)",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="relative w-full h-[100px]">
            <Image
              src="/ngo-quyen.jpg"
              alt="Ngô Quyền"
              fill
              className="object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a2b] to-transparent" />
          </div>
          <div className="p-1.5 text-center bg-[#0e1a2b]">
            <p className="text-[10px] font-bold text-white truncate">Ngô Quyền</p>
          </div>
        </div>

        {/* Character Card 2 (Right tilted) */}
        <div
          className="absolute w-[100px] h-[140px] rounded-xl overflow-hidden border shadow-lg transition-transform duration-300"
          style={{
            transform: "rotate(14deg) translate(50px, 10px) scale(0.95)",
            zIndex: 10,
            background: "rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div className="relative w-full h-[100px]">
            <Image
              src="/war.jpg"
              alt="Lịch sử"
              fill
              className="object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e1a2b] to-transparent" />
          </div>
          <div className="p-1.5 text-center bg-[#0e1a2b]">
            <p className="text-[10px] font-bold text-white truncate">Bạch Đằng</p>
          </div>
        </div>

        {/* Mascot (Center Front) */}
        <div
          className="absolute z-20 transition-transform duration-500 hover:scale-105"
          style={{
            width: "140px",
            height: "140px",
            filter: "drop-shadow(0 10px 20px rgba(0, 0, 0, 0.4))",
            transform: "translateY(-10px)",
          }}
        >
          <Image
            src="/history_talk_mascot.png"
            alt="Mascot"
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
