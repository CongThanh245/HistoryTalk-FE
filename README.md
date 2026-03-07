# Core FE — README

✅ **Mục đích:** Đây là frontend app Next.js (React) cho dự án Core.  
Tài liệu này mô tả **cấu trúc thư mục** và **cách sử dụng từng folder** để giúp bảo trì và phát triển nhanh hơn.

---

## 🚀 Bắt đầu nhanh

### Cài đặt phụ thuộc

```bash
npm install
```

### Chạy dev

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Chạy production

```bash
npm start
```

### Lint

```bash
npm run lint
```

> Lưu ý: sử dụng Node tương thích với Next.js 16 và TypeScript.

---

# 📁 Cấu trúc thư mục chi tiết

```
core-app-fe/
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
├── public/                          # 📦 Tài nguyên tĩnh (hình ảnh, icon, favicon)
└── src/
  ├── app/                        # 🏠 Next.js App Router (routes & pages)
  │   ├── layout.tsx
  │   ├── favicon.ico
  │   ├── (admin)/
  │   │   ├── layout.tsx
  │   │   └── dashboard/
  │   ├── (auth)/
  │   │   └── layout.tsx
  │   ├── (app)/
  │   │   ├── layout.tsx
  │   │   └── page.tsx
  │   └── (marketing)/
  │       ├── layout.tsx
  │       ├── page.tsx
  │       ├── about/
  │       │   └── page.tsx
  │       ├── features/
  │       │   └── page.tsx
  │       └── pricing/
  │           └── page.tsx
  │
  ├── components/                 # 🧩 React components
  │   ├── animation/
  │   ├── commons/
  │   │   ├── confirm-dialog.tsx
  │   │   ├── empty-state.tsx
  │   │   ├── error-state.tsx
  │   │   └── loading-state.tsx
  │   ├── context/
  │   │   ├── auth-context.tsx
  │   │   ├── query-client-provider.tsx
  │   │   └── theme-provider.tsx
  │   ├── layouts/
  │   │   └── sidebar/
  │   │       └── sidebar.tsx
  │   ├── marketing/
  │   │   ├── container.tsx
  │   │   ├── navbar.tsx
  │   │   ├── section-heading.tsx
  │   │   └── section/
  │
  ├── constants/
  │   ├── index.ts
  │   ├── permissions.ts
  │   ├── roles.ts
  │   └── theme.ts
  │
  ├── features/
  │   └── auth/
  │       └── api.ts
  │
  ├── lib/
  │   ├── get-query-client.ts
  │   ├── hooks/
  │   │   ├── use-mobile.ts
  │   │   ├── use-navigation.ts
  │   │   └── use-url-sync.ts
  │   ├── react-query/
  │   │   ├── query-client.ts
  │   │   └── query-keys.ts
  │   └── utils/
  │       ├── cn.ts
  │       ├── date.ts
  │       ├── format.ts
  │       └── helpers.ts
  │
  ├── middlewares/
  │   └── auth.middleware.ts
  │
  ├── routers/
  │   ├── helper.ts
  │   ├── index.ts
  │   ├── navigation.ts
  │   └── sidebar.ts
  │
  ├── services/
  │   ├── character.service.ts
  │   ├── chat.service.ts
  │   ├── quiz.service.ts
  │   └── scenario.service.ts
  │
  ├── shared/
  │   └── query-key.ts
  │
  ├── store/
  │
  └── styles/
      ├── globals.css
      └── theme.css
```

---

# 📁 Cấu trúc chính (tóm tắt)

## Root

- `package.json`, `next.config.ts`, `tsconfig.json`  
  → cấu hình project, scripts, TypeScript

- `public/`  
  → tài nguyên tĩnh (images, favicon…)

---

## src/

### `app/` ✅ (Next.js App Router)

- Dùng cấu trúc route của Next.js  
- Mỗi route có thể có:

```
page.tsx
layout.tsx
```

- Các folder:

```
(auth)
(app)
(admin)
(marketing)
```

được dùng để **group routes** hoặc **tách layout theo context**.

---

### `components/` 🧩

- `ui/`  
  UI primitives dùng khắp app (Button, Input, Card, Table…)

- `layouts/`  
  Layout chung như sidebar

- `context/`  
  React Context providers (auth, theme, query client)

- `commons/`  
  Shared components

```
confirm-dialog
empty-state
error-state
loading-state
```

- `screens/`  
  Page-level components (theo route)

- `animation/`  
  Animation components

---

### `configs/` ⚙️

Cấu hình hệ thống:

```
axios.client.ts
axios.server.ts
```

---

### `constants/` 📋

Các giá trị hằng:

```
roles
permissions
theme
```

---

### `features/` 🎯

Logic theo **domain / module**.

Ví dụ:

```
auth/
```

---

### `lib/` 📚

Chứa utilities và core helpers.

```
hooks/
react-query/
utils/
```

Ví dụ:

```
use-navigation
use-mobile
use-url-sync
```

---

### `services/` 🔌

API layer:

```
character.service.ts
chat.service.ts
quiz.service.ts
scenario.service.ts
```

---

### `routers/` 🗺️

Helper cho navigation:

```
sidebar
navigation
```

---

### `middlewares/` 🚦

Middleware logic:

```
auth.middleware.ts
```

---

### `shared/` 🔄

Shared values.

Ví dụ:

```
query-key.ts
```

---

### `store/` 📦

State management.

Có thể dùng:

```
Zustand
Redux
Jotai
```

---

### `styles/` 🎨

Global styles:

```
globals.css
theme.css
```

---

# ✅ Best Practices

- Dùng `components/ui` cho **UI primitives**
- Dùng `features` cho **domain logic**
- Dùng `services` cho **API layer**
- Dùng `react-query` cho **data fetching và caching**

Biến môi trường:

```
.env.local
```

Ví dụ:

```
NEXT_PUBLIC_API_URL=
```

---

# 🧩 Kịch bản phổ biến

### Thêm trang mới

```
src/app/new-page/page.tsx
```

### Thêm UI component

```
src/components/ui/MyComponent.tsx
```

### Thêm API service

```
src/services/new-api.service.ts
```

---

# 📌 Mở rộng

Có thể bổ sung:

- README tiếng Anh
- Coding guidelines
- Commit message convention
- Testing structure (Jest / Playwright)

---

✨ **Happy Coding**