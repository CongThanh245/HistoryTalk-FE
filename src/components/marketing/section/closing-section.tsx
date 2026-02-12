import Link from "next/link";
import { Container } from "../container";
import { MagneticButton } from "@/components/commons/MagneticButton";

export function ClosingSection() {
  return (
    <section className="py-20 md:py-32 lg:py-40 bg-[var(--bg-main)] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[var(--accent-gold)] rounded-full blur-3xl" />
      </div>

      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Headline */}
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] leading-tight">
              Lịch sử không chỉ là quá khứ.
            </h2>
            <p className="text-2xl md:text-3xl text-[var(--accent-gold)] font-medium">
              Nó định hình con người chúng ta ngày hôm nay.
            </p>
          </div>

          {/* Supporting text */}
          <div className="space-y-4 py-8">
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              Bước vào cuộc trò chuyện.
            </p>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              Đặt câu hỏi về quá khứ.
            </p>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)]">
              Hiểu về nhân loại.
            </p>
          </div>

          {/* CTA */}
          <MagneticButton
            href="/app"
            size="xl"
            className="shadow-[var(--shadow-strong)]"
          >
            Bắt đầu hành trình với HistoryTalk
          </MagneticButton>

          {/* Secondary text */}
          <div className="pt-8">
            <p className="text-[var(--text-muted)]">
              Miễn phí dùng thử · Không cần thẻ tín dụng
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
