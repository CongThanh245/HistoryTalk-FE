# Responsive Design Guide - HistoryTalk Customer Views

This document outlines the responsive design patterns implemented for the Customer role views.

## Breakpoints

We use standard Tailwind CSS breakpoints:

- `sm`: 640px - Large phones
- `md`: 768px - Tablets (primary breakpoint for layout changes)
- `lg`: 1024px - Small laptops
- `xl`: 1280px - Desktops

## Layout Structure

### Page Wrapper Pattern

All Customer pages follow this consistent padding pattern:

```tsx
<div className="px-3 py-6 md:px-6 md:py-8">
  {/* Page content */}
</div>
```

**Files updated:**
- `@/app/(app)/home/page.tsx`
- `@/app/(app)/events/page.tsx`
- `@/app/(app)/characters/page.tsx`
- `@/app/(app)/quiz/page.tsx`
- `@/app/(app)/profile/page.tsx`
- `@/app/(app)/payment/history/page.tsx`

## Component-Specific Responsive Behavior

### 1. Sidebar (Mobile Drawer)

**File:** `@/components/layouts/sidebar/sidebar.tsx`

- **Mobile (< md):** Sidebar becomes a fixed drawer with backdrop
- **Desktop (≥ md):** Sidebar sits in the flex row beside main content
- **Behavior:**
  - Toggle via hamburger button in Header
  - Auto-closes when resizing to desktop
  - Backdrop click closes the drawer

### 2. Chat Page Panels

**Files:**
- `@/components/chat/chat-client.tsx`
- `@/components/chat/chat-left-panel.tsx`
- `@/components/chat/chat-right-panel.tsx`
- `@/components/chat/chat-main.tsx`

**Responsive Behavior:**
- **Mobile (< md):** Both panels hidden by default, toggle buttons visible
- **Tablet/Desktop (≥ md):** Panels visible, can be collapsed
- **Panel Width:** 260px fixed on all screen sizes
- **Breakpoint:** Changed from `lg` (1024px) to `md` (768px) for better tablet support

### 3. Historical Map

**File:** `@/components/historical-map/HistoricalMapModal.tsx`

**Responsive Behavior:**
- **Mobile (< md):** Side panel takes full width when open, map hidden
- **Desktop (≥ md):** Side panel fixed at 360px, map visible alongside
- **Panel Width:** 100% on mobile, 360px on desktop

### 4. Event Timeline

**File:** `@/components/commons/timeline-strip.tsx`

**Responsive Behavior:**
- **Mobile:** Smaller items (64px width), compact height (64px)
- **Desktop:** Larger items (80px width), full height (72px)
- **Navigation buttons:** Smaller on mobile (28px vs 32px)

### 5. Grid Layouts

**Home Page:**
```tsx
// Quiz section
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

// Historical contexts
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

// Recent quiz cards
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
```

**Characters Page:**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

**Quiz Page:**
```tsx
// Main layout
<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">

// Quiz cards
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
```

### 6. Profile Page

**File:** `@/app/(app)/profile/page.tsx`

**Responsive Behavior:**
- **Form grid:** 1 column on mobile, 2 columns on desktop
- **Tab labels:** Hidden on mobile (show only icons), visible on sm+
- **Max width:** 768px (max-w-3xl) centered

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<button className="...">
  <Icon />
  <span className="hidden sm:inline">{label}</span>
</button>
```

## Header Responsive Behavior

**File:** `@/components/layouts/header.tsx`

- **Mobile:**
  - Hamburger menu button (opens sidebar)
  - Search hidden
  - Spacer pushes auth section right
- **Desktop:**
  - Full search input visible
  - No hamburger menu

```tsx
{/* Mobile hamburger — opens sidebar drawer */}
<button className="md:hidden ...">

{/* Search — hidden on mobile, visible on md+ */}
<div className="hidden md:flex ...">
```

## Common Patterns

### Hide on Mobile
```tsx
<div className="hidden md:block">...</div>
<span className="hidden sm:inline">...</span>
```

### Show only on Mobile
```tsx
<div className="md:hidden">...</div>
```

### Responsive Width
```tsx
<div className="w-full md:w-[360px]">...</div>
```

### Responsive Padding
```tsx
<div className="px-3 py-6 md:px-6 md:py-8">...</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
```

### Responsive Text
```tsx
<h1 className="text-2xl md:text-3xl font-bold">...</h1>
```

## Testing Checklist

When implementing new Customer-facing UI, verify:

- [ ] All pages use consistent padding (`px-3 py-6 md:px-6 md:py-8`)
- [ ] Mobile (< 768px) layout works without horizontal scrolling
- [ ] Tablet (768px - 1024px) layout is usable
- [ ] Desktop (> 1024px) layout uses space efficiently
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Text is readable (minimum 14px/0.875rem) on all devices
- [ ] Images scale appropriately without distortion
- [ ] Modal/dialogs work on small screens

## Files Excluded (Admin Views)

The following areas were intentionally NOT modified as per requirements:
- Staff/Admin pages (`@/app/staff/*`)
- Content Admin views
- System Admin dashboard

## Migration Notes

If you're updating existing components:
1. Replace `lg:hidden` with `md:hidden` for mobile-only elements
2. Use `px-3 py-6 md:px-6 md:py-8` for page padding
3. Ensure grid layouts have `min-w-0` on flex children to prevent overflow
4. Test on actual devices or browser dev tools at 375px, 768px, and 1440px
