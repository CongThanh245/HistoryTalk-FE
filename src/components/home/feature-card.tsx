"use client";

import Link from "next/link";
import {
  Landmark, Users, MessageSquare, ClipboardList,
  Library, Bookmark, ChevronRight, LucideIcon,
} from "lucide-react";

// Static — không cần API
const FEATURE_CARDS = [
  { icon: Landmark,      title: "Sự kiện lịch sử", desc: "Khám phá các mốc lịch sử qua dòng thời gian tương tác.", href: "/events",     accent: "var(--accent-gold)",      glow: "rgba(201,162,77,0.12)"  },
  { icon: Users,         title: "Nhân vật",         desc: "Tìm hiểu cuộc đời những nhân vật làm thay đổi lịch sử.", href: "/characters", accent: "var(--accent-bronze)",    glow: "rgba(196,106,47,0.12)"  },
  { icon: MessageSquare, title: "Chat với lịch sử", desc: "Trò chuyện với AI đóng vai nhân vật lịch sử.",           href: "/chat-history",       accent: "var(--accent-blue)",      glow: "rgba(143,179,200,0.12)" },
  { icon: ClipboardList, title: "Trắc nghiệm",      desc: "Kiểm tra kiến thức với hàng nghìn câu hỏi theo chủ đề.", href: "/quiz",       accent: "var(--burning-flame)",   glow: "rgba(255,177,98,0.12)"  },
  { icon: Library,       title: "Thư viện",         desc: "Kho tàng tư liệu và hình ảnh lịch sử được kiểm duyệt.", href: "/library",    accent: "var(--accent-teal)",      glow: "rgba(47,111,115,0.15)"  },
  { icon: Bookmark,      title: "Đã lưu",           desc: "Truy cập nhanh các nội dung bạn đã đánh dấu.",           href: "/saved",      accent: "var(--accent-gold-soft)", glow: "rgba(226,199,122,0.10)" },
];

interface FeatureCardItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  accent: string;
  glow: string;
}

function FeatureCard({ icon: Icon, title, desc, href, accent, glow }: FeatureCardItem) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl p-5 border transition-all duration-200 overflow-hidden"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 65%)` }}
      />
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }}
      />
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: glow, border: `1px solid ${accent}30` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>
      <div className="relative z-10 flex-1">
        <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--content-heading)" }}>
          {title}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: "var(--content-muted)" }}>
          {desc}
        </p>
      </div>
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-200">
        <ChevronRight className="w-4 h-4" style={{ color: accent }} />
      </div>
    </Link>
  );
}

export function FeatureCards() {
  return (
    <section>
      <h2 className="text-base font-semibold mb-4" style={{ color: "var(--content-heading)" }}>
        Khám phá
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {FEATURE_CARDS.map((card) => (
          <FeatureCard key={card.href} {...card} />
        ))}
      </div>
    </section>
  );
}