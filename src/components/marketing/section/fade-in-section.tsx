"use client";

import { useState, useEffect } from "react";

// Wrapper để fade in sections khi load xong - tránh hiện tượng "khựng"
export function FadeInSection({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Defer hiển thị để browser có thời gian paint xong
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`transition-opacity duration-500 ease-out will-change-opacity min-h-[100px] ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
