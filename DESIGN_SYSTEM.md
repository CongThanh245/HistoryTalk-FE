# HistoryTalk — Design System

> Tài liệu này là **nguồn duy nhất** về design tokens, component patterns và nguyên tắc UI của HistoryTalk.  
> Dùng làm **system prompt** khi build mobile app (React Native / Flutter) để đảm bảo nhất quán hoàn toàn với Web.

---

## Mục lục

1. [Tinh thần thiết kế](#1-tinh-thần-thiết-kế)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Radius](#4-spacing--radius)
5. [Shadows & Borders](#5-shadows--borders)
6. [Component Patterns](#6-component-patterns)
7. [Animation & Motion](#7-animation--motion)
8. [Icon Library](#8-icon-library)
9. [Hướng dẫn dùng prompt cho mobile](#9-hướng-dẫn-dùng-prompt-cho-mobile)

---

## 1. Tinh thần thiết kế

**Cinematic · Premium · Historical**

HistoryTalk không phải app học lịch sử thông thường. Mọi thành phần UI cần truyền tải cảm giác:

- **Bảo tàng cao cấp** — trang trọng, không rối mắt, có chiều sâu
- **Điện ảnh** — có ánh sáng, bóng tối, chuyển động mượt
- **Ấm áp & lịch sử** — tông màu đất nung, vàng cổ, không dùng màu sặc sỡ hiện đại
- **Dual theme**: Light (mặc định) = nền kem ấm + đỏ rượu; Dark = nền xanh navy đậm + vàng cam

> ❌ Tránh: Màu xanh lá thuần túy, màu đỏ tươi, gradient lòe loẹt, corner radius quá lớn (>24px), nền trắng thuần.  
> ✅ Nên dùng: Tông nâu ấm, vàng cổ (#c9a24d), đỏ rượu (#72383D), navy (#0e1a2b).

---

## 2. Color System

### 2.1 Backgrounds (Light Theme — Mặc định)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `--bg-main` | `#EFE9E1` | Nền trang chính |
| `--bg-deep` | `#D1C7BD` | Sidebar, nền sâu hơn |
| `--bg-surface` | `#F7F1EA` | Card, panel, bottom sheet |
| `--bg-elevated` | `#FBF7F2` | Modal, dropdown, hover surface |

### 2.2 Backgrounds (Dark Theme)

| Token | Hex | Dùng cho |
|-------|-----|----------|
| `--bg-main` | `#0e1a2b` | Nền trang chính |
| `--bg-deep` | `#070d18` | Nền sidebar, nền rất sâu |
| `--bg-surface` | `#1a2436` | Card, panel |
| `--bg-elevated` | `#24314a` | Modal, dropdown |

### 2.3 Text Colors

| Token | Light | Dark | Dùng cho |
|-------|-------|------|----------|
| `--text-primary` | `#322D29` | `#f7f1e8` | Text chính |
| `--text-secondary` | `#5F554E` | `#dfdab5` | Text phụ, subtitle |
| `--text-tertiary` | `#72383D` | `#EA7A0A` | Highlight nhẹ |
| `--text-muted` | `#8B7D72` | `#8da0ab` | Placeholder, hint |
| `--text-inverse` | `#EFE9E1` | `#0e1a2b` | Text trên nền nhấn |
| `--text-on-dark` | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.85)` | Text trắng trên sidebar tối |

### 2.4 Brand / Accent Colors

| Token | Light | Dark | Ý nghĩa |
|-------|-------|------|---------|
| `--accent-gold` | `#72383D` | `#EA7A0A` | **Màu nhấn chính** — active, CTA, icon chính |
| `--accent-gold-soft` | `#8D4A50` | `#e2c77a` | Nhấn phụ, badge, hover text |
| `--accent-gold-active-bg` | `rgba(114,56,61,0.18)` | `rgba(234,122,10,0.16)` | Nền item đang active |
| `--accent-gold-glow` | `rgba(114,56,61,0.28)` | `rgba(234,122,10,0.26)` | Box-shadow glow của accent |
| `--accent-blue` | `#322D29` | `#8fb3c8` | AI, tri thức, khám phá |
| `--accent-bronze` | `#72383D` | `#c46a2f` | Cổ vật, kim loại |
| `--accent-danger` | `#9A3F43` | `#b8322a` | Warning, error |
| `--burning-flame` | `#72383D` | `#FAB95B` | Badge nổi bật, streak |
| `--gold-on-light` | `#72383D` | `#ffb95c` | Màu vàng hiển thị rõ trên nền sáng |

### 2.5 Header & Sidebar Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--header-bg` | `#F7F1EA` | `#0e1a2b` |
| `--header-border` | `rgba(50,45,41,0.14)` | `rgba(231,221,200,0.12)` |
| `--header-text` | `#322D29` | `#f0e8d5` |
| `--sidebar-nav-text` | `#322D29` | `rgba(255,255,255,0.75)` |
| `--sidebar-active-text` | `#72383D` | `#e2c77a` |
| `--sidebar-hover-bg` | `rgba(114,56,61,0.12)` | `rgba(255,255,255,0.05)` |

### 2.6 Card Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--card-light-bg` | `#F7F1EA` | `#1a2436` |
| `--card-light-border` | `rgba(50,45,41,0.16)` | `rgba(231,221,200,0.12)` |
| `--card-light-hover` | `rgba(114,56,61,0.1)` | `rgba(255,146,21,0.08)` |

### 2.7 Era Filter Tokens

| Token | Light | Dark |
|-------|-------|------|
| `--era-filter-active-bg` | `#72383D` | `#EA7A0A` |
| `--era-filter-active-text` | `#EFE9E1` | `#0e1a2b` |
| `--era-filter-bg` | `#EFE9E1` | `rgba(255,255,255,0.06)` |
| `--era-filter-text` | `#322D29` | `rgba(255,255,255,0.78)` |
| `--era-filter-border` | `rgba(50,45,41,0.22)` | `rgba(231,221,200,0.12)` |
| `--era-filter-count-bg` | `rgba(114,56,61,0.12)` | `rgba(255,146,21,0.14)` |
| `--era-filter-count-text` | `#72383D` | `#e2c77a` |

### 2.8 Màu Raw (dùng trực tiếp khi cần)

```
Gold chính (dark):     #EA7A0A  / #c9a24d
Gold mềm (dark):       #e2c77a
Gold rượu (light):     #72383D  / #8D4A50
Navy chính:            #0e1a2b
Bronze:                #c46a2f
Blue AI:               #8fb3c8
```

---

## 3. Typography

### 3.1 Font Families

| Vai trò | Font Name | Dùng khi |
|---------|-----------|----------|
| **Body / UI** | `VL Outfit` | Mọi text thông thường (tên, mô tả, button, label) |
| **Display / Branding** | `VL ZOLINA` | Tiêu đề hero, brand logo, section heading lớn. Luôn **UPPERCASE** |

> 📱 **Mobile**: Nếu không embed được font, dùng **Outfit** (Google Fonts) cho body và **serif bold** uppercase cho title.  
> VL ZOLINA là font display-only, không dùng cho text nhỏ dưới 18px.

### 3.2 Typography Scale

| Token | Size | Dùng cho |
|-------|------|----------|
| `--text-hero` | `3rem` / 48px | H1 hero page (landing) |
| `--text-section` | `3.5rem` / 56px | Section heading lớn |
| `--text-title` | `2rem` / 32px | Card/block title |
| `--text-subtitle` | `1.5rem` / 24px | Subtitle, page subtitle |
| `--text-lead` | `1.25rem` / 20px | Lead paragraph |
| `--text-body` | `1rem` / 16px | Body text chính |
| `--text-small` | `0.875rem` / 14px | Text phụ, caption |
| `--text-xs` | `0.75rem` / 12px | Eyebrow text, label nhỏ |
| `--text-micro` | `0.625rem` / 10px | Badge, tag nhỏ nhất |

### 3.3 Font Weight

| Weight | Dùng cho |
|--------|----------|
| 400 | Body text, mô tả |
| 600 | Subtitle, nav item, label |
| 700 | Button, tiêu đề card |
| 800 | H1, H2, badge, heading chính |
| 900 | Display / branding (VL ZOLINA) |

### 3.4 Line Height

- **Heading**: `1.15 – 1.25`
- **Body**: `1.5 – 1.6`
- **Caption/badge**: `1`

---

## 4. Spacing & Radius

### 4.1 Spacing Scale (dùng bội số 4px)

| Name | Value | Dùng cho |
|------|-------|----------|
| `xs` | 4px | Gap icon-text |
| `sm` | 8px | Padding badge, gap nhỏ |
| `md` | 12px | Padding card content |
| `lg` | 16px | Padding section |
| `xl` | 24px | Gap section |
| `2xl` | 32px | Padding modal |
| `3xl` | 48px | Section vertical spacing |

### 4.2 Border Radius

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--radius-sm` | `6px` | Badge, tag, input |
| `--radius-md` | `10px` | Button, chip |
| `--radius-lg` | `16px` | Card, panel, sheet |
| `999px` | `999px` | Pill / full rounded (avatar, toggle) |

---

## 5. Shadows & Borders

### 5.1 Shadows

| Token | Value | Dùng cho |
|-------|-------|----------|
| `--shadow-soft` (light) | `0 12px 28px rgba(50,45,41,0.12)` | Card hover |
| `--shadow-strong` (light) | `0 22px 60px rgba(50,45,41,0.22)` | Modal, dropdown |
| `--shadow-gold` (light) | `0 0 18px rgba(114,56,61,0.22)` | Active card, selected item |
| `--shadow-soft` (dark) | `0 8px 30px rgba(0,0,0,0.35)` | Card hover |
| `--shadow-strong` (dark) | `0 20px 60px rgba(0,0,0,0.6)` | Modal, dropdown |
| `--shadow-gold` (dark) | `0 0 18px rgba(255,146,21,0.26)` | Active card |

### 5.2 Borders

| Token | Value |
|-------|-------|
| `--border-default` (light) | `rgba(50,45,41,0.14)` |
| `--border-strong` (light) | `rgba(114,56,61,0.32)` |
| `--border-default` (dark) | `rgba(231,221,200,0.12)` |
| `--border-strong` (dark) | `rgba(231,221,200,0.24)` |

> **Quy tắc border**: Luôn dùng `border-default` cho card/input ở trạng thái rest. Dùng `border-strong` hoặc `accent-gold` khi focused/active.

---

## 6. Component Patterns

### 6.1 Character Card

**Có 3 variants:**

#### A. Carousel Card (nền tối — Dark Card)
- Background: `var(--bg-surface)` với viền `var(--border-default)`
- Image chiếm `65%` chiều cao card
- Gradient phủ ảnh: `linear-gradient(to top, var(--bg-surface) 0%, transparent 50%)`
- Badge era: nền `rgba(14,26,43,0.8)` + viền `border-default`, text `var(--accent-gold)` uppercase
- Hover: `inset box-shadow = 1.5px var(--accent-gold)` + `var(--shadow-gold)`
- Hover text: "Chat ngay" fade-in + translate
- Hover overlay: mô tả với typewriter effect

#### B. Page Card (nền sáng — trang /characters)
- Kích thước: `250px` mobile / `300px` sm / `320px` md
- Image chiếm `62%` chiều cao, nền đen, có blur overlay
- Content area: nền `black` text `white`
- Hover (desktop): overlay `bg-black/92` + typewriter text + CTA button

#### C. Compact Card (sidebar / chat panel)
- Layout ngang: avatar 32px (rounded-lg) + tên + title
- Background `var(--card-light-bg)`, border `var(--card-light-border)`
- Hover: border chuyển thành `var(--accent-gold)`
- Icon chat xuất hiện khi hover

### 6.2 Button Variants

| Variant | Style |
|---------|-------|
| `default` | `bg-primary` (accent-gold) + text bg-main |
| `outline` | Border + transparent bg, hover bg-accent |
| `ghost` | Không border, hover bg-accent nhẹ |
| `magnetic` | Border 2px accent-gold, transparent bg |
| `secondary` | bg-elevated, text-primary |
| `destructive` | bg-danger |

**Sizes:**
- `sm`: height 32px, padding x 12px
- `default`: height 36px, padding x 16px
- `lg`: height 40px, padding x 24px
- `icon`: 36×36px (square)

**Transitions**: `duration-300` cho màu, `duration-150` cho transform (scale 0.98 active).

### 6.3 Card (Generic)

```
Background:    var(--card-light-bg)
Border:        var(--card-light-border)  
Border-radius: var(--radius-lg)          ← 16px
Hover:         translateY(-2px) + shadow-soft
Image gradient: linear-gradient(to top, card-bg → transparent)
```

**DarkCard** (dùng trong carousel/dark context):
```
Background:   var(--bg-surface)
Border:       var(--border-default)
Hover border: inset 1.5px var(--accent-gold) + shadow-gold
```

### 6.4 Header / Navbar

- Background: `var(--header-bg)` — tách biệt với nền trang
- Chiều cao: `56px` mobile / `64px` desktop
- Border bottom: `var(--header-border)` — 1px
- Logo: dùng `logo-light-theme.png` (light) / `logo-dark-theme.png` (dark)
- Text: `var(--header-text)`
- Icons: `var(--header-text-muted)` khi inactive

### 6.5 Sidebar / Bottom Navigation

- Background: gradient `linear-gradient(180deg, rgba(accent,0.1), transparent 18rem), var(--bg-deep)` (light) hoặc `var(--abyssal-blue)` (dark)
- Nav item rest: `var(--sidebar-nav-text)`
- Nav item active: text `var(--sidebar-active-text)`, bg `var(--accent-gold-active-bg)`, icon glow
- Section label: `var(--sidebar-section-label)` uppercase 10px tracking-wider
- Hover: bg `var(--sidebar-hover-bg)` transition 150ms

### 6.6 Badge / Tag

```css
Era badge (trên card):
  background: rgba(14,26,43,0.8) hoặc rgba(accent-gold, 0.15)
  color: var(--accent-gold)
  font-size: 8–10px
  font-weight: 700
  text-transform: UPPERCASE
  border-radius: 6px hoặc 999px (pill)

Score badge (quiz):
  background: {color}18   ← màu với alpha 0.1
  color: {color}           ← green/gold/red tuỳ điểm
  font-size: 11–12px
  border-radius: 999px
```

### 6.7 Input / Search

```
Background:   var(--header-input-bg)
Border:       var(--border-default)
Border-radius: var(--radius-sm)   ← 6px
Focus border: var(--accent-gold)
Placeholder:  var(--text-muted)
```

### 6.8 Loading States

**Skeleton**: `animate-pulse`, background `var(--card-light-border)`, border-radius match với element gốc.

**Spinner**: SVG 4 ring animation — màu sử dụng:
- Ring ngoài: `#c9a24d` (gold)
- Ring nhỏ: `#8fb3c8` (blue AI)
- Ring trái: `#c46a2f` (bronze)
- Ring phải: `#e2c77a` (gold soft)

### 6.9 Era Filter (Chips)

```
Rest:   bg=var(--era-filter-bg), text=var(--era-filter-text), border=var(--era-filter-border)
Active: bg=var(--era-filter-active-bg), text=var(--era-filter-active-text)
Count:  bg=var(--era-filter-count-bg), text=var(--era-filter-count-text)
border-radius: 999px (pill)
```

### 6.10 Home Banner

```
Background:  var(--home-banner-bg)  ← gradient warm
Border:      var(--home-banner-border)
Title:       var(--home-banner-title), font-extrabold
Text:        var(--home-banner-text)
CTA Button:  var(--home-banner-button-bg) → hover var(--home-banner-button-hover-bg)
```

---

## 7. Animation & Motion

### 7.1 Transition Defaults

| Loại | Duration | Easing |
|------|----------|--------|
| Màu sắc, opacity | `150–200ms` | `ease` |
| Transform (hover) | `200–300ms` | `ease` |
| Modal in/out | `280–320ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Scroll-driven | — | `scrub: true` (GSAP) |
| Hero reveal | `750–900ms` | `power3.out` |

### 7.2 Hover Micro-animations

- **Card hover**: `translateY(-1px)` + shadow tăng
- **Button active**: `scale(0.98)` 
- **Nav item**: bg fade `150ms`
- **Icon**: opacity 0→1, translate 0
- **Character card hover overlay**: opacity 0→1 `300ms`

### 7.3 Background Ambient Effects

**Ambient Beam** (landing page):
```css
animation: landingBeamDrift 8s ease-in-out infinite;
/* Beam nghiêng 100deg, màu cam/vàng/xanh mờ */
```

**Radial Glow** (nhiều component):
```css
radial-gradient(circle at X% Y%, rgba(accent, 0.08–0.15), transparent)
```

### 7.4 Typewriter Effect

Dùng cho character description khi hover:
- `speed = 8ms` per ký tự
- Reset khi `isHovered = false` (delay 0ms)

---

## 8. Icon Library

**Thư viện chính**: `@phosphor-icons/react` (web) → `phosphor-react-native` (mobile)

**Weight mặc định**: `regular` cho UI icons, `fill` / `bold` cho CTA và emphasis.

**Kích thước thường dùng**:
- Nav icon: `20–24px`
- Card icon: `16–20px`
- Button icon: `16px`
- Badge icon: `12–14px`

**Màu icon**:
- Active: `var(--accent-gold)`
- Inactive: `var(--sidebar-nav-icon)` / muted
- Trên nền tối: `rgba(255,255,255,0.45–0.75)`

---

## 9. Hướng dẫn dùng prompt cho mobile

### 9.1 System Prompt Template (copy & paste)

Dùng đoạn sau làm **system prompt** khi chat với AI để build mobile:

---

```
Bạn đang build mobile app cho HistoryTalk — nền tảng học lịch sử qua AI.

## Tinh thần thiết kế
- Cinematic, Premium, Historical — tông màu đất nung, vàng cổ, không màu sặc sỡ
- Dual theme: Light (nền kem #EFE9E1 + đỏ rượu #72383D) | Dark (navy #0e1a2b + vàng cam #EA7A0A)

## Màu sắc cốt lõi
Accent chính:   #72383D (light) / #EA7A0A (dark)
Accent mềm:     #8D4A50 (light) / #e2c77a (dark)
Nền chính:      #EFE9E1 (light) / #0e1a2b (dark)
Card/Surface:   #F7F1EA (light) / #1a2436 (dark)
Text chính:     #322D29 (light) / #f7f1e8 (dark)
Text phụ:       #5F554E (light) / #dfdab5 (dark)
Border:         rgba(50,45,41,0.14) (light) / rgba(231,221,200,0.12) (dark)

## Typography
Font body:    VL Outfit (hoặc Outfit Google Fonts)
Font display: VL ZOLINA (uppercase only) — hoặc bold serif uppercase
Scale: micro=10px, xs=12px, small=14px, body=16px, lead=20px, subtitle=24px, title=32px

## Border Radius
Card/Panel:  16px
Button:      10px
Badge/Input: 6px
Pill:        999px

## Shadows (dark theme)
Card hover:  0 8px 30px rgba(0,0,0,0.35)
Modal:       0 20px 60px rgba(0,0,0,0.6)
Accent glow: 0 0 18px rgba(255,146,21,0.26)

## Component rules
- Card: bg=#1a2436, border=rgba(231,221,200,0.12), active border=1.5px #EA7A0A
- Badge era: uppercase, 8-10px, font-weight 700, color=accent, bg=rgba(accent,0.15)
- Button CTA: gradient accent-gold, rounded 10px, height 44-52px, font-weight 800
- Nav active: text=accent-gold, bg=rgba(accent,0.16), có dot indicator
- Input focus: border=accent-gold
- Skeleton: animate-pulse, bg=border-color

## Animations
- Transition: 150-300ms ease
- Hover card: translateY(-2px) + shadow
- Press button: scale(0.97)
- Modal enter: scale(0.92→1) + opacity 280ms cubic-bezier(0.16,1,0.3,1)
- Page transition: fade + slide 200ms

## Icon library
Phosphor Icons (phosphor-react-native) — weight: regular UI, fill CTA
Màu active: accent-gold, inactive: rgba(255,255,255,0.45)
```

---

### 9.2 Mapping Token → React Native / Flutter

| Web CSS Token | React Native | Flutter |
|---------------|--------------|---------|
| `var(--bg-main)` | `colors.bgMain` | `AppColors.bgMain` |
| `var(--accent-gold)` | `colors.accentGold` | `AppColors.accentGold` |
| `var(--text-primary)` | `colors.textPrimary` | `AppColors.textPrimary` |
| `var(--radius-lg)` | `borderRadius: 16` | `BorderRadius.circular(16)` |
| `var(--shadow-soft)` | `elevation: 4` / shadow props | `BoxShadow(...)` |
| `animate-pulse` | Animated.loop + opacity | `AnimationController` loop |

### 9.3 Breakpoints (nếu dùng responsive mobile)

| Breakpoint | px | Notes |
|------------|-----|-------|
| `sm` | ≥ 640px | Tablet nhỏ |
| `md` | ≥ 768px | Tablet |
| `lg` | ≥ 1024px | Desktop |

> Mobile app mặc định target `< 640px`. Tuy nhiên nếu có iPad layout thì dùng `md+`.

### 9.4 Checklist nhất quán Web ↔ Mobile

Trước khi submit PR mobile, kiểm tra:

- [ ] Đúng accent color (đỏ rượu/vàng cam, không phải màu ngẫu nhiên)
- [ ] Font body là Outfit/VL Outfit, display là uppercase serif
- [ ] Card radius 16px, badge radius 6px
- [ ] Era badge luôn UPPERCASE + accent color
- [ ] Skeleton loading dùng animate-pulse với bg = border-color
- [ ] Button CTA có height ≥ 44px (touch target iOS standard)
- [ ] Icon từ Phosphor, kích thước 16–24px
- [ ] Nav active item có accent color + bg tint
- [ ] Transition không quá 300ms
- [ ] Dark mode dùng đúng set token dark

---

## Phụ lục: Toast / Notification Colors

| Type | Icon color | Border |
|------|------------|--------|
| Success | `#5dcc78` (dark) / `#4A8C62` (light) | alpha 0.7 |
| Error | `#f07070` (dark) / `#9A3F43` (light) | alpha 0.7 |
| Warning | `#ffc070` (dark) / `#B88C3C` (light) | alpha 0.7 |
| Info | `#a8ccde` (dark) / `#72383D` (light) | alpha 0.65 |
| Default | `#e2c77a` (dark) / `#72383D` (light) | accent-gold |

---

*Cập nhật lần cuối: 2026-06-25. Mọi thay đổi design token cần cập nhật file này đồng thời.*
