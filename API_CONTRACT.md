# HistoryTalk — API Contract

> **Version:** 2.2 — Updated Characters, HistoricalContexts, Quiz fields & soft-delete API flow  
> **Base URL:** `{BACKEND_BASE_URL}/api/v1`  
> **Response Wrapper:** `{ success: boolean, message: string, data: T, timestamp: string }`  
> **Auth:** `Authorization: Bearer <accessToken>`  
> **Roles:** `CUSTOMER` | `CONTENT_ADMIN` | `SYSTEM_ADMIN`

---

## Mục lục

1. [Enums & Common Types](#1-enums--common-types)
2. [Auth](#2-auth)
3. [Characters](#3-characters)
4. [Historical Contexts (Events)](#4-historical-contexts-events)
5. [Chat Sessions & Messages](#5-chat-sessions--messages)
6. [Chat History](#6-chat-history)
7. [Quiz — Customer](#7-quiz--customer)
8. [Quiz — Staff/Admin](#8-quiz--staffadmin)
9. [Error Format](#9-error-format)
10. [Notes cho Backend](#10-notes-cho-backend)

---

## 1. Enums & Common Types

### Era (thời đại)

| FE Value (lowercase) | Backend Value (uppercase) | Label | Khoảng năm |
|---|---|---|---|
| `ancient` | `ANCIENT` | Cổ đại | → 937 |
| `medieval` | `MEDIEVAL` | Trung đại | 938 → 1857 |
| `modern` | `MODERN` | Cận đại | 1858 → 1944 |
| `contemporary` | `CONTEMPORARY` | Hiện đại | 1945 → nay |

> **Backend phải dùng UPPERCASE.** FE tự convert sang lowercase cho UI.  
> `all` chỉ dùng nội bộ FE cho filter — **không gửi lên API**.

### MessageRole

| Value | Ý nghĩa |
|---|---|
| `USER` | Tin nhắn người dùng |
| `ASSISTANT` | Tin nhắn nhân vật AI |

### QuizLevel

| Value | Ý nghĩa |
|---|---|
| `EASY` | Dễ |
| `MEDIUM` | Trung bình |
| `HARD` | Khó |

### Pagination Response (dùng chung)

```json
{
  "content": [],
  "totalElements": 0,
  "totalPages": 0,
  "currentPage": 0,
  "pageSize": 0,
  "hasNext": false,
  "hasPrevious": false
}
```

> `currentPage` là **0-indexed**.

---

## 2. Auth

### `POST /auth/register`

Đăng ký tài khoản mới (Customer).

**Request:**
```json
{
  "userName": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": { "message": "string" },
  "timestamp": "ISO8601"
}
```

---

### `POST /auth/login`

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "string",
  "data": {
    "uid": "string",
    "userName": "string",
    "email": "string",
    "role": "CUSTOMER",
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "expiresIn": 3600
  },
  "timestamp": "ISO8601"
}
```

> `role`: `CUSTOMER` | `CONTENT_ADMIN` | `SYSTEM_ADMIN`

---

### `POST /auth/logout`

Yêu cầu auth. Không cần body. Response `200`.

---

### `POST /auth/refresh-token`

**Request:**
```json
{ "refreshToken": "string" }
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

---

### `POST /auth/register-content-admin`

Yêu cầu role `SYSTEM_ADMIN`.

**Request:**
```json
{
  "userName": "string",
  "name": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "roleName": "CONTENT_ADMIN"
}
```

> `roleName`: `CONTENT_ADMIN` | `SYSTEM_ADMIN`

**Response `200`:** `{ "success": true, "message": "string" }`

---

## 3. Characters

### Object `Character`

```typescript
{
  characterId: string      // ID nhân vật (FE map sang id)
  name: string
  title: string            // Chức danh
  background: string       // Tiểu sử (FE map sang description)
  image: string | null     // URL ảnh (FE map sang imageUrl + avatarUrl)
  modelUrl?: string | null  // URL model 3D (GLB/GLTF)
  personality?: string
  bornYear?: number | null // null nếu không rõ năm sinh
  bornMonth?: number | null // null nếu không rõ tháng sinh
  bornDay?: number | null  // null nếu không rõ ngày sinh
  isBornBc?: boolean       // true = trước Công nguyên (BC)
  deathYear?: number | null // null nếu không rõ năm mất
  deathMonth?: number | null // null nếu không rõ tháng mất
  deathDay?: number | null // null nếu không rõ ngày mất
  isDeathBc?: boolean      // true = trước Công nguyên (BC)
  era?: string             // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  isActive?: boolean
  isPublished?: boolean     // true = đã publish cho người dùng xem
  createdAt?: string        // ISO8601 - thời gian tạo (admin only)
  updatedAt?: string        // ISO8601 - thời gian cập nhật (admin only)
  deletedAt?: string | null // ISO8601 - thời gian xóa tạm thời (null nếu chưa xóa)
  context?: { contextId: string }   // nested object
  events?: { id: string; title: string; year: number }[]
}
```

> **Quan trọng:** FE dùng `raw.characterId ?? raw.id` làm id. Phải trả `characterId`.  
> **Quan trọng:** FE dùng `raw.image ?? raw.imageUrl`. Ưu tiên trả field `image`.  
> **Quan trọng:** FE dùng `raw.modelUrl` cho model 3D. Trả `null` nếu không có.  
> **Quan trọng:** `contextId` nằm trong `context.contextId` (nested).  
> **Quan trọng:** CUSTOMER: GET /characters auto-filter `isPublished=true`, ignore `published` param.  
> **Quan trọng:** ADMIN/STAFF: `?published=true` chỉ published, `?published=false` chỉ unpublished, không truyền = tất cả.  
> **Quan trọng:** `createdAt` và `updatedAt` chỉ trả về cho ADMIN/STAFF, CUSTOMER sẽ không thấy.
> **Quan trọng:** Không dùng `lifespan`. Ngày sinh/mất tách thành từng field; phần không rõ trả `null` để FE hiển thị `?`.

---

### `GET /characters`

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo tên, chức danh |
| `page` | number | 0-indexed |
| `limit` | number | Số item/trang |
| `era` | string | `ANCIENT` \| `MEDIEVAL` \| `MODERN` \| `CONTEMPORARY` |
| `published` | boolean | `true` = chỉ published, `false` = chỉ unpublished, không truyền = tất cả |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "characterId": "...",
        "name": "...",
        "title": "...",
        "background": "...",
        "image": "url",
        "bornYear": null,
        "bornMonth": null,
        "bornDay": null,
        "isBornBc": true,
        "deathYear": null,
        "deathMonth": null,
        "deathDay": null,
        "isDeathBc": true,
        "era": "MEDIEVAL",
        "isActive": true,
        "isPublished": true,
        "modelUrl": null
      }
    ],
    "totalElements": 24,
    "totalPages": 3,
    "currentPage": 0,
    "pageSize": 8,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### `GET /characters/:id`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "characterId": "string",
    "name": "string",
    "title": "string",
    "background": "string",
    "image": "string | null",
    "personality": "string",
    "bornYear": null,
    "bornMonth": null,
    "bornDay": null,
    "isBornBc": true,
    "deathYear": null,
    "deathMonth": null,
    "deathDay": null,
    "isDeathBc": true,
    "era": "MEDIEVAL",
    "isActive": true,
    "isPublished": true,
    "context": { "contextId": "string" }
  }
}
```

---

### `GET /characters/context/:contextId`

Lấy danh sách nhân vật thuộc 1 bối cảnh lịch sử.

> **Quan trọng:** BE auto-filter theo role. CUSTOMER chỉ thấy `isPublished: true`. ADMIN/STAFF thấy tất cả.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "characterId": "string",
      "name": "string",
      "title": "string",
      "background": "string",
      "image": "string | null",
      "isPublished": true,
      "context": { "contextId": "string" }
    }
  ]
}
```

---

### `POST /characters`

Yêu cầu role `CONTENT_ADMIN` | `SYSTEM_ADMIN`.

**Request:**
```json
{
  "name": "string",
  "title": "string",
  "background": "string",
  "image": "string | null",
  "modelUrl": "string | null",    // URL model 3D (GLB/GLTF)
  "personality": "string",
  "bornYear": null,
  "bornMonth": null,
  "bornDay": null,
  "isBornBc": true,
  "deathYear": null,
  "deathMonth": null,
  "deathDay": null,
  "isDeathBc": true,
  "isActive": true,
  "isPublished": false     // mặc định false khi tạo mới
}
```

**Response `200`:** `{ "success": true, "data": Character }`

---

### `PUT /characters/:id`

**Request:** Partial của POST body trên.

**Response `200`:** `{ "success": true, "data": Character }`

---

### `DELETE /characters/:id`

Permanent delete. Response `200`.

---

### `PATCH /characters/:id/soft-delete`

Chuyển nhân vật vào thùng rác (set `deletedAt` thành thời gian hiện tại). Response `200`.

> **Lưu ý:** FE gọi API này thay vì tự set `deletedAt` trong body.

---

### `PATCH /characters/:id/toggle-active`

Bật/Tắt hoạt động (đảo ngược `isActive`). Response `200`.

---

### `POST /characters/:characterId/contexts/:contextId`

Gắn nhân vật vào bối cảnh. Response `200`.

---

## 4. Historical Contexts (Events)

> FE gọi resource này là "Events" nhưng endpoint là `/historical-contexts`.  
> `contextId` ↔ `id` của event trong FE.

### Object `HistoricalContext`

```typescript
{
  contextId: string        // ID (FE map sang id)
  name: string             // Tên sự kiện (FE map sang title)
  description: string      // Mô tả (FE map sang summary)
  year: number             // Năm bắt đầu
  yearLabel?: string       // VD: "938 SCN", "258 TCN" — backend tự format
  era: string              // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  location?: string
  imageUrl?: string | null
  videoUrl?: string | null
  period?: string
  isActive?: boolean
  isPublished?: boolean    // true = đã publish cho Customer xem
  isDraft?: boolean        // true = đang ở trạng thái nháp
  startYear?: number       // Năm bắt đầu sự kiện (phân biệt với year)
  endYear?: number         // Năm kết thúc sự kiện
  beforeTCN?: boolean      // true = trước Công nguyên (TCN)
  characterIds?: string[]  // Danh sách ID nhân vật liên quan
  deletedAt?: string | null // ISO8601 - thời gian xóa tạm thời (null nếu chưa xóa)
}
```

---

### `GET /historical-contexts`

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo tên |
| `page` | number | 0-indexed |
| `limit` | number | Số item/trang |
| `era` | string | `ANCIENT` \| `MEDIEVAL` \| `MODERN` \| `CONTEMPORARY` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "contextId": "string",
        "name": "string",
        "description": "string",
        "year": 938,
        "yearLabel": "938 SCN",
        "era": "MEDIEVAL",
        "location": "Sông Bạch Đằng",
        "imageUrl": "string | null",
        "videoUrl": "string | null",
        "isActive": true
      }
    ],
    "totalElements": 48,
    "totalPages": 8,
    "currentPage": 0,
    "pageSize": 6,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### `GET /historical-contexts/:id`

**Response `200`:** `{ "success": true, "data": HistoricalContext }`

---

### `POST /historical-contexts`

Yêu cầu role `CONTENT_ADMIN` | `SYSTEM_ADMIN`.

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "era": "MEDIEVAL",
  "year": 938,
  "startYear": 938,         // Năm bắt đầu (optional)
  "endYear": 939,           // Năm kết thúc (optional)
  "beforeTCN": false,       // true = trước Công nguyên
  "location": "string",
  "imageUrl": "string | null",
  "videoUrl": "string | null",
  "isActive": true,
  "isPublished": false,     // mặc định false
  "characterIds": ["char-1", "char-2"]  // Danh sách nhân vật liên quan (optional)
}
```

**Response `200`:** `{ "success": true, "data": HistoricalContext }`

---

### `PUT /historical-contexts/:id`

**Request:** Partial của POST body. **Response `200`:** `{ "success": true, "data": HistoricalContext }`

---

### `DELETE /historical-contexts/:id`

Permanent delete. Response `200`.

---

### `PATCH /historical-contexts/:id/soft-delete`

Chuyển bối cảnh lịch sử vào thùng rác (set `deletedAt` thành thời gian hiện tại). Response `200`.

> **Lưu ý:** FE gọi API này thay vì tự set `deletedAt` trong body.

---

### `PATCH /historical-contexts/:id/toggle-active`

Bật/Tắt hoạt động. Response `200`.

---

## 5. Chat Sessions & Messages

### Object `ChatSession`

```typescript
{
  id: string
  characterId: string
  contextId: string      // ID của historical-context
  title: string          // AI tự tạo sau tin đầu, để "" khi mới tạo
  lastMessage: string
  lastMessageAt: string  // ISO8601
  messageCount: number
}
```

### Object `ChatMessage`

```typescript
{
  id: string
  sessionId: string
  role: "USER" | "ASSISTANT"
  content: string
  createdAt: string  // ISO8601
}
```

---

### `GET /chat/sessions`

Lấy sessions của user theo context + character.

**Query params:**

| Param | Type | Required | Mô tả |
|---|---|---|---|
| `contextId` | string | ✓ | ID bối cảnh lịch sử |
| `characterId` | string | ✓ | ID nhân vật |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "characterId": "string",
      "contextId": "string",
      "title": "string",
      "lastMessage": "string",
      "lastMessageAt": "2026-05-22T14:30:00Z",
      "messageCount": 14
    }
  ]
}
```

---

### `POST /chat/sessions`

Tạo session mới. Backend tự tạo tin nhắn chào (`role: ASSISTANT`) đầu tiên.

**Request:**
```json
{
  "contextId": "string",
  "characterId": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "characterId": "string",
    "contextId": "string",
    "title": "",
    "lastMessage": "",
    "lastMessageAt": "ISO8601",
    "messageCount": 0
  }
}
```

---

### `DELETE /chat/sessions/:sessionId`

Xóa session và toàn bộ messages. Response `200`.

---

### `GET /chat/sessions/:sessionId/messages`

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "string",
        "sessionId": "string",
        "role": "ASSISTANT",
        "content": "string",
        "createdAt": "ISO8601"
      }
    ],
    "suggestedQuestions": [
      "Câu hỏi gợi ý 1",
      "Câu hỏi gợi ý 2",
      "Câu hỏi gợi ý 3"
    ]
  }
}
```

> - Messages sort theo `createdAt` ASC.  
> - `suggestedQuestions`: trả `[]` nếu chưa có message.

---

### `POST /chat/messages`

Gửi tin nhắn — backend gọi AI và trả reply trong cùng response (synchronous).

**Request:**
```json
{
  "sessionId": "string",
  "content": "string"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "string",
      "sessionId": "string",
      "role": "USER",
      "content": "string",
      "createdAt": "ISO8601"
    },
    "assistantMessage": {
      "id": "string",
      "sessionId": "string",
      "role": "ASSISTANT",
      "content": "string",
      "createdAt": "ISO8601"
    },
    "suggestedQuestions": ["string", "string", "string"]
  }
}
```

---

## 6. Chat History

### `GET /chat/history`

Lấy lịch sử chat của user đang auth, **đã group theo context**.

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "contextId": "string",
      "contextName": "string",
      "sessions": [
        {
          "id": "string",
          "characterId": "string",
          "characterName": "string",
          "characterTitle": "string",
          "characterImage": "string",
          "contextId": "string",
          "contextName": "string",
          "sessionTitle": "string",
          "lastMessage": "string",
          "lastMessageAt": "ISO8601",
          "messageCount": 14
        }
      ]
    }
  ]
}
```

> - Sort groups theo `lastMessageAt` của session mới nhất, DESC.  
> - `characterImage`: URL ảnh nhân vật (FE field name: `characterImage`, không phải `characterImageUrl`).  
> - Group dùng `contextId` + `contextName` (không phải `eventId`/`eventTitle`).

---

## 7. Quiz — Customer

### Object `QuizSet`

```typescript
{
  quizId: string
  title: string
  era: "ALL" | "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY"
  level: "EASY" | "MEDIUM" | "HARD"
  playCount: number        // tổng số lượt làm quiz (COUNT QuizSession)
  contextTitle?: string
}
```

### Object `QuizQuestion`

```typescript
{
  questionId: string
  content: string
  options: string[]      // 4 phần tử
  correctAnswer: number  // index 0-3
  explanation?: string
}
```

> `options` trong DB là string, backend phải parse/trả về `string[]` cho FE. Khuyến nghị lưu DB dạng JSON array string.

---

### `GET /quizzes`

> **Lưu ý:** Backend hiện trả về **array trực tiếp** (không pagination). FE tự wrap.  
> Nếu backend có thể trả pagination thì càng tốt.

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo title |

**Response `200`:**
```json
{
  "success": true,
  "data": [
    {
      "quizId": "string",
      "title": "string",
      "era": "CONTEMPORARY",
      "level": "MEDIUM",
      "playCount": 3241,
      "contextTitle": "string"
    }
  ]
}
```

> `playCount` là tổng số phiên làm bài của quiz, tính từ `COUNT(QuizSession WHERE quiz_id = ...)`. Không phải số lần admin cho phép làm.

---

### `GET /quizzes/:quizId`

**Response `200`:** `{ "success": true, "data": QuizSet }`

---

### `POST /quizzes/:quizId/start`

Bắt đầu phiên làm bài. Không cần body.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "quizId": "string",
    "title": "string",
    "questions": [
      {
        "questionId": "string",
        "content": "string",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "explanation": "string"
      }
    ]
  }
}
```

> `correctAnswer` trả về ngay vì đây là app học tập (hiện đúng/sai sau mỗi câu).  
> Backend trả questions theo thứ tự ổn định. DB hiện chưa có `orderIndex`, nên không bắt buộc field này trong contract.

---

### `POST /quizzes/submit`

**Request:**
```json
{
  "sessionId": "string",
  "answers": [
    { "questionId": "string", "selectedAnswer": 0 }
  ]
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "sessionId": "string",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "correctAnswers": [0, 1, 2],
    "wrongAnswers": [3, 4]
  }
}
```

> `correctAnswers` / `wrongAnswers`: mảng **index** (0-based) trong danh sách questions.
> `sessionId` là `QuizSession.session_id`; DB không có bảng Result riêng.

---

### `GET /quizzes/results/me`

**Query params:**

| Param | Type | Default |
|---|---|---|
| `page` | number | 0 |
| `size` | number | 10 |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "sessionId": "string",
        "quizId": "string",
        "quizTitle": "string",
        "score": 8,
        "totalQuestions": 10,
        "percentage": 80,
        "completedAt": "ISO8601",
        "durationSeconds": 420
      }
    ],
    "totalElements": 20,
    "totalPages": 2,
    "currentPage": 0,
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

> `completedAt` map từ `QuizSession.end_time`.  
> `durationSeconds` = số giây giữa `QuizSession.start_time` và `QuizSession.end_time`.

---

### `PATCH /quizzes/sessions/:sessionId/soft-delete`

Xóa mềm một session quiz đã làm (chuyển vào thùng rác). Yêu cầu auth.

**Response `200`:**
```json
{
  "success": true,
  "message": "Xóa thành công"
}
```

---

## 8. Quiz — Content Admin/System Admin

> Tất cả endpoint dưới yêu cầu role `CONTENT_ADMIN` hoặc `SYSTEM_ADMIN`.

### Object `ContentAdminQuizSet`

```typescript
{
  quizId: string
  title: string
  era: "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY"
  level: "EASY" | "MEDIUM" | "HARD"
  playCount: number        // tổng số lượt làm quiz (COUNT QuizSession)
  contextId: string
  contextTitle: string
  createdBy: string
  createdDate: string      // ISO8601
  updatedDate: string      // ISO8601
  isActive: boolean
  deletedAt?: string | null // ISO8601 - thời gian xóa tạm thời (null nếu chưa xóa)
  questions: QuizQuestion[]
}
```

---

### `GET /staff/quizzes`

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo title |
| `era` | string | Era enum |
| `level` | string | `EASY` \| `MEDIUM` \| `HARD` |
| `page` | number | 0-indexed |
| `size` | number | Số item/trang |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [ "ContentAdminQuizSet..." ],
    "totalElements": 0,
    "totalPages": 0,
    "currentPage": 0,
    "pageSize": 0,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### `GET /staff/quizzes/:quizId`

Chi tiết quiz kèm toàn bộ câu hỏi.

**Response `200`:** `{ "success": true, "data": ContentAdminQuizSet }`

---

### `POST /staff/quizzes`

**Request:**
```json
{
  "title": "string",
  "contextId": "string",
  "era": "CONTEMPORARY",
  "level": "MEDIUM",
  "questions": [
    {
      "content": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "string"
    }
  ]
}
```

**Response `200`:** `{ "success": true, "data": ContentAdminQuizSet }`

---

### `PUT /staff/quizzes/:quizId`

Cập nhật metadata (không bao gồm questions).

**Request:** Partial — tất cả field đều optional:
```json
{
  "title": "string",
  "contextId": "string",
  "era": "CONTEMPORARY",
  "level": "MEDIUM"
}
```

**Response `200`:** `{ "success": true, "data": ContentAdminQuizSet }`

---

### `DELETE /staff/quizzes/:quizId`

Permanent delete. Response `200`.

---

### `PATCH /staff/quizzes/:quizId/soft-delete`

Chuyển bộ Quiz vào thùng rác (set `deletedAt` thành thời gian hiện tại). Response `200`.

---

### `PATCH /staff/quizzes/:quizId/toggle-active`

Bật/Tắt hoạt động (đảo `isActive`). Response `200`.

---

### `POST /staff/quizzes/:quizId/questions`

Thêm câu hỏi vào quiz.

**Request:**
```json
{
  "content": "string",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "explanation": "string"
}
```

**Response `200`:** `{ "success": true, "data": QuizQuestion }`

---

### `PUT /staff/quizzes/:quizId/questions/:questionId`

Sửa câu hỏi. **Request:** Partial của POST body — tất cả optional.

**Response `200`:** `{ "success": true }`

---

### `DELETE /staff/quizzes/:quizId/questions/:questionId`

Xóa câu hỏi. Response `200`.

---

## 9. Error Format

```json
{
  "success": false,
  "message": "Character not found",
  "data": null,
  "timestamp": "ISO8601"
}
```

| HTTP Status | Khi nào |
|---|---|
| `400` | Request params/body không hợp lệ |
| `401` | Chưa auth hoặc token hết hạn |
| `403` | Không đủ role/quyền |
| `404` | Không tìm thấy resource |
| `500` | Lỗi server |

---

## 10. Notes cho Backend

### ⚠️ Critical — phải đúng để FE không lỗi

1. **Response wrapper bắt buộc:** Mọi response phải có shape `{ success, message, data, timestamp }`. FE đọc `res.data.success` và `res.data.data`.

2. **Character ID field:** Phải trả `characterId` (không phải `id`). FE dùng `raw.characterId ?? raw.id`.

3. **Character image & model fields:** 
   - `image` (không phải `imageUrl`). FE dùng `raw.image ?? raw.imageUrl`.
   - `modelUrl` cho model 3D (GLB/GLTF). Trả `null` nếu không có.

4. **Character contextId:** Phải nằm trong `context.contextId` (nested object), không phải flat `contextId`.

5. **Chat history fields:** Group dùng `contextId` + `contextName`. Session dùng `characterImage` (không phải `characterImageUrl`).

6. **Era enum:** Backend nhận và trả **UPPERCASE** (`ANCIENT`, `MEDIEVAL`, `MODERN`, `CONTEMPORARY`). FE tự convert lowercase cho UI.

7. **MessageRole:** Phải là `USER` và `ASSISTANT` (UPPERCASE) — không phải `user`/`assistant`.

8. **Pagination:** `currentPage` là **0-indexed**. FE gửi `page=0` cho trang đầu.

9. **Quiz /quizzes (GET):** Backend trả `data` là **array trực tiếp** (không pagination object). FE tự wrap.

### Datetime

- Tất cả datetime dùng **ISO 8601 UTC**: `"2026-05-22T14:30:00Z"`
- `createdDate` / `updatedDate` (Staff Quiz) — cùng format ISO 8601.

### Active State & Soft Delete pattern

- Thêm `isActive: boolean (default true)` vào `Character`, `HistoricalContext`, `Quiz`.
- Mọi GET query filter `WHERE isActive = true AND deletedAt IS NULL` mặc định cho phía Customer.
- PATCH `/:id/toggle-active` thực hiện bật/tắt (đảo trạng thái `isActive`).
- Thêm `deletedAt: string | null (default null)` vào `Character`, `HistoricalContext`, `Quiz`, `QuizSession` (ISO8601 UTC).
- **Soft Delete API flow:** FE gọi `PATCH /:id/soft-delete` để xóa mềm. **KHÔNG** cho phép FE tự set `deletedAt` trong body của PUT/POST.
- Các endpoint soft-delete: `PATCH /characters/:id/soft-delete`, `PATCH /historical-contexts/:id/soft-delete`, `PATCH /staff/quizzes/:quizId/soft-delete`, `PATCH /quizzes/sessions/:sessionId/soft-delete`.
- Mọi GET query filter `WHERE deletedAt IS NULL` cho phía Admin/Staff theo mặc định (trừ khi có param lọc thùng rác hoặc yêu cầu cụ thể).

### Role check

- `/staff/*` endpoints: check `role IN ('CONTENT_ADMIN', 'SYSTEM_ADMIN')` từ JWT → `403` nếu không đủ quyền.
- `POST /auth/register-content-admin`: chỉ `SYSTEM_ADMIN` được gọi.
