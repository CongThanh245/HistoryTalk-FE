import Link from "next/link";
import { Container } from "../container";
import { Carousel3DVertical } from "./vertical-carousel";

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 lg:py-40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue)] rounded-full blur-3xl" />
      </div>

      <Container>
        {/* Split Layout: Grid 12 columns */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* ===== LEFT SIDE: Col-5 (Static Content) ===== */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Main Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-[var(--text-primary)]">
              Lịch sử không phải để{" "}
              <span className="text-[var(--accent-gold)]">ghi nhớ</span>.
              <br />
              Mà để{" "}
              <span className="text-[var(--accent-gold)]">trải nghiệm</span>.
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed">
              Chúng tôi giúp thế hệ trẻ trên toàn thế giới hiểu sâu sắc về lịch sử nhân loại 
              bằng cách cho họ trò chuyện với các nhân vật lịch sử được mô phỏng — 
              không chỉ để học sự kiện, mà để hiểu lựa chọn, hậu quả và bản sắc.
            </p>

            {/* Supporting Quote */}
            <div className="py-4 space-y-2 border-l-2 border-[var(--accent-gold)]/30 pl-4">
              <p className="text-base md:text-lg text-[var(--text-primary)] font-medium italic">
                "Học sinh không ghét lịch sử.
              </p>
              <p className="text-base md:text-lg text-[var(--accent-gold)] font-medium italic">
                Họ ghét cách lịch sử được dạy."
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
              <Link
                href="/app"
                className="
                  group
                  px-8 py-4 text-lg font-semibold
                  bg-[var(--accent-gold)] text-[var(--text-inverse)]
                  rounded-[var(--radius-md)]
                  hover:bg-[var(--accent-gold-soft)]
                  transition-all duration-300
                  shadow-[var(--shadow-soft)]
                  hover:shadow-[var(--shadow-strong)]
                  hover:-translate-y-0.5
                  inline-flex items-center gap-2
                "
              >
                <span>Thử HistoryTalk</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>

              <Link
                href="#how-it-works"
                className="
                  px-8 py-4 text-lg font-medium
                  text-[var(--text-primary)] 
                  border-2 border-[var(--border-default)]
                  rounded-[var(--radius-md)]
                  hover:bg-[var(--bg-surface)] 
                  hover:border-[var(--accent-gold)]
                  transition-all duration-300
                "
              >
                Tìm hiểu thêm
              </Link>
            </div>

            {/* Stats or Social Proof (Optional) */}
            <div className="pt-8 flex items-center gap-8 text-sm text-[var(--text-muted)]">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/20 border-2 border-[var(--bg-main)] flex items-center justify-center"
                    >
                      <span className="text-xs">👤</span>
                    </div>
                  ))}
                </div>
                <span>10,000+ học sinh</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[var(--accent-gold)]">★★★★★</span>
                <span>4.9/5 đánh giá</span>
              </div>
            </div>
          </div>

          {/* ===== RIGHT SIDE: Col-7 (3D Carousel) ===== */}
          <div className="lg:col-span-7">
            <div className="relative">
              {/* Ambient Glow Effect */}
              <div className="absolute inset-0 bg-[var(--accent-gold)] opacity-5 blur-[100px] rounded-full" />
              
              {/* 3D Vertical Carousel */}
              <Carousel3DVertical />
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}