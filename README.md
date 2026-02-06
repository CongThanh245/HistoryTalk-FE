# Core FE — README

✅ **Mục đích:** Đây là frontend app Next.js (React) cho dự án Core. Tài liệu này mô tả **cấu trúc thư mục** và **cách sử dụng từng folder** để giúp bảo trì và phát triển nhanh hơn.

---

## 🚀 Bắt đầu nhanh

- Cài đặt phụ thuộc:

```bash
npm install
```

- Chạy dev:

```bash
npm run dev
```

- Build:

```bash
npm run build
```

- Chạy production:

```bash
npm start
```

- Lint:

```bash
npm run lint
```

> Lưu ý: sử dụng Node tương thích với Next.js 16 và TypeScript.

---

## 📁 Cấu trúc thư mục chi tiết

```
core-app-fe/
├── public/                          # 📦 Tài nguyên tĩnh (hình ảnh, icon, favicon)
├── src/
│   ├── app/                        # 🏠 Next.js App Router (routes & pages)
│   │   ├── globals.css
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── (admin)/
│   │   │   └── layout.tsx          # Admin section layout
│   │   ├── (app)/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── (auth)/
│   │   │   └── layout.tsx          # Auth routes (login, register, etc.)
│   │   └── (marketing)/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   │
│   ├── components/                 # 🧩 React components
│   │   ├── animation/              # Animation components
│   │   ├── commons/                # Shared UI components
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-state.tsx
│   │   │   └── loading-state.tsx
│   │   ├── context/                # React Context providers
│   │   │   ├── auth-context.tsx
│   │   │   ├── query-client-provider.tsx
│   │   │   └── theme-provider.tsx
│   │   ├── layouts/                # Layout components
│   │   │   └── sidebar/
│   │   │       └── sidebar.tsx
│   │   ├── screens/                # Page-level screen components
│   │   │   ├── admin/
│   │   │   ├── app/
│   │   │   └── marketing/
│   │   └── ui/                     # ⭐ UI primitives (reusable components)
│   │       ├── alert-dialog.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── pagination.tsx
│   │       ├── table.tsx
│   │       └── ... (more UI components)
│   │
│   ├── configs/                    # ⚙️ Configuration files
│   │   ├── axios.client.ts         # Axios client config
│   │   ├── axios.server.ts         # Axios server config
│   │   └── route.config.ts
│   │
│   ├── constants/                  # 📋 Hằng số & giá trị cố định
│   │   ├── index.ts
│   │   ├── permissions.ts
│   │   ├── roles.ts
│   │   └── theme.ts
│   │
│   ├── features/                   # 🎯 Feature modules (domain-specific logic)
│   │   └── auth/
│   │       └── api.ts
│   │
│   ├── lib/                        # 📚 Utilities & helpers
│   │   ├── get-query-client.ts
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── use-mobile.ts
│   │   │   ├── use-navigation.ts
│   │   │   └── use-url-sync.ts
│   │   ├── react-query/            # React Query configuration
│   │   │   ├── query-client.ts
│   │   │   └── query-keys.ts
│   │   └── utils/                  # Helper utilities
│   │       ├── cn.ts              # Class name merger
│   │       ├── date.ts
│   │       ├── format.ts
│   │       └── helpers.ts
│   │
│   ├── middlewares/                # 🚦 Custom middlewares
│   │   └── auth.middleware.ts
│   │
│   ├── routers/                    # 🗺️ Router & navigation helpers
│   │   ├── helper.ts
│   │   ├── index.ts
│   │   ├── navigation.ts
│   │   └── sidebar.ts
│   │
│   ├── services/                   # 🔌 API service layer
│   │   ├── character.service.ts
│   │   ├── chat.service.ts
│   │   ├── quiz.service.ts
│   │   └── scenario.service.ts
│   │
│   ├── shared/                     # 🔄 Shared values & types
│   │   └── query-key.ts
│   │
│   ├── store/                      # 📦 State management (Zustand, Redux, etc.)
│   │
│   └── styles/                     # 🎨 Global styles
│       └── theme.css
│
├── components.json                 # shadcn/ui config
├── eslint.config.mjs              # ESLint configuration
├── next.config.ts                 # Next.js configuration
├── package.json                   # Dependencies & scripts
├── postcss.config.mjs             # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # This file
```

---

## 📁 Cấu trúc chính (tóm tắt)

Root:
- `package.json`, `next.config.ts`, `tsconfig.json` — cấu hình, scripts, TypeScript
- `public/` — tài nguyên tĩnh (hình ảnh, favicon…)

src/
- `app/` ✅ (Next.js App Router)
  - Dùng cấu trúc route của Next.js (mỗi thư mục route có `page.tsx`, `layout.tsx` nếu cần)
  - Thư mục `(auth)`, `(app)`, `(admin)`, `(marketing)` chứa các route/khung phân quyền
- `components/` 🧩 
  - `ui/` — **UI primitives** (Button, Input, Card, Table, v.v.) dùng khắp app
  - `layouts/` — layout chung (ví dụ: `sidebar/`) 
  - `context/` — React Context providers (auth, theme, query client)
  - `commons/` — shared components (confirm-dialog, empty-state, error-state, loading-state)
  - `screens/` — page-level screen components (organized by route)
  - `animation/` — animation components
- `configs/` ⚙️
  - `axios.client.ts`, `axios.server.ts` — cấu hình axios cho client/server
- `constants/` 📋 — các hằng số (theme, roles, permissions…)
- `features/` 🎯 — feature modules (domain-specific logic)
- `lib/` 📚
  - `hooks/` — custom React hooks (`use-navigation`, `use-mobile`, `use-url-sync`, etc.)
  - `react-query/` — `query-client.ts`, `query-keys.ts` để cấu hình caching/queries
  - `utils/` — helper chung (date, format, cn, helpers)
- `middlewares/` 🚦 — middleware tuỳ chỉnh
- `routers/` 🗺️ — helper cho navigation/sidebars
- `services/` 🔌 — API service layer (character, chat, quiz, scenario services)
- `shared/` 🔄 — giá trị chia sẻ (vd. `query-key.ts`)
- `store/` 📦 — state management (Zustand, Redux, etc.)
- `styles/` 🎨 — global styles (theme.css, etc.)

---

## 🧭 Hướng dẫn dùng chi tiết cho từng folder

### `src/app/`
- Là **entry point** cho routes (Next App Router). Mỗi thư mục con tương ứng 1 route.
- Để thêm route mới, tạo thư mục mới với `page.tsx` (component trang) và `layout.tsx` (nếu cần layout riêng).
- Các thư mục bắt đầu bằng `(name)` thường dùng cho grouping / nested routing (vd. `(auth)` cho các trang đăng nhập/register).

### `src/components/ui/`
- Chứa các component UI tái sử dụng (Button, Input, Dialog, Table...)
- Khi thêm component mới: tạo file và export từ index nếu cần.

### `src/components/layouts/`
- Chứa layout app (vd. `sidebar`) — sử dụng trong `app/layout.tsx` hoặc route-level `layout.tsx`.

### `src/lib/`
- `hooks/`: custom hooks (ví dụ `use-navigation` để mapping active routes hoặc xử lý navigation)
- `react-query/`: cấu hình query client và key namespace — dùng cho data fetching
- `utils.ts`: helper nhỏ (date, format, validators...)

### `src/services/`
- Đóng gói các call tới API (REST/GraphQL).
- Ví dụ: `authApi.ts` xử lý login/register/token refresh.

### `src/configs/` & `src/constants/`
- `configs` chứa cấu hình cụ thể (axios clients). `constants` chứa giá trị cố định (roles, permissions, theme defaults).

### `src/routers/` & `src/middlewares/`
- `routers/` chứa helper để build sidebar/navigation từ cấu hình route.
- `middlewares/` dùng để xử lý logic chung (auth redirect, permission check) nếu cần.

---

## ✅ Best practices & Tips
- Dùng `src/components/ui` cho primitives, `src/features` cho logic theo domain.
- Giữ `services` tách biệt khỏi UI để test dễ dàng.
- Sử dụng React Query (`src/lib/react-query`) cho data fetching và caching.
- Biến môi trường: thêm `.env.local` (ví dụ `NEXT_PUBLIC_API_URL`) cho URL API — tránh commit secrets.
- Viết tests (Jest / Playwright) nếu cần; hiện tại repo chưa có cấu trúc test.

---

## 🧩 Kịch bản phổ biến
- Thêm trang mới: `src/app/your-route/page.tsx` (+ `layout.tsx` nếu cần)
- Thêm component UI: `src/components/ui/MyComp.tsx` → export và dùng
- Thêm API call: `src/services/newApi.ts` → import vào feature hoặc page

---

## 📌 Liên hệ & Mở rộng
- Muốn mình thêm phần **README bằng tiếng Anh**, **README chi tiết cho từng component**, hoặc **thêm guideline code style / commit messages**, báo mình biết nhé.

---

**Chúc coding vui vẻ!** ✨