import { useRef, useState } from 'react';
import { gsap } from 'gsap';

interface UseSlideOverlayOptions {
  duration?: number;
  ease?: string;
  textColorFrom?: string;
  textColorTo?: string;
}

type SlideDirection = 'left' | 'right';

/**
 * Hook tạo hiệu ứng gạt overlay từ trái sang phải hoặc ngược lại
 * Tự động đổi chiều mỗi lần hover nếu hover nhanh (< 2s)
 * 
 * @example
 * const { overlayRef, textRef, handleMouseEnter, handleMouseLeave } = useSlideOverlay();
 * <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
 *   <span ref={overlayRef} className="overlay" />
 *   <span ref={textRef}>Text</span>
 * </div>
 */
export function useSlideOverlay(options: UseSlideOverlayOptions = {}) {
  const {
    duration = 0.8,
    ease = 'power3.inOut',
    textColorFrom = 'var(--accent-gold)',
    textColorTo = 'var(--text-inverse)',
  } = options;

  const overlayRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [lastHoverTime, setLastHoverTime] = useState(0);
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('left');

  const handleMouseEnter = () => {
    if (!overlayRef.current) return;

    const now = Date.now();
    const timeSinceLastHover = now - lastHoverTime;
    
    // Đổi chiều nếu hover nhanh (< 2s)
    const newDirection =
      timeSinceLastHover < 2000 && lastHoverTime > 0
        ? slideDirection === 'left' ? 'right' : 'left'
        : slideDirection;

    setSlideDirection(newDirection);
    setLastHoverTime(now);

    // Đổi màu chữ
    if (textRef.current) {
      gsap.to(textRef.current, {
        color: textColorTo,
        duration,
        ease,
      });
    }

    // Gạt overlay vào
    gsap.fromTo(
      overlayRef.current,
      {
        scaleX: 0,
        transformOrigin: newDirection === 'left' ? 'left' : 'right',
      },
      {
        scaleX: 1,
        duration,
        ease,
      }
    );
  };

  const handleMouseLeave = () => {
    // Đổi màu chữ về ban đầu
    if (textRef.current) {
      gsap.to(textRef.current, {
        color: textColorFrom,
        duration,
        ease,
      });
    }

    // Gạt overlay ra
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        scaleX: 0,
        transformOrigin: slideDirection === 'left' ? 'right' : 'left',
        duration,
        ease,
      });
    }
  };

  return {
    overlayRef,
    textRef,
    slideDirection,
    handleMouseEnter,
    handleMouseLeave,
  };
}