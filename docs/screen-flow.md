# Screen Flow theo Role — HistoryTalk FE

Tài liệu mô tả luồng màn hình của từng role, dựng từ code hiện tại:

- Phân quyền route: [src/middlewares/auth.middleware.ts](../src/middlewares/auth.middleware.ts), [src/components/context/customer-route-guard.tsx](../src/components/context/customer-route-guard.tsx)
- Trang chủ mỗi role: `ROLE_HOME` trong [src/constants/roles.ts](../src/constants/roles.ts)
- Menu sidebar + menu nhanh "Tạo": [src/routers/sidebar.ts](../src/routers/sidebar.ts)
- Danh sách route: [src/constants/routes.ts](../src/constants/routes.ts)

## 0. Tổng quan

| Role | Nhãn | Trang chủ sau đăng nhập | Khu vực được phép |
|---|---|---|---|
| Khách (chưa đăng nhập) | — | `/` (landing) | Marketing, `/events`, `/characters`, `/quiz`, `/map`… (xem catalog) |
| `CUSTOMER` | Người dùng | `/home` | App học (B2C), mua gói |
| `SCHOOL_STUDENT` | Học sinh | `/classes` | App học + không gian lớp học |
| `TEACHER` | Giáo viên | `/teaching` | App học + công cụ giảng dạy |
| `SCHOOL_ADMIN` | Quản trị trường | `/school` | Chỉ `/school/**` |
| `CONTENT_ADMIN` | Quản trị nội dung | `/staff` | `/staff/**` trừ `/staff/admin/**` |
| `SYSTEM_ADMIN` | Quản trị hệ thống | `/staff/admin` | Chỉ `/staff/admin/**` |

### Quy tắc redirect chung (middleware)

| Điều kiện | Kết quả |
|---|---|
| Chưa đăng nhập, vào `/staff`, `/school`, `/chat/*`, `/profile`, `/classes`, `/teaching`, `/assignments`, `/grades` | → `/login` |
| Đã đăng nhập, vào `/login`, `/register`, `/forgot-password` hoặc `/` | → trang chủ của role |
| `CONTENT_ADMIN` / `SYSTEM_ADMIN` vào trang ngoài `/staff` | → trang chủ của role |
| `CONTENT_ADMIN` vào `/staff/admin/**` | → `/staff` |
| `SYSTEM_ADMIN` vào `/staff/**` ngoài `/staff/admin` | → `/staff/admin` |
| `SCHOOL_ADMIN` vào trang ngoài `/school` | → `/school` |
| Customer / Teacher / Student vào `/staff` hoặc `/school` | → trang chủ của role |
| Teacher / Student vào `/pricing` hoặc `/payment/**` | → trang chủ của role (tài khoản trường không mua gói) |
| Không phải Teacher/Student vào `/classes/**` | → `/home` |
| Không phải Teacher vào `/teaching/**` | → trang chủ của role |
| Không phải Student vào `/assignments/**` | → trang chủ của role |
| Không phải Student/Customer vào `/grades` | → trang chủ của role |

## 1. Xác thực (dùng chung mọi role)

```mermaid
flowchart LR
  Landing["/ Landing"] --> Login["/login"]
  Landing --> Register["/register"]
  Login --> Forgot["/forgot-password"]
  Forgot -->|"link trong email"| Reset["/reset-password"]
  Reset --> Login
  Register --> Login
  Login -->|"Google OAuth"| GSuccess["/auth/google/success"]
  Login -->|"Google OAuth lỗi"| GFail["/auth/google/failure"] --> Login
  Login -->|"thành công"| RoleHome{{"ROLE_HOME theo role"}}
  GSuccess --> RoleHome
  RoleHome --> H1["/home — Customer"]
  RoleHome --> H2["/classes — Student"]
  RoleHome --> H3["/teaching — Teacher"]
  RoleHome --> H4["/school — School Admin"]
  RoleHome --> H5["/staff — Content Admin"]
  RoleHome --> H6["/staff/admin — System Admin"]
```

- Đăng nhập Google lần đầu: thông báo gợi ý đặt mật khẩu → `/profile?tab=security`.
- Đăng xuất (dropdown người dùng) → `/`.

## 2. Khách (chưa đăng nhập)

```mermaid
flowchart LR
  Landing["/ Landing"] --> About["/about"]
  Landing --> Features["/features"]
  Landing --> Pricing["/pricing"]
  Pricing -->|"Đăng ký"| Register["/register"]
  Landing -->|"Khám phá"| Home["/home"]
  Home --> Events["/events"]
  Home --> Characters["/characters"]
  Home --> Quiz["/quiz"]
  Home --> Map["/map"]
  Characters -->|"Trò chuyện"| LoginReq["/login (bắt buộc đăng nhập)"]
  Events -->|"Trò chuyện / Nâng cấp"| LoginReq
```

Khách xem được catalog; mọi hành động cần tài khoản (chat, nâng cấp Pro, lưu ghi chú bản đồ) đều yêu cầu đăng nhập.

## 3. Customer (`CUSTOMER`) — người học B2C

**Sidebar**
- *Menu*: Trang chủ `/home` · Sự kiện lịch sử `/events` · Nhân vật `/characters` · Lịch sử trò chuyện `/chat-history` · Câu đố lịch sử `/quiz` · Bản đồ lịch sử `/map`
- *Account*: Tiến độ học tập `/grades` · Hồ sơ `/profile`
- Chân sidebar: nút nâng cấp Pro (dialog chọn gói)

```mermaid
flowchart TD
  Home["/home"] --> Events["/events"]
  Home --> Characters["/characters"]
  Home --> ChatHistory["/chat-history"]
  Home --> Quiz["/quiz"]
  Home -->|"Nhiệm vụ hằng ngày"| Quest["route của nhiệm vụ"]

  Events -->|"chọn sự kiện"| EventDrawer["/events?event=:id (drawer chi tiết)"]
  EventDrawer -->|"Làm câu đố"| QuizCtx["/quiz?contextId=:id"]
  EventDrawer -->|"chọn nhân vật"| Chat["/chat/:characterId"]

  Characters -->|"Trò chuyện"| Chat
  ChatHistory -->|"mở hội thoại"| Chat
  Chat -->|"panel phải: bối cảnh"| EventDrawer
  Chat -->|"panel phải: câu đố"| QuizDo["/quiz/:quizId"]

  Quiz --> QuizDo
  Quiz -->|"Lịch sử"| QuizHist["/quiz?view=history"]
  QuizDo -->|"Kết quả"| QuizResult["Màn kết quả"]
  QuizResult --> Quiz
  QuizResult --> QuizHist

  Map["/map"] -->|"chọn địa danh"| Room["/map/room/:roomId"]
  Room -->|"Xem sự kiện"| EventDrawer
  Room -->|"Làm câu đố"| QuizCtx
  Room --> Map

  Grades["/grades"] --> Chat
  Grades --> Quiz

  Profile["/profile"] --> PTab1["?tab=profile"]
  Profile --> PTab2["?tab=billing"]
  Profile --> PTab3["?tab=security"]
```

**Luồng mua gói**

```mermaid
flowchart LR
  Upgrade["Dialog Nâng cấp Pro (sidebar) / /profile?tab=billing"] -->|"chọn gói"| Gateway["Cổng thanh toán (checkoutUrl)"]
  Gateway -->|"thành công"| Success["/payment/success"]
  Gateway -->|"huỷ"| Cancel["/payment/cancel"]
  Success --> Home["/home"]
  Success --> Profile["/profile"]
  Cancel --> Home
  Profile -.-> History["/payment/history"]
```

## 4. Học sinh trường (`SCHOOL_STUDENT`)

**Sidebar**
- *Không gian lớp học* (hiển thị tên trường): Lớp học `/classes` · Bài tập `/assignments` · Kho tư liệu `/classes/materials` (gồm `/map/class`) · Bảng điểm `/grades`
- *HistoryTalk*: Sự kiện lịch sử `/events` · Nhân vật `/characters` · Câu đố lịch sử `/quiz` · Bản đồ trận đánh `/map`
- *Account*: Lịch sử trò chuyện `/chat-history` · Hồ sơ `/profile`
- Không được vào `/pricing`, `/payment/**`; nút nâng cấp chỉ hiện gợi ý.

```mermaid
flowchart TD
  Classes["/classes (trang chủ)"] -->|"chọn lớp"| ClassDetail["/classes/:classId"]
  ClassDetail --> TabA["Tab Bài tập"]
  ClassDetail --> TabM["Tab Tư liệu"]
  ClassDetail --> TabG["Tab Điểm"]
  TabA --> AssignDetail["/assignments/:id"]
  TabM -->|"tư liệu giáo viên soạn"| LocalContent["/classes/:classId/local/:contentId"]
  LocalContent --> ClassDetail
  ClassDetail --> ClassMap["/map/class"]
  ClassDetail --> Grades["/grades"]

  Assignments["/assignments"] --> AssignDetail
  Assignments --> Grades
  AssignDetail -->|"Đọc bối cảnh"| MatDetail["/classes/materials/context/:id"]
  AssignDetail -->|"Trò chuyện nhân vật"| Chat["/chat/:characterId"]
  AssignDetail -->|"Kiểm tra"| QuizDo["/quiz/:quizId"]
  AssignDetail -->|"Bối cảnh trên bản đồ"| ClassMap

  Materials["/classes/materials"] --> MatDetail
  Materials --> MatChar["/classes/materials/character/:id"]
  Materials --> ClassMap
  Materials --> Events["/events"]
  Materials --> Characters["/characters"]
  Materials --> Quiz["/quiz"]
  MatChar -->|"Trò chuyện"| Chat
  ClassMap -->|"chọn ghim"| MatDetail

  Grades -->|"chọn bài"| AssignDetail

  Chat -.->|"hết token"| Boost["Dialog xin thêm token (gửi giáo viên)"]
```

Thư viện HistoryTalk (`/events`, `/characters`, `/quiz`, `/map`, `/chat-history`) dùng chung luồng với Customer ở mục 3.

## 5. Giáo viên (`TEACHER`)

**Sidebar**
- *Không gian lớp học*: Tổng quan `/teaching` · Lớp học `/classes` · Bài tập `/teaching/assignments` · Soạn tư liệu `/teaching/local` (gồm `/map/class`) · Yêu cầu token `/teaching/token-requests`
- *HistoryTalk*: Sự kiện lịch sử · Nhân vật · Câu đố lịch sử · Bản đồ trận đánh
- *Account*: Lịch sử trò chuyện · Hồ sơ
- **Menu nhanh "Tạo"**: Bài tập `/teaching/assignments/new` · Bối cảnh lịch sử `/teaching/local/new?kind=CONTEXT` · Nhân vật lịch sử `/teaching/local/new?kind=CHARACTER` · Bộ đề `/teaching/local/quizzes/new`

### 5.1 Lớp học & bài tập

```mermaid
flowchart TD
  Teaching["/teaching (Tổng quan, ?classId=)"] -->|"chọn lớp"| ClassDetail["/classes/:classId"]
  Teaching --> TAssign["/teaching/assignments"]
  Teaching --> TokenReq["/teaching/token-requests"]

  Classes["/classes"] --> ClassDetail
  ClassDetail --> TabA["Tab Bài tập"]
  ClassDetail --> TabS["Tab Học sinh"]
  ClassDetail --> TabT["Tab Thống kê"]
  TabA --> AssignDetail["/teaching/assignments/:id"]
  TabA -->|"Giao bài"| NewAssign["/teaching/assignments/new?classId="]
  TabT --> TokenReq
  ClassDetail --> ClassMap["/map/class"]
  ClassDetail --> Local["/teaching/local"]

  TAssign -->|"?classId= lọc lớp"| TAssign
  TAssign --> AssignDetail
  TAssign --> NewAssign
  AssignDetail --> ClassDetail
  AssignDetail --> TAssign

  NewAssign -->|"Wizard: chọn lớp → loại → nội dung → hạn nộp"| Created["Tạo xong"]
  Created --> AssignDetail
  NewAssign -.->|"chưa có nội dung"| LocalNew["/teaching/local/new?kind="]
  NewAssign -.->|"soạn bộ đề mới (returnTo)"| QuizNew["/teaching/local/quizzes/new"]
  QuizNew -.->|"quay lại kèm targetId"| NewAssign
```

Loại bài tập: Đọc bối cảnh · Trò chuyện với nhân vật · Kiểm tra (bộ đề).

### 5.2 Soạn tư liệu (local content)

```mermaid
flowchart TD
  Local["/teaching/local"] -->|"Tạo"| LocalNew["/teaching/local/new?kind=CONTEXT|CHARACTER"]
  Local -->|"Sửa"| LocalEdit["/teaching/local/:id?kind="]
  Local --> Trash["/teaching/local/trash"]
  Local -->|"Xem bối cảnh"| Events["/events"]
  Local -->|"Thử chat"| Chat["/chat/:characterId"]
  Local -->|"Giao bài"| NewAssign["/teaching/assignments/new"]
  Local --> ClassMap["/map/class"]

  LocalNew -->|"Lưu"| LocalEdit
  LocalEdit -->|"Xoá / Quay lại"| Local
  LocalEdit -->|"Bộ đề của bối cảnh"| QuizEdit["/teaching/local/quizzes/:quizId"]
  LocalEdit -->|"Thêm bộ đề"| QuizNew["/teaching/local/quizzes/new?contextId="]
  LocalEdit -->|"Ghim trận đánh"| ClassMap

  QuizNew -->|"Tạo"| QuizEdit
  QuizEdit -->|"Quay lại"| LocalEdit
  QuizEdit -->|"Giao bài"| NewAssign
  Trash -->|"Khôi phục"| Local
  ClassMap -->|"ghim của mình"| LocalEdit
```

Trạng thái tư liệu có thể bị School Admin đổi (ẩn / trả lại giáo viên) — xem mục 6.

### 5.3 Yêu cầu token

`/teaching/token-requests`: duyệt / từ chối yêu cầu xin thêm token hằng ngày của học sinh (gửi từ màn chat, mục 4).

## 6. Quản trị trường (`SCHOOL_ADMIN`)

**Sidebar**
- *Trường học*: Tổng quan `/school` · Lớp học `/school/classes` · Giám sát nội dung `/school/content`
- *Tài khoản*: Giáo viên `/school/teachers` · Học sinh `/school/students`
- *Cấu hình*: Hạn mức token `/school/tokens`

```mermaid
flowchart TD
  School["/school (Tổng quan)"] --> SClasses["/school/classes"]
  School --> SContent["/school/content"]
  School --> STeachers["/school/teachers"]
  School --> SStudents["/school/students"]
  School --> STokens["/school/tokens"]

  SClasses -->|"chọn lớp"| SClassDetail["/school/classes/:classId"]
  SClassDetail --> SClasses
  SClasses -.->|"Tạo / sửa lớp, gán giáo viên"| SClasses

  STeachers -.->|"Tạo / khoá / import tài khoản"| STeachers
  SStudents -.->|"Tạo / khoá / import tài khoản"| SStudents

  SContent -->|"Hiển thị lại"| C1["ACTIVE"]
  SContent -->|"Ẩn với học sinh"| C2["INACTIVE"]
  SContent -->|"Trả lại giáo viên"| C3["DRAFT"]

  STokens -.->|"Phân bổ hạn mức"| STokens
```

Mọi URL ngoài `/school/**` đều bị đưa về `/school`.

## 7. Quản trị nội dung (`CONTENT_ADMIN`)

**Sidebar** *Content Admin*: Tổng quan `/staff` · Bối cảnh `/staff/contexts` · Bản đồ lịch sử `/staff/map` · Nhân vật `/staff/characters` · Tài liệu `/staff/documents` · Bộ đề `/staff/quizzes` · Nhiệm vụ hằng ngày `/staff/quests`

**Menu nhanh "Tạo"**: Bối cảnh `/staff/contexts/create` · Nhân vật `/staff/characters/create` · Bộ đề `/staff/quizzes?create=1`

```mermaid
flowchart TD
  Staff["/staff (Tổng quan)"] --> Contexts["/staff/contexts"]
  Staff --> Characters["/staff/characters"]
  Staff --> Quizzes["/staff/quizzes"]

  Contexts -->|"Tạo"| CtxCreate["/staff/contexts/create"]
  CtxCreate -->|"Lưu"| CtxDetail["/staff/contexts/:id"]
  Contexts -->|"chọn dòng"| CtxDetail
  CtxDetail -->|"nhân vật thuộc bối cảnh"| CharDetail["/staff/characters/:id"]
  CtxDetail -->|"Quay lại / xoá"| Contexts

  Characters -->|"Tạo"| CharCreate["/staff/characters/create"]
  CharCreate -->|"Lưu"| CharDetail
  Characters -->|"chọn dòng"| CharDetail
  Characters -->|"xem bối cảnh"| EventPreview["/events?event=:id"]
  CharDetail -->|"Quay lại / xoá"| Characters

  Quizzes -->|"?create=1"| QuizDialog["Dialog tạo bộ đề"]
  Map["/staff/map"] -.->|"Ghim trận đánh / địa danh"| Map
  Map -->|"Đóng"| Staff
  Documents["/staff/documents"] -.->|"Tải lên / xem tài liệu của bối cảnh & nhân vật"| Documents
  Quests["/staff/quests"] -.->|"CRUD nhiệm vụ hằng ngày"| Quests
```

## 8. Quản trị hệ thống (`SYSTEM_ADMIN`)

**Sidebar**
- *Dashboard*: Tổng quan `/staff/admin`
- *Tài khoản*: Customer `/staff/admin/accounts/customer` · Content Admin `/staff/admin/accounts/content-admin`
- *Gói trường học*: Trường & School Admin `/staff/admin/schools`
- *Hệ thống*: Gói dịch vụ `/staff/admin/subscriptions` · Lịch sử giao dịch `/staff/admin/payment/history`

**Menu nhanh "Tạo"**: Trường học `/staff/admin/schools/new`

```mermaid
flowchart TD
  Admin["/staff/admin (Tổng quan)"] --> AccCus["/staff/admin/accounts/customer"]
  Admin --> AccSys["/staff/admin/accounts/system-admin"]
  Admin -.-> AccCA["/staff/admin/accounts/content-admin"]
  Admin -.-> Subs["/staff/admin/subscriptions"]
  Admin -.-> Pay["/staff/admin/payment/history"]
  Admin -.-> Schools["/staff/admin/schools"]

  Schools -->|"Tạo trường"| SchoolNew["/staff/admin/schools/new"]
  Schools -->|"chọn trường"| SchoolDetail["/staff/admin/schools/:schoolId"]
  SchoolNew -->|"Tạo trường + gói + tài khoản School Admin"| SchoolDetail
  SchoolNew -->|"Huỷ"| Schools
  SchoolDetail --> TabInfo["Tab Thông tin"]
  SchoolDetail --> TabAdmins["Tab Quản trị trường"]
  SchoolDetail --> Schools
```

Mũi tên nét đứt: điều hướng qua sidebar.

## 9. Ghi chú: link trỏ tới route không có trang

Phát hiện khi đọc code, nên kiểm tra lại:

- `ROUTES.CHARACTER_DETAIL(id)` → `/characters/:id`: không có trang tương ứng (hiện không nơi nào dùng).
- `ROUTES.STAFF.TRASH` (`/staff/trash`): chưa có trang.
- `/staff/admin/accounts/system-admin`: có trang (dynamic `[role]`), chỉ vào được từ Tổng quan, không có trong sidebar.
- `/library`, `/saved` có trang nhưng đang ẩn khỏi sidebar (MVP).
