"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { ChevronsRight, X } from "lucide-react";
import { Mascot, type MascotAccessory, type MascotMood } from "./Mascot";
import { QuizConfetti } from "@/components/quiz/QuizFx";
import { formatDayMonth, getOnThisDay } from "@/data/on-this-day";
import { getSeason, SEASON_GREETING, type Season } from "@/lib/season";
import { onCelebrate } from "@/lib/celebrate";
import { cn } from "@/lib/utils/cn";
import { Role } from "@/constants/roles";
import { useAuthStore } from "@/store/auth.store";

const SEASON_ACCESSORY: Record<Season, MascotAccessory> = {
  tet: "mai",
  reunification: "flag",
  national: "flag",
  "mid-autumn": "lantern",
  teacher: "flowers",
};

// Full-screen tools (chat, map, quiz runner) need the corner for their own controls.
const HIDDEN_ON = [/^\/chat/, /^\/map/, /^\/quiz\/[^/]+/, /^\/assignments\/[^/]+/];

const TIPS: { match: RegExp; text: string }[] = [
  { match: /^\/home/, text: "Bấm 🔥 trên thanh trên cùng để xem nhiệm vụ hôm nay và nhận token." },
  { match: /^\/characters/, text: "Chọn một nhân vật rồi hỏi bất cứ điều gì — họ trả lời bằng chính góc nhìn của mình." },
  { match: /^\/events/, text: "Mở một sự kiện để xem diễn biến, bản đồ và các nhân vật liên quan." },
  { match: /^\/quiz/, text: "Chế độ luyện tập cho biết đúng/sai ngay sau mỗi câu — hợp để ôn bài." },
];
const DEFAULT_TIP = "Làm đủ nhiệm vụ mỗi ngày để giữ chuỗi ngày học nhé!";

// Teachers have no streak or quests; their tips point at the teaching tools instead.
const TEACHER_TIPS: { match: RegExp; text: string }[] = [
  { match: /^\/teaching\/assignments/, text: "Bài tập có thể là đọc bối cảnh, trò chuyện với nhân vật hoặc làm kiểm tra — đặt hạn nộp để học sinh thấy ngay." },
  { match: /^\/teaching\/local/, text: "Tư liệu riêng của bạn chỉ học sinh trường mình thấy; xuất bản rồi mới giao được cho lớp." },
  { match: /^\/classes/, text: "Mở một lớp để xem tiến độ từng học sinh và cấp thêm token khi các em cần." },
];
const TEACHER_DEFAULT_TIP = "Mẩu “ngày này năm xưa” ở trên có thể dùng làm câu mở đầu cho tiết học hôm nay.";

const SEEN_KEY = "ht-companion-seen";
const TUCKED_KEY = "ht-companion-tucked";
const todayKey = () => new Date().toISOString().slice(0, 10);

function readStorage(store: "local" | "session", key: string) {
  try {
    return (store === "local" ? localStorage : sessionStorage).getItem(key);
  } catch {
    return null;
  }
}
function writeStorage(store: "local" | "session", key: string, value: string) {
  try {
    (store === "local" ? localStorage : sessionStorage).setItem(key, value);
  } catch {
    // storage blocked — the companion just forgets
  }
}

const subscribeNoop = () => () => {};

/** Floating hourglass guide: "Ngày này năm xưa", page tips, holiday greetings and celebrations. */
export function MascotCompanion() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  // Tucked = peeking from the right edge; remembered across visits, one click brings it back.
  const [tucked, setTucked] = useState(() => readStorage("local", TUCKED_KEY) === "1");
  const [hover, setHover] = useState(false);
  const [cheer, setCheer] = useState<{ text: string; key: number } | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const cheerTimer = useRef<number | undefined>(undefined);

  const season = useMemo(() => (mounted ? getSeason() : null), [mounted]);
  const onThisDay = useMemo(() => getOnThisDay(), []);
  const isTeacher = useAuthStore((s) => s.user?.role) === Role.TEACHER;
  const tip = isTeacher
    ? (TEACHER_TIPS.find((t) => t.match.test(pathname))?.text ?? TEACHER_DEFAULT_TIP)
    : (TIPS.find((t) => t.match.test(pathname))?.text ?? DEFAULT_TIP);
  const offPage = HIDDEN_ON.some((re) => re.test(pathname));

  // Greet once a day, a moment after the page settles.
  useEffect(() => {
    if (!mounted || tucked || readStorage("local", SEEN_KEY) === todayKey()) return;
    const t = window.setTimeout(() => {
      setOpen(true);
      writeStorage("local", SEEN_KEY, todayKey());
    }, 2500);
    return () => window.clearTimeout(t);
  }, [mounted, tucked]);

  useEffect(
    () =>
      onCelebrate(({ text, confetti }) => {
        window.clearTimeout(cheerTimer.current);
        setCheer({ text, key: Date.now() });
        if (confetti) setConfettiKey((k) => k + 1);
        cheerTimer.current = window.setTimeout(() => setCheer(null), 3800);
      }),
    [],
  );

  useEffect(() => {
    if (!confettiKey) return;
    const t = window.setTimeout(() => setConfettiKey(0), 4500);
    return () => window.clearTimeout(t);
  }, [confettiKey]);

  if (!mounted) return null;

  const setTuck = (value: boolean) => {
    setTucked(value);
    writeStorage("local", TUCKED_KEY, value ? "1" : "0");
  };
  // A celebration still pops the mascot out briefly, even when tucked.
  const peeking = tucked && !cheer;

  const mood: MascotMood = cheer || hover ? "happy" : "idle";
  const showBubble = !offPage && (open || !!cheer);
  const [first] = onThisDay.entries;

  return (
    <>
      {confettiKey > 0 && <QuizConfetti key={confettiKey} />}

      <div
        className={cn(
          "pointer-events-none fixed bottom-3 right-3 z-40 flex flex-col items-end gap-2 md:bottom-5 md:right-5",
          offPage && !cheer && "hidden",
        )}
      >
        {showBubble && (
          <div
            key={cheer?.key ?? "info"}
            role={cheer ? "status" : "dialog"}
            aria-label={cheer ? undefined : "Trợ lý HistoryTalk"}
            className="companion-bubble pointer-events-auto relative w-[300px] max-w-[calc(100vw-24px)] rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-sm shadow-[var(--shadow-strong)]"
          >
            {cheer ? (
              <p className="pr-2 font-semibold text-content-heading">{cheer.text}</p>
            ) : (
              <>
                <button
                  type="button"
                  aria-label="Đóng"
                  onClick={() => setOpen(false)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-content-muted transition-colors hover:bg-[var(--sidebar-hover-bg)] hover:text-content-heading"
                >
                  <X size={15} aria-hidden="true" />
                </button>

                {season && <p className="mb-3 pr-7 font-semibold text-content-heading">{SEASON_GREETING[season]}</p>}

                {first && (
                  <div className={cn(!season && "pr-7")}>
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--gold-on-light)]">
                      {onThisDay.daysAway === 0
                        ? `Ngày này năm xưa · ${formatDayMonth(first.date)}`
                        : `Sắp tới · ${formatDayMonth(first.date)} (còn ${onThisDay.daysAway} ngày)`}
                    </p>
                    {onThisDay.entries.map((e) => (
                      <p key={e.text} className="mt-1.5 leading-relaxed text-content-text">
                        <b className="tabular-nums text-content-heading">{e.year}</b> — {e.text}
                      </p>
                    ))}
                    {first.href && (
                      <Link href={first.href} onClick={() => setOpen(false)} className="mt-1.5 inline-block text-[13px] font-semibold text-[var(--accent-gold)] hover:underline">
                        Tìm hiểu thêm →
                      </Link>
                    )}
                  </div>
                )}

                <p className="mt-3 border-t border-[var(--border-default)] pt-3 text-[13px] leading-relaxed text-content-muted">
                  <span className="font-semibold text-content-text">Mẹo: </span>
                  {tip}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setTuck(true);
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-content-subtle underline-offset-2 hover:text-content-muted hover:underline"
                >
                  <ChevronsRight size={13} aria-hidden="true" />
                  Thu gọn
                </button>
              </>
            )}
            <span aria-hidden="true" className="absolute -bottom-[7px] right-9 h-3 w-3 rotate-45 border-b border-r border-[var(--border-default)] bg-[var(--bg-surface)]" />
          </div>
        )}

        <button
          type="button"
          aria-label={peeking ? "Hiện trợ lý" : open ? "Đóng lời nhắn" : "Mở trợ lý: ngày này năm xưa"}
          title={peeking ? "Hiện trợ lý" : undefined}
          aria-expanded={peeking ? undefined : open}
          onClick={() => {
            if (peeking) {
              setTuck(false);
              setOpen(true);
            } else setOpen((v) => !v);
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          className={cn(
            "companion-mascot pointer-events-auto rounded-full p-1 transition-transform duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-gold)]",
            peeking && "is-tucked",
            offPage && "hidden",
          )}
        >
          <Mascot mood={mood} size={64} accessory={season ? SEASON_ACCESSORY[season] : null} />
        </button>
      </div>
    </>
  );
}
