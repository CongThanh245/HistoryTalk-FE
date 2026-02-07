import Link from "next/link";
import { Container } from "../container";

export function HeroSection() {
  return (
    <section className="py-20 md:py-32 lg:py-40 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[var(--accent-blue)] rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="text-center space-y-8 max-w-5xl mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight text-[var(--text-primary)]">
            Lịch sử không phải để{" "}
            <span className="text-[var(--accent-gold)]">ghi nhớ</span>.
            <br />
            Mà để <span className="text-[var(--accent-gold)]">trải nghiệm</span>.
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-4xl mx-auto leading-relaxed">
            Chúng tôi giúp thế hệ trẻ trên toàn thế giới hiểu sâu sắc về lịch sử nhân loại 
            bằng cách cho họ trò chuyện với các nhân vật lịch sử được mô phỏng — 
            không chỉ để học sự kiện, mà để hiểu lựa chọn, hậu quả và bản sắc.
          </p>

          {/* Supporting line */}
          <div className="py-4">
            <p className="text-lg md:text-xl text-[var(--text-primary)] font-medium italic">
              Học sinh không ghét lịch sử.
            </p>
            <p className="text-lg md:text-xl text-[var(--accent-gold)] font-medium italic">
              Họ ghét cách lịch sử được dạy.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/app"
              className="
                px-8 py-4 text-lg font-semibold
                bg-[var(--accent-gold)] text-[var(--text-inverse)]
                rounded-[var(--radius-md)]
                hover:bg-[var(--accent-gold-soft)]
                transition-colors duration-300
                shadow-[var(--shadow-soft)]
              "
            >
              Thử HistoryTalk
            </Link>

            <Link
              href="#how-it-works"
              className="
                px-8 py-4 text-lg font-medium
                text-[var(--text-primary)] 
                border-2 border-[var(--border-default)]
                rounded-[var(--radius-md)]
                hover:bg-[var(--bg-surface)] hover:border-[var(--accent-gold)]
                transition-all duration-300
              "
            >
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}