import type { PaymentTier } from "@/services/payment.service";

export type BillingCycle = "month" | "year";

/** One plan (free / plus / pro) with its monthly and yearly tier rows from /payments/tiers. */
export interface TierPlan {
  key: string;
  title: string;
  isFree: boolean;
  monthly?: PaymentTier;
  yearly?: PaymentTier;
  /** Tokens added per day — the same for both billing cycles of a plan. */
  dailyTokens: number;
}

/** Yearly rows share the monthly row's title and are told apart by noMonth = 12. */
export function groupTierPlans(tiers: PaymentTier[]): TierPlan[] {
  const plans = new Map<string, TierPlan>();
  for (const tier of tiers) {
    if (!tier.isActive) continue;
    const key = tier.title.trim().toLowerCase();
    const plan = plans.get(key) ?? { key, title: tier.title.trim(), isFree: tier.amount <= 0, dailyTokens: tier.limitedToken };
    if (tier.noMonth >= 12) plan.yearly = tier;
    else plan.monthly = tier;
    plan.isFree = plan.isFree && tier.amount <= 0;
    plan.dailyTokens = Math.max(plan.dailyTokens, tier.limitedToken);
    plans.set(key, plan);
  }
  const sortPrice = (p: TierPlan) => (p.monthly ?? p.yearly)?.amount ?? 0;
  return [...plans.values()].sort((a, b) => sortPrice(a) - sortPrice(b));
}

/** The tier to sell for a cycle; falls back to the other cycle when a plan only has one. */
export function tierForCycle(plan: TierPlan, cycle: BillingCycle): PaymentTier | undefined {
  return cycle === "year" ? plan.yearly ?? plan.monthly : plan.monthly ?? plan.yearly;
}

/** Percent saved by paying yearly instead of 12 monthly payments, or null when not cheaper. */
export function yearlySavingPercent(plan: TierPlan): number | null {
  if (!plan.monthly || !plan.yearly || plan.monthly.amount <= 0) return null;
  const fullYear = plan.monthly.amount * 12;
  const saving = Math.round(((fullYear - plan.yearly.amount) / fullYear) * 100);
  return saving > 0 ? saving : null;
}

/** Plan level by title, as the backend ranks it: free=0, plus=1, pro=2; unknown titles are -1. */
export function planRank(title: string | null | undefined): number {
  switch (title?.trim().toLowerCase()) {
    case "free":
      return 0;
    case "plus":
      return 1;
    case "pro":
      return 2;
    default:
      return -1;
  }
}

/**
 * Whether a user on `current` may buy `target` mid-period: a higher plan, or the same plan
 * with a longer duration. With no active paid plan any paid tier can be bought.
 */
export function canUpgradeTo(current: PaymentTier | undefined, target: PaymentTier): boolean {
  if (!current || current.amount <= 0) return true;
  const currentRank = planRank(current.title);
  const targetRank = planRank(target.title);
  if (currentRank < 0 || targetRank < 0) return false;
  if (targetRank !== currentRank) return targetRank > currentRank;
  return target.noMonth > current.noMonth;
}

export function hasYearlyPlans(plans: TierPlan[]): boolean {
  return plans.some((p) => !!p.yearly);
}

export function formatVnd(amount: number): string {
  if (amount <= 0) return "0đ";
  return `${amount.toLocaleString("vi-VN")}đ`;
}
