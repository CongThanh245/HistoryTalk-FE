"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { paymentService, type PaymentHistoryItem, type PaymentTier } from "@/services/payment.service";
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Hourglass,
  Sparkles,
  Timer,
  XCircle,
} from "lucide-react";

type PaymentStatus = "success" | "cancelled" | "pending" | "unknown";

function getStatus(params: URLSearchParams): PaymentStatus {
  const code = params.get("code");
  const status = params.get("status")?.toUpperCase();
  const cancel = params.get("cancel");

  if (cancel === "true") return "cancelled";
  if (code === "00" || status === "PAID") return "success";
  if (status === "PENDING") return "pending";
  return "unknown";
}

function formatCurrency(amount?: string | number | null) {
  if (amount === undefined || amount === null || amount === "") return "Đang cập nhật";

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount)) return String(amount);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(parsedAmount);
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date());
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDuration(months?: number) {
  if (!months) return "Theo thời hạn của gói";
  return months >= 12 ? `${Math.round(months / 12)} năm sử dụng` : `${months} tháng sử dụng`;
}

function formatTokens(tokens?: number) {
  if (!tokens) return "Mở rộng lượt trò chuyện AI";
  return `${new Intl.NumberFormat("vi-VN").format(tokens)} token AI`;
}

const CONFIG: Record<
  PaymentStatus,
  {
    icon: ReactNode;
    title: string;
    desc: string;
    panelClassName: string;
    iconClassName: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={26} />,
    title: "Thanh toán thành công",
    desc: "Cảm ơn bạn đã thanh toán. Gói học tập của bạn đã được kích hoạt và sẵn sàng sử dụng trên HistoryTalk.",
    panelClassName: "border-[var(--status-success-border)] bg-[var(--status-success-bg)]",
    iconClassName: "text-[var(--status-success)]",
  },
  cancelled: {
    icon: <XCircle size={26} />,
    title: "Giao dịch đã bị hủy",
    desc: "Không có khoản thanh toán nào được ghi nhận. Bạn có thể quay lại và chọn gói phù hợp khi sẵn sàng.",
    panelClassName: "border-[var(--status-danger-border)] bg-[var(--status-danger-bg)]",
    iconClassName: "text-[var(--accent-danger)]",
  },
  pending: {
    icon: <Hourglass size={26} />,
    title: "Đang xác nhận thanh toán",
    desc: "PayOS đang xử lý giao dịch. Nếu bạn đã chuyển khoản, trạng thái sẽ được cập nhật sau ít phút.",
    panelClassName: "border-[var(--status-warning-border)] bg-[var(--status-warning-bg)]",
    iconClassName: "text-[var(--status-warning)]",
  },
  unknown: {
    icon: <Timer size={26} />,
    title: "Chưa xác định trạng thái",
    desc: "HistoryTalk chưa nhận được trạng thái cuối cùng từ cổng thanh toán. Hãy kiểm tra lại trong lịch sử đơn hàng.",
    panelClassName: "border-[var(--status-neutral-border)] bg-[var(--status-neutral-bg)]",
    iconClassName: "text-[var(--content-muted)]",
  },
};

export default function PaymentResult() {
  const params = useSearchParams();
  const router = useRouter();
  const status = getStatus(params);
  const cfg = CONFIG[status];

  const orderCode = params.get("orderCode");
  const amount = params.get("amount");
  const [historyItem, setHistoryItem] = useState<PaymentHistoryItem | null>(null);
  const [tier, setTier] = useState<PaymentTier | null>(null);

  const paymentTime = historyItem?.paidAt ?? (status === "success" ? new Date().toISOString() : null);
  const packageName = historyItem?.tierTitle ?? tier?.title ?? (status === "success" ? "Gói HistoryTalk" : "Đang cập nhật");
  const displayedAmount = historyItem?.amount ?? tier?.amount ?? amount;

  const features = useMemo(() => {
    if (status !== "success") return [];

    return [
      {
        title: formatTokens(tier?.limitedToken),
        desc: "Dùng cho các phiên trò chuyện, hỏi đáp và khám phá nhân vật lịch sử.",
      },
      {
        title: formatDuration(tier?.noMonth),
        desc: "Quyền lợi được gắn với tài khoản ngay sau khi hệ thống xác nhận giao dịch.",
      },
      {
        title: "Mở trải nghiệm học tập nâng cao",
        desc: "Tiếp tục trò chuyện với nhân vật, luyện quiz và theo dõi tiến độ học tập.",
      },
    ];
  }, [status, tier]);

  useEffect(() => {
    const code = params.get("code") ?? "";
    const id = params.get("id") ?? "";
    const cancel = params.get("cancel") === "true";
    const payosStatus = params.get("status") ?? "";
    const orderCodeNum = Number(params.get("orderCode") ?? "0");

    if (!orderCodeNum) return;

    paymentService
      .notifyReturn({ code, id, cancel, status: payosStatus, orderCode: orderCodeNum })
      .catch(() => {});
  }, [params]);

  useEffect(() => {
    if (status !== "success") return;

    const orderCodeNum = Number(orderCode ?? "0");

    Promise.all([paymentService.getMyHistory().catch(() => []), paymentService.getTiers().catch(() => [])])
      .then(([history, tiers]) => {
        const matchedHistory = orderCodeNum
          ? history.find((item) => Number(item.orderCode) === orderCodeNum)
          : history.find((item) => item.status?.toUpperCase() === "PAID");
        setHistoryItem(matchedHistory ?? null);

        const matchedTier = matchedHistory
          ? tiers.find((item) => item.tierId === matchedHistory.tierId)
          : null;
        setTier(matchedTier ?? null);
      })
      .catch(() => {});
  }, [orderCode, status]);

  useEffect(() => {
    if (status !== "success") return;

    const tid = setTimeout(() => {
      toast(
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 font-bold text-[var(--content-heading)]">
            <Sparkles className="size-4 shrink-0 text-[var(--accent-gold)]" />
            Gói thanh toán đã được kích hoạt!
          </div>
          <p className="text-xs leading-5 text-[var(--content-muted)]">
            Cảm ơn bạn đã nâng cấp. Bạn có thể dùng quyền lợi mới ngay bây giờ.
          </p>
        </div>,
        {
          duration: 8_000,
          icon: null,
          classNames: {
            toast: "ht-toast ht-toast--success",
          },
        },
      );
    }, 800);

    return () => clearTimeout(tid);
  }, [status]);

  if (status !== "success") {
    return (
      <div className="flex min-h-full items-center justify-center px-4 py-8 md:py-12">
        <section className="w-full max-w-3xl overflow-hidden rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-strong)] animate-in fade-in zoom-in-95 duration-500 sm:p-8">
          <div className={`rounded-lg border p-5 ${cfg.panelClassName}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 shrink-0 ${cfg.iconClassName}`}>
                {cfg.icon}
              </span>
              <div>
                <h1 className="text-2xl font-extrabold text-[var(--content-heading)]">{cfg.title}</h1>
                <p className="mt-2 text-sm leading-6 text-[var(--content-muted)]">{cfg.desc}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--abyssal-blue)] px-4 text-sm font-bold text-white shadow-[0_12px_28px_rgba(27,38,50,0.2)] transition hover:-translate-y-0.5"
            >
              <Home size={17} />
              Về trang chủ
            </button>

            <button
              type="button"
              onClick={() => router.push("/home")}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated)] px-4 text-sm font-bold text-[var(--content-heading)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--accent-gold)]"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden px-4 py-5 md:py-6">
      <div className="absolute inset-0 -z-10 bg-[#17130f]" />
      <Image
        src="/quang_trung_2D.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-30"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(12,10,8,0.96)_0%,rgba(23,19,15,0.9)_42%,rgba(23,19,15,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-[linear-gradient(0deg,#17130f_0%,rgba(23,19,15,0)_100%)]" />

      <section className="mx-auto grid w-full max-w-5xl items-stretch gap-0 overflow-hidden rounded-lg border border-white/12 bg-[#211a14]/88 shadow-[0_28px_80px_rgba(0,0,0,0.42)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-500 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="relative min-h-[260px] overflow-hidden border-b border-white/10 bg-[#2b2118] lg:border-b-0 lg:border-r">
          <Image
            src="/ngo-quyen-chan-dung.png"
            alt="Nhân vật lịch sử HistoryTalk"
            fill
            priority
            sizes="(min-width: 1024px) 420px, 100vw"
            className="object-cover object-top opacity-95"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(22,16,12,0.06)_0%,rgba(22,16,12,0.18)_45%,rgba(22,16,12,0.92)_100%)]" />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white">
            <div className="inline-flex items-center rounded-full border border-amber-200/30 bg-black/28 px-3 py-1 text-xs font-bold text-amber-100">
              Đã xác nhận bởi PayOS
            </div>
            <h2 className="mt-3 max-w-sm text-xl font-extrabold leading-tight text-white">
              Hành trình lịch sử của bạn đã được mở khóa
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-5 text-amber-50/80">
              Tiếp tục trò chuyện với các nhân vật, luyện tập quiz và khám phá nội dung nâng cao trong tài khoản của bạn.
            </p>
          </div>
        </aside>

        <div className="bg-[linear-gradient(180deg,rgba(255,251,245,0.98)_0%,rgba(244,236,221,0.98)_100%)] p-5 text-[#241812] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#d97706] text-white shadow-[0_14px_34px_rgba(180,83,9,0.28)]">
              {cfg.icon}
            </span>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight text-[#20150f] sm:text-3xl">
                Cảm ơn bạn đã thanh toán
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-[#5c493d]">{cfg.desc}</p>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-[#dfc7a6] bg-white/72 p-3">
              <div className="text-xs font-bold text-[#8a4f0d]">
                Thời gian
              </div>
              <p className="mt-1 text-sm font-extrabold leading-5 text-[#231610]">
                {formatDateTime(paymentTime)}
              </p>
            </div>
            <div className="rounded-lg border border-[#dfc7a6] bg-white/72 p-3">
              <div className="text-xs font-bold text-[#8a4f0d]">
                Gói thanh toán
              </div>
              <p className="mt-1 text-sm font-extrabold leading-5 text-[#231610]">{packageName}</p>
            </div>
            <div className="rounded-lg border border-[#dfc7a6] bg-white/72 p-3">
              <div className="text-xs font-bold text-[#8a4f0d]">
                Số tiền
              </div>
              <p className="mt-1 text-sm font-extrabold leading-5 text-[#231610]">
                {formatCurrency(displayedAmount)}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-lg border border-[#d9bd94] bg-[#fffaf1] p-3">
            <div className="mb-2 text-sm font-extrabold text-[#231610]">
              Chi tiết giao dịch
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5">
                <span className="text-[#6d5a4b]">Mã đơn hàng</span>
                <span className="break-all text-right font-mono text-xs font-bold text-[#231610]">
                  {orderCode ? `#${orderCode}` : "Đang cập nhật"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 rounded-md bg-white/70 px-2 py-1.5">
                <span className="text-[#6d5a4b]">Trạng thái</span>
                <span className="font-bold text-[#9a5a08]">Đã thanh toán</span>
              </div>
            </div>
          </div>

          <div className="mt-3">
            <h2 className="text-base font-extrabold text-[#20150f]">Quyền lợi của gói</h2>
            <div className="mt-2 grid gap-2">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-[#dfc7a6] bg-white/75 px-3 py-2"
                >
                  <div>
                    <h3 className="text-sm font-extrabold text-[#231610]">{feature.title}</h3>
                    <p className="text-xs leading-4 text-[#6d5a4b]">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#241812] px-4 text-sm font-bold text-white shadow-[0_14px_32px_rgba(36,24,18,0.24)] transition hover:-translate-y-0.5 hover:bg-[#3a281e]"
            >
              Về trang chủ
            </button>

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#caa878] bg-white/78 px-4 text-sm font-bold text-[#241812] transition hover:-translate-y-0.5 hover:border-[#9a5a08] hover:text-[#9a5a08]"
            >
              Xem tài khoản
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
