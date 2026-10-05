# Lược đồ trận đánh và thuyết minh ghim

Frontend: bản đồ → chọn trận đánh → **Chỉnh sửa lược đồ trận đánh** (CONTENT_ADMIN / SYSTEM_ADMIN) mở thẳng trình chỉnh sửa. Trang trận đánh có nút **Chỉnh sửa lược đồ**; người học thấy nút **Khám phá trận đánh**.

URL: `/staff/map?battle=<contextId>` (đang chọn trận) · `&view=detail` (trang trận đánh) · `&view=edit` (chỉnh sửa lược đồ). Tương tự cho `/staff/admin/map` và `/map`.

## Trạng thái triển khai

- Editor hỗ trợ URL ảnh hoặc ảnh PNG/JPG/WebP từ máy (tối đa 2 MB cho bản nháp), 2 chế độ ảnh, phe/quân đoàn, 22 loại ký hiệu (chọn rồi bấm lên bản đồ hoặc kéo thả), chỉnh nhãn, phe, góc xoay, kích thước, nhân bản, xóa và thu phóng. Trang người học có chú giải phe và ký hiệu.
- **Lưu bản nháp** lưu localStorage theo tài khoản và contextId, chỉ admin đó xem được trên trình duyệt đó. Không gọi API xuất bản. Có **Xuất JSON** để giữ/chuyển thiết kế.
- Detail đã đọc `battleMap` từ response historical-contexts. Không dùng `imageUrl` minh họa làm bản đồ thay thế.
- API hiện tại chưa được coi là hỗ trợ lưu `battleMap`. Cần BE triển khai contract bên dưới, rồi FE nối thao tác lưu server và upload media. Không cần sửa tên field của audio.

## Field trên historical context

Giữ `imageUrl` hiện tại cho ảnh minh họa/thumbnail. Thêm field độc lập `battleMap` (nullable) cho GET danh sách, GET chi tiết, POST/PUT historical-contexts.

```json
{
  "battleMap": {
    "version": 1,
    "mode": "custom",
    "imageUrl": "https://example.com/waterloo-blank-map.jpg",
    "imageSource": "Tên nguồn / URL bài viết",
    "factions": [
      { "id": "france", "name": "Quân Pháp", "color": "#1d4ed8" },
      { "id": "britain", "name": "Quân Anh", "color": "#b91c1c" }
    ],
    "symbols": [
      {
        "id": "attack-1", "type": "arrow", "factionId": "france",
        "label": "Hướng tiến quân", "x": 42, "y": 65,
        "size": 15, "rotation": 270
      }
    ]
  }
}
```

| Field | Ý nghĩa |
| --- | --- |
| `version` | Phiên bản schema, hiện tại `1` |
| `mode` | `custom`: ảnh nền + các lớp ký hiệu; `image`: hiển thị ảnh đã có ký hiệu, không render lớp tự vẽ |
| `imageUrl` | URL riêng của ảnh bản đồ. Bản nháp file local dùng data URL; khi nối BE phải upload và thay bằng URL media |
| `imageSource` | Nguồn ảnh/ghi công, chuỗi có thể rỗng |
| `factions` | Danh sách phe/quân đoàn do admin định nghĩa, ID ổn định, tên và màu hex `#RRGGBB` |
| `symbols[].type` | Hướng: `arrow` (tiến công), `flank`, `march`, `retreat`. Lực lượng: `infantry`, `cavalry`, `archer`, `artillery`, `armor`, `navy`, `airforce`. Trận địa: `headquarters`, `fort`, `camp`, `defenseLine`, `stakes`, `ambush`. Diễn biến: `clash`, `victory`, `destroyed`, `step` (số thứ tự lấy từ `label`), `label` |
| `symbols[].factionId` | ID thuộc `factions`; xóa phe phải xử lý các ký hiệu liên quan |
| `symbols[].x`, `y` | Tâm ký hiệu theo % chiều rộng/cao của ảnh gốc, từ 0 đến 100; gốc ở góc trên trái |
| `symbols[].size` | Chiều rộng ký hiệu theo % chiều rộng ảnh gốc, từ 2 đến 60 |
| `symbols[].rotation` | Độ xoay theo chiều kim đồng hồ, 0–360; mũi tên mặc định hướng sang phải |
| `symbols[].label` | Có thể rỗng. `label`: chữ vẽ trên lược đồ. `step`: số trong vòng tròn. Các loại khác: **ghi chú** hiện trong bảng chú giải (gộp theo loại + phe + ghi chú) và khi rê chuột, không vẽ lên lược đồ |

Khi chuyển `mode`, giữ nguyên `factions` và `symbols` để admin có thể trở lại bản custom. Cần lưu nguyên bộ bản đồ trong một lần cập nhật. BE kiểm tra quyền admin khi ghi; các endpoint đọc trả bản được xuất bản theo quyền truy cập bối cảnh.

## Audio

Nguồn duy nhất: **`MapPin.description`**, chính là field **Thông tin khi bấm vào ghim** trong POST `/historical-contexts/{contextId}/map-pins`.

```json
{
  "label": "Trận Waterloo",
  "description": "Nhập văn bản diễn biến trận đánh để đọc thành audio…",
  "latitude": 50.68,
  "longitude": 4.41,
  "pinYear": 1815
}
```

Detail đọc `pin.description` bằng Web Speech API, `vi-VN`. Không fallback sang mô tả bối cảnh và không tự sinh nội dung. Thiếu nội dung hoặc trình duyệt không hỗ trợ thì không cho phát. Chất lượng giọng đọc phụ thuộc giọng được cài trên trình duyệt/hệ điều hành. Bản đồ không lưu thêm bản sao text audio.
