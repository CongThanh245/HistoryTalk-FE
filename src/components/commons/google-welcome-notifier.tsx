"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Mail, KeyRound, ArrowRight } from "lucide-react";

/**
 * Mount this once inside the authenticated app layout.
 * When the URL contains ?notify=google_welcome it fires a Sonner toast
 * and strips the param from the URL so it doesn't show again on refresh.
 */
export function GoogleWelcomeNotifier() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (searchParams.get("notify") !== "google_welcome") return;

    // Strip the param so it's gone after the toast fires
    const next = new URLSearchParams(searchParams.toString());
    next.delete("notify");
    const qs = next.toString();
    router.replace(pathname + (qs ? `?${qs}` : ""), { scroll: false });

    // Delay slightly so the page has settled before showing the toast
    const tid = setTimeout(() => {
      toast(
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 font-bold text-content-heading">
            <KeyRound className="size-4 shrink-0 text-accent-gold" />
            Mật khẩu tạm thời đã được gửi
          </div>
          <p className="text-xs leading-5 text-content-muted">
            HistoryTalk đã gửi mật khẩu tạm vào email của bạn.
            Hãy đổi ngay để bảo vệ tài khoản.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-content-muted">
            <Mail className="size-3.5 shrink-0" />
            Kiểm tra hộp thư đến (hoặc thư mục spam)
          </div>
          <button
            type="button"
            onClick={() => router.push("/profile?tab=security")}
            className="mt-1 inline-flex items-center gap-1.5 self-start rounded-md px-3 py-1.5 text-xs font-bold transition hover:opacity-80 bg-[linear-gradient(135deg,var(--accent-gold)_0%,var(--truffle,#8b5e3c)_100%)] text-bg-deep"
          >
            Đổi mật khẩu ngay
            <ArrowRight className="size-3" />
          </button>
        </div>,
        {
          duration: 12_000,
          icon: null,
          classNames: {
            toast: "ht-toast ht-toast--info",
          },
        },
      );
    }, 600);

    return () => clearTimeout(tid);
    // Run only once when notify param is present
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
