import Link from "next/link";
import { Container } from "../container";
import { Carousel3DVertical } from "./vertical-carousel";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue)] rounded-full blur-3xl" />
      </div>

      <Container>
        {/* Đổi từ 12 cột sang grid-cols-2 (tương đương 6:6) để cân bằng thị giác */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          {/* ===== LEFT SIDE: Text Content ===== */}
          <div className="space-y-8">
            
            {/* Main Headline - Đã giảm size để bớt chiếm diện tích */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-[1.15] text-[var(--text-primary)]">
              History Talk{" "}
              <span className="block text-[var(--accent-gold)] mt-2">
                Khi lịch sử trở nên sống động
              </span>
            </h1>

            {/* Subheadline - Thêm max-w để dòng chữ không quá dài khó đọc */}
            <p className="text-base md:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl">
              Chúng tôi giúp thế hệ trẻ trên toàn thế giới hiểu sâu sắc về lịch sử nhân loại 
              bằng cách cho họ trò chuyện với các nhân vật lịch sử được mô phỏng.
            </p>

            {/* Supporting Quote */}
            <div className="py-2 space-y-1 border-l-2 border-[var(--accent-gold)]/30 pl-6">
              <p className="text-sm md:text-base text-[var(--text-primary)] font-medium italic">
                "Học sinh không ghét lịch sử.
              </p>
              <p className="text-sm md:text-base text-[var(--accent-gold)] font-medium italic">
                Họ ghét cách lịch sử được dạy."
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link
                href="/app"
                className="px-8 py-4 text-base font-semibold bg-[var(--accent-gold)] text-[var(--text-inverse)] rounded-[var(--radius-md)] hover:brightness-110 transition-all shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2"
              >
                <span>Thử HistoryTalk</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              <Link
                href="#how-it-works"
                className="px-8 py-4 text-base font-medium text-[var(--text-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-surface)] transition-all"
              >
                Tìm hiểu thêm
              </Link>
            </div>
          </div>

          {/* ===== RIGHT SIDE: 3D Carousel ===== */}
          <div className="relative w-full flex justify-center items-center">
             {/* Glow effect nhỏ lại để tập trung vào Carousel */}
            <div className="absolute inset-0 bg-[var(--accent-gold)] opacity-10 blur-[80px] rounded-full scale-75" />
            
            <div className="w-full max-w-[500px] lg:max-w-none">
                <Carousel3DVertical />
            </div>
          </div>

        </div>
      </Container>
    </section>
  );
}