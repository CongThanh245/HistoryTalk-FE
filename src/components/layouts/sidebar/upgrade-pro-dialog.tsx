"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckIcon, CrownIcon, SparklesIcon, XIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import { paymentService } from "@/services/payment.service";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useProfile } from "@/features/profile/hooks";
import { useEntitlements } from "@/features/saas/entitlements";
import {
  formatVnd,
  groupTierPlans,
  hasYearlyPlans,
  tierForCycle,
  yearlySavingPercent,
  type BillingCycle,
  type TierPlan,
} from "@/features/payment/tier-plans";

function getTierFeatureSummary(planKey: string): string {
  if (planKey.includes("pro")) return "Nội dung, chat, call, video call, quiz";
  if (planKey.includes("plus")) return "Nội dung, chat, call, quiz";
  return "Nội dung, chat, quiz";
}

function TierCard({
  plan,
  cycle,
  index,
  onCheckout,
  loadingId,
  currentTierId,
}: {
  plan: TierPlan;
  cycle: BillingCycle;
  index: number;
  onCheckout: (tierId: string) => void;
  loadingId: string | null;
  currentTierId: string | null;
}) {
  const tier = tierForCycle(plan, cycle)!;
  const isFeatured = index === 0;
  const isLoading = loadingId === tier.tierId;
  const isFree = plan.isFree;
  const isYearly = tier.noMonth >= 12;
  const saving = isYearly ? yearlySavingPercent(plan) : null;
  // The account's subscription may be either the monthly or the yearly row of this plan.
  const isCurrent = currentTierId
    ? currentTierId === plan.monthly?.tierId || currentTierId === plan.yearly?.tierId
    : isFree;

  const features: [string, string][] = [
    ["Thời hạn", isFree ? "Miễn phí" : `${tier.noMonth} tháng`],
    ["Token AI", `${plan.dailyTokens.toLocaleString("vi-VN")}/ngày`],
    ["Tính năng", getTierFeatureSummary(plan.key)],
  ];

  return (
    <section
      className={`upgrade-pro-card upgrade-pro-card-${index} ${isFeatured ? "is-featured" : ""}`}
    >
      <div className="upgrade-pro-card-head">
        <CrownIcon className="size-5" />
        <div>
          <h3>{plan.title}</h3>
          <p>{isFree ? "Miễn phí" : saving ? `Tiết kiệm ${saving}% so với trả theo tháng` : `${tier.noMonth} tháng sử dụng`}</p>
        </div>
      </div>

      <div className="upgrade-pro-price">
        <span>{formatVnd(tier.amount)}</span>
        {!isFree && <small>{isYearly ? "/năm" : "/tháng"}</small>}
      </div>

      {isCurrent ? (
        <div
          className={`upgrade-pro-action is-current cursor-default pointer-events-none ${isFeatured ? "is-featured" : ""}`}
        >
          Gói hiện tại
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onCheckout(tier.tierId)}
          className={`upgrade-pro-action ${isFeatured ? "is-featured" : ""} ${isLoading ? "opacity-70 cursor-wait" : "opacity-100 cursor-pointer"}`}
        >
          {isLoading ? "Đang xử lý..." : "Đăng ký ngay"}
        </button>
      )}

      <div className="upgrade-pro-features">
        {features.map(([label, value]) => (
          <div key={label} className="upgrade-pro-feature">
            <span>{label}</span>
            <strong>
              {value}
              {isFeatured ? (
                <SparklesIcon className="size-3.5" />
              ) : (
                <CheckIcon className="size-3.5" />
              )}
            </strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <section className={`upgrade-pro-card upgrade-pro-card-${index} opacity-60`}>
      <div className="upgrade-pro-card-head">
        <CrownIcon className="size-5 text-[var(--border-strong)]" />
        <div className="flex-1">
          <div className="h-[18px] w-[60%] bg-[var(--border-default)] rounded-sm mb-2" />
          <div className="h-3.5 w-[80%] bg-[var(--border-default)] rounded-sm" />
        </div>
      </div>
      <div className="h-10 w-1/2 bg-[var(--border-default)] rounded-sm mt-7" />
      <div className="h-11 bg-[var(--border-default)] rounded-sm mt-[22px]" />
    </section>
  );
}

interface UpgradeProDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpgradeProDialog({
  children,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: UpgradeProDialogProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("month");
  const [localOpen, setLocalOpen] = useState(false);
  // School accounts never buy plans: the dialog stays closed and the trigger explains who to ask.
  const entitlements = useEntitlements();
  const isSchoolAccount = entitlements.mode === "B2B";
  const open = !isSchoolAccount && (controlledOpen !== undefined ? controlledOpen : localOpen);
  const setOpen = controlledOnOpenChange !== undefined ? controlledOnOpenChange : setLocalOpen;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();
  const { data: profile } = useProfile();

  const { data: tiers, isLoading } = useQuery({
    queryKey: queryKeys.payments.tiers,
    queryFn: paymentService.getTiers,
    enabled: open,
  });

  const checkoutMutation = useMutation({
    mutationFn: (tierId: string) => paymentService.checkout(tierId),
    onSuccess: (data) => {
      window.location.href = data.checkoutUrl;
    },
    onError: () => {
      toast.error("Không thể tạo đơn thanh toán. Vui lòng thử lại.");
      setLoadingId(null);
    },
  });

  const handleTriggerClick = () => {
    if (isSchoolAccount) {
      toast.info(entitlements.upgradeHint);
      return;
    }
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để nâng cấp Pro.", {
        action: {
          label: "Đăng nhập",
          onClick: () => router.push("/login"),
        },
      });
      return;
    }
    setOpen(true);
  };

  const handleCheckout = (tierId: string) => {
    setLoadingId(tierId);
    checkoutMutation.mutate(tierId);
  };

  const plans = groupTierPlans(tiers ?? []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
      {children && (
        <div onClick={handleTriggerClick} className="contents">
          {children}
        </div>
      )}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="upgrade-pro-overlay" />
        <DialogPrimitive.Content className="upgrade-pro-content">
          <DialogPrimitive.Title className="sr-only">Nâng cấp HistoryTalk Pro</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Bảng so sánh các gói nâng cấp của HistoryTalk.
          </DialogPrimitive.Description>

          <div className="upgrade-pro-brand">HistoryTalk</div>

          <DialogPrimitive.Close className="upgrade-pro-close" aria-label="Đóng">
            <XIcon className="size-5" />
          </DialogPrimitive.Close>

          {hasYearlyPlans(plans) && (
            <div role="radiogroup" aria-label="Chu kỳ thanh toán" className="mx-auto mt-[60px] flex w-fit border border-[var(--border-strong)]">
              {([
                ["month", "Theo tháng"],
                ["year", "Theo năm"],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={cycle === value}
                  onClick={() => setCycle(value)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-[0.08em] transition-colors ${
                    cycle === value
                      ? "bg-[var(--text-primary)] text-[var(--text-inverse)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div className={`upgrade-pro-grid ${hasYearlyPlans(plans) ? "mt-6" : "mt-[60px]"}`}>
            {isLoading
              ? [0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)
              : plans.map((plan, index) => (
                  <TierCard
                    key={plan.key}
                    plan={plan}
                    cycle={cycle}
                    index={index}
                    onCheckout={handleCheckout}
                    loadingId={loadingId}
                    currentTierId={profile?.tierId ?? null}
                  />
                ))}
          </div>

          <footer className="upgrade-pro-foot">
            <p>Thanh toán an toàn qua PayOS · Chuyển khoản ngân hàng & QR</p>
            <div>
              <span>FAQ</span>
              <span>Chính sách riêng tư</span>
              <span>Điều khoản dịch vụ</span>
            </div>
          </footer>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
