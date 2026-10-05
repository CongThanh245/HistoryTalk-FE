"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, ChevronLeft, ChevronRight, ClipboardList, Landmark, MessagesSquare, UserRound } from "lucide-react";

const heroes = [
  { src: "/ly_thuong_kiet_2D.jpg", name: "Lý Thường Kiệt" },
  { src: "/ngo_quyen_2D.jpg", name: "Ngô Quyền" },
  { src: "/quang_trung_2D.jpg", name: "Quang Trung" },
  { src: "/le_loi_2D.jpg", name: "Lê Lợi" },
  { src: "/vo_nguyen_giap_2D.jpg", name: "Võ Nguyên Giáp" },
];

const features = [
  { href: "/characters", icon: UserRound, title: "Chọn nhân vật", description: "Gặp gỡ nhân vật lịch sử và bắt đầu cuộc trò chuyện của riêng bạn." },
  { href: "/events", icon: Landmark, title: "Mở bối cảnh", description: "Khám phá sự kiện và tư liệu liên quan đến câu chuyện của nhân vật." },
  { href: "/quiz", icon: ClipboardList, title: "Thử thách trí nhớ", description: "Làm câu đố để ôn lại nhân vật, sự kiện và những điều vừa khám phá." },
];

const pad = (n: number) => String(n).padStart(2, "0");

export function HomeBanner() {
  const [activeIndex, setActiveIndex] = useState(2);
  const activeHero = heroes[activeIndex];

  function moveHero(direction: -1 | 1) {
    setActiveIndex((index) => (index + direction + heroes.length) % heroes.length);
  }

  return (
    <section className="home-banner-stage" aria-label="Khám phá HistoryTalk">
      <div className="home-banner-ornament" aria-hidden="true" />
      <div className="home-banner-inner">

        <div className="home-banner-content">
          <div className="home-banner-discovery">
            <header className="home-banner-heading">
              <h1 className="archive-title">Gặp nhân vật, mở cả một <em>lát cắt lịch sử</em></h1>
              <p>Bắt đầu bằng một cuộc trò chuyện, rồi lần theo bối cảnh, sự kiện và thử thách để hiểu vì sao lịch sử đã rẽ sang hướng đó.</p>
            </header>

            <ol className="home-banner-features">
              {features.map(({ href, icon: Icon, title, description }, index) => (
                <li key={href}>
                  <Link href={href} className="home-banner-feature">
                    <span className="home-banner-feature-index">{pad(index + 1)}</span>
                    <div className="home-banner-feature-title">
                      <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
                      <h2>{title}</h2>
                      <ArrowUpRight size={16} className="home-banner-feature-arrow" aria-hidden="true" />
                    </div>
                    <p>{description}</p>
                  </Link>
                </li>
              ))}
            </ol>

            <div className="home-banner-picker" aria-label="Chọn nhân vật nổi bật">
              <button type="button" className="home-banner-arrow" aria-label="Nhân vật trước" onClick={() => moveHero(-1)}><ChevronLeft size={18} aria-hidden="true" /></button>
              <div className="home-banner-heroes">
                {heroes.map((hero, index) => (
                  <button type="button" key={hero.src} className={`home-banner-hero ${index === activeIndex ? "is-active" : ""}`} aria-label={`Chọn ${hero.name}`} aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
                    <span className="home-banner-hero-image"><Image src={hero.src} alt="" width={84} height={99} sizes="(max-width: 640px) 64px, 84px" className="home-banner-hero-thumbnail archive-photo" /></span>
                    <span className="home-banner-hero-name">{hero.name}</span>
                  </button>
                ))}
              </div>
              <button type="button" className="home-banner-arrow" aria-label="Nhân vật tiếp theo" onClick={() => moveHero(1)}><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          </div>

          <div className="home-banner-spotlight">
            <div className="home-banner-portrait-frame">
              <div className="home-banner-portrait">
                <Image src={activeHero.src} alt={`Chân dung ${activeHero.name}`} fill priority sizes="(max-width: 768px) 290px, 350px" className="object-cover object-top" />
              </div>
              {/* 國史 — "quốc sử", national history */}
              <span className="archive-seal home-banner-seal" aria-hidden="true">國史</span>
            </div>
            <div className="home-banner-caption">
              <p className="archive-title is-plain home-banner-spotlight-name">{activeHero.name}</p>
              <span className="archive-label">{pad(activeIndex + 1)} / {pad(heroes.length)}</span>
            </div>
            <Link href="/characters" className="btn-crimson home-banner-cta">Bắt đầu trò chuyện<MessagesSquare size={17} aria-hidden="true" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}
