"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Building2, Check, Loader2, School, Send, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Container } from "@/components/marketing/container";
import { B2bQuoteForm } from "@/components/marketing/b2b-quote-form";
import { cn } from "@/lib/utils/cn";
import { formatVnd } from "@/features/payment/tier-plans";
import {
  B2B_LIMITS,
  B2B_PACKAGE_LABELS,
  b2bQuoteService,
  type B2bPackage,
  type B2bPlan,
  type B2bQuoteInput,
} from "@/services/b2b-quote.service";

const CALC_DEBOUNCE_MS = 300;
const planIcons = [School, Building2, Users];

const formatTokens = (n: number) => n.toLocaleString("vi-VN");
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(Math.round(n) || min, min), max);

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SummaryRow({ label, value, strong, accent }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-[var(--text-inverse)]/15 py-2.5">
      <dt className={cn("text-sm", strong ? "font-semibold" : "opacity-80")}>{label}</dt>
      <dd className={cn("text-right tabular-nums", strong ? "text-lg font-extrabold" : "text-sm", accent && "text-[var(--accent-on-ink)]")}>
        {value}
      </dd>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  // Typing is kept as text so a half-typed number is not clamped mid-way; it is applied on blur.
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const sliderMax = Math.min(max, 3000);
  return (
    <label className="grid gap-2">
      <span className="flex items-baseline justify-between text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
        {label}
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            const n = Number(e.target.value);
            if (Number.isFinite(n) && n >= min && n <= max) onChange(Math.round(n));
          }}
          onBlur={() => onChange(clamp(Number(text), min, max))}
          className="h-9 w-28 rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 text-right text-sm font-semibold tabular-nums text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
          aria-label={label}
        />
      </span>
      <input
        type="range"
        min={min}
        max={sliderMax}
        value={Math.min(value, sliderMax)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent-gold)]"
        aria-hidden="true"
        tabIndex={-1}
      />
    </label>
  );
}

export default function ForSchoolsPage() {
  const calculatorRef = useRef<HTMLDivElement>(null);
  const catalogQuery = useQuery({ queryKey: ["b2b", "plans"], queryFn: b2bQuoteService.plans, staleTime: 10 * 60 * 1000 });
  const catalog = catalogQuery.data;

  const [selectedPackage, setSelectedPackage] = useState<B2bPackage>("ENTERPRISE_CUSTOM");
  const [students, setStudents] = useState(850);
  const [teachers, setTeachers] = useState(22);
  const [promoCode, setPromoCode] = useState("");
  const [quoteOpen, setQuoteOpen] = useState(false);

  const quoteInput: B2bQuoteInput = useMemo(
    () => ({ selectedPackage, numberOfStudents: students, numberOfTeachers: teachers, promoCode: promoCode.trim() || undefined }),
    [selectedPackage, students, teachers, promoCode],
  );
  const debouncedInput = useDebounced(quoteInput, CALC_DEBOUNCE_MS);
  const calcQuery = useQuery({
    queryKey: ["b2b", "calculate", debouncedInput],
    queryFn: () => b2bQuoteService.calculate(debouncedInput),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });
  const calc = calcQuery.data;
  const isCalculating = calcQuery.isFetching || debouncedInput !== quoteInput;

  const choosePlan = (plan: B2bPlan, scroll = true) => {
    setSelectedPackage(plan.packageType);
    setStudents(plan.maxStudents);
    setTeachers(plan.maxTeachers);
    if (scroll) calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  // Changing the numbers by hand makes it a custom plan.
  const setCustom = (apply: () => void) => {
    apply();
    setSelectedPackage("ENTERPRISE_CUSTOM");
  };

  const summaryText = `${B2B_PACKAGE_LABELS[selectedPackage]} · ${students.toLocaleString("vi-VN")} học sinh · ${teachers.toLocaleString("vi-VN")} giáo viên${
    calc ? ` · ${formatVnd(calc.finalPriceVnd)}/năm học` : ""
  }`;

  return (
    <div className="w-full overflow-hidden">
      <section className="relative overflow-hidden pb-8 pt-8 md:pb-10 md:pt-10">
        <Container>
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <span className="archive-label">Dành cho trường học</span>
              <h1 className="archive-title mt-3 max-w-4xl text-[clamp(30px,4.2vw,52px)]">
                HistoryTalk cho nhà trường <em>trả theo số học sinh</em>
              </h1>
              <p className="mt-4 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                Quỹ token chung cho cả năm học, kho nội dung lịch sử địa phương riêng, vấn đáp và quiz không giới hạn. Chọn
                gói hoặc nhập quy mô trường để xem giá, rồi gửi yêu cầu báo giá ngay.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setQuoteOpen(true)}
              className="btn-crimson inline-flex min-h-11 items-center justify-center gap-2 px-6 text-[13px] font-bold uppercase tracking-[0.08em]"
            >
              <Send className="h-4 w-4" aria-hidden="true" /> Gửi yêu cầu báo giá
            </button>
          </div>
        </Container>
      </section>

      <section className="relative pb-16">
        <Container className="max-w-6xl">
          {catalogQuery.isLoading ? (
            <div className="grid gap-0 border-l border-t border-[var(--text-primary)] md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-[420px] animate-pulse border-b border-r border-[var(--text-primary)] bg-[var(--bg-surface)]" />
              ))}
            </div>
          ) : catalogQuery.isError || !catalog ? (
            <div className="rounded-sm border border-border-card bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
              Chưa tải được bảng giá trường học.{" "}
              <button type="button" className="underline" onClick={() => catalogQuery.refetch()}>
                Thử lại
              </button>
            </div>
          ) : (
            <div className="grid border-l border-t border-[var(--text-primary)] md:grid-cols-3">
              {catalog.plans.map((plan, index) => {
                const Icon = planIcons[index] ?? School;
                const isInk = plan.popular;
                return (
                  <div
                    key={plan.packageType}
                    className={cn(
                      "relative flex flex-col border-b border-r border-[var(--text-primary)] p-6 lg:p-8",
                      isInk ? "bg-[var(--text-primary)] text-[var(--text-inverse)]" : "bg-[var(--bg-surface)]",
                    )}
                  >
                    {isInk && <div className="absolute left-0 right-0 top-0 h-[3px] bg-[var(--accent-gold)]" />}
                    <div className="mb-3 flex min-h-6 items-center justify-between gap-3">
                      <Icon className={cn("h-5 w-5", isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--accent-gold)]")} />
                      {plan.popular && (
                        <span className="rounded-sm bg-[var(--accent-gold)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#FFFFFF]">
                          Phổ biến
                        </span>
                      )}
                    </div>
                    <h2 className={cn("archive-title is-plain text-[21px]", isInk && "text-[var(--text-inverse)]")}>{plan.displayName}</h2>
                    <div className={cn("mt-5 border-t pt-5", isInk ? "border-[var(--text-inverse)]/25" : "border-[var(--border-default)]")}>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-[34px] font-extrabold leading-none">{formatVnd(plan.finalPriceVnd)}</span>
                        <span className="text-sm opacity-70">/năm học</span>
                      </div>
                      <p className={cn("mt-2 text-[11px] font-bold uppercase tracking-[0.1em]", isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--text-muted)]")}>
                        ≈ {formatVnd(plan.averageMonthlyCostPerStudentVnd)} / học sinh / tháng
                        {plan.discountPercent > 0 && ` · đã giảm ${plan.discountPercent}%`}
                      </p>
                    </div>
                    <div className="mt-6 grid gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          choosePlan(plan, false);
                          setQuoteOpen(true);
                        }}
                        className={cn(
                          "min-h-11 w-full rounded-sm border text-[13px] font-bold uppercase tracking-[0.08em] transition-colors",
                          isInk
                            ? "border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[#FFFFFF] hover:opacity-90"
                            : "border-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--text-inverse)]",
                        )}
                      >
                        Nhận báo giá gói này
                      </button>
                      <button
                        type="button"
                        onClick={() => choosePlan(plan)}
                        className={cn("min-h-9 text-[12px] font-semibold underline-offset-4 hover:underline", isInk ? "text-[var(--text-inverse)] opacity-80" : "text-[var(--text-secondary)]")}
                      >
                        Tuỳ chỉnh số học sinh, giáo viên
                      </button>
                    </div>
                    <ul className={cn("mt-6 border-t", isInk ? "border-[var(--text-inverse)]/25" : "border-[var(--border-default)]")}>
                      {plan.highlights.map((text) => (
                        <li
                          key={text}
                          className={cn("flex items-start gap-2.5 border-b py-2.5 text-sm leading-relaxed", isInk ? "border-[var(--text-inverse)]/15" : "border-[var(--border-default)]")}
                        >
                          <Check className={cn("mt-0.5 h-4 w-4 shrink-0", isInk ? "text-[var(--accent-on-ink)]" : "text-[var(--accent-gold)]")} />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Container>
      </section>

      <section ref={calculatorRef} className="relative scroll-mt-24 border-t border-[var(--text-primary)] py-16 md:py-20">
        <Container className="max-w-6xl">
          <h2 className="archive-title text-[clamp(26px,3.5vw,40px)]">Tính giá theo quy mô trường</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
            Mỗi học sinh có hạn mức {formatTokens(catalog?.studentDailyTokenLimit ?? 5000)} token/ngày, mỗi giáo viên{" "}
            {formatTokens(catalog?.teacherDailyTokenLimit ?? 5000)} token/ngày. Trường càng đông học sinh, chiết khấu càng lớn.
          </p>

          <div className="mt-8 grid gap-0 border-l border-t border-[var(--text-primary)] lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
            <div className="grid content-start gap-6 border-b border-r border-[var(--text-primary)] bg-[var(--bg-surface)] p-6 lg:p-8">
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Gói">
                {(Object.keys(B2B_PACKAGE_LABELS) as B2bPackage[]).map((pkg) => {
                  const plan = catalog?.plans.find((p) => p.packageType === pkg);
                  return (
                    <button
                      key={pkg}
                      type="button"
                      role="radio"
                      aria-checked={selectedPackage === pkg}
                      onClick={() => (plan ? choosePlan(plan) : setSelectedPackage("ENTERPRISE_CUSTOM"))}
                      className={cn(
                        "border px-3 py-2 text-[12px] font-bold uppercase tracking-[0.06em] transition-colors",
                        selectedPackage === pkg
                          ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--text-inverse)]"
                          : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]",
                      )}
                    >
                      {B2B_PACKAGE_LABELS[pkg]}
                    </button>
                  );
                })}
              </div>
              <NumberField
                label="Số học sinh"
                value={students}
                min={B2B_LIMITS.minStudents}
                max={B2B_LIMITS.maxStudents}
                onChange={(v) => setCustom(() => setStudents(v))}
              />
              <NumberField
                label="Số giáo viên"
                value={teachers}
                min={B2B_LIMITS.minTeachers}
                max={B2B_LIMITS.maxTeachers}
                onChange={(v) => setCustom(() => setTeachers(v))}
              />
              <label className="grid gap-1.5">
                <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Mã ưu đãi</span>
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  maxLength={40}
                  placeholder="Nếu có"
                  className="h-11 w-full rounded-sm border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 text-sm uppercase tracking-[0.06em] text-[var(--text-primary)] placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
                {promoCode.trim() && calc && !isCalculating && (
                  <span className={cn("text-xs", calc.promoCodeApplied ? "text-(--status-success)" : "text-[var(--text-muted)]")}>
                    {calc.promoCodeApplied ? `Đã áp dụng mã ${calc.promoCodeApplied}.` : "Mã này không hợp lệ hoặc đã hết hạn."}
                  </span>
                )}
              </label>

              {catalog && (
                <div>
                  <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Chiết khấu theo số học sinh</p>
                  <ul className="mt-2 border-t border-[var(--border-default)]">
                    {catalog.discountTiers.map((tier) => {
                      const active = students >= tier.minStudents && (tier.maxStudents == null || students <= tier.maxStudents);
                      return (
                        <li
                          key={tier.minStudents}
                          className={cn(
                            "flex items-center justify-between gap-3 border-b border-[var(--border-default)] px-2 py-2 text-sm",
                            active && "bg-[var(--accent-gold-active-bg)] font-semibold",
                          )}
                        >
                          <span>
                            {tier.maxStudents == null
                              ? `Từ ${tier.minStudents.toLocaleString("vi-VN")} học sinh`
                              : `${tier.minStudents.toLocaleString("vi-VN")} – ${tier.maxStudents.toLocaleString("vi-VN")} học sinh`}
                          </span>
                          <span className="tabular-nums">{tier.discountPercent > 0 ? `−${tier.discountPercent}%` : "Giá gốc"}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            <aside className="border-b border-r border-[var(--text-primary)] bg-[var(--text-primary)] p-6 text-[var(--text-inverse)] lg:sticky lg:top-24 lg:self-start lg:p-8" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <h3 className="archive-title is-plain text-[20px] text-[var(--text-inverse)]">Tóm tắt gói</h3>
                {isCalculating && <Loader2 className="h-4 w-4 animate-spin opacity-70" aria-label="Đang tính" />}
              </div>
              {calcQuery.isError && !calc ? (
                <p className="mt-6 text-sm opacity-80">Chưa tính được giá. Kiểm tra số học sinh và giáo viên rồi thử lại.</p>
              ) : !calc ? (
                <div className="mt-6 space-y-3">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-5 animate-pulse bg-[var(--text-inverse)]/15" />
                  ))}
                </div>
              ) : (
                <dl className="mt-4">
                  <SummaryRow label="Quỹ token năm học" value={`${formatTokens(calc.totalTokenPool)} token`} />
                  <SummaryRow label="Chi phí token AI" value={formatVnd(calc.aiTokenCostVnd)} />
                  <SummaryRow label="Lưu trữ, quiz và LMS" value={formatVnd(calc.dbAndLmsCostVnd)} />
                  <SummaryRow label="Tạm tính" value={formatVnd(calc.subtotalVnd)} />
                  <SummaryRow
                    label={`Chiết khấu (${calc.discountPercent}%)`}
                    value={calc.discountAmountVnd > 0 ? `−${formatVnd(calc.discountAmountVnd)}` : "0đ"}
                    accent
                  />
                  <SummaryRow label="Tổng năm học" value={formatVnd(calc.finalPriceVnd)} strong />
                  <p className="mt-3 text-sm opacity-80">
                    Bình quân <strong className="text-[var(--accent-on-ink)]">{formatVnd(calc.averageMonthlyCostPerStudentVnd)}</strong> mỗi
                    học sinh mỗi tháng.
                  </p>
                </dl>
              )}
              <button
                type="button"
                onClick={() => setQuoteOpen(true)}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-sm border border-[var(--accent-gold)] bg-[var(--accent-gold)] text-[13px] font-bold uppercase tracking-[0.08em] text-[#FFFFFF] transition-opacity hover:opacity-90"
              >
                <Send className="h-4 w-4" aria-hidden="true" /> Gửi yêu cầu báo giá
              </button>
              <p className="mt-2 text-center text-xs opacity-70">Gửi kèm đúng gói và quy mô đang chọn ở trên.</p>
            </aside>
          </div>
        </Container>
      </section>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gửi yêu cầu báo giá</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-content-text">
              Điền thông tin người liên hệ của trường. Giá trên trang là giá niêm yết; chiết khấu cuối cùng được thống nhất khi
              tư vấn.
            </DialogDescription>
          </DialogHeader>
          <B2bQuoteForm quote={quoteInput} summary={summaryText} onSubmitted={() => setQuoteOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
