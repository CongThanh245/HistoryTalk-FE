"use client";

import { useRef } from "react";
import { Container } from "../container";
import { MagneticButton } from "@/components/commons/MagneticButton";
import { useRevealAnimation } from "@/lib/hooks/use-reveal-animation";

export function ClosingSection() {
  const sectionRef = useRef<HTMLElement>(null);
  useRevealAnimation(sectionRef);

  return (
    <section ref={sectionRef} className="py-20 bg-[var(--bg-deep)]">
      <Container>
        {/* Thẻ cha dùng flex justify-center để làm mốc căn giữa cho ảnh */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-[var(--border-default)] bg-[var(--bg-surface)] h-[550px] lg:h-[600px] flex justify-center">
          {/* LỚP 1: ẢNH ĐIỆN THOẠI (Căn giữa theo Card cha) */}
          <div className="absolute inset-0 flex justify-center items-end pointer-events-none z-10">
            <img
              src="/phone_mock.png"
              alt="Preview"
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%) translateY(12%)",
                width: "370px",
                zIndex: 10,
                pointerEvents: "none",
              }}
            />
          </div>

          {/* LỚP 2: NỘI DUNG CHỮ (Dùng Grid để chia 2 bên) */}
          <div className="relative z-20 w-full h-full grid grid-cols-1 lg:grid-cols-3 px-10 lg:px-16">
            {/* Cột trái */}
            <div className="flex items-center">
              <h2 className="text-4xl lg:text-6xl font-bold text-[var(--text-primary)]">
                LỊCH SỬ KHÔNG <br /> CHỈ LÀ{" "}
                <span className="text-[var(--accent-gold)]">QUÁ KHỨ.</span>
              </h2>
            </div>

            {/* Cột giữa rỗng: Tạo khoảng không cho điện thoại ở lớp dưới hiện lên */}
            <div className="hidden lg:block"></div>

            {/* Cột phải */}
            <div className="flex flex-col justify-center items-start lg:items-end gap-6 text-left lg:text-right">
              <p className="text-base lg:text-lg text-[var(--text-secondary)] max-w-[280px]">
                Bước vào cuộc trò chuyện với những người đã tạo nên lịch sử. Đặt
                câu hỏi, khám phá sự thật, và hiểu về lịch sử theo góc nhìn của nhân vật.{" "}
              </p>
              <MagneticButton
                href="/home"
                size="lg"
                className="!rounded-full px-10 py-5"
              >
                Bắt đầu ngay
              </MagneticButton>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
