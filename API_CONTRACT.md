# HistoryTalk — API Contract

> **Version:** 1.0  
> **Base URL:** `https://api.historytalk.vn/v1`  
> **Auth:** Bearer token — header `Authorization: Bearer <token>`  
> Tất cả endpoints (trừ `/auth/*`) đều yêu cầu auth.

---

## Mục lục

1. [Enum Values](#1-enum-values)
2. [Characters](#2-characters)
3. [Events](#3-events)
4. [Chat Sessions](#4-chat-sessions)
5. [Chat Messages](#5-chat-messages)
6. [Chat History](#6-chat-history)
7. [Error Format](#7-error-format)
8. [Ghi chú](#8-ghi-chú)

---

## 1. Enum Values

### `EventEra`

| Value | Label | Khoảng năm |
|---|---|---|
| `ancient` | Cổ đại | Từ đầu → 937 |
| `medieval` | Trung đại | 938 → 1857 |
| `modern` | Cận đại | 1858 → 1944 |
| `contemporary` | Hiện đại | 1945 → nay |

> `all` chỉ dùng ở FE cho filter UI, **không gửi lên API**.

### `EventCategory`

| Value | Label |
|---|---|
| `war` | Chiến tranh |
| `politics` | Chính trị |
| `culture` | Văn hoá |
| `science` | Khoa học |
| `religion` | Tôn giáo |
| `other` | Khác |

### `MessageRole`

| Value | Ý nghĩa |
|---|---|
| `user` | Tin nhắn của người dùng |
| `assistant` | Tin nhắn của nhân vật AI |

---

## 2. Characters

### `GET /characters`

Lấy danh sách nhân vật — dùng cho trang `/characters`.

**Query params**

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | `number` | `1` | Trang hiện tại (1-indexed) |
| `limit` | `number` | `8` | Số item/trang, max `20` |
| `era` | `EventEra` | — | Lọc theo thời đại |
| `search` | `string` | — | Tìm theo tên, chức danh, mô tả, tên sự kiện liên quan |

**Response `200`**

```json
{
  "data": [
    {
      "id": "ngo-quyen",
      "name": "Ngô Quyền",
      "title": "Tiết độ sứ Tĩnh Hải quân",
      "description": "Anh hùng dân tộc, người lãnh đạo quân dân Đại Việt đánh tan quân Nam Hán...",
      "imageUrl": "/images/characters/ngo-quyen.jpg",
      "era": "medieval",
      "lifespan": "898–944",
      "side": "Đại Việt",
      "events": [
        {
          "id": "bach-dang-938",
          "title": "Trận Bạch Đằng",
          "year": 938,
          "era": "medieval"
        }
      ]
    }
  ],
  "total": 24,
  "page": 1,
  "totalPages": 3
}
```

---

### `GET /characters/:id`

Lấy chi tiết 1 nhân vật — dùng cho right panel trong trang chat.

**Response `200`** — cùng shape với 1 item trong `data[]` ở trên.

---

## 3. Events

### `GET /events`

Lấy danh sách sự kiện lịch sử — dùng cho trang `/events`.

**Query params**

| Param | Type | Default | Mô tả |
|---|---|---|---|
| `page` | `number` | `1` | Trang hiện tại |
| `limit` | `number` | `6` | Số item/trang |
| `era` | `EventEra` | — | Lọc theo thời đại |
| `category` | `EventCategory` | — | Lọc theo loại sự kiện |
| `search` | `string` | — | Tìm theo tên sự kiện |

**Response `200`**

```json
{
  "data": [
    {
      "id": "bach-dang-938",
      "year": 938,
      "yearLabel": "938 SCN",
      "title": "Trận Bạch Đằng",
      "summary": "Ngô Quyền dùng kế cọc nhọn đánh tan quân Nam Hán...",
      "category": "war",
      "location": "Sông Bạch Đằng, Quảng Ninh",
      "imageUrl": "/images/events/bach-dang.jpg"
    }
  ],
  "total": 48,
  "page": 1,
  "totalPages": 8
}
```

> `yearLabel`: backend tự format (`"938 SCN"`, `"258 TCN"`). FE dùng thẳng, không tự format lại.

---

### `GET /events/:id`

Lấy chi tiết sự kiện kèm danh sách nhân vật — dùng khi mở `EventDetailModal`.

**Response `200`**

```json
{
  "id": "bach-dang-938",
  "year": 938,
  "yearLabel": "938 SCN",
  "title": "Trận Bạch Đằng",
  "summary": "...",
  "category": "war",
  "location": "Sông Bạch Đằng, Quảng Ninh",
  "imageUrl": "/images/events/bach-dang.jpg",
  "characters": [
    {
      "id": "ngo-quyen",
      "name": "Ngô Quyền",
      "title": "Tiết độ sứ Tĩnh Hải quân",
      "imageUrl": "/images/characters/ngo-quyen.jpg",
      "era": "medieval",
      "role": "Chỉ huy quân Đại Việt",
      "side": "Đại Việt"
    }
  ]
}
```

> `characters[].role`: vai trò của nhân vật **trong sự kiện này** (khác với `title` là chức danh chung).

---

## 4. Chat Sessions

### `GET /chat/sessions`

Lấy danh sách sessions của user — dùng cho left panel trong trang chat.

**Query params**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `eventId` | `string` | ✓ | ID sự kiện |
| `characterId` | `string` | ✓ | ID nhân vật |

**Response `200`** — mảng sessions, sort theo `lastMessageAt` desc.

```json
[
  {
    "id": "session-abc123",
    "characterId": "ngo-quyen",
    "eventId": "bach-dang-938",
    "title": "Kế sách cọc nhọn Bạch Đằng",
    "lastMessage": "Quân Nam Hán đã mắc bẫy cọc nhọn...",
    "lastMessageAt": "2026-05-22T14:30:00Z",
    "messageCount": 14
  }
]
```

---

### `POST /chat/sessions`

Tạo session mới.

**Request body**

```json
{
  "eventId": "bach-dang-938",
  "characterId": "ngo-quyen"
}
```

**Response `201`** — object session vừa tạo, cùng shape với item trong `GET /chat/sessions`.

> `title` lúc mới tạo để trống `""`. Backend tự update sau khi có tin nhắn đầu tiên (dùng AI summary).

---

### `DELETE /chat/sessions/:id`

Xoá session và toàn bộ messages bên trong.

**Response `204`** — No Content.

---

## 5. Chat Messages

### `GET /chat/sessions/:id/messages`

Lấy toàn bộ messages của 1 session — dùng khi load trang chat hoặc chọn session.

**Response `200`**

```json
{
  "messages": [
    {
      "id": "msg-001",
      "sessionId": "session-abc123",
      "role": "assistant",
      "content": "Chào ngươi! Ta là Ngô Quyền, Tiết độ sứ Tĩnh Hải quân...",
      "createdAt": "2026-05-22T14:00:00Z"
    },
    {
      "id": "msg-002",
      "sessionId": "session-abc123",
      "role": "user",
      "content": "Tướng quân đã chuẩn bị trận Bạch Đằng như thế nào?",
      "createdAt": "2026-05-22T14:01:00Z"
    },
    {
      "id": "msg-003",
      "sessionId": "session-abc123",
      "role": "assistant",
      "content": "Ta đã cho đóng cọc nhọn dưới lòng sông...",
      "createdAt": "2026-05-22T14:01:05Z"
    }
  ],
  "suggestedQuestions": [
    "Tướng quân đã biết trước quân Hán sẽ đến từ hướng nào?",
    "Cọc nhọn được làm từ vật liệu gì và đóng như thế nào?",
    "Sau trận thắng, tướng quân có kế hoạch gì tiếp theo?"
  ]
}
```

> - Messages sort theo `createdAt` asc.
> - `suggestedQuestions` được generate dựa trên **message cuối cùng** trong session. Trả `[]` nếu session chưa có message hoặc message cuối là `role: "user"`.
> - Tin nhắn đầu tiên (`role: "assistant"`) là lời chào — backend tự generate khi `POST /chat/sessions`.

---

### `POST /chat/messages`

Gửi tin nhắn của user, backend gọi AI và trả về reply ngay trong cùng response.

> **Phase 1:** Đồng bộ — FE chờ response. **Phase 2** sẽ migrate sang SSE/WebSocket khi cần.

**Request body**

```json
{
  "sessionId": "session-abc123",
  "characterId": "ngo-quyen",
  "eventId": "bach-dang-938",
  "content": "Tướng quân đã chuẩn bị trận Bạch Đằng như thế nào?"
}
```

**Response `200`**

```json
{
  "userMessage": {
    "id": "msg-003",
    "sessionId": "session-abc123",
    "role": "user",
    "content": "Tướng quân đã chuẩn bị trận Bạch Đằng như thế nào?",
    "createdAt": "2026-05-22T14:01:00Z"
  },
  "assistantMessage": {
    "id": "msg-004",
    "sessionId": "session-abc123",
    "role": "assistant",
    "content": "Ta đã cho đóng cọc nhọn dưới lòng sông từ nhiều ngày trước...",
    "createdAt": "2026-05-22T14:01:05Z"
  },
  "suggestedQuestions": [
    "Tướng quân đã biết trước quân Hán sẽ đến từ hướng nào?",
    "Cọc nhọn được làm từ vật liệu gì và đóng như thế nào?",
    "Sau trận thắng, tướng quân có kế hoạch gì tiếp theo?"
  ]
}
```

> - Backend nhận `eventId` để làm context cho AI (nhân vật biết mình đang ở sự kiện nào).
> - `suggestedQuestions`: 3 câu gợi ý do AI generate, liên quan đến nội dung vừa trả lời.

---

## 6. Chat History

### `GET /chat/history`

Lấy toàn bộ lịch sử chat của user hiện tại, **đã group theo sự kiện** — dùng cho trang `/chat-history`.

**Response `200`** — mảng groups, sort theo `lastMessageAt` của session mới nhất trong group, desc.

```json
[
  {
    "eventId": "bach-dang-938",
    "eventTitle": "Trận Bạch Đằng",
    "eventYear": 938,
    "sessions": [
      {
        "id": "session-abc123",
        "characterId": "ngo-quyen",
        "characterName": "Ngô Quyền",
        "characterImageUrl": "/images/characters/ngo-quyen.jpg",
        "characterTitle": "Tiết độ sứ Tĩnh Hải quân",
        "eventId": "bach-dang-938",
        "eventTitle": "Trận Bạch Đằng",
        "eventYear": 938,
        "sessionTitle": "Kế sách cọc nhọn Bạch Đằng",
        "lastMessage": "Quân Nam Hán đã mắc bẫy cọc nhọn...",
        "lastMessageAt": "2026-05-22T14:30:00Z",
        "messageCount": 14
      }
    ]
  }
]
```

> FE tự filter theo era ở client-side — không cần thêm query param cho endpoint này.

---

## 7. Error Format

Tất cả lỗi đều trả về cùng shape:

```json
{
  "code": "RESOURCE_NOT_FOUND",
  "message": "Character not found",
  "statusCode": 404
}
```

| Status | Code | Khi nào |
|---|---|---|
| `400` | `BAD_REQUEST` | Request params/body không hợp lệ |
| `401` | `UNAUTHORIZED` | Chưa đăng nhập hoặc token hết hạn |
| `403` | `FORBIDDEN` | Không có quyền truy cập resource |
| `404` | `RESOURCE_NOT_FOUND` | Không tìm thấy resource |
| `500` | `INTERNAL_ERROR` | Lỗi server |

---

## 8. Ghi chú

### Đã quyết định — backend không cần hỏi lại

- **Datetime:** ISO 8601 UTC. VD: `"2026-05-22T14:30:00Z"`
- **Phân trang:** FE gửi `page` (1-indexed) + `limit`. Backend trả `total` + `totalPages`.
- **imageUrl:** relative path hoặc absolute đều được. FE dùng Next.js `<Image>`.
- **`yearLabel`:** Backend tự format (`"938 SCN"`, `"258 TCN"`). FE dùng thẳng.
- **Session title:** Backend tự generate bằng AI summary sau tin nhắn đầu. Để `""` khi mới tạo.
- **Tin nhắn chào:** Backend tự tạo message `role: "assistant"` đầu tiên khi `POST /chat/sessions`.
- **Chat AI phase 1:** Đồng bộ, không streaming. Phase 2 sẽ thảo luận riêng.
- **`/chat/history`:** Chỉ trả về data của user đang auth. Sort desc theo session mới nhất.
- **`era` trong Character:** Dùng đúng enum `ancient | medieval | modern | contemporary`.

### Chưa quyết định — cần thảo luận thêm

- Auth flow: JWT hay session? Token refresh như thế nào?
- Upload ảnh nhân vật/sự kiện: endpoint riêng hay dùng S3 presigned URL?
- Rate limiting cho `POST /chat/messages` — giới hạn bao nhiêu request/phút?
- AI model nào dùng cho chat? Context window tối đa bao nhiêu messages?


----# HistoryTalk — Quiz API Specification

> **Version:** 2.0  
> **Base path:** `/Historical-tell/api/v1`  
> **Response wrapper:** `{ success, message, data, timestamp }`  
> **Auth:** Bearer token — `Authorization: Bearer <token>`  
> **Roles:** `CUSTOMER` | `STAFF` | `ADMIN`

---

## Data Model

```typescript
QuizSet {
  quizId:          string
  title:           string
  description:     string
  grade:           10 | 11 | 12          // Lớp học
  chapterNumber:   number                // Số bài
  chapterTitle:    string                // Tên chủ đề ngắn
  era:             "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY" | "ALL"
  difficulty:      "EASY" | "MEDIUM" | "HARD"
  totalQuestions:  number                // tính tự động từ questions
  durationSeconds: number                // thời gian gợi ý
  playCount:       number                // tính tự động
  rating:          number                // tính tự động từ reviews
  tags:            string[]
  createdAt:       ISO datetime
  createdBy:       string (staffId)
}

QuizQuestion {
  questionId:    string
  quizId:        string
  orderIndex:    number                  // thứ tự câu hỏi
  content:       string
  options:       string[]                // đúng 4 phần tử
  correctAnswer: number                  // index 0-3
  explanation:   string (optional)
}

QuizSession {
  sessionId:   string
  quizId:      string
  userId:      string
  startedAt:   ISO datetime
  expiresAt:   ISO datetime
  submitted:   boolean
}

QuizResult {
  resultId:        string
  quizId:          string
  quizTitle:       string
  userId:          string
  score:           number
  totalQuestions:  number
  durationSeconds: number
  completedAt:     ISO datetime
  difficulty:      "EASY" | "MEDIUM" | "HARD"
}
```

---

## CUSTOMER Endpoints

### `GET /quizzes`

Lấy danh sách bộ câu hỏi.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Tìm theo title, chapterTitle |
| `page` | number | Default 0 |
| `limit` | number | Default 20 |
| `grade` | number | `10` \| `11` \| `12` |
| `era` | enum | `ANCIENT` \| `MEDIEVAL` \| `MODERN` \| `CONTEMPORARY` |

**Response:**
```json
{
  "content": [
    {
      "quizId": "ls12-b1",
      "title": "Lịch sử 12 — Bài 1: Liên Hợp Quốc",
      "description": "string",
      "grade": 12,
      "chapterNumber": 1,
      "chapterTitle": "Liên Hợp Quốc",
      "era": "CONTEMPORARY",
      "difficulty": "MEDIUM",
      "totalQuestions": 10,
      "durationSeconds": 900,
      "playCount": 3241,
      "rating": 4.8,
      "tags": ["liên hợp quốc"],
      "createdAt": "2024-01-10"
    }
  ],
  "totalElements": 15,
  "totalPages": 1,
  "currentPage": 0,
  "pageSize": 20,
  "hasNext": false,
  "hasPrevious": false
}
```

---

### `GET /quizzes/:quizId`

Chi tiết 1 bộ câu hỏi. Response là single object như trên.

---

### `POST /quizzes/:quizId/start`

Bắt đầu phiên làm bài.

**Request body:** Không cần.

**Response:**
```json
{
  "sessionId": "string",
  "quizId": "string",
  "questions": [
    {
      "questionId": "string",
      "orderIndex": 1,
      "content": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "string (optional)"
    }
  ],
  "durationSeconds": 900,
  "startedAt": "2024-03-20T10:00:00Z",
  "expiresAt": "2024-03-20T10:15:00Z"
}
```

> `correctAnswer` trả về luôn trong response này vì frontend cần để hiện đúng/sai ngay sau khi chọn.

---

### `POST /quizzes/submit`

Nộp bài.

**Request body:**
```json
{
  "sessionId": "string",
  "answers": [
    { "questionId": "string", "selectedAnswer": 0 }
  ],
  "durationSeconds": 480
}
```

**Response:**
```json
{
  "resultId": "string",
  "score": 8,
  "totalQuestions": 10,
  "correctAnswers": [0, 1, 2, 3, 5, 6, 7, 9],
  "wrongAnswers": [4, 8],
  "durationSeconds": 480,
  "completedAt": "2024-03-20T10:08:00Z"
}
```

> `correctAnswers` / `wrongAnswers` là mảng **index** (0-based) của câu trong danh sách questions.

---

### `GET /quizzes/results/me`

Lịch sử làm bài của user hiện tại.

**Response:**
```json
[
  {
    "resultId": "string",
    "quizId": "string",
    "quizTitle": "string",
    "grade": 12,
    "chapterTitle": "Liên Hợp Quốc",
    "score": 8,
    "totalQuestions": 10,
    "durationSeconds": 480,
    "completedAt": "2024-03-20T10:08:00Z",
    "difficulty": "MEDIUM"
  }
]
```

---

## STAFF / ADMIN Endpoints

> Tất cả endpoint dưới đây yêu cầu role `STAFF` hoặc `ADMIN`.  
> Backend nên kiểm tra role từ JWT token.

---

### `GET /staff/quizzes`

Danh sách tất cả quiz kèm thống kê — dùng cho trang quản lý của staff.

**Query params:**

| Param | Type | Description |
|---|---|---|
| `search` | string | Tìm theo title |
| `page` | number | Default 0 |
| `limit` | number | Default 20 |
| `grade` | number | `10` \| `11` \| `12` |
| `difficulty` | enum | `EASY` \| `MEDIUM` \| `HARD` |

**Response item** (thêm các field quản lý so với GET /quizzes):
```json
{
  "quizId": "string",
  "title": "string",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string",
  "difficulty": "MEDIUM",
  "totalQuestions": 10,
  "durationSeconds": 900,
  "playCount": 3241,
  "rating": 4.8,
  "createdAt": "2024-01-10",
  "createdBy": "staffId",
  "updatedAt": "2024-02-01",
  "updatedBy": "staffId"
}
```

---

### `GET /staff/quizzes/:quizId`

Chi tiết quiz kèm toàn bộ câu hỏi — dùng để edit.

**Response:**
```json
{
  "quizId": "string",
  "title": "string",
  "description": "string",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string",
  "era": "CONTEMPORARY",
  "difficulty": "MEDIUM",
  "durationSeconds": 900,
  "tags": ["string"],
  "questions": [
    {
      "questionId": "string",
      "orderIndex": 1,
      "content": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ],
  "createdAt": "string",
  "createdBy": "string",
  "updatedAt": "string",
  "updatedBy": "string"
}
```

---

### `POST /staff/quizzes`

Tạo bộ câu hỏi mới.

**Request body:**
```json
{
  "title": "string (required)",
  "description": "string (required)",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string (required)",
  "era": "CONTEMPORARY",
  "difficulty": "MEDIUM",
  "durationSeconds": 900,
  "tags": ["string"],
  "questions": [
    {
      "orderIndex": 1,
      "content": "string (required)",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "string (optional)"
    }
  ]
}
```

**Response:** QuizSet object đã tạo kèm `quizId` được generate.

---

### `PUT /staff/quizzes/:quizId`

Cập nhật thông tin quiz (không bao gồm câu hỏi).

**Request body:** Partial của POST body, không có `questions`.

```json
{
  "title": "string (optional)",
  "description": "string (optional)",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string (optional)",
  "era": "CONTEMPORARY",
  "difficulty": "MEDIUM",
  "durationSeconds": 900,
  "tags": ["string"]
}
```

---

### `DELETE /staff/quizzes/:quizId`

Xóa bộ câu hỏi. Nên soft delete (thêm field `deletedAt`).

---

### `POST /staff/quizzes/:quizId/questions`

Thêm câu hỏi mới vào quiz đã có.

**Request body:**
```json
{
  "orderIndex": 11,
  "content": "string",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "string (optional)"
}
```

**Response:** QuizQuestion object đã tạo.

---

### `PUT /staff/quizzes/:quizId/questions/:questionId`

Sửa 1 câu hỏi.

**Request body:** Partial của POST body trên.

---

### `DELETE /staff/quizzes/:quizId/questions/:questionId`

Xóa 1 câu hỏi khỏi quiz.

---

### `PUT /staff/quizzes/:quizId/questions/reorder`

Sắp xếp lại thứ tự câu hỏi.

**Request body:**
```json
{
  "order": ["questionId-1", "questionId-3", "questionId-2"]
}
```

---

## Tóm tắt

| Endpoint | Method | Role | Mô tả | Priority |
|---|---|---|---|---|
| `/quizzes` | GET | All | Danh sách quiz | 🔴 High |
| `/quizzes/:id` | GET | All | Chi tiết quiz | 🔴 High |
| `/quizzes/:id/start` | POST | Customer | Bắt đầu làm bài | 🔴 High |
| `/quizzes/submit` | POST | Customer | Nộp bài | 🔴 High |
| `/quizzes/results/me` | GET | Customer | Lịch sử làm bài | 🟡 Medium |
| `/staff/quizzes` | GET | Staff/Admin | Danh sách quản lý | 🟡 Medium |
| `/staff/quizzes/:id` | GET | Staff/Admin | Chi tiết + questions | 🟡 Medium |
| `/staff/quizzes` | POST | Staff/Admin | Tạo quiz mới | 🟡 Medium |
| `/staff/quizzes/:id` | PUT | Staff/Admin | Sửa thông tin quiz | 🟡 Medium |
| `/staff/quizzes/:id` | DELETE | Staff/Admin | Xóa quiz | 🟢 Low |
| `/staff/quizzes/:id/questions` | POST | Staff/Admin | Thêm câu hỏi | 🟡 Medium |
| `/staff/quizzes/:id/questions/:qId` | PUT | Staff/Admin | Sửa câu hỏi | 🟡 Medium |
| `/staff/quizzes/:id/questions/:qId` | DELETE | Staff/Admin | Xóa câu hỏi | 🟢 Low |
| `/staff/quizzes/:id/questions/reorder` | PUT | Staff/Admin | Sắp xếp câu hỏi | 🟢 Low |

---

## Notes cho Backend

1. **`grade` field** — thêm vào bảng `Quiz`, kiểu `INTEGER`, giá trị `10`, `11`, `12`.

2. **`chapterNumber` + `chapterTitle`** — thêm vào bảng `Quiz`, dùng để group và hiển thị trên UI.

3. **`correctAnswer` trong start response** — frontend cần field này ngay khi làm bài để hiện đúng/sai sau mỗi câu. Không cần ẩn vì đây là app học tập, không phải thi cử nghiêm túc.

4. **Soft delete** — thêm `deletedAt: datetime (nullable)` vào bảng `Quiz` và `QuizQuestion`. Filter `WHERE deletedAt IS NULL` trong tất cả GET queries.

5. **`playCount`** — tự động tăng 1 mỗi khi `POST /quizzes/:id/start` được gọi thành công.

6. **`totalQuestions`** — tính tự động từ `COUNT(questions)`, không cần lưu riêng hoặc có thể cache.

7. **Role check** — staff endpoint nên check `role IN ('STAFF', 'ADMIN')` từ JWT, trả về `403 Forbidden` nếu không đủ quyền.