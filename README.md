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
  └── styles/
    ├── globals.css
    └── theme.css

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

---

## 📡 API & React Query Guide

Project sử dụng **React Query** để gọi API và cache dữ liệu.  
Flow chuẩn:

```
Component / Feature
   ↓
useQuery / useMutation
   ↓
Service (API call)
   ↓
Backend
```

Rule quan trọng:

- `services/` → chỉ gọi API (axios/fetch)
- `react-query/` → quản lý cache và query keys
- `components/` hoặc `features/` → dùng `useQuery` và `useMutation`

---

## 📁 Service Layer — `src/services/`

Service chỉ gọi API, **không dùng React Query**.

Ví dụ:

```ts
// src/services/character.service.ts

import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const characterService = {
  getCharacters: async () => {
    const res = await axios.get(`${API_URL}/characters`);
    return res.data;
  },

  getCharacterById: async (id: string) => {
    const res = await axios.get(`${API_URL}/characters/${id}`);
    return res.data;
  },

  createCharacter: async (data: any) => {
    const res = await axios.post(`${API_URL}/characters`, data);
    return res.data;
  },

  updateCharacter: async (id: string, data: any) => {
    const res = await axios.put(`${API_URL}/characters/${id}`, data);
    return res.data;
  },

  deleteCharacter: async (id: string) => {
    const res = await axios.delete(`${API_URL}/characters/${id}`);
    return res.data;
  },
};
```

Rule:

- Không dùng `useQuery` trong service
- Không dùng `useMutation` trong service

---

## 📁 Query Keys — `src/lib/react-query/query-keys.ts`

Dùng để quản lý cache và invalidate query.

```ts
export const queryKeys = {
  characters: ["characters"],
  character: (id: string) => ["character", id],
};
```

---

## 📁 Query viết ở đâu?

Query (`useQuery`) được viết trong:

```
components/
hoặc
features/
```

Ví dụ:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/lib/react-query/query-keys";

export function CharacterList() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.characters,
    queryFn: characterService.getCharacters,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.map((c: any) => (
        <div key={c.id}>{c.name}</div>
      ))}
    </div>
  );
}
```

---

## 📁 Mutation viết ở đâu?

Mutation (`useMutation`) cũng được viết trong:

```
components/
hoặc
features/
```

**Không viết trong `services/`.**

Ví dụ:

```tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { characterService } from "@/services/character.service";
import { queryKeys } from "@/lib/react-query/query-keys";

export function CreateCharacterButton() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: characterService.createCharacter,

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.characters,
      });
    },
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: "Ngô Quyền",
    });
  };

  return <button onClick={handleCreate}>Create</button>;
}
```

---

## 📁 Flow Mutation

```
Component
   ↓
useMutation()
   ↓
Service
   ↓
API
   ↓
invalidateQueries()
   ↓
Refetch
```

---

## 📁 Khi thêm API mới

### Bước 1 — Tạo service

```
src/services/event.service.ts
```

```ts
export const eventService = {
  getEvents: async () => {},
  createEvent: async () => {},
};
```

---

### Bước 2 — Thêm query key

```
src/lib/react-query/query-keys.ts
```

```ts
events: ["events"];
```

---

### Bước 3 — Query

```ts
useQuery({
  queryKey: queryKeys.events,
  queryFn: eventService.getEvents,
});
```

---

### Bước 4 — Mutation

```ts
useMutation({
  mutationFn: eventService.createEvent,
});
```

---

## 📁 Rule quan trọng

### ✅ Đúng

Service:

```
services/
```

Query:

```
components/
features/
```

Mutation:

```
components/
features/
```

---

### ❌ Sai

```
services/useMutation ❌
services/useQuery ❌
component gọi axios trực tiếp ❌
```

---

## 📁 Ví dụ Structure Chuẩn

```
services/
  character.service.ts

lib/
  react-query/
    query-keys.ts

components/
  CharacterList.tsx
  CreateCharacter.tsx
```

---

---

**Chúc coding vui vẻ!** ✨
