# API sửa ghim bản đồ: `PUT /historical-contexts/{contextId}/map-pins/{pinId}`

## Vì sao cần

Thuyết minh audio của trận đánh là `MapPin.description`. Hiện BE chỉ có GET, POST và DELETE cho ghim, nên muốn sửa thuyết minh (hoặc tên, vị trí) thì FE phải **xóa ghim cũ rồi tạo ghim mới**. Cách này có 2 vấn đề:

- Nếu POST lỗi sau khi DELETE đã chạy, trận đánh **mất ghim**.
- `pinId` đổi sau mỗi lần sửa.

FE sẽ thêm phần sửa thuyết minh vào editor lược đồ trận đánh và cần API sửa trực tiếp.

## Endpoint

```
PUT /api/v1/historical-contexts/{contextId}/map-pins/{pinId}
Authorization: Bearer <token>
Content-Type: application/json
```

Đặt trong `MapPinController` cạnh `@DeleteMapping("/{pinId}")`.

## Request body: **cập nhật một phần**

Tất cả các field đều không bắt buộc. **Field không gửi thì giữ nguyên.**

```json
{
  "description": "Năm 938, Ngô Quyền cho cắm cọc gỗ dưới lòng sông Bạch Đằng…",
  "label": "Trận Bạch Đằng",
  "latitude": 20.9431,
  "longitude": 106.8167,
  "pinYear": 938,
  "pathGeoJson": { "type": "LineString", "coordinates": [] }
}
```

| Field | Kiểu | Ràng buộc | Ghi chú |
| --- | --- | --- | --- |
| `description` | string | tối đa 5000 ký tự | **Gửi `""` để xóa thuyết minh** (BE lưu `null`). Dùng chuỗi rỗng vì Jackson không phân biệt được "không gửi" và `null` |
| `label` | string | nếu có: không rỗng, tối đa 200 ký tự | |
| `latitude` | number | -90 đến 90 | |
| `longitude` | number | -180 đến 180 | |
| `pinYear` | integer | | |
| `pathGeoJson` | object | `type` phải là `"LineString"`, kiểm tra giống lúc tạo | Không gửi thì giữ nguyên |

Thường FE sẽ chỉ gửi `{ "description": "…" }`. Các field còn lại để sau này đổi vị trí ghim mà không phải xóa và tạo lại.

Gợi ý: tạo `UpdateMapPinRequest` (các field giống `CreateMapPinRequest` nhưng bỏ `@NotBlank`/`@NotNull`, thêm `@Size(max = 200)` cho `label` và `@Size(max = 5000)` cho `description`), tái dùng `serializePathGeoJson` của service.

## Phân quyền: giống `DELETE`

| Người gọi | Được sửa |
| --- | --- |
| `CONTENT_ADMIN`, `SYSTEM_ADMIN` | Ghim `pinOwnerType = "ADMIN"` của context này |
| Người dùng thường | Chỉ ghim `USER` do chính họ tạo (`createdBy = callerId`) |

Ghim không tồn tại, đã xóa mềm (`deletedAt != null`), không thuộc `contextId`, hoặc không có quyền sửa: trả **404** như DELETE đang làm.

Không đổi `pinId`, `contextId`, `createdBy`, `pinOwnerType`, `createdAt`. `updatedAt` tự cập nhật (entity đã có `@UpdateTimestamp`).

## Response

`200 OK`, envelope như các API khác; `data` là `MapPinResponse` sau khi sửa:

```json
{
  "success": true,
  "message": "Map pin updated successfully",
  "data": {
    "pinId": "uuid",
    "contextId": "uuid",
    "createdBy": "uid",
    "pinOwnerType": "ADMIN",
    "label": "Trận Bạch Đằng",
    "description": "Năm 938, Ngô Quyền cho cắm cọc gỗ…",
    "pinType": null,
    "latitude": 20.9431,
    "longitude": 106.8167,
    "pinYear": 938,
    "createdAt": "2026-09-20T10:00:00",
    "updatedAt": "2026-10-05T14:30:00",
    "pathGeoJson": { "type": "LineString", "coordinates": [] }
  }
}
```

FE đọc `response.data.data` và dùng các field: `pinId`, `contextId`, `pinOwnerType`, `label`, `description`, `latitude`, `longitude`, `pinYear`.

## Lỗi

| Mã | Khi nào | `message` |
| --- | --- | --- |
| 400 | Vi phạm ràng buộc (label rỗng, quá dài, tọa độ ngoài khoảng, `pathGeoJson` sai) | Thông báo tiếng Việt như các API khác. FE hiển thị nguyên văn |
| 401 | Chưa đăng nhập | |
| 404 | Không tìm thấy ghim hoặc không có quyền | `Không tìm thấy map pin với ID: …` |

## Checklist

- [ ] `UpdateMapPinRequest` (partial, có validate)
- [ ] `MapPinService.updatePin(contextId, pinId, request, callerId, role)`, phân quyền giống `deletePin`
- [ ] `@PutMapping("/{pinId}")` trong `MapPinController`, `@SecurityRequirement(name = "bearerAuth")`
- [ ] `description: ""` thì lưu `null`
- [ ] Swagger mô tả rõ "field không gửi thì giữ nguyên"

## Phía FE

FE đã gọi sẵn API này. Trong lúc BE chưa có endpoint (server trả 405), FE tạm dùng cách cũ: tạo ghim mới với cùng tọa độ, **tạo xong mới xóa ghim cũ**. Khi BE triển khai xong, FE tự chuyển sang `PUT`, không cần sửa thêm.
