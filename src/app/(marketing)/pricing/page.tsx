"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Gem, Sparkles, Zap } from "lucide-react";
import { Container } from "@/components/marketing/container";
import { MagneticButton } from "@/components/commons/MagneticButton";
import { cn } from "@/lib/utils/cn";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentTier } from "@/services/payment.service";

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface DisplayPlan {
  id: string;
  name: string;
  badge?: string;
  description: string;
  price: string;
  priceSuffix: string;
  ctaLabel: string;
  ctaHref: string;
  ctaStyle: "outline" | "primary" | "gold";
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
}

const planDescriptions = [
  "Bắt đầu khám phá lịch sử với các tính năng cốt lõi và giới hạn phù hợp cho trải nghiệm thử.",
  "Mở rộng lượt trò chuyện, token AI và nhịp học hằng ngày cho người học cá nhân.",
  "Dành cho người học cần đào sâu hơn, lưu nhiều ngữ cảnh hơn và sử dụng AI thường xuyên.",
  "Phù hợp cho lớp học, nhóm học tập hoặc tổ chức cần nhiều tài nguyên hơn.",
];

const planIcons = [
  <Sparkles key="sparkles" className="h-5 w-5" />,
  <Zap key="zap" className="h-5 w-5" />,
  <Crown key="crown" className="h-5 w-5" />,
  <Gem key="gem" className="h-5 w-5" />,
];

const fallbackTiers: PaymentTier[] = [
  {
    tierId: "fallback-free",
    title: "Free",
    amount: 0,
    noMonth: 1,
    limitedToken: 50,
    isActive: true,
  },
  {
    tierId: "fallback-plus",
    title: "Plus",
    amount: 99000,
    noMonth: 1,
    limitedToken: 500,
    isActive: true,
  },
  {
    tierId: "fallback-pro",
    title: "Pro",
    amount: 199000,
    noMonth: 1,
    limitedToken: 2000,
    isActive: true,
  },
];

function formatCurrency(amount: number) {
  if (amount <= 0) return "0đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(noMonth: number) {
  if (!noMonth || noMonth <= 1) return "tháng";
  return `${noMonth} tháng`;
}

function normalizeTierTitle(title: string) {
  const trimmed = title.trim();
  if (/historytalk/i.test(trimmed)) return trimmed;
  return trimmed.length <= 8 ? `HistoryTalk ${trimmed}` : trimmed;
}

function tierToPlan(tier: PaymentTier, index: number, paidTierCount: number): DisplayPlan {
  const isFree = tier.amount <= 0;
  const isPopular = !isFree && index === Math.max(1, Math.ceil(paidTierCount / 2));
  const duration = formatDuration(tier.noMonth);
  const tokenText = tier.limitedToken > 0
    ? `${tier.limitedToken.toLocaleString("vi-VN")} token AI`
    : "Token AI theo cấu hình gói";

  return {
    id: tier.tierId,
    name: normalizeTierTitle(tier.title),
    badge: isPopular ? "Phổ biến" : undefined,
    description: planDescriptions[index] ?? "Gói học lịch sử với quyền truy cập và tài nguyên được mở rộng.",
    price: isFree ? "Miễn phí" : formatCurrency(tier.amount),
    priceSuffix: isFree ? "" : `/${duration}`,
    ctaLabel: isFree ? "Bắt đầu" : "Chọn gói",
    ctaHref: isFree ? "/register" : `/register?plan=${encodeURIComponent(tier.tierId)}`,
    ctaStyle: isFree ? "outline" : isPopular ? "gold" : "primary",
    icon: planIcons[index] ?? planIcons[planIcons.length - 1],
    popular: isPopular,
    features: [
      { text: `${duration[0].toUpperCase()}${duration.slice(1)} sử dụng`, highlight: true },
      { text: tokenText, highlight: tier.limitedToken > 0 },
      { text: "Trò chuyện với nhân vật lịch sử bằng AI" },
      { text: "Khám phá bối cảnh sự kiện theo mạch học" },
      { text: "Làm quiz ôn tập sau hành trình" },
      { text: tier.isActive ? "Đang mở đăng ký" : "Tạm ngừng đăng ký" },
    ],
  };
}

function PricingSkeleton() {
  return (
    <div className="grid grid-cols-1 border-t border-l border-[var(--text-primary)] md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-h-[460px] border-r border-b border-[var(--text-primary)] bg-[var(--bg-surface)] p-6">
          <div className="h-5 w-28 animate-pulse bg-[var(--border-default)]" />
          <div className="mt-5 h-12 w-full animate-pulse bg-[var(--border-default)]" />
          <div className="mt-6 h-9 w-36 animate-pulse bg-[var(--border-default)]" />
          <div className="mt-7 h-11 w-full animate-pulse bg-[var(--border-default)]" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 5 }).map((__, itemIndex) => (
              <div key={itemIndex} className="h-4 w-full animate-pulse bg-[var(--border-default)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PricingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.payments.tiers,
    queryFn: paymentService.getTiers,
  });

  const usingFallback = isError;

  const activeTiers = useMemo(
    () => (usingFallback ? fallbackTiers : data ?? [])
      .filter((tier) => tier.isActive)
      .sort((a, b) => a.amount - b.amount),
    [data, usingFallback],
  );

  const plans = useMemo(() => {
    const paidTierCount = activeTiers.filter((tier) => tier.amount > 0).length;
    return activeTiers.map((tier, index) => tierToPlan(tier, index, paidTierCount));
  }, [activeTiers]);

  useEffect(() => {
    let ctx: ReturnType<typeof import("gsap").gsap.context> | null = null;

    const init = async () => {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!pageRef.current) return;

      ctx = gsap.context(() => {
        gsap.fromTo(
          "[data-pricing-hero]",
          { y: 32, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.75, ease: "power3.out", stagger: 0.1 },
        );

        gsap.fromTo(
          "[data-pricing-card]",
          { y: 64, opacity: 0, rotateX: 7 },
          {
            y: 0,
            opacity: 1,
            rotateX: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: "[data-pricing-grid]",
              start: "top 78%",
            },
          },
        );

        gsap.fromTo(
          "[data-faq-item]",
          { x: -24, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: "[data-faq-list]",
              start: "top 82%",
            },
          },
        );
      }, pageRef);
    };

    init();
    return () => ctx?.revert();
  }, [plans.length]);

  return (
    <div ref={pageRef} className="w-full overflow-hidden">
      <section className="relative overflow-hidden pb-10 pt-32 md:pb-14 md:pt-40">
        <Container className="relative">
          <div data-pricing-hero className="flex items-center justify-between gap-4 border-b border-[var(--text-primary)] pb-3">
            {plans.length > 0 && (
              <span className="archive-label hidden sm:inline-block">{String(plans.length).padStart(2, "0")} gói</span>
            )}
          </div>

          <div className="mt-10 grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h1 data-pricing-hero className="archive-title max-w-4xl text-[clamp(36px,6vw,72px)]">
                Chọn gói học phù hợp
                <br />
                <em>với hành trình lịch sử của bạn</em>
              </h1>

              <p data-pricing-hero className="mt-6 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
                Các gói được tải trực tiếp từ hệ thống thanh toán, luôn phản ánh giá và giới hạn token hiện tại.
              </p>

              <div data-pricing-hero className="mt-8">
                <MagneticButton
                  href="/register"
                  size="lg"
                  className="rounded-[2px] border border-[var(--accent-gold)] text-base font-bold uppercase tracking-[0.08em]"
                >
                  Bắt đầu ngay
                </MagneticButton>
              </div>
            </div>

            {/* 國史 — "quốc sử", national history */}
            <span data-pricing-hero className="archive-seal mb-2 mr-2 hidden md:inline-grid" aria-hidden="true">國史</span>
          </div>
        </Container>
      </section>

      <section className="relative pb-20 md:pb-28">
        <Container className="max-w-[1320px]">
          {isLoading ? (
            <PricingSkeleton />
          ) : plans.length === 0 ? (
            <div className="rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
              Hiện chưa có gói thanh toán đang hoạt động.
            </div>
          ) : (
            <>
              {usingFallback && (
                <div className="mb-5 rounded-[2px] border border-[var(--accent-gold)] bg-[var(--accent-gold-active-bg)] p-5 text-left">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="archive-title is-plain text-[19px]">
                        Đang hiển thị bảng giá tham khảo
                      </h2>
                      <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                        Chưa kết nối được API `/payments/tiers`, nên trang tạm dùng dữ liệu fallback để bạn vẫn xem được các gói.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="btn-line shrink-0"
                    >
                      {isFetching ? "Đang tải lại..." : "Thử tải lại API"}
                    </button>
                  </div>
                </div>
              )}

              {/* Ruled columns: the grid draws the top/left rules, each plan its right/bottom ones. */}
              <div
                data-pricing-grid
                className={cn(
                  "mx-auto grid grid-cols-1 border-t border-l border-[var(--text-primary)] md:grid-cols-2",
                  plans.length <= 1 && "max-w-md xl:grid-cols-1",
                  plans.length === 2 && "max-w-3xl xl:grid-cols-2",
                  plans.length === 3 && "max-w-6xl xl:grid-cols-3",
                  plans.length >= 4 && "max-w-[1320px] xl:grid-cols-4",
                )}
              >
                {plans.map((plan, idx) => {
                  const tier = activeTiers[idx];
                  const isInk = !!plan.popular;

                  return (
                    <div
                      key={plan.id}
                      data-pricing-card
                      className={cn(
                        "relative flex min-h-[520px] flex-col border-r border-b border-[var(--text-primary)] p-6 transition-colors duration-200 lg:p-8",
                        isInk
                          ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                          : "bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]",
                      )}
                    >
                      {isInk && <div className="absolute left-0 right-0 top-0 h-[3px] bg-[var(--accent-gold)]" />}

                      <div className="mb-4 flex min-h-6 items-center justify-between gap-3">
                        <span className={cn("text-[11px] font-bold tracking-[0.12em]", isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--text-tertiary)]")}>
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {plan.badge && (
                          <span className="rounded-[2px] bg-[var(--accent-gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#FFFFFF]">
                            {plan.badge}
                          </span>
                        )}
                      </div>

                      <div className="mb-3 flex items-center gap-3">
                        <span className={isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--accent-gold)]"}>{plan.icon}</span>
                        <h3 className={cn("archive-title is-plain text-[22px]", isInk && "text-[var(--text-inverse)]")}>{plan.name}</h3>
                      </div>

                      <p className={cn("min-h-[76px] text-sm leading-relaxed", isInk ? "text-[var(--text-inverse)] opacity-75" : "text-[var(--text-tertiary)]")}>{plan.description}</p>

                      <div className={cn("mb-6 mt-5 border-t pt-5", isInk ? "border-[var(--text-inverse)]/25" : "border-[var(--border-default)]")}>
                        <div className="flex items-baseline gap-1.5">
                          <span className={cn("font-display text-[40px] font-extrabold leading-none", isInk ? "text-[var(--text-inverse)]" : "text-[var(--text-primary)]")}>{plan.price}</span>
                          {plan.priceSuffix && <span className={cn("text-sm", isInk ? "text-[var(--text-inverse)] opacity-70" : "text-[var(--text-muted)]")}>{plan.priceSuffix}</span>}
                        </div>
                        <p className={cn("mt-2 text-[10px] font-bold uppercase tracking-[0.1em]", isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--text-muted)]")}>
                          {tier.noMonth > 0 ? `${tier.noMonth} tháng sử dụng` : "Gói dùng thử"}
                        </p>
                      </div>

                      <MagneticButton
                        href={plan.ctaHref}
                        size="md"
                        magneticStrength={0.09}
                        className={cn(
                          "w-full justify-center rounded-[2px] border text-[13px] font-bold uppercase tracking-[0.08em]",
                          plan.ctaStyle === "outline" && "border-[var(--text-primary)]",
                          plan.ctaStyle === "primary" && "border-[var(--accent-gold)]",
                          plan.ctaStyle === "gold" && "border-[var(--accent-gold)] [&_span]:text-[var(--text-inverse)]!",
                        )}
                      >
                        {plan.ctaLabel}
                      </MagneticButton>

                      <ul className={cn("mt-6 border-t", isInk ? "border-[var(--text-inverse)]/25" : "border-[var(--border-default)]")}>
                        {plan.features.map((feature) => (
                          <li
                            key={feature.text}
                            className={cn("flex items-start gap-2.5 border-b py-2.5", isInk ? "border-[var(--text-inverse)]/15" : "border-[var(--border-default)]")}
                          >
                            <Check
                              className={cn(
                                "mt-0.5 h-4 w-4 flex-shrink-0",
                                feature.highlight
                                  ? isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--accent-gold)]"
                                  : isInk ? "text-[var(--text-inverse)] opacity-60" : "text-[var(--text-muted)]",
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm leading-relaxed",
                                isInk
                                  ? feature.highlight ? "font-semibold text-[var(--text-inverse)]" : "text-[var(--text-inverse)] opacity-80"
                                  : feature.highlight ? "font-semibold text-[var(--text-primary)]" : "text-[var(--text-secondary)]",
                              )}
                            >
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Container>
      </section>

      <section className="relative border-t border-[var(--text-primary)] py-16 md:py-24">
        <Container className="relative max-w-3xl">
          <div className="archive-heading">
            <div className="min-w-0">
              <h2 className="archive-title">Câu hỏi thường gặp</h2>
              <p>Chưa tìm được gói phù hợp? Liên hệ với chúng tôi để được tư vấn giải pháp tốt nhất.</p>
            </div>
          </div>

          <div data-faq-list className="text-left">
            {[
              {
                q: "Tôi có thể hủy gói đăng ký bất cứ lúc nào không?",
                a: "Có, bạn có thể hủy đăng ký bất cứ lúc nào. Tài khoản sẽ tiếp tục hoạt động cho đến hết chu kỳ thanh toán hiện tại.",
              },
              {
                q: "Bảng giá này lấy từ đâu?",
                a: "Các gói trong trang này được tải trực tiếp từ API /payments/tiers, bao gồm giá, thời hạn và giới hạn token.",
              },
              {
                q: "Tôi có thể nâng cấp hoặc hạ cấp gói không?",
                a: "Có, bạn có thể thay đổi gói bất cứ lúc nào. Phần chênh lệch sẽ được xử lý theo chính sách thanh toán hiện tại.",
              },
            ].map((faq, index) => (
              <details
                key={faq.q}
                data-faq-item
                className="group border-b border-[var(--border-strong)]"
              >
                <summary className="flex cursor-pointer select-none items-center gap-4 px-1 py-4 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-gold)]">
                  <span className="text-[11px] font-bold tracking-[0.12em] text-[var(--text-tertiary)]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{faq.q}</span>
                  <span className="ml-3 text-lg text-[var(--text-muted)] transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <div className="pb-4 pl-12 pr-1 text-sm leading-relaxed text-[var(--text-secondary)]">{faq.a}</div>
              </details>
            ))}
          </div>

        </Container>
      </section>
    </div>
  );
}
