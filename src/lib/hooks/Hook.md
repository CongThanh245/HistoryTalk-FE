# 🧲 Magnetic Effect & Slide Overlay Hooks

Thư viện hooks tái sử dụng để tạo hiệu ứng nam châm và overlay trượt cho bất kỳ component nào.

## 📦 Cài đặt

```bash
npm install gsap
```

## 🎯 Hooks

### 1. `useMagneticEffect` - Hiệu ứng nam châm

Tạo hiệu ứng kéo element theo con trỏ chuột.

#### Props:
```typescript
{
  strength?: number;     // Độ mạnh của nam châm (0-1), mặc định: 0.12
  duration?: number;     // Thời gian animation (giây), mặc định: 0.4
  ease?: string;         // GSAP easing, mặc định: 'power2.out'
}
```

#### Ví dụ cơ bản:
```tsx
import { useMagneticEffect } from '@/hooks/useMagneticEffect';

function MyComponent() {
  const magnetic = useMagneticEffect<HTMLDivElement>({
    strength: 0.2,
    duration: 0.3,
  });

  return (
    <div
      ref={magnetic.ref}
      onMouseMove={magnetic.handleMouseMove}
      onMouseLeave={magnetic.handleMouseLeave}
    >
      Hover me!
    </div>
  );
}
```

### 2. `useSlideOverlay` - Hiệu ứng overlay trượt

Tạo hiệu ứng overlay gạt từ trái sang phải hoặc ngược lại, tự động đổi chiều.

#### Props:
```typescript
{
  duration?: number;           // Thời gian animation, mặc định: 0.8
  ease?: string;               // GSAP easing, mặc định: 'power3.inOut'
  textColorFrom?: string;      // Màu chữ ban đầu, mặc định: 'var(--accent-gold)'
  textColorTo?: string;        // Màu chữ khi hover, mặc định: 'var(--text-inverse)'
}
```

#### Ví dụ cơ bản:
```tsx
import { useSlideOverlay } from '@/hooks/useSlideOverlay';

function MyButton() {
  const overlay = useSlideOverlay({
    duration: 0.6,
  });

  return (
    <div
      className="relative overflow-hidden"
      onMouseEnter={overlay.handleMouseEnter}
      onMouseLeave={overlay.handleMouseLeave}
    >
      <span
        ref={overlay.overlayRef}
        className="absolute inset-0 bg-[var(--accent-gold)]"
        style={{ transform: "scaleX(0)", transformOrigin: "left" }}
      />
      <span ref={overlay.textRef}>
        Hover me!
      </span>
    </div>
  );
}
```

## 💡 Ví dụ sử dụng

### 1. Button với cả 2 hiệu ứng

```tsx
import { useMagneticEffect } from '@/hooks/useMagneticEffect';
import { useSlideOverlay } from '@/hooks/useSlideOverlay';

function MagneticButton() {
  const magnetic = useMagneticEffect<HTMLButtonElement>({ strength: 0.12 });
  const overlay = useSlideOverlay({ duration: 0.8 });

  return (
    <button
      ref={magnetic.ref}
      className="relative overflow-hidden border-2 border-[var(--accent-gold)] px-6 py-3"
      onMouseEnter={overlay.handleMouseEnter}
      onMouseMove={magnetic.handleMouseMove}
      onMouseLeave={() => {
        magnetic.handleMouseLeave();
        overlay.handleMouseLeave();
      }}
    >
      <span
        ref={overlay.overlayRef}
        className="absolute inset-0 bg-[var(--accent-gold)]"
        style={{ transform: "scaleX(0)", transformOrigin: "left" }}
      />
      <span ref={overlay.textRef} className="relative z-10">
        Click me
      </span>
    </button>
  );
}
```

### 2. Card với chỉ magnetic effect

```tsx
function MagneticCard() {
  const magnetic = useMagneticEffect<HTMLDivElement>({ 
    strength: 0.08,
    duration: 0.5 
  });

  return (
    <div
      ref={magnetic.ref}
      onMouseMove={magnetic.handleMouseMove}
      onMouseLeave={magnetic.handleMouseLeave}
      className="p-6 bg-white rounded-lg shadow-lg cursor-pointer"
    >
      <h3>Card Title</h3>
      <p>Card content...</p>
    </div>
  );
}
```

### 3. Text/Icon đơn giản

```tsx
function MagneticIcon() {
  const magnetic = useMagneticEffect<HTMLDivElement>({ strength: 0.2 });

  return (
    <div
      ref={magnetic.ref}
      onMouseMove={magnetic.handleMouseMove}
      onMouseLeave={magnetic.handleMouseLeave}
      className="text-4xl cursor-pointer"
    >
      🧲
    </div>
  );
}
```

### 4. Grid với nhiều items

```tsx
function MagneticGrid() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map(item => (
        <MagneticGridItem key={item.id} {...item} />
      ))}
    </div>
  );
}

function MagneticGridItem({ title }) {
  const magnetic = useMagneticEffect<HTMLDivElement>({ strength: 0.1 });

  return (
    <div
      ref={magnetic.ref}
      onMouseMove={magnetic.handleMouseMove}
      onMouseLeave={magnetic.handleMouseLeave}
      className="p-4 bg-gray-100 rounded cursor-pointer"
    >
      {title}
    </div>
  );
}
```

## 🎨 Tuỳ chỉnh

### Độ mạnh nam châm (strength)
- `0.05-0.08`: Rất nhẹ, cho card/container lớn
- `0.1-0.15`: Vừa phải, cho button/icon thông thường
- `0.2-0.3`: Mạnh, cho text/element nhỏ cần nổi bật

### Thời gian animation (duration)
- `0.2-0.4s`: Nhanh, responsive
- `0.5-0.8s`: Vừa, mượt mà
- `0.9-1.2s`: Chậm, dramatic

### GSAP Easing
- `power2.out`: Mặc định, tự nhiên
- `power3.inOut`: Mượt mà hơn
- `elastic.out`: Có độ nảy
- `back.out`: Có độ quá đà

## 📝 Notes

- ✅ Hoạt động với mọi HTML element
- ✅ TypeScript support đầy đủ
- ✅ Tối ưu performance với GSAP
- ✅ Không cần dependency ngoài GSAP
- ⚠️ Cần `position: relative` hoặc `absolute` cho overlay
- ⚠️ Cần `overflow: hidden` cho overlay effect

## 🚀 Best Practices

1. **Dùng `strength` phù hợp với kích thước element**
   - Element nhỏ → strength cao
   - Element lớn → strength thấp

2. **Kết hợp cả 2 hooks cho button quan trọng**
   ```tsx
   const magnetic = useMagneticEffect();
   const overlay = useSlideOverlay();
   ```

3. **Chỉ dùng magnetic cho card/container**
   ```tsx
   const magnetic = useMagneticEffect({ strength: 0.08 });
   // Không cần overlay
   ```

4. **Performance: Tránh dùng quá nhiều trên 1 trang**
   - Giới hạn ~20-30 magnetic elements
   - Sử dụng `will-change: transform` cho smooth animation