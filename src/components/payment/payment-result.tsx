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
    iconClassName: "text-[var(--text-muted)]",
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
        <section className="w-full max-w-3xl overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--text-primary)] bg-[var(--bg-elevated)] px-5 py-2.5 sm:px-8">
            {orderCode && (
              <span className="font-mono text-xs font-semibold text-[var(--text-tertiary)]">#{orderCode}</span>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className={`rounded-[2px] border p-5 ${cfg.panelClassName}`}>
              <div className="flex items-start gap-3">
                <span className={`mt-1 shrink-0 ${cfg.iconClassName}`}>
                  {cfg.icon}
                </span>
                <div>
                  <h1 className="archive-title text-[26px] sm:text-[30px]">{cfg.title}</h1>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{cfg.desc}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push("/home")}
                className="btn-ink h-11"
              >
                <Home size={16} />
                Về trang chủ
              </button>

              <button
                type="button"
                onClick={() => router.push("/home")}
                className="btn-line h-11"
              >
                <ArrowLeft size={16} />
                Quay lại
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-full overflow-hidden bg-[var(--bg-main)] px-4 py-5 md:py-6">
      <Image
        src="/quang_trung_2D.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover opacity-[0.07] grayscale"
      />

      <section className="mx-auto grid w-full max-w-5xl items-stretch gap-0 overflow-hidden rounded-[2px] border border-[var(--text-primary)] bg-[var(--bg-surface)] animate-in fade-in zoom-in-95 duration-500 lg:grid-cols-[0.72fr_1.28fr]">
        <aside className="flex flex-col border-b border-[var(--text-primary)] bg-[var(--bg-deep)] lg:border-b-0 lg:border-r">
          <div className="relative min-h-[240px] flex-1 overflow-hidden">
            <Image
              src="/ngo-quyen-chan-dung.png"
              alt="Nhân vật lịch sử HistoryTalk"
              fill
              priority
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover object-top"
            />
          </div>
          <div className="bg-[var(--text-primary)] p-5 text-[var(--text-inverse)]">
            <div className="inline-flex items-center rounded-[2px] border border-[var(--accent-on-ink)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--accent-on-ink)]">
              Đã xác nhận bởi PayOS
            </div>
            <h2 className="archive-title is-plain mt-3 max-w-sm text-[20px] text-[var(--text-inverse)]">
              Hành trình lịch sử của bạn đã được mở khóa
            </h2>
            <p className="mt-2 max-w-sm text-xs leading-5 opacity-75">
              Tiếp tục trò chuyện với các nhân vật, luyện tập quiz và khám phá nội dung nâng cao trong tài khoản của bạn.
            </p>
          </div>
        </aside>

        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-[var(--text-primary)] pb-4">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[2px] bg-[var(--accent-gold)] text-[#FFFFFF]">
                {cfg.icon}
              </span>
              <div>
                <h1 className="archive-title mt-1 text-[26px] sm:text-[32px]">
                  Cảm ơn bạn đã thanh toán
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-5 text-[var(--text-secondary)]">{cfg.desc}</p>
              </div>
            </div>
            <span className="archive-seal hidden shrink-0 sm:inline-grid" aria-hidden="true">國史</span>
          </div>

          <dl className="mt-4 grid rounded-[2px] border border-[var(--text-primary)] sm:grid-cols-3">
            <div className="p-3">
              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Thời gian
              </dt>
              <dd className="mt-1 text-sm font-bold leading-5 text-[var(--text-primary)]">
                {formatDateTime(paymentTime)}
              </dd>
            </div>
            <div className="border-t border-[var(--border-default)] p-3 sm:border-l sm:border-t-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Gói thanh toán
              </dt>
              <dd className="mt-1 text-sm font-bold leading-5 text-[var(--text-primary)]">{packageName}</dd>
            </div>
            <div className="border-t border-[var(--border-default)] p-3 sm:border-l sm:border-t-0">
              <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
                Số tiền
              </dt>
              <dd className="mt-1 font-display text-xl font-extrabold leading-6 tabular-nums text-[var(--text-primary)]">
                {formatCurrency(displayedAmount)}
              </dd>
            </div>
          </dl>

          <div className="mt-4">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-tertiary)]">
              Chi tiết giao dịch
            </div>
            <div className="divide-y divide-[var(--border-default)] border-y border-[var(--border-strong)] text-sm">
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-[var(--text-secondary)]">Mã đơn hàng</span>
                <span className="break-all text-right font-mono text-xs font-bold text-[var(--text-primary)]">
                  {orderCode ? `#${orderCode}` : "Đang cập nhật"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-2">
                <span className="text-[var(--text-secondary)]">Trạng thái</span>
                <span className="inline-flex h-6 items-center gap-1.5 rounded-[2px] border border-[var(--status-success-border)] bg-[var(--status-success-bg)] px-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--status-success)]">
                  <CheckCircle2 size={12} />
                  Đã thanh toán
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="archive-title text-lg">Quyền lợi của gói</h2>
            <ol className="mt-2 divide-y divide-[var(--border-default)] border-y border-[var(--border-strong)]">
              {features.map((feature, i) => (
                <li key={feature.title} className="flex gap-3 py-2.5">
                  <span className="font-display text-sm font-extrabold tabular-nums text-[var(--gold-on-light)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">{feature.title}</h3>
                    <p className="text-xs leading-4 text-[var(--text-tertiary)]">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push("/home")}
              className="btn-crimson h-10"
            >
              Về trang chủ
            </button>

            <button
              type="button"
              onClick={() => router.push("/profile")}
              className="btn-line h-10"
            >
              Xem tài khoản
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
