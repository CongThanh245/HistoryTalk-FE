# CHUẨN HÓA PHÂN TRANG TOÀN HỆ THỐNG (1-BASED PAGINATION CONTRACT)

> **Trạng thái:** ACTIVE & APPLIED  
> **Phạm vi áp dụng:** Toàn bộ REST API & Swagger UI của HistoryTalk (Backend Java Spring Boot & Frontend Next.js)  
> **Nguyên tắc cốt lõi:** **1-Based Indexing** cho cả Request Parameters, Swagger Docs và JSON Response Metadata.

---

## 1. BỐI CẢNH & NGUYÊN DO CHUẨN HÓA

### Vấn đề trước đây (Inconsistency & Discrepancy)
1. **Lệch pha Swagger & Response:** Ở một số API dùng trực tiếp `Pageable` của Spring Data (VD: `GET /api/v1/chat/scenarios`), Swagger hiển thị mặc định `page=0` (`Zero-based page index 0..N`), nhưng Response trả về lại tự ý `+ 1` thành `"page": 1`. Điều này gây nhầm lẫn khi test và integration.
2. **Không đồng nhất giữa các Module:**
   - Các API công khai (`/api/v1/characters`, `/api/v1/historical-contexts`): FE gửi `page=1` (1-based), BE nhận và trả `currentPage=1`.
   - Các API quản trị / nội bộ (`/api/v1/quizzes`, `/api/v1/payment/history`, `/admin/schools`): BE nhận `page=0`, trả `currentPage=0`, buộc FE phải tự `page + 1` khi hiển thị UI.

### Quyết định kỹ thuật
Hệ thống chính thức chuyển **100% các API phân trang sang chuẩn 1-BASED INDEX**:
* Trang đầu tiên luôn là **`page = 1`**.
* Request: Client truyền `?page=1` để lấy trang 1.
* Response: `pagination.page: 1` và `currentPage: 1` cho trang 1.
* Swagger UI: Hiển thị `One-based page index (1..N)` với default value là `1`.

---

## 2. QUY CHUẨN REQUEST CONTRACT (CLIENT $\rightarrow$ SERVER)

### 2.1. Query Parameters
Mọi API có hỗ trợ phân trang đều sử dụng 2 tham số query chuẩn:
* **`page`** (`integer`, tùy chọn, default: `1`):
  * Số thứ tự trang cần lấy, **bắt đầu từ 1** (`1..N`).
  * Nếu không truyền hoặc truyền $\le 1$, Backend mặc định lấy trang đầu tiên (`page = 1`).
* **`size`** / **`limit`** (`integer`, tùy chọn, default: tùy theo endpoint, thường là `10` hoặc `20`):
  * Số lượng bản ghi tối đa trên một trang.

### 2.2. Ví dụ Request URL
```http
# Lấy trang đầu tiên (Trang 1)
GET /api/v1/chat/scenarios?page=1&size=20
GET /api/v1/quizzes?page=1&size=10
GET /api/v1/historical-contexts?page=1&limit=6

# Lấy trang thứ hai (Trang 2)
GET /api/v1/chat/scenarios?page=2&size=20
```

---

## 3. QUY CHUẨN RESPONSE CONTRACT (SERVER $\rightarrow$ CLIENT)

Tất cả các API phân trang trả về một trong hai cấu trúc dữ liệu chuẩn dưới đây:

### 3.1. Cấu trúc Standard Envelope (`PaginatedApiResponse`)
Áp dụng cho các API Chat Scenarios, Classrooms, Assignments, Schools,...:
```json
{
  "success": true,
  "message": "Scenarios retrieved successfully",
  "data": [
    { "scenarioId": "...", "characterName": "Đại tướng Võ Nguyên Giáp", ... }
  ],
  "pagination": {
    "page": 1,           // Trang hiện tại (1-based, luôn >= 1)
    "size": 20,          // Kích thước trang
    "totalElements": 18, // Tổng số bản ghi thực tế
    "totalPages": 1,     // Tổng số trang
    "hasNext": false,    // Có trang kế tiếp hay không
    "hasPrevious": false // Có trang trước đó hay không
  },
  "timestamp": "2026-11-05T14:30:00.000",
  "errorCode": null
}
```

### 3.2. Cấu trúc Data Page Envelope (`PaginatedResponse`)
Áp dụng cho Quiz, Payment Orders, Users,...:
```json
{
  "success": true,
  "message": "Quizzes retrieved successfully",
  "data": {
    "content": [ ... ],
    "totalElements": 45,
    "totalPages": 5,
    "currentPage": 1,    // Trang hiện tại (1-based, luôn >= 1)
    "pageSize": 10,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

## 4. HƯỚNG DẪN DÀNH CHO FRONTEND (FE GUIDELINES)

1. **State quản lý số trang:**
   - Khởi tạo state trang: `const [page, setPage] = useState(1);` (thay vì `0`).
   - Nút Previous: `Math.max(1, page - 1)`.
   - Nút Next: `Math.min(totalPages, page + 1)`.
2. **Hiển thị nhãn trên giao diện:**
   - Không cần cộng thêm 1: `Trang ${page} / ${totalPages}` (hoặc `Trang ${data.pagination.page} / ${data.pagination.totalPages}`).
3. **TanStack Table / UI Thư viện sử dụng 0-based pageIndex:**
   - Nếu component UI (như `TablePagination`) sử dụng `pageIndex` theo thang `0..N-1`:
     - Khi truyền vào API call: `params: { page: pageIndex + 1, size }`.
     - Khi nhận Response từ API: `pageIndex = (res.pagination?.page ?? 1) - 1`.

---

## 5. DANH SÁCH ENDPOINTS ĐÃ ĐỒNG BỘ 1-BASED TRÊN BACKEND

| Phân hệ | Endpoint | Parameter Page | Response Page Field |
| :--- | :--- | :--- | :--- |
| **Chat** | `GET /api/v1/chat/scenarios` | `page` (default 1) | `pagination.page = 1` |
| **Character** | `GET /api/v1/characters` | `page` (default 1) | `data.currentPage = 1` |
| **Historical Context** | `GET /api/v1/historical-contexts` | `page` (default 1) | `data.currentPage = 1` |
| **Quiz** | `GET /api/v1/quizzes/results/me`<br>`GET /api/v1/staff/quizzes`<br>`GET /api/v1/staff/question-bank` | `page` (default 1) | `data.currentPage = 1` |
| **Assignment** | `GET /api/v1/student/assignments/my`<br>`GET /api/v1/teacher/assignments` | `page` (default 1) | `pagination.page = 1` |
| **Classroom** | `GET /api/v1/classrooms`<br>`GET /api/v1/classrooms/{id}/students` | `page` (default 1) | `pagination.page = 1` |
| **School Admin** | `GET /api/v1/school-admin/students`<br>`GET /api/v1/school-admin/teachers`<br>`GET /api/v1/admin/schools` | `page` (default 1) | `pagination.page = 1` |
| **Payment** | `GET /api/v1/payment/history` | `page` (default 1) | `data.currentPage = 1` |
| **User Admin** | `GET /api/v1/admin/users` | `page` (default 1) | `data.currentPage = 1` |
