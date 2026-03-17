"use client";

import { useEffect, useRef } from "react";

const FULL_TEXT =
  "Chào mừng bạn đến với HistoryTalk - Hãy bắt đầu trò chuyện với nhân vật mà bạn thích";
const HIGHLIGHT_TEXT = "HistoryTalk";

export function WelcomeHeading() {
  const textRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let cursorTween: any;
    let timer: ReturnType<typeof setInterval>;

    import("gsap").then((m) => {
      const gsap = m.gsap ?? m.default;
      const el = textRef.current;
      const cursor = cursorRef.current;
      if (!el || !cursor) return;

      const chars = Array.from(FULL_TEXT);
      let i = 0;

      el.innerHTML = "";

      // Cursor blink
      cursorTween = gsap.to(cursor, {
        opacity: 0,
        duration: 0.5,
        ease: "steps(1)",
        repeat: -1,
        yoyo: true,
      });

      timer = setInterval(() => {
        if (i < chars.length) {
          i++;
          const currentString = chars.slice(0, i).join("");

          // Kiểm tra và highlight từ khóa
          if (currentString.includes(HIGHLIGHT_TEXT)) {
            // Chia chuỗi thành 2 phần: trước và sau highlight
            const parts = currentString.split(HIGHLIGHT_TEXT);
            el.innerHTML = `
              ${parts[0]}<span style="color: var(--accent-gold, #c9a24d)">${HIGHLIGHT_TEXT}</span>${parts[1]}
            `;
          } else {
            el.textContent = currentString;
          }
        } else {
          clearInterval(timer);
          setTimeout(() => {
            gsap.to(cursor, {
              opacity: 0,
              duration: 0.4,
              onComplete: () => {
                cursorTween?.kill();
                if (cursor) cursor.style.display = "none";
              },
            });
          }, 1200);
        }
      }, 30);
    });

    return () => {
      clearInterval(timer);
      cursorTween?.kill();
    };
  }, []);

  return (
    <h2
      className="text-lg font-bold uppercase"
      style={{ color: "var(--content-heading)", letterSpacing: "0.06em" }}
    >
      <span ref={textRef} />
      <span
        ref={cursorRef}
        style={{
          display: "inline-block",
          width: "2px",
          height: "1em",
          background: "var(--accent-gold, #c9a24d)",
          marginLeft: "2px",
          verticalAlign: "middle",
          borderRadius: "1px",
        }}
      />
    </h2>
  );
}
