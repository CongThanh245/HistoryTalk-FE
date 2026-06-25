"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  WELCOME_SCREEN_FINISHED_EVENT,
  WELCOME_SCREEN_KEY,
} from "@/constants/welcome-screen";

const WELCOME_DURATION = 2800;
const FADE_DURATION = 500;
const SESSION_COOKIE = `${WELCOME_SCREEN_KEY}=true; path=/; samesite=lax`;

export function WelcomeScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const isSeenInCookie = document.documentElement.dataset.welcomeScreenSeen === "true";
    if (sessionStorage.getItem(WELCOME_SCREEN_KEY) || isSeenInCookie) {
      if (isSeenInCookie && !sessionStorage.getItem(WELCOME_SCREEN_KEY)) {
        sessionStorage.setItem(WELCOME_SCREEN_KEY, "true");
      }
      document.cookie = SESSION_COOKIE;
      document.documentElement.dataset.welcomeScreenSeen = "true";

      requestAnimationFrame(() => {
        setIsVisible(false);
        window.dispatchEvent(new Event(WELCOME_SCREEN_FINISHED_EVENT));
      });
      return;
    }

    sessionStorage.setItem(WELCOME_SCREEN_KEY, "true");
    document.cookie = SESSION_COOKIE;
    document.documentElement.dataset.welcomeScreenSeen = "false";
    document.body.style.overflow = "hidden";

    const startedAt = performance.now();
    let animationFrame = 0;

    const updateProgress = (now: number) => {
      const elapsed = now - startedAt;
      const ratio = Math.min(elapsed / WELCOME_DURATION, 1);
      const easedProgress = 1 - Math.pow(1 - ratio, 3);

      setProgress(Math.min(Math.round(easedProgress * 100), 100));

      if (ratio < 1) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);

    const leaveTimer = window.setTimeout(() => {
      setProgress(100);
      setIsLeaving(true);
    }, WELCOME_DURATION);

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
      document.body.style.overflow = "";
      document.documentElement.dataset.welcomeScreenSeen = "true";
      window.dispatchEvent(new Event(WELCOME_SCREEN_FINISHED_EVENT));
    }, WELCOME_DURATION + FADE_DURATION);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`welcome-screen ${isLeaving ? "welcome-screen--leaving" : ""}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        background: "#070d18",
      }}
      role="status"
      aria-live="polite"
      aria-label={`Đang chuẩn bị trải nghiệm HistoryTalk, ${progress}%`}
    >
      <div className="welcome-screen__glow" aria-hidden="true" />

      <div className="welcome-screen__content">
        <Image
          className="welcome-screen__logo"
          src="/logo-screen.gif"
          alt="HistoryTalk"
          width={420}
          height={420}
          priority
          unoptimized
        />

        <div className="welcome-screen__loading">
          <div className="welcome-screen__heading">
            <span>Đang mở dòng lịch sử</span>
            <span>{progress}%</span>
          </div>

          <div
            className="welcome-screen__track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <div
              className="welcome-screen__progress"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p>Chào mừng bạn đến với HistoryTalk</p>
        </div>
      </div>
    </div>
  );
}
