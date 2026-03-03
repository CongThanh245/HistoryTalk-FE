"use client";

import Link from "next/link";
import {
  Landmark, Users, MessageSquare, ClipboardList,
  Library, Bookmark, ArrowRight, Clock, Flame,
  Star, Trophy, ChevronRight,
} from "lucide-react";

const FEATURE_CARDS = [
  { icon: Landmark,      title: "Sự kiện lịch sử", desc: "Khám phá các mốc lịch sử qua dòng thời gian tương tác.", href: "/events",     accent: "var(--accent-gold)",      glow: "rgba(201,162,77,0.12)"  },
  { icon: Users,         title: "Nhân vật",         desc: "Tìm hiểu cuộc đời những nhân vật làm thay đổi lịch sử.", href: "/characters", accent: "var(--accent-bronze)",    glow: "rgba(196,106,47,0.12)"  },
  { icon: MessageSquare, title: "Chat với lịch sử", desc: "Trò chuyện với AI đóng vai nhân vật lịch sử.",           href: "/chat",       accent: "var(--accent-blue)",      glow: "rgba(143,179,200,0.12)" },
  { icon: ClipboardList, title: "Trắc nghiệm",      desc: "Kiểm tra kiến thức với hàng nghìn câu hỏi theo chủ đề.", href: "/quiz",       accent: "var(--burning-flame)",   glow: "rgba(255,177,98,0.12)"  },
  { icon: Library,       title: "Thư viện",         desc: "Kho tàng tư liệu và hình ảnh lịch sử được kiểm duyệt.", href: "/library",    accent: "var(--accent-teal)",      glow: "rgba(47,111,115,0.15)"  },
  { icon: Bookmark,      title: "Đã lưu",           desc: "Truy cập nhanh các nội dung bạn đã đánh dấu.",           href: "/saved",      accent: "var(--accent-gold-soft)", glow: "rgba(226,199,122,0.10)" },
];

const RECENT_QUIZ = [
  { title: "Chiến tranh thế giới thứ II", questions: 20, score: 85, time: "2 ngày trước" },
  { title: "Triều đại nhà Nguyễn",        questions: 15, score: 72, time: "5 ngày trước" },
  { title: "Cách mạng Pháp 1789",         questions: 10, score: 90, time: "1 tuần trước" },
];

const SUGGESTED_QUIZ = [
  { title: "Đế chế La Mã",              questions: 25, difficulty: "Trung bình", tag: "Phổ biến" },
  { title: "Lịch sử Việt Nam cổ đại",   questions: 30, difficulty: "Dễ",         tag: "Mới"       },
  { title: "Thế chiến I & nguyên nhân", questions: 20, difficulty: "Khó",        tag: "Thử thách" },
];

function FeatureCard({ icon: Icon, title, desc, href, accent, glow }: (typeof FEATURE_CARDS)[0]) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col gap-3 rounded-xl p-5 border transition-all duration-200 overflow-hidden"
      style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 65%)` }} />
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 0 1px ${accent}40` }} />

      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background: glow, border: `1px solid ${accent}30` }}>
        <Icon className="w-5 h-5" style={{ color: accent }} />
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-sm font-semibold mb-1"
          style={{ color: "var(--content-heading)", fontFamily: "'Georgia', serif" }}>
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

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? "var(--accent-teal)" : score >= 70 ? "var(--gold-on-light)" : "var(--burning-flame)";
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
      {score}%
    </span>
  );
}

export default function HomePage() {
  return (
    <div className="space-y-10 pb-10">

      {/* Greeting */}
      <div className="space-y-1 pt-2">
        <p className="text-sm" style={{ color: "var(--content-subtle)" }}>Chào mừng trở lại 👋</p>
        <h1 className="text-3xl font-bold"
          style={{ color: "var(--content-heading)", fontFamily: "'Georgia', 'Times New Roman', serif" }}>
          Xin chào,{" "}
          <span style={{
            background: "linear-gradient(90deg, var(--gold-on-light) 0%, var(--accent-bronze) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Nguyen Thanh
          </span>!
        </h1>
        <p className="text-sm" style={{ color: "var(--content-muted)" }}>
          Hôm nay bạn muốn khám phá trang sử nào?
        </p>
      </div>

      {/* Feature cards */}
      <section>
        <h2 className="text-base font-semibold mb-4"
          style={{ color: "var(--content-heading)", fontFamily: "'Georgia', serif" }}>
          Khám phá
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FEATURE_CARDS.map((card) => <FeatureCard key={card.href} {...card} />)}
        </div>
      </section>

      {/* Quiz sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
              <h2 className="text-base font-semibold"
                style={{ color: "var(--content-heading)", fontFamily: "'Georgia', serif" }}>
                Lần thi gần đây
              </h2>
            </div>
            <Link href="/quiz" className="flex items-center gap-1 text-xs" style={{ color: "var(--gold-on-light)" }}>
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {RECENT_QUIZ.map((q, i) => (
              <div key={i}
                className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-colors duration-150"
                style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(160,120,40,0.10)" }}>
                    <Trophy className="w-4 h-4" style={{ color: "var(--gold-on-light)" }} />
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--content-text)" }}>{q.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                      {q.questions} câu · {q.time}
                    </p>
                  </div>
                </div>
                <ScoreBadge score={q.score} />
              </div>
            ))}
          </div>
        </section>

        {/* Suggested */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4" style={{ color: "var(--burning-flame)" }} />
              <h2 className="text-base font-semibold"
                style={{ color: "var(--content-heading)", fontFamily: "'Georgia', serif" }}>
                Gợi ý cho bạn
              </h2>
            </div>
            <Link href="/quiz" className="flex items-center gap-1 text-xs" style={{ color: "var(--gold-on-light)" }}>
              Xem thêm <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {SUGGESTED_QUIZ.map((q, i) => {
              const tagColor = q.tag === "Mới" ? "var(--accent-teal)" : q.tag === "Thử thách" ? "var(--accent-danger)" : "var(--gold-on-light)";
              const tagBg    = q.tag === "Mới" ? "rgba(47,111,115,0.12)" : q.tag === "Thử thách" ? "rgba(184,50,42,0.10)" : "rgba(160,120,40,0.10)";
              return (
                <Link key={i} href="/quiz"
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-150 group"
                  style={{ background: "var(--card-light-bg)", borderColor: "var(--card-light-border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,177,98,0.10)" }}>
                      <Star className="w-4 h-4" style={{ color: "var(--burning-flame)" }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--content-text)" }}>{q.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--content-muted)" }}>
                        {q.questions} câu · {q.difficulty}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: tagBg, color: tagColor }}>
                      {q.tag}
                    </span>
                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--gold-on-light)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}