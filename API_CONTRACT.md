# HistoryTalk — API Contract

> **Version:** 2.1 — Synced with FE source code  
> **Base URL:** `{BACKEND_BASE_URL}/api/v1`  
> **Response Wrapper:** `{ success: boolean, message: string, data: T, timestamp: string }`  
> **Auth:** `Authorization: Bearer <accessToken>`  
> **Roles:** `CUSTOMER` | `STAFF` | `ADMIN`

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

### EventCategory

| Backend Value | Label |
|---|---|
| `WAR` | Chiến tranh |
| `POLITICS` | Chính trị |
| `CULTURE` | Văn hoá |
| `SCIENCE` | Khoa học |
| `RELIGION` | Tôn giáo |
| `OTHER` | Khác |

> Backend nhận và trả về **UPPERCASE**. FE tự convert lowercase cho UI.

### MessageRole

| Value | Ý nghĩa |
|---|---|
| `USER` | Tin nhắn người dùng |
| `ASSISTANT` | Tin nhắn nhân vật AI |

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

> `role`: `CUSTOMER` | `STAFF` | `ADMIN`

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

### `POST /auth/register-staff`

Yêu cầu role `ADMIN`.

**Request:**
```json
{
  "userName": "string",
  "name": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "roleName": "STAFF"
}
```

> `roleName`: `STAFF` | `ADMIN`

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
  personality?: string
  lifespan?: string        // VD: "898–944"
  side?: string            // Phe, VD: "Đại Việt"
  era?: string             // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  role?: string            // Vai trò cụ thể trong context
  isDraft?: boolean
  deletedAt?: string | null
  context?: { contextId: string }   // nested object
  events?: { id: string; title: string; year: number }[]
}
```

> **Quan trọng:** FE dùng `raw.characterId ?? raw.id` làm id. Phải trả `characterId`.  
> **Quan trọng:** FE dùng `raw.image ?? raw.imageUrl`. Ưu tiên trả field `image`.  
> **Quan trọng:** `contextId` nằm trong `context.contextId` (nested).

---

### `GET /characters`

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo tên, chức danh |
| `page` | number | 0-indexed |
| `limit` | number | Số item/trang |
| `era` | string | `ANCIENT` \| `MEDIEVAL` \| `MODERN` \| `CONTEMPORARY` |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [ { "characterId": "...", "name": "...", "title": "...", "background": "...", "image": "url", "era": "MEDIEVAL", "isDraft": false } ],
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
    "lifespan": "string",
    "side": "string",
    "era": "MEDIEVAL",
    "role": "string",
    "isDraft": false,
    "deletedAt": null,
    "context": { "contextId": "string" }
  }
}
```

---

### `GET /characters/context/:contextId`

Lấy danh sách nhân vật thuộc 1 bối cảnh lịch sử.

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
      "side": "string",
      "context": { "contextId": "string" }
    }
  ]
}
```

---

### `POST /characters`

Yêu cầu role `STAFF` | `ADMIN`.

**Request:**
```json
{
  "name": "string",
  "title": "string",
  "background": "string",
  "image": "string | null",
  "personality": "string",
  "lifespan": "string",
  "side": "string",
  "isDraft": false
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

Soft delete — set `deletedAt`. Response `200`.

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
  year: number
  yearLabel?: string       // VD: "938 SCN", "258 TCN" — backend tự format
  startYear?: number
  endYear?: number
  beforeTCN?: boolean
  category: string         // WAR | POLITICS | CULTURE | SCIENCE | RELIGION | OTHER
  era: string              // ANCIENT | MEDIEVAL | MODERN | CONTEMPORARY
  location?: string
  imageUrl?: string | null
  videoUrl?: string | null
  period?: string
  isDraft?: boolean
  deletedAt?: string | null
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
| `category` | string | `WAR` \| `POLITICS` \| ... |

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
        "category": "WAR",
        "era": "MEDIEVAL",
        "location": "Sông Bạch Đằng",
        "imageUrl": "string | null",
        "videoUrl": "string | null",
        "isDraft": false
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

Yêu cầu role `STAFF` | `ADMIN`.

**Request:**
```json
{
  "name": "string",
  "description": "string",
  "era": "MEDIEVAL",
  "category": "WAR",
  "year": 938,
  "startYear": 938,
  "endYear": 938,
  "beforeTCN": false,
  "location": "string",
  "imageUrl": "string | null",
  "videoUrl": "string | null",
  "isDraft": false
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

Soft delete. Response `200`.

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
  description: string
  era: "ALL" | "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY"
  durationSeconds: number
  playCount: number
  rating: number
  contextTitle?: string
  grade?: 10 | 11 | 12
  chapterNumber?: number
  chapterTitle?: string
}
```

### Object `QuizQuestion`

```typescript
{
  questionId: string
  content: string
  options: string[]      // 4 phần tử
  correctAnswer: number  // index 0-3
  orderIndex: number
  explanation?: string
}
```

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
      "description": "string",
      "grade": 12,
      "chapterNumber": 1,
      "chapterTitle": "string",
      "era": "CONTEMPORARY",
      "durationSeconds": 900,
      "playCount": 3241,
      "rating": 4.8,
      "contextTitle": "string"
    }
  ]
}
```

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
    "durationSeconds": 900,
    "questions": [
      {
        "questionId": "string",
        "content": "string",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": 0,
        "orderIndex": 0,
        "explanation": "string"
      }
    ]
  }
}
```

> `correctAnswer` trả về ngay vì đây là app học tập (hiện đúng/sai sau mỗi câu).  
> FE sort questions theo `orderIndex` ASC.

---

### `POST /quizzes/submit`

**Request:**
```json
{
  "sessionId": "string",
  "answers": [
    { "questionId": "string", "selectedAnswer": 0 }
  ],
  "durationSeconds": 480
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "resultId": "string",
    "score": 8,
    "totalQuestions": 10,
    "percentage": 80,
    "correctAnswers": [0, 1, 2],
    "wrongAnswers": [3, 4]
  }
}
```

> `correctAnswers` / `wrongAnswers`: mảng **index** (0-based) trong danh sách questions.

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
        "resultId": "string",
        "quizId": "string",
        "quizTitle": "string",
        "score": 8,
        "totalQuestions": 10,
        "percentage": 80,
        "durationSeconds": 480,
        "completedAt": "ISO8601"
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

---

## 8. Quiz — Staff/Admin

> Tất cả endpoint dưới yêu cầu role `STAFF` hoặc `ADMIN`.

### Object `StaffQuizSet`

```typescript
{
  quizId: string
  title: string
  description: string
  grade: number            // 10 | 11 | 12
  chapterNumber: number
  chapterTitle: string
  era: "ANCIENT" | "MEDIEVAL" | "MODERN" | "CONTEMPORARY"
  durationSeconds: number
  playCount: number
  rating: number
  contextId: string
  contextTitle: string
  createdBy: string
  createdDate: string      // ISO8601
  updatedDate: string      // ISO8601
  deletedAt: string | null
  questions: QuizQuestion[]
}
```

---

### `GET /staff/quizzes`

**Query params:**

| Param | Type | Mô tả |
|---|---|---|
| `search` | string | Tìm theo title |
| `grade` | number | 10 \| 11 \| 12 |
| `era` | string | Era enum |
| `page` | number | 0-indexed |
| `size` | number | Số item/trang |

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "content": [ "StaffQuizSet..." ],
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

**Response `200`:** `{ "success": true, "data": StaffQuizSet }`

---

### `POST /staff/quizzes`

**Request:**
```json
{
  "title": "string",
  "description": "string",
  "contextId": "string",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string",
  "era": "CONTEMPORARY",
  "durationSeconds": 900,
  "questions": [
    {
      "content": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "orderIndex": 0,
      "explanation": "string"
    }
  ]
}
```

**Response `200`:** `{ "success": true, "data": StaffQuizSet }`

---

### `PUT /staff/quizzes/:quizId`

Cập nhật metadata (không bao gồm questions).

**Request:** Partial — tất cả field đều optional:
```json
{
  "title": "string",
  "description": "string",
  "contextId": "string",
  "grade": 12,
  "chapterNumber": 1,
  "chapterTitle": "string",
  "era": "CONTEMPORARY",
  "durationSeconds": 900
}
```

**Response `200`:** `{ "success": true, "data": StaffQuizSet }`

---

### `DELETE /staff/quizzes/:quizId`

Permanent delete. Response `200`.

---

### `PATCH /staff/quizzes/:quizId/soft-delete`

Soft delete — set `deletedAt`. Response `200`.

---

### `PATCH /staff/quizzes/:quizId/restore`

Khôi phục quiz đã soft-delete. Response `200`.

---

### `POST /staff/quizzes/:quizId/questions`

Thêm câu hỏi vào quiz.

**Request:**
```json
{
  "content": "string",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 0,
  "orderIndex": 0,
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

3. **Character image field:** Phải trả `image` (không phải `imageUrl`). FE dùng `raw.image ?? raw.imageUrl`.

4. **Character contextId:** Phải nằm trong `context.contextId` (nested object), không phải flat `contextId`.

5. **Chat history fields:** Group dùng `contextId` + `contextName`. Session dùng `characterImage` (không phải `characterImageUrl`).

6. **Era enum:** Backend nhận và trả **UPPERCASE** (`ANCIENT`, `MEDIEVAL`, `MODERN`, `CONTEMPORARY`). FE tự convert lowercase cho UI.

7. **Category enum:** Backend nhận và trả **UPPERCASE** (`WAR`, `POLITICS`, `CULTURE`, `SCIENCE`, `RELIGION`, `OTHER`).

8. **Pagination:** `currentPage` là **0-indexed**. FE gửi `page=0` cho trang đầu.

9. **Quiz /quizzes (GET):** Backend trả `data` là **array trực tiếp** (không pagination object). FE tự wrap.

10. **MessageRole:** Phải là `USER` và `ASSISTANT` (UPPERCASE) — không phải `user`/`assistant`.

### Datetime

- Tất cả datetime dùng **ISO 8601 UTC**: `"2026-05-22T14:30:00Z"`
- `createdDate` / `updatedDate` (Staff Quiz) — cùng format ISO 8601.

### Soft Delete pattern

- Thêm `deletedAt: datetime (nullable)` vào `Character`, `HistoricalContext`, `Quiz`, `QuizQuestion`.
- Mọi GET query filter `WHERE deletedAt IS NULL` mặc định.
- PATCH `/soft-delete` set `deletedAt = now()`.
- PATCH `/restore` set `deletedAt = null`.

### Role check

- `/staff/*` endpoints: check `role IN ('STAFF', 'ADMIN')` từ JWT → `403` nếu không đủ quyền.
- `POST /auth/register-staff`: chỉ `ADMIN` được gọi.