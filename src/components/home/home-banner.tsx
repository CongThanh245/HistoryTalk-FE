"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Landmark,
  MessagesSquare,
  SlidersHorizontal,
  User,
} from "lucide-react";

const bannerLinks = [
  { href: "/events", icon: Landmark, label: "Sự kiện lịch sử" },
  { href: "/characters", icon: User, label: "Nhân vật" },
  { href: "/quiz", icon: ClipboardList, label: "Câu đố lịch sử" },
];

const heroes = [
  { src: "/ly_thuong_kiet_2D.jpg", name: "Lý Thường Kiệt" },
  { src: "/le_loi_2D.jpg", name: "Lê Lợi" },
  { src: "/quang_trung_2D.jpg", name: "Quang Trung" },
  { src: "/ngo_quyen_2D.jpg", name: "Ngô Quyền" },
  { src: "/vo_nguyen_giap_2D.jpg", name: "Võ Nguyên Giáp" },
];

const featureTiles = [
  {
    icon: MessagesSquare,
    title: "Trò chuyện trực tiếp",
    description: "Đặt câu hỏi và nghe câu chuyện lịch sử qua góc nhìn của nhân vật.",
  },
  {
    icon: SlidersHorizontal,
    title: "Khám phá theo ngữ cảnh",
    description: "Đi từ nhân vật sang sự kiện, tài liệu và câu đố liên quan.",
  },
];

export function HomeBanner() {
  const [activeHeroIndex, setActiveHeroIndex] = useState(2);
  const activeHero = heroes[activeHeroIndex];

  const showPreviousHero = () => {
    setActiveHeroIndex((currentIndex) =>
      currentIndex === 0 ? heroes.length - 1 : currentIndex - 1,
    );
  };

  const showNextHero = () => {
    setActiveHeroIndex((currentIndex) =>
      currentIndex === heroes.length - 1 ? 0 : currentIndex + 1,
    );
  };

  return (
    <section className="home-banner-stage relative overflow-hidden rounded-3xl border border-black/5 bg-white px-5 py-7 text-content-heading shadow-[0_18px_48px_rgba(9,9,11,0.08)] dark:border-white/8 dark:bg-[#151515] dark:text-white dark:shadow-[0_22px_55px_rgba(0,0,0,0.20)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
      <div className="relative z-10 max-w-[760px]">
        <h1 className="font-title text-3xl font-extrabold leading-tight sm:text-4xl lg:text-[2.65rem]">
          Trò chuyện cùng nhân vật lịch sử Việt Nam
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-content-muted dark:text-white/82 sm:text-base">
          Gặp gỡ các bậc tiền nhân, hỏi về chiến trận, quyết sách và những bước ngoặt đã làm nên dòng chảy lịch sử dân tộc.
        </p>
      </div>

      <div className="relative z-10 mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_12px_34px_rgba(9,9,11,0.06)] dark:border-white/14 dark:bg-white/12 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] sm:p-5 lg:p-6">
        <div className="grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_360px] lg:items-start xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="flex flex-col gap-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {featureTiles.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="flex min-h-[150px] flex-col rounded-xl border border-black/10 bg-white p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/28 dark:bg-white/12 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
                >
                  <div className="flex min-h-12 items-center gap-3 rounded-lg bg-black/[0.04] px-3 text-sm font-bold text-content-heading dark:bg-black/20 dark:text-white">
                    <Icon size={18} className="text-accent-gold" />
                    {title}
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-content-muted dark:text-white/78 sm:text-sm">
                    {description}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                aria-label="Nhân vật trước"
                onClick={showPreviousHero}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/20 text-content-heading transition-colors hover:bg-black/5 dark:border-white/55 dark:text-white dark:hover:bg-white/14"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex flex-1 items-end justify-center gap-3 sm:gap-5">
                {heroes.map((hero, index) => {
                  const isActive = index === activeHeroIndex;

                  return (
                    <button
                      type="button"
                      key={hero.src}
                      aria-label={`Chọn ${hero.name}`}
                      aria-pressed={isActive}
                      onClick={() => setActiveHeroIndex(index)}
                      className={`relative h-[76px] w-[54px] overflow-hidden rounded-xl border transition-all duration-300 sm:h-[92px] sm:w-[68px] ${
                        isActive
                          ? "home-banner-thumb-active border-accent-gold shadow-[0_0_0_2px_rgba(245,158,11,0.18)] dark:border-white/80 dark:shadow-[0_0_0_2px_rgba(255,255,255,0.16)]"
                          : "border-black/10 opacity-60 grayscale hover:opacity-95 hover:grayscale-0 dark:border-white/18 dark:opacity-55 dark:hover:opacity-90"
                      }`}
                    >
                      <Image
                        src={hero.src}
                        alt={hero.name}
                        fill
                        sizes="70px"
                        className="object-cover object-top"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                aria-label="Nhân vật tiếp theo"
                onClick={showNextHero}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-black/20 text-content-heading transition-colors hover:bg-black/5 dark:border-white/55 dark:text-white dark:hover:bg-white/14"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {bannerLinks.map(({ href, icon: Icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="group/link flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.04] px-4 py-2 text-xs font-bold text-content-heading transition-all duration-200 hover:-translate-y-0.5 hover:bg-black/[0.07] dark:border-white/16 dark:bg-black/18 dark:text-white/92 dark:hover:bg-white/12 sm:text-sm"
                >
                  <Icon size={15} className="text-accent-gold" />
                  {label}
                  <ArrowRight size={13} className="-translate-x-1 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-70" />
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[360px] flex-col items-center lg:max-w-[410px]">
            <div className="home-banner-rings absolute top-[-36px] h-[280px] w-[280px] rounded-[42px] border border-black/8 dark:border-white/8 sm:h-[320px] sm:w-[320px]" />
            <div className="home-banner-portrait relative h-[245px] w-[245px] overflow-hidden rounded-[42px] border border-black/10 bg-white shadow-[0_24px_54px_rgba(120,113,108,0.24)] dark:border-white/28 dark:bg-white/8 dark:shadow-[0_24px_54px_rgba(0,0,0,0.38)] sm:h-[285px] sm:w-[285px]">
              <Image
                key={activeHero.src}
                src={activeHero.src}
                alt={activeHero.name}
                fill
                priority
                sizes="285px"
                className="object-cover object-top"
              />
            </div>

            <Link
              href="/characters"
              className="relative -mt-4 inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#151515] px-5 py-2 text-lg font-extrabold text-white shadow-[0_10px_24px_rgba(120,113,108,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-black dark:border-white/55 dark:bg-white dark:text-[#151515] dark:shadow-[0_10px_24px_rgba(0,0,0,0.28)] dark:hover:bg-white/90 sm:text-xl"
            >
              Bắt đầu trò chuyện
              <MessagesSquare size={19} />
            </Link>

            <div className="mt-5 max-w-[320px] text-center text-base font-extrabold leading-relaxed text-content-heading dark:text-white/92 sm:text-lg">
              {activeHero.name}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
