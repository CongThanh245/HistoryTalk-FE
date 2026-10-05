# API cho màn hình Bản đồ trận đánh

Tài liệu này liệt kê **các API và field mà FE đang dùng** ở màn hình bản đồ, để BE đối chiếu và triển khai phần còn thiếu.

- Màn hình: `/map` (người học), `/staff/map` (CONTENT_ADMIN), `/staff/admin/map` (SYSTEM_ADMIN). Cả 3 dùng chung một component.
- URL state: `?battle=<contextId>` (trận đang chọn) · `&view=detail` (trang trận đánh) · `&view=edit` (editor lược đồ, chỉ admin).
- Base URL: `${NEXT_PUBLIC_API_BASE_URL}${NEXT_PUBLIC_API_BASE_PATH ?? "/api/v1"}`; gửi token qua axios client chung.
- Envelope: FE luôn đọc dữ liệu ở `response.data.data`. Khi có lỗi, FE hiển thị toast `response.data.message`.

## Tóm tắt trạng thái

| Phần | Nguồn dữ liệu | BE cần làm |
| --- | --- | --- |
| Danh sách trận đánh (dropdown, marker) | API `GET /historical-contexts` | Đã có. Kiểm tra lại field ở mục 1 |
| Ghim vị trí trận đánh (xem/thêm/xóa) | API `/historical-contexts/{id}/map-pins` | Đã có. Kiểm tra lại field ở mục 2 |
| Nhân vật của trận đánh | API `GET /characters/context/{contextId}` | Đã có |
| Chat với nhân vật | API `/chat/*` (dùng chung với trang chat) | Đã có |
| Thuyết minh audio | `MapPin.description`, đọc bằng Web Speech API của trình duyệt | Không cần API riêng |
| Lược đồ trận đánh (`battleMap`) | API `PUT /historical-contexts/{id}` (BE đã làm, FE đã nối) | Còn thiếu: xóa hẳn lược đồ (mục 5) |
| Upload ảnh lược đồ | API `POST /media/map-image` (BE đã làm, FE đã nối) | Không |
| Ranh giới VN và tỉnh (GeoJSON) | File tĩnh `/data/vietnam-adm0.geojson`, `/data/vietnam-adm1.geojson` của FE | Không cần |
| Nền bản đồ | Tile OpenStreetMap | Không cần |

> Code cũ `landmark.service.ts` (`/landmarks`, dữ liệu mock + Wikidata) **không còn được màn hình map dùng**. BE **không** cần làm `/landmarks`.

---

## 1. Danh sách trận đánh: `GET /historical-contexts`

FE gọi: `GET /historical-contexts?page=1&limit=200`

Response `data`:

```json
{
  "content": [ /* HistoricalContext[] */ ],
  "totalElements": 12,
  "totalPages": 1,
  "currentPage": 1,
  "pageSize": 200,
  "hasNext": false,
  "hasPrevious": false
}
```

Các field của mỗi phần tử mà màn hình map dùng:

| Field BE | Bắt buộc | FE dùng để |
| --- | --- | --- |
| `contextId` (hoặc `id` / `_id`) | Có | Khóa của trận đánh; nằm trong URL `?battle=`. **Phải là UUID**: FE chỉ gọi API nhân vật khi id đúng định dạng UUID |
| `name` | Có | Tên trận trong dropdown, panel, trang chi tiết |
| `description` | Không | Đoạn "Bối cảnh" trong panel bên phải |
| `year` | Có | Năm hiển thị (số âm = TCN) và là tham số `year` khi lấy ghim |
| `startYear` | Không | Dự phòng khi thiếu `year` |
| `location` | Không | Hiển thị cạnh tọa độ và trên trang chi tiết |
| `imageUrl` | Không | Ảnh header của panel. Null thì FE dùng ảnh mặc định |
| `battleMap` | Không | Lược đồ trận đánh, xem mục 5. Hiện BE chưa trả, FE coi như `null` |

FE sắp xếp danh sách theo `year` rồi đến `name`. Người học chỉ thấy các trận **đã có ít nhất 1 ghim**; admin thấy tất cả.

## 2. Ghim vị trí: `/historical-contexts/{contextId}/map-pins`

### 2.1 Lấy ghim

`GET /historical-contexts/{contextId}/map-pins?year={year}`

`year` = `context.year` (hoặc `startYear`). Response `data`: `MapPin[]`

```json
[
  {
    "pinId": "uuid",
    "contextId": "uuid",
    "createdBy": "uid",
    "pinOwnerType": "ADMIN",
    "label": "Trận Bạch Đằng",
    "description": "Văn bản diễn biến, dùng làm thuyết minh audio…",
    "latitude": 20.9431,
    "longitude": 106.8167,
    "pinYear": 938,
    "createdAt": "2026-09-20T10:00:00Z",
    "updatedAt": null
  }
]
```

| Field | FE dùng để |
| --- | --- |
| `pinId` | Chọn ghim, xóa ghim |
| `contextId` | Biết ghim thuộc trận nào khi bấm marker |
| `pinOwnerType` | `"ADMIN"` hoặc `"USER"`. FE ưu tiên ghim `ADMIN` làm vị trí chính; chỉ ghim `ADMIN` mới hiện nút xóa |
| `label` | Tên ghim |
| `description` | Phần "Thuyết minh diễn biến". **Đây là nguồn duy nhất của audio** ở trang chi tiết |
| `latitude`, `longitude` | Vị trí marker |
| `pinYear` | Năm hiển thị trên badge |
| `createdBy`, `createdAt`, `updatedAt` | Hiện FE chưa hiển thị |

**Lưu ý hiệu năng:** màn hình tổng quan gọi API này **một lần cho mỗi trận** (có thể tới 200 request) để vẽ toàn bộ marker. Đề xuất BE làm thêm endpoint gộp (không bắt buộc), ví dụ `GET /map-pins/overview` trả ghim chính của mọi context. Khi có endpoint này, FE sẽ chuyển sang dùng nó.

### 2.2 Tạo ghim (admin)

`POST /historical-contexts/{contextId}/map-pins`

```json
{
  "label": "Trận Bạch Đằng",
  "description": "Có thể bỏ trống",
  "latitude": 20.9431,
  "longitude": 106.8167,
  "pinYear": 938
}
```

- `label`: bắt buộc, tối đa 200 ký tự (FE đang giới hạn).
- `description`: không bắt buộc. FE không gửi field này khi để trống.
- Response `data`: `MapPin` vừa tạo.

### 2.3 Xóa ghim (admin)

`DELETE /historical-contexts/{contextId}/map-pins/{pinId}`

Hiện tại khi **đổi vị trí ghim**, FE gọi DELETE ghim cũ rồi POST ghim mới. Nếu BE làm `PUT /historical-contexts/{contextId}/map-pins/{pinId}`, FE có thể chuyển sang cập nhật một bước (tránh mất ghim nếu POST lỗi).

## 3. Nhân vật của trận đánh: `GET /characters/context/{contextId}`

Response `data`: `Character[]` hoặc `{ "characters": Character[] }` (FE nhận cả hai dạng).

| Field | FE dùng để |
| --- | --- |
| `characterId` (hoặc `id`) | Mở chat với nhân vật |
| `name` | Tên nhân vật |
| `image` (hoặc `imageUrl`) | Avatar. Không có thì FE hiển thị chữ cái đầu |

Panel hiển thị tối đa 5 nhân vật.

## 4. Chat với nhân vật (trang chi tiết trận đánh)

Dùng chung API với trang chat, không thay đổi gì:

| Method | Endpoint | Body / Params |
| --- | --- | --- |
| GET | `/chat/sessions` | `?characterId=&contextId=` |
| POST | `/chat/sessions` | `{ characterId, contextId }` → `data` hoặc `data.session` |
| GET | `/chat/sessions/{sessionId}/messages` | |
| POST | `/chat/messages` | `{ sessionId, content, messageType: "TEXT" }` |

## 5. Lược đồ trận đánh (`battleMap`)

### Hiện trạng (04/10/2026)

- BE đã có `battleMap` (cột `jsonb`, migration V28) và `POST /media/map-image` trên `main`.
- FE: chọn ảnh từ máy thì upload ngay qua `/media/map-image`; nút **Lưu** gọi `PUT /historical-contexts/{id}` với body `{ "battleMap": {...} }`. Người học đọc `battleMap` từ `GET /historical-contexts`.
- Bản nháp cũ trong `localStorage` (nếu có) được mở lại trong editor khi server chưa có lược đồ; lần lưu đầu tiên sẽ upload ảnh base64 rồi xóa bản nháp cũ.
- **Còn thiếu ở BE:** PUT bỏ qua `battleMap: null` nên chưa xóa hẳn được lược đồ. BE cũng chưa kiểm tra `factionId`, khoảng `x`/`y`/`size` và mã màu như FE; dữ liệu sai sẽ khiến FE bỏ cả lược đồ.

### Yêu cầu ban đầu gửi BE (đã làm)

1. **Thêm field `battleMap` (nullable, kiểu JSON object)** vào historical context:
   - Trả về trong `GET /historical-contexts` (danh sách) và `GET /historical-contexts/{id}`.
   - Nhận trong `POST /historical-contexts` và `PUT /historical-contexts/{id}`. FE đã có sẵn code gửi `battleMap` trong `eventService.update`, chỉ cần nối với nút Lưu.
   - Lưu nguyên object trong một lần cập nhật (không merge từng symbol).
   - Chỉ CONTENT_ADMIN / SYSTEM_ADMIN được ghi.
2. **Endpoint upload ảnh lược đồ** trả về URL hiển thị được, ví dụ:
   `POST /media/upload` (multipart, field `file`, PNG/JPG/WebP, ≤ 2 MB) → `{ "data": { "url": "https://…" } }`.
   Nếu BE đã có endpoint upload dùng cho `imageUrl` của context hoặc avatar nhân vật, báo lại tên endpoint để FE dùng lại.

### Schema `battleMap` (version 1)

```json
{
  "version": 1,
  "mode": "custom",
  "imageUrl": "https://cdn.example.com/bach-dang-blank.jpg",
  "imageSource": "Bảo tàng Lịch sử Quốc gia",
  "factions": [
    { "id": "dai-viet", "name": "Quân Đại Việt", "color": "#b91c1c" },
    { "id": "nam-han", "name": "Quân Nam Hán", "color": "#1d4ed8" }
  ],
  "symbols": [
    {
      "id": "s1",
      "type": "arrow",
      "factionId": "dai-viet",
      "label": "Hướng phản công",
      "x": 42,
      "y": 65,
      "size": 15,
      "rotation": 270
    }
  ]
}
```

Các ràng buộc FE đang kiểm tra (`isBattleMap`). BE nên validate tương tự khi ghi:

| Field | Kiểu / ràng buộc |
| --- | --- |
| `version` | Luôn là `1` |
| `mode` | `"custom"` (ảnh nền + lớp ký hiệu) hoặc `"image"` (ảnh đã có sẵn ký hiệu, không vẽ lớp ký hiệu) |
| `imageUrl` | string, URL ảnh lược đồ (khác `imageUrl` thumbnail của context) |
| `imageSource` | string, có thể rỗng, tối đa 500 ký tự |
| `factions[]` | `{ id: string, name: string, color: "#RRGGBB" }` |
| `symbols[].id` | string |
| `symbols[].type` | Một trong: `arrow`, `flank`, `march`, `retreat`, `infantry`, `cavalry`, `archer`, `artillery`, `armor`, `navy`, `airforce`, `headquarters`, `fort`, `camp`, `defenseLine`, `stakes`, `ambush`, `clash`, `victory`, `destroyed`, `step`, `label` |
| `symbols[].factionId` | Phải trùng `id` của một phần tử trong `factions` |
| `symbols[].label` | string, có thể rỗng |
| `symbols[].x`, `y` | number 0–100 (% chiều rộng/cao ảnh, gốc ở góc trên trái) |
| `symbols[].size` | number 2–60 (% chiều rộng ảnh) |
| `symbols[].rotation` | number, độ xoay theo chiều kim đồng hồ |

Khi đổi `mode`, FE vẫn giữ `factions` và `symbols`, nên BE lưu nguyên.

Chi tiết thêm về ý nghĩa từng ký hiệu: [battle-map-api-contract.md](./battle-map-api-contract.md).

---

## Checklist cho BE

- [ ] `GET /historical-contexts` trả đủ `contextId` (UUID), `name`, `description`, `year`, `location`, `imageUrl`.
- [ ] Map-pin trả đủ field ở mục 2.1, đặc biệt là `pinOwnerType` và `description`.
- [ ] Thêm `battleMap` (JSON, nullable) vào GET/POST/PUT historical-contexts, có validate và phân quyền admin.
- [ ] Endpoint upload ảnh lược đồ, trả URL.
- [ ] `PUT` map-pin: **cần cho việc sửa thuyết minh**. Đặc tả: [map-pin-update-api.md](./map-pin-update-api.md).
- [ ] (Tùy chọn) Endpoint gộp ghim cho màn hình tổng quan để tránh N request.
