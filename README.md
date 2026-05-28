# Core FE — README

✅ **Mục đích:** Đây là frontend app Next.js (React) cho dự án Core.  
Tài liệu này mô tả **cấu trúc thư mục**, **cách sử dụng từng folder**, và **luồng implement API** để giúp bảo trì và phát triển nhanh hơn.

---

## 🚀 Bắt đầu nhanh

> **⚠️ Lưu ý:** Dùng nhánh `develop` cho tất cả công việc. Không dùng `master`.

### 0. Yêu cầu hệ thống (Cài đặt Bun)
Dự án này sử dụng **Bun** làm trình quản lý gói chính thay thế hoàn toàn cho `npm` hay `yarn`. Hãy đảm bảo bạn đã cài đặt Bun trước khi tiếp tục:

* **Windows (PowerShell):**
  ```powershell
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```
* **macOS / Linux:**
  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```
> *Lưu ý: Sau khi cài đặt xong, bạn hãy khởi động lại terminal/editor mới để nạp lệnh `bun`.*

### 1. Clone và checkout nhánh develop

```bash
git clone <repo-url>
cd core-app-fe
git checkout develop
```

### 2. Cài đặt & setup env

```bash
bun install
copy .env.example .env.local  # Windows
cp .env.example .env.local     # Mac/Linux
# Mở .env.local sửa URL theo backend bạn dùng
```

### 3. Chạy dev

```bash
bun dev
```

### Push code lên develop

```bash
git add .
git commit -m "feat: your feature"
git push origin develop
```

### Build

```bash
bun run build
```

### Chạy production

```bash
bun start
```

### Lint

```bash
bun run lint
```

> Lưu ý: Dự án hiện tại sử dụng **Bun** (phiên bản `>= 1.0`) để quản lý package và chạy ứng dụng Next.js 16 với TypeScript.

---

## ⚙️ Biến môi trường

Tạo file `.env.local` ở root project:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_API_BASE_PATH=/Historical-tell/api/v1
```

- `NEXT_PUBLIC_API_BASE_URL` — địa chỉ backend server
- `NEXT_PUBLIC_API_BASE_PATH` — base path của API (Spring MVC servlet path + `/api/v1`)

---

## 🔌 Luồng implement API — từ A đến Z

> Ví dụ thực tế: implement `GET /historical-contexts` hiển thị danh sách sự kiện lịch sử.

### Tổng quan luồng

```
Backend API
  ↓
services/          → gọi axios, trả về data đã map
  ↓
shared/query-key   → định nghĩa query key tập trung
  ↓
features/hooks     → useQuery / useMutation với React Query
  ↓
components/        → UI gọi hooks, render data
```

---

### Bước 1 — Định nghĩa types và service (`services/`)

Tạo file `services/event.service.ts`. File này chịu trách nhiệm:

- Khai báo interface/type cho request và response
- Gọi axios và map response từ backend về format UI cần dùng

```typescript
// services/event.service.ts
import { axiosClient } from "@/configs/axios.client";

// ── 1. Khai báo types khớp với backend response ──────────

// Backend trả về uppercase -> dùng cho params gửi lên
export type EventEraBackend =
  | "ANCIENT"
  | "MEDIEVAL"
  | "MODERN"
  | "CONTEMPORARY";

// UI dùng lowercase cho filter thời đại
export type EventEra =
  | "all"
  | "ancient"
  | "medieval"
  | "modern"
  | "contemporary";

// Interface cho data UI sẽ dùng
export interface HistoricalEvent {
  id: string; // ← map từ contextId của backend
  title: string; // ← map từ name của backend
  summary: string; // ← map từ description của backend
  year: number;
  yearLabel?: string;
  location?: string;
  imageUrl?: string;
  era?: EventEraBackend;
  period?: string;
  startYear?: number;
  endYear?: number;
  beforeTCN?: boolean;
}

// Interface cho query params gửi lên backend
export interface GetEventsParams {
  search?: string;
  page?: number;
  limit?: number;
  era?: EventEraBackend; // Chỉ gửi khi không phải "all"
}

// Interface cho response (pagination)
export interface GetEventsResponse {
  content: HistoricalEvent[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ── 2. Map function: raw backend → UI type ───────────────
// Đây là nơi xử lý sự khác nhau giữa field name backend và frontend

export function mapContext(raw: any): HistoricalEvent {
  return {
    id: raw.contextId, // rename
    title: raw.name, // rename
    summary: raw.description, // rename
    year: raw.year ?? raw.startYear ?? 0,
    yearLabel: raw.yearLabel,
    location: raw.location,
    imageUrl: raw.imageUrl,
    era: raw.era as EventEraBackend,
    period: raw.period,
    startYear: raw.startYear,
    endYear: raw.endYear,
    beforeTCN: raw.beforeTCN,
  };
}

// ── 3. Service function gọi API ──────────────────────────

export const eventService = {
  // Dùng trong Client Components (hooks)
  getAllClient: async (
    params?: GetEventsParams,
  ): Promise<GetEventsResponse> => {
    const res = await axiosClient.get("/historical-contexts", { params });
    const raw = res.data.data; // unwrap ApiResponse wrapper { success, message, data }
    return {
      ...raw,
      content: raw.content.map(mapContext), // map từng item
    };
  },
};
```

> **Lưu ý quan trọng:**
>
> - File service **chỉ được import `axiosClient`**, không được import `axiosServer`
> - `axiosServer` chỉ dùng trong file riêng `*.server.service.ts` để tránh lỗi `next/headers` trong Client Component
> - Luôn unwrap `res.data.data` vì backend wrap response trong `{ success, message, data, timestamp }`

---

### Bước 2 — Đăng ký query key (`shared/query-key.ts`)

Query key dùng để React Query cache và invalidate đúng data. Tất cả keys đặt tập trung ở một file.

```typescript
// shared/query-key.ts
import type { GetEventsParams } from "@/services/event.service";

export const queryKeys = {
  events: {
    all: ["events"] as const,
    list: (params?: GetEventsParams) =>
      ["events", "list", params ?? {}] as const,
    detail: (id: string) => ["events", "detail", id] as const,
  },
  // Thêm domain mới vào đây...
  characters: {
    all: ["characters"] as const,
    list: (params?: { search?: string; page?: number }) =>
      ["characters", "list", params ?? {}] as const,
    detail: (id: string) => ["characters", "detail", id] as const,
  },
} as const;
```

> **Quy tắc đặt key:** `[domain, action, params]`  
> Ví dụ: `["events", "list", { page: 1, limit: 10 }]`

---

### Bước 3 — Tạo hooks (`features/`)

Hooks là nơi kết hợp service + query key. Component chỉ gọi hook, không gọi service trực tiếp.

```typescript
// features/events/hooks.ts
import { useQuery } from "@tanstack/react-query";
import {
  eventService,
  type GetEventsParams,
  type EventEraBackend,
} from "@/services/event.service";
import { queryKeys } from "@/shared/query-key";

export function useEvents(params?: GetEventsParams) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventService.getAllClient(params),
    placeholderData: (prev) => prev, // giữ data cũ khi đang load data mới (tránh flash)
  });
}
```

---

### Bước 4 — Dùng trong Component

```typescript
// components/event/event-list.tsx
"use client";

import { useEvents } from "@/features/events/hooks";
import type { EventEraBackend } from "@/services/event.service";

export function EventList({ era }: { era?: EventEraBackend }) {
  const { data, isLoading, isError } = useEvents({
    page: 1,
    limit: 20,
    ...(era && { era }), // chỉ gửi era khi có giá trị
  });

  if (isLoading) return <div>Đang tải...</div>;
  if (isError)   return <div>Có lỗi xảy ra</div>;

  return (
    <div>
      {data?.content.map((event) => (
        <div key={event.id}>
          <h3>{event.title}</h3>
          <p>{event.summary}</p>
        </div>
      ))}
    </div>
  );
}
```

---

### Bước 5 (tuỳ chọn) — Prefetch ở Server Component

Dùng khi trang cần SEO hoặc data phải có sẵn trước khi render. Cần file `*.server.service.ts` riêng vì Server Component có thể dùng `next/headers`.

```typescript
// services/event.server.service.ts
import { axiosServer } from "@/configs/axios.server"; // ← chỉ file này mới được dùng axiosServer
import {
  GetEventsParams,
  GetEventsResponse,
  mapContext,
} from "./event.service";

export const eventServerService = {
  getAll: async (params?: GetEventsParams): Promise<GetEventsResponse> => {
    const res = await axiosServer.get("/historical-contexts", { params });
    const raw = res.data.data;
    return { ...raw, content: raw.content.map(mapContext) };
  },
};
```

```typescript
// app/(app)/events/page.tsx — Server Component
import { eventServerService } from "@/services/event.server.service";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/get-query-client";
import { queryKeys } from "@/shared/query-key";
import { EventList } from "@/components/event/event-list";

export default async function EventsPage() {
  const queryClient = getQueryClient();

  // Prefetch data trên server → client không cần load lại
  await queryClient.prefetchQuery({
    queryKey: queryKeys.events.list(),
    queryFn: () => eventServerService.getAll({ page: 1, limit: 20 }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventList />
    </HydrationBoundary>
  );
}
```

---

### Tóm tắt nhanh — Checklist implement API mới

```
☐ 1. Tạo services/[domain].service.ts
       - Khai báo types (request params + response)
       - Viết mapFunction nếu field name khác nhau
       - Export service object với các function gọi axiosClient

☐ 2. Thêm query key vào shared/query-key.ts
       - Theo format [domain, action, params]

☐ 3. Tạo features/[domain]/hooks.ts
       - useQuery cho GET
       - useMutation cho POST/PUT/DELETE

☐ 4. Dùng hook trong component
       - Không gọi service trực tiếp trong component

☐ 5. (Tuỳ chọn) Tạo services/[domain].server.service.ts
       - Nếu cần prefetch ở Server Component
```

---

### Ví dụ thực tế — Params có điều kiện

Khi filter có giá trị "tất cả" thì không gửi param lên backend:

```typescript
// Đúng: chỉ gửi era khi không phải "all"
const params: GetEventsParams = {
  page: 1,
  limit: 100,
  ...(era !== "all" && { era: era.toUpperCase() as EventEraBackend }),
};
```

---

### Lưu ý quan trọng về axios

| File                      | Dùng ở đâu                        | Token                                     |
| ------------------------- | --------------------------------- | ----------------------------------------- |
| `configs/axios.client.ts` | Client Components, hooks          | Tự động gắn Bearer token từ Zustand store |
| `configs/axios.server.ts` | Server Components, server actions | Đọc token từ cookie                       |

**Không bao giờ** import `axiosServer` vào Client Component — sẽ gây lỗi `next/headers`.

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
    ├── app/                         # 🏠 Next.js App Router (routes & pages)
    │   ├── layout.tsx
    │   ├── middleware.ts             # Entry point middleware (chỉ gọi sang middlewares/)
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
    │       └── page.tsx
    │
    ├── components/                  # 🧩 React components
    │   ├── ui/                      # UI primitives (Button, Input, Card...)
    │   ├── animation/
    │   ├── commons/                 # Shared components dùng nhiều nơi
    │   │   ├── confirm-dialog.tsx
    │   │   ├── empty-state.tsx
    │   │   ├── error-state.tsx
    │   │   └── loading-state.tsx
    │   ├── context/                 # React Context providers
    │   │   ├── auth-context.tsx
    │   │   ├── query-client-provider.tsx
    │   │   └── theme-provider.tsx
    │   └── layouts/
    │       └── sidebar/
    │
    ├── configs/                     # ⚙️ Cấu hình axios
    │   ├── axios.client.ts          # Dùng trong Client Components
    │   └── axios.server.ts          # Dùng trong Server Components
    │
    ├── constants/                   # 📋 Hằng số
    │   ├── index.ts
    │   ├── permissions.ts
    │   ├── roles.ts
    │   └── theme.ts
    │
    ├── features/                    # 🎯 Domain logic (hooks React Query)
    │   ├── auth/
    │   │   ├── api.ts
    │   │   ├── hooks.ts
    │   │   └── types.ts
    │   └── events/
    │       └── hooks.ts
    │
    ├── lib/                         # 📚 Utilities & helpers
    │   ├── get-query-client.ts
    │   ├── hooks/
    │   ├── react-query/
    │   └── utils/
    │
    ├── middlewares/                 # 🚦 Middleware logic
    │   └── auth.middleware.ts
    │
    ├── routers/                     # 🗺️ Navigation helpers
    │   ├── sidebar.ts
    │   └── navigation.ts
    │
    ├── services/                    # 🔌 API layer
    │   ├── event.service.ts         # Client-side service
    │   ├── event.server.service.ts  # Server-side service (có axiosServer)
    │   ├── character.service.ts
    │   ├── chat.service.ts
    │   └── quiz.service.ts
    │
    ├── shared/                      # 🔄 Shared values
    │   └── query-key.ts             # Tất cả React Query keys
    │
    ├── store/                       # 📦 State management (Zustand)
    │   └── auth.store.ts
    │
    └── styles/                      # 🎨 Global styles
        ├── globals.css
        └── theme.css
```

---

## ✅ Best Practices

- Dùng `components/ui` cho **UI primitives**
- Dùng `features/` cho **domain logic** (hooks React Query)
- Dùng `services/` cho **API layer** (gọi axios, map data)
- Dùng `shared/query-key.ts` cho **tất cả React Query keys**
- Dùng `store/` cho **global state** (Zustand)
- **Không** gọi service trực tiếp trong component — phải đi qua hook
- **Không** import `axiosServer` vào Client Component

---

## 🧩 Kịch bản phổ biến

### Thêm trang mới

```
src/app/(app)/new-page/page.tsx
```

### Thêm UI component

```
src/components/ui/MyComponent.tsx
```

### Thêm API service mới

```
1. src/services/[domain].service.ts         ← types + axiosClient
2. src/shared/query-key.ts                  ← thêm key mới
3. src/features/[domain]/hooks.ts           ← useQuery/useMutation
4. (tuỳ chọn) src/services/[domain].server.service.ts ← nếu cần prefetch
```

---

✨ **Happy Coding**
