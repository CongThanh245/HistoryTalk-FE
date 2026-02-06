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

## 📁 Cấu trúc chính (tóm tắt)

Root:
- `package.json`, `next.config.ts`, `tsconfig.json` — cấu hình, scripts, TypeScript
- `public/` — tài nguyên tĩnh (hình ảnh, favicon…)

src/
- `app/` ✅ (Next.js App Router)
  - Dùng cấu trúc route của Next.js (mỗi thư mục route có `page.tsx`, `layout.tsx` nếu cần)
  - Thư mục `(auth)`, `(private)`, `(public)`, `(status)` chứa các route/khung phân quyền
- `components/` 🔧
  - `layouts/` — layout chung (ví dụ: `sidebar/`) 
  - `ui/` — các **UI primitives** (Button, Input, Card, Table, v.v.) dùng khắp app
- `configs/` 🔧
  - `axios.client.ts`, `axios.server.ts` — cấu hình axios cho client/server
- `constants/` — các hằng số (theme, roles, permissions…)
- `features/` — nơi đặt các feature module (domain-specific logic)
- `lib/` 🧠
  - `hooks/` — custom React hooks (vd. `use-navigation.ts`)
  - `react-query/` — `query-client.ts`, `query-keys.ts` để cấu hình caching/queries
  - `utils.ts` — helper chung
- `middlewares/` — middleware tuỳ chỉnh nếu có
- `routers/` — helper cho navigation/sidebars
- `services/` — gọi API (vd. `authApi.ts`)
- `shared/` — các giá trị chia sẻ (vd. `query-key.ts`)
- `types/` — định nghĩa TypeScript types/interfaces

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