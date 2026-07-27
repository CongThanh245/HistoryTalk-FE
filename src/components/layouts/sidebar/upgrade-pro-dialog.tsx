"use client";

import { useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CheckIcon, CrownIcon, SparklesIcon, XIcon } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query-key";
import { paymentService, type PaymentTier } from "@/services/payment.service";
import { toast } from "sonner";
import { useAuthStore } from "@/store/auth.store";
import { useRouter } from "next/navigation";
import { useProfile } from "@/features/profile/hooks";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getTierFeatureSummary(tier: PaymentTier): string {
  const value = `${tier.tierId} ${tier.title}`.toLowerCase();

  if (value.includes("pro")) return "Nội dung, chat, call, video call, quiz";
  if (value.includes("plus")) return "Nội dung, chat, call, quiz";
  return "Nội dung, chat, quiz";
}

function TierCard({
  tier,
  index,
  onCheckout,
  loadingId,
  currentTierId,
}: {
  tier: PaymentTier;
  index: number;
  onCheckout: (tierId: string) => void;
  loadingId: string | null;
  currentTierId: string | null;
}) {
  const isFeatured = index === 0;
  const isLoading = loadingId === tier.tierId;
  const isFree = tier.amount === 0;
  const isCurrent = currentTierId ? tier.tierId === currentTierId : isFree;

  const features: [string, string][] = [
    ["Thời hạn", `${tier.noMonth} tháng`],
    ["Token AI", tier.limitedToken.toLocaleString("vi-VN")],
    ["Tính năng", getTierFeatureSummary(tier)],
  ];

  return (
    <section
      className={`upgrade-pro-card upgrade-pro-card-${index} ${isFeatured ? "is-featured" : ""}`}
    >
      <div className="upgrade-pro-card-head">
        <CrownIcon className="size-5" />
        <div>
          <h3>{tier.title}</h3>
          <p>{tier.noMonth} tháng sử dụng</p>
        </div>
      </div>

      <div className="upgrade-pro-price">
        <span>{isFree ? "Miễn phí" : formatCurrency(tier.amount)}</span>
        {!isFree && <small>/{tier.noMonth} tháng</small>}
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
        <CrownIcon className="size-5 text-white/20" />
        <div className="flex-1">
          <div className="h-[18px] w-[60%] bg-white/10 rounded-md mb-2" />
          <div className="h-3.5 w-[80%] bg-white/[0.07] rounded-md" />
        </div>
      </div>
      <div className="h-10 w-1/2 bg-white/10 rounded-lg mt-7" />
      <div className="h-11 bg-white/[0.08] rounded-lg mt-[22px]" />
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
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
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

  const activeTiers = tiers?.filter((t) => t.isActive).sort((a, b) => a.amount - b.amount) ?? [];

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

          <div className="upgrade-pro-grid mt-[60px]">
            {isLoading
              ? [0, 1, 2].map((i) => <SkeletonCard key={i} index={i} />)
              : activeTiers.map((tier, index) => (
                  <TierCard
                    key={tier.tierId}
                    tier={tier}
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
