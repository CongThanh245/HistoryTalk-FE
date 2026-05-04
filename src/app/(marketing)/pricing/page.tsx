"use client";

import { Container } from "@/components/marketing/container";
import { cn } from "@/lib/utils/cn";
import { Check, Sparkles, Zap, Crown, Gem } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/* ─── Plan Data ─── */
interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  price: string;
  priceSuffix: string;
  priceNote?: string;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: "outline" | "primary" | "gold";
  icon: React.ReactNode;
  includedNote?: string;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Miễn phí",
    description:
      "Bắt đầu khám phá lịch sử ngay hôm nay — hoàn toàn miễn phí với các tính năng cơ bản.",
    price: "₫0",
    priceSuffix: "VNĐ/tháng",
    priceNote: "(cần có tài khoản HistoryTalk)",
    ctaLabel: "Bắt đầu",
    ctaHref: "/register",
    ctaStyle: "outline",
    icon: <Sparkles className="w-5 h-5" />,
    features: [
      { text: "Trò chuyện với 5 nhân vật lịch sử" },
      { text: "3 cuộc hội thoại / ngày" },
      { text: "Truy cập bối cảnh lịch sử cơ bản" },
      { text: "Làm quiz kiểm tra kiến thức" },
      { text: "Hỗ trợ cộng đồng" },
    ],
  },
  {
    id: "plus",
    name: "HistoryTalk Plus",
    badge: "Phổ biến",
    description:
      "Nhiều quyền truy cập hơn vào nhân vật và tính năng nâng cao để trải nghiệm sâu hơn.",
    price: "₫79.000",
    priceSuffix: "VNĐ/tháng",
    ctaLabel: "Bắt đầu",
    ctaHref: "/register?plan=plus",
    ctaStyle: "primary",
    icon: <Zap className="w-5 h-5" />,
    popular: true,
    includedNote: "Mọi lợi ích trong bản Miễn phí, kèm theo:",
    features: [
      { text: "Trò chuyện không giới hạn", highlight: true },
      { text: "Truy cập 50+ nhân vật lịch sử" },
      { text: "Bối cảnh lịch sử nâng cao với hình ảnh" },
      { text: "Tạo quiz tùy chỉnh" },
      { text: "Lịch sử hội thoại không giới hạn" },
      { text: "Hỗ trợ ưu tiên qua email" },
    ],
  },
  {
    id: "pro",
    name: "HistoryTalk Pro",
    description:
      "Tận hưởng trải nghiệm cao cấp với quyền truy cập mọi nhân vật và tính năng AI tiên tiến nhất.",
    price: "₫199.000",
    priceSuffix: "VNĐ/tháng",
    ctaLabel: "Bắt đầu",
    ctaHref: "/register?plan=pro",
    ctaStyle: "primary",
    icon: <Crown className="w-5 h-5" />,
    includedNote: "Mọi lợi ích trong bản Plus, kèm theo:",
    features: [
      { text: "Truy cập tất cả nhân vật lịch sử", highlight: true },
      { text: "AI trò chuyện sâu hơn với nguồn trích dẫn" },
      { text: "Tạo bối cảnh lịch sử riêng" },
      { text: "Xuất báo cáo & tóm tắt hội thoại" },
      { text: "Truy cập sớm tính năng mới" },
      { text: "Hỗ trợ ưu tiên 24/7" },
    ],
  },
  {
    id: "ultra",
    name: "HistoryTalk Ultra",
    description:
      "Dành cho tổ chức giáo dục — quản lý nhóm học viên và sử dụng toàn bộ nền tảng.",
    price: "₫2.500.000",
    priceSuffix: "VNĐ/tháng",
    ctaLabel: "Liên hệ",
    ctaHref: "/about",
    ctaStyle: "gold",
    icon: <Gem className="w-5 h-5" />,
    includedNote: "Mọi lợi ích trong gói Pro, và:",
    features: [
      { text: "Tối đa 50 tài khoản thành viên", highlight: true },
      { text: "Bảng điều khiển quản trị nhóm" },
      { text: "Phân tích tiến độ học tập" },
      { text: "Tích hợp LMS (Moodle, Google Classroom)" },
      { text: "API truy cập nội dung" },
      { text: "Quản lý tài khoản chuyên biệt" },
    ],
  },
];

/* ─── CTA Button Styles ─── */
function ctaClasses(style: Plan["ctaStyle"]) {
  const base =
    "inline-flex items-center justify-center w-full px-6 py-3 rounded-full text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer";
  switch (style) {
    case "outline":
      return cn(
        base,
        "border border-[var(--border-strong)] text-[var(--text-primary)]",
        "hover:bg-white/[0.04] hover:border-[var(--accent-gold)]/40",
      );
    case "primary":
      return cn(
        base,
        "bg-[var(--accent-blue)] text-white",
        "hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-blue)]/20",
      );
    case "gold":
      return cn(
        base,
        "bg-[var(--accent-gold)] text-[var(--text-inverse)]",
        "hover:brightness-110 hover:shadow-lg hover:shadow-[var(--accent-gold)]/30",
      );
  }
}

/* ─── Page Component ─── */
export default function PricingPage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  return (
    <div className="w-full">
      {/* ── Hero Section ── */}
      <section className="relative pt-32 pb-10 md:pt-40 md:pb-14 overflow-hidden">
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse 60% 50% at 50% 0%, rgba(212, 175, 55, 0.06) 0%, transparent 70%),
              radial-gradient(circle at 80% 20%, rgba(143, 179, 200, 0.04) 0%, transparent 50%)
            `,
          }}
        />

        <Container className="relative text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--text-primary)] leading-tight">
            Khai phá chiều sâu
            <br />
            <span className="text-[var(--accent-gold-soft)]">lịch sử</span>{" "}
            cùng{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-soft) 50%, var(--accent-blue) 100%)",
              }}
            >
              HistoryTalk
            </span>
          </h1>

          <div className="mt-8">
            <Link
              href="/register"
              className={cn(
                "inline-flex items-center px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide",
                "bg-[var(--accent-blue)] text-white",
                "hover:brightness-110 transition-all duration-300",
                "hover:shadow-lg hover:shadow-[var(--accent-blue)]/25",
              )}
            >
              Nâng cấp
            </Link>
          </div>

          <p className="mt-6 text-sm text-[var(--text-muted)]">
            Bạn đang tìm giải pháp cho tổ chức giáo dục?{" "}
            <Link
              href="/about"
              className="text-[var(--accent-blue)] underline underline-offset-2 hover:text-[var(--accent-gold-soft)] transition-colors"
            >
              Liên hệ
            </Link>
          </p>
        </Container>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="relative pb-20 md:pb-28">
        <Container className="max-w-[1320px]">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-0 border border-[var(--border-default)] rounded-2xl overflow-hidden">
            {plans.map((plan, idx) => {
              const isLast = idx === plans.length - 1;
              const isHovered = hoveredPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col p-6 lg:p-8 transition-all duration-300",
                    "border-b md:border-b-0 md:border-r border-[var(--border-default)]",
                    isLast && "md:border-r-0",
                    /* 2-col last row fix */
                    idx === 2 && "md:border-r xl:border-r",
                    idx >= 2 && "md:border-b-0",
                    isHovered && "bg-white/[0.02]",
                  )}
                  onMouseEnter={() => setHoveredPlan(plan.id)}
                  onMouseLeave={() => setHoveredPlan(null)}
                >
                  {/* Popular badge */}
                  {plan.popular && (
                    <div className="absolute -top-px left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--accent-blue)] to-transparent" />
                  )}

                  {/* Plan name + badge */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">
                      {plan.name}
                    </h3>
                    {plan.badge && (
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--accent-blue)]/15 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20">
                        {plan.badge}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed min-h-[60px]">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-5 mb-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-[var(--text-primary)]">
                        {plan.price}
                      </span>
                      <span className="text-sm text-[var(--text-muted)]">
                        {plan.priceSuffix}
                      </span>
                    </div>
                    {plan.priceNote && (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {plan.priceNote}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link href={plan.ctaHref} className={ctaClasses(plan.ctaStyle)}>
                    {plan.ctaLabel}
                  </Link>

                  {/* Divider */}
                  <div className="my-6 border-t border-[var(--border-default)]" />

                  {/* Included note */}
                  {plan.includedNote && (
                    <p className="text-xs text-[var(--text-muted)] mb-4 italic">
                      {plan.includedNote}
                    </p>
                  )}

                  {/* Features */}
                  <div className="space-y-1">
                    {/* Section title */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[var(--accent-gold)]">{plan.icon}</span>
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {plan.name === "Miễn phí" ? "Ứng dụng HistoryTalk" : plan.name}
                      </span>
                    </div>

                    {/* Feature descriptions */}
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-4">
                      {plan.id === "free" &&
                        "Trợ lý AI cá nhân mạnh mẽ và chủ động giúp bạn khám phá lịch sử."}
                      {plan.id === "plus" &&
                        "Quyền truy cập nâng cao vào nhân vật lịch sử, tính năng tạo quiz, và lưu trữ không giới hạn."}
                      {plan.id === "pro" &&
                        "Quyền truy cập cao cấp vào mọi nhân vật, AI trích dẫn nguồn và xuất báo cáo chuyên nghiệp."}
                      {plan.id === "ultra" &&
                        "Hệ thống quản trị dành cho tổ chức giáo dục, tích hợp LMS và quản lý nhóm học viên."}
                    </p>

                    {/* Feature list */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2.5">
                          <Check
                            className={cn(
                              "w-4 h-4 mt-0.5 flex-shrink-0",
                              feature.highlight
                                ? "text-[var(--accent-gold)]"
                                : "text-[var(--accent-blue)]",
                            )}
                          />
                          <span
                            className={cn(
                              "text-sm leading-relaxed",
                              feature.highlight
                                ? "text-[var(--text-primary)] font-medium"
                                : "text-[var(--text-secondary)]",
                            )}
                          >
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ── FAQ / Bottom CTA ── */}
      <section className="relative py-16 md:py-24 border-t border-[var(--border-default)]">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 50% 60% at 50% 100%, rgba(212, 175, 55, 0.04) 0%, transparent 70%)",
          }}
        />
        <Container className="relative text-center max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-4">
            Câu hỏi thường gặp
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-10 leading-relaxed">
            Chưa tìm được gói phù hợp? Liên hệ với chúng tôi để được tư vấn
            giải pháp tốt nhất.
          </p>

          {/* FAQ Items */}
          <div className="space-y-4 text-left">
            {[
              {
                q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
                a: "Có, bạn có thể hủy đăng ký bất cứ lúc nào. Tài khoản sẽ tiếp tục hoạt động cho đến hết chu kỳ thanh toán hiện tại.",
              },
              {
                q: "Gói Miễn phí có giới hạn thời gian không?",
                a: "Không, gói Miễn phí hoàn toàn vĩnh viễn. Bạn chỉ bị giới hạn về số lượng cuộc hội thoại và nhân vật có thể truy cập.",
              },
              {
                q: "Tôi có thể nâng cấp hoặc hạ cấp gói không?",
                a: "Có, bạn có thể thay đổi gói bất cứ lúc nào. Phần chênh lệch sẽ được tính theo tỷ lệ.",
              },
              {
                q: "Gói Ultra có hỗ trợ tùy chỉnh nội dung không?",
                a: "Có, gói Ultra cho phép tổ chức giáo dục tùy chỉnh bối cảnh lịch sử và tích hợp vào chương trình giảng dạy riêng.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                className="group border border-[var(--border-default)] rounded-xl overflow-hidden transition-colors hover:border-[var(--accent-gold)]/20"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none text-sm font-medium text-[var(--text-primary)] transition-colors">
                  {faq.q}
                  <span className="ml-3 text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-45 text-lg">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm text-[var(--text-secondary)] leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12">
            <Link
              href="/about"
              className={cn(
                "inline-flex items-center px-8 py-3.5 rounded-full text-sm font-semibold",
                "border border-[var(--border-strong)] text-[var(--text-primary)]",
                "hover:bg-white/[0.04] hover:border-[var(--accent-gold)]/40 transition-all duration-300",
              )}
            >
              Liên hệ tư vấn
            </Link>
          </div>
        </Container>
      </section>
    </div>
  );
}
