import { useRef } from 'react';
import { gsap } from 'gsap';

interface UseMagneticEffectOptions {
  strength?: number;
  duration?: number;
  ease?: string;
}

/**
 * Hook tạo hiệu ứng nam châm - kéo element theo con trỏ chuột
 * 
 * @example
 * const { ref, handleMouseMove, handleMouseLeave } = useMagneticEffect({ strength: 0.3 });
 * <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>Content</div>
 */
export function useMagneticEffect<T extends HTMLElement>(
  options: UseMagneticEffectOptions = {}
) {
  const {
    strength = 0.12,
    duration = 0.4,
    ease = 'power2.out',
  } = options;

  const elementRef = useRef<T>(null);

  const handleMouseMove = (e: React.MouseEvent<T>) => {
    if (!elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;

    gsap.to(elementRef.current, {
      x: deltaX,
      y: deltaY,
      duration,
      ease,
    });
  };

  const handleMouseLeave = () => {
    if (!elementRef.current) return;

    gsap.to(elementRef.current, {
      x: 0,
      y: 0,
      duration: duration * 1.5,
      ease: 'power3.out',
    });
  };

  return {
    ref: elementRef,
    handleMouseMove,
    handleMouseLeave,
  };
}