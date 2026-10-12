# B2B gói trường học — nhu cầu của System Admin & việc còn tồn

> Ghi chú để làm sau (chưa commit). Cập nhật: 12/10/2026 (sau khi BE push API CRUD tài khoản, PR #111).
> Phạm vi: System Admin vận hành các trường liên kết (B2B), tài khoản School Admin và quỹ token AI.

**Lưu ý tên gọi:** tài khoản cấp cho trường là **School Admin** (`SCHOOL_ADMIN`), không phải Content Admin. `CONTENT_ADMIN` là role nội bộ của HistoryTalk (quản lý nội dung chính thức). Tài liệu BA nên dùng đúng tên để BE không phân quyền nhầm.

**Kết luận nhanh:** BE mới có phần **khởi tạo** (tạo trường, cấp School Admin, cấp quỹ token một lần). Còn thiếu gần hết phần **vận hành sau khi ký hợp đồng**, nặng nhất là token AI (chi phí tiền thật).

---

## 1. Vòng đời một trường B2B

| Giai đoạn | System Admin cần làm | Hiện có (BE main, 10/2026) |
|---|---|---|
| Ký hợp đồng, onboarding | Tạo trường với thông tin pháp lý (mã số thuế, người đại diện, cấp học), hợp đồng (ngày bắt đầu/kết thúc, gói), số học sinh tối đa | Có tên, mã, địa chỉ, liên hệ, gói, cam kết lịch sử địa phương. **Thiếu** ngày hợp đồng, giới hạn số học sinh, thông tin xuất hóa đơn |
| Bàn giao tài khoản | Tạo School Admin; đổi người phụ trách khi cán bộ trường nghỉ; khóa tài khoản cũ; đặt lại mật khẩu | **Đã đủ** (PR #111): danh sách, sửa, khóa/mở khóa, xóa, đặt lại mật khẩu. FE đã tích hợp |
| Vận hành | Theo dõi trường dùng bao nhiêu token, nạp thêm, cảnh báo sắp hết | Gần như chưa có (xem mục 2) |
| Gia hạn, đổi gói | Gia hạn hợp đồng, nâng/hạ gói (thay đổi quỹ) | Chưa có |
| Ngừng dịch vụ | Tạm ngưng khi hết hạn/chưa thanh toán; quy định học sinh còn đăng nhập/xem được gì | Có field `status` (ACTIVE/INACTIVE/SUSPENDED) nhưng **không có API đổi**, chưa định nghĩa tác động |
| Chấm dứt hợp đồng | Xuất dữ liệu trả trường; xóa dữ liệu cá nhân học sinh | Chưa có. Học sinh là trẻ vị thành niên, phải tuân thủ **Nghị định 13/2023/NĐ-CP** |

## 2. Token AI — phần System Admin cần quan tâm nhất

Hiện BE chỉ theo dõi **token đã chia cho học sinh** (`allocated`), không theo dõi **token đã thực sự dùng**. Hai số này khác nhau rất xa.

### 2.1. BA cần chốt mô hình

| | A. Chia trước vào ví từng học sinh (BE đang làm) | B. Quỹ chung + giới hạn mỗi ngày cho từng học sinh |
|---|---|---|
| Cách chạy | Import học sinh → mỗi em nhận sẵn N token, trừ vào quỹ trường | Học sinh dùng thẳng từ quỹ trường, mỗi em tối đa X token/ngày |
| Ưu | Đơn giản | Không "chôn" token ở em không học; công bằng; khớp chữ "token/tháng" |
| Nhược | Token nằm chết trong ví; em học nhiều hết sớm; cần cơ chế thu hồi | BE phải trừ quỹ theo thời gian thực |

Đề xuất nghiêng về **B**, nhưng đây là quyết định kinh doanh, cần BA chốt.

### 2.2. Dù chọn mô hình nào, System Admin cũng cần

- [ ] **Tiêu thụ thực tế** theo trường, theo ngày/tháng; quy ra **chi phí ước tính (VND)** để so với giá trị hợp đồng.
- [ ] **Nạp thêm / điều chỉnh quỹ**, bắt buộc ghi lý do, có lịch sử (ai, bao nhiêu, khi nào).
- [ ] **Quy tắc chu kỳ:** quỹ có nạp lại hằng tháng không? Token thừa có cộng sang tháng sau không? (Hiện code BE chỉ cấp **một lần** lúc tạo trường, không có tác vụ định kỳ, dù doc ghi "token/tháng".)
- [ ] **Hành vi khi hết quỹ:** chặn chat / chuyển model rẻ hơn / cho vượt rồi tính phí sau.
- [ ] **Cảnh báo** khi trường còn dưới 20% quỹ; cảnh báo bất thường (một tài khoản dùng gấp nhiều lần bình thường).
- [ ] **Token của giáo viên và School Admin** trừ vào quỹ trường hay quỹ riêng?
- [ ] **Thu hồi token** khi học sinh nghỉ học / bị khóa (với mô hình A).

## 3. Nhu cầu khác của System Admin

- [ ] **Nhật ký thao tác** (tạo, khóa, nạp token, đổi gói) — cần khi tranh chấp với trường.
- [ ] **Dashboard tổng:** số trường hoạt động, sắp hết hạn trong 30 ngày, token tiêu thụ tháng, chi phí AI so với doanh thu.
- [ ] **Gỡ nội dung lịch sử địa phương** vi phạm do trường đăng (công ty vẫn chịu trách nhiệm pháp lý).

## 4. Thứ tự ưu tiên đề xuất

**Nên có ngay (sprint gần nhất):**
1. ~~Xem danh sách, khóa/mở khóa, đặt lại mật khẩu School Admin.~~ (BE đã làm, FE đã tích hợp)
2. Tạm ngưng/kích hoạt trường + định nghĩa tác động lên tài khoản của trường.
3. Chốt mô hình token (A/B) và chu kỳ nạp lại.
4. Nạp thêm / điều chỉnh quỹ, có lý do và lịch sử.
5. Ghi nhận token đã dùng thực tế theo trường.

**Sau đó:**

6. Ngày hợp đồng, giới hạn số học sinh, cảnh báo sắp hết hạn.
7. Dashboard chi phí AI, cảnh báo bất thường.
8. Nhật ký thao tác.
9. Xuất/xóa dữ liệu khi chấm dứt hợp đồng.

---

## 5. Việc gửi BE (từ đợt tích hợp Sprint 5)

### 5.1. CRUD tài khoản — BE đã làm đủ (PR #111), FE đã tích hợp

| Task | Trạng thái |
|---|---|
| System Admin CRUD School Admin | Danh sách theo trường, sửa, khóa/mở khóa, xóa, đặt lại mật khẩu — xong |
| School Admin CRUD Teacher | Danh sách, sửa, khóa/mở khóa, xóa, đặt lại mật khẩu — xong |
| School Admin CRUD Student | Danh sách, chi tiết, sửa, khóa/mở khóa, xóa, đặt lại mật khẩu, cấp token, tải file mẫu — xong |

**Lỗi / thiếu sót của đợt API này (cần báo BE):**
- [ ] **Xóa = khóa** ở cả School Admin, giáo viên, học sinh: `DELETE` và `PUT /status {active:false}` đều chỉ ghi `deletedAt`. Tài khoản "đã xóa" vẫn hiện là "Đã khóa" và mở khóa lại được. Doc mô tả là hai thao tác khác nhau. (FE: ẩn nút Xóa ở dòng đã khóa, hộp xác nhận ghi rõ điều này.)
- [ ] **Không chặn khóa/xóa School Admin hoạt động cuối cùng** của trường phía server. FE đã chặn, nhưng hai System Admin thao tác cùng lúc vẫn có thể lọt.
- [ ] **Đặt lại mật khẩu** không kiểm tra tài khoản có đang bị khóa.
- [ ] **Sửa học sinh không xóa được** `dob`, `gender`, `email` (gửi null/rỗng bị bỏ qua, giữ giá trị cũ). Chỉ `phoneNumber` xóa được.
- [ ] **Xóa học sinh không trả token** trong ví về quỹ trường.
- [ ] **Cấp token** chấp nhận cả học sinh đang bị khóa; `số HS × token` tính bằng `int` có thể tràn số.
- [ ] Học sinh không có `studentCode` khi đặt lại mật khẩu nhận mật khẩu ngẫu nhiên, không theo `{mã HS}@2026`.

**Vẫn còn thiếu:**
- [ ] Response đăng nhập trả `mustChangePassword` + API đổi mật khẩu lần đầu (mọi tài khoản tạo ra đều có cờ này).
- [ ] Cho đăng nhập bằng `userName` (học sinh không có email đang phải dùng email ảo `…@saas.historytalk.vn`).
- [ ] `GET /admin/school-packages` trả danh sách gói (mã, tên, số token, chu kỳ) để FE khỏi chép cứng.
- [ ] Sửa / tạm ngưng / kích hoạt trường.

### 5.2. Lỗi trong phần đã làm

- [ ] `totalTokensAllocated` trong kết quả import học sinh luôn = 0 (`AbstractStudentImportProcessor` không gán).
- [ ] File CSV có BOM (Excel lưu "CSV UTF-8") → không nhận cột `student_code`, mã học sinh bị tự sinh mà không báo lỗi. Cần bỏ `﻿` khi đọc (vd. `BOMInputStream`).
- [ ] `errorCode` trả về là số (400…), không phải chuỗi như doc (`INSUFFICIENT_TOKEN_QUOTA`).
- [ ] Ghim bản đồ cá nhân: khi tạo không giới hạn độ dài `label`/`description` (khi sửa thì 200/5000).

### 5.3. Doc lệch với code

- `dob` thực tế bắt buộc (yyyy-MM-dd); chỉ nhận `.csv` dù endpoint tên `import-excel`; `gender` chỉ MALE/FEMALE.
- Mật khẩu dưới 6 ký tự → `<mã HS>@2026` (doc ghi chuỗi `Ht@…`).
- Tạo trường trả 409 khi trùng **tên** trường (doc không ghi).
- `createdAt` là `LocalDateTime`, không có múi giờ (doc ghi `...Z`).
- `TeacherSummaryDto` không có `userName`.
- Thông báo lỗi lẫn tiếng Anh và tiếng Việt.

### 5.4. Gamification (tồn từ trước)

- [ ] `POST /users/me/daily-check-in` và API gamification từ chối `SCHOOL_STUDENT`, `TEACHER` (403).
- [ ] `getToday` vẫn trả streak cũ sau khi người dùng bỏ một ngày.

### 5.5. Sprint sau (đã có trong kế hoạch BE)

- Import học sinh theo lớp; gán/chuyển học sinh vào lớp.
- Toàn bộ phần lớp học (tạm bỏ qua ở sprint này), kể cả các điểm đã thấy: `teacherId: null` không gỡ được giáo viên, `status` nhận chuỗi bất kỳ, `gradeLevel`/`academicYear` không validate, xóa giáo viên không gỡ khỏi lớp.
- Giáo viên giao bài tập (Sự kiện, Trò chuyện nhân vật, Test) cho lớp kèm deadline.
- Báo cáo cho giáo viên: bảng điểm bài Test, thống kê tần suất/số tin nhắn chat AI của học sinh.

---

## 6. Việc FE còn treo

- [ ] **FAKE UI — các màn đang GIỮ nhưng chạy bằng dữ liệu mẫu** (quyết định 12/10/2026: giữ lại, chờ API sprint sau). Trên giao diện có thanh vàng "Giao diện mẫu — dữ liệu giả, chưa kết nối API"; trong code có comment `// FAKE UI` (tìm nhanh: `grep -rn "FAKE UI" src`).

  | Màn | Route | Chờ API |
  |---|---|---|
  | Dashboard giáo viên | `/teaching` | Thống kê lớp, bài tập |
  | Bài tập (giáo viên) | `/teaching/assignments`, `/new`, `/[id]` | Giao bài tập kèm deadline, chấm bài |
  | Tư liệu lớp & trường (giáo viên) | `/teaching/local`, `/new`, `/[id]` | Nội dung lịch sử địa phương + duyệt |
  | Bài tập (học sinh) | `/assignments`, `/assignments/[id]` | Bài tập, nộp bài |
  | Bảng điểm (học sinh trường) | `/grades` (phần SCHOOL_STUDENT; phần Customer dùng API thật) | Bảng điểm bài Test |
  | Tư liệu lớp & trường (học sinh) | `/classes/materials`, `/classes/[classId]/local/[contentId]` | Nội dung địa phương |
  | Khối "Báo cáo hoạt động" | `/school` (phần dưới dashboard) | Thống kê chat AI, báo cáo lớp |

  Lưu ý: bộ chọn lớp trên `/teaching` và `/teaching/assignments` vẫn liệt kê **lớp mẫu**, không phải lớp thật từ API.
  Khi BE có API: thay store mẫu bằng API, bỏ comment `FAKE UI` và thanh `MockDataNotice` ở màn đó.
- [ ] (Tùy chọn) Viết spec API sprint sau dựa trên giao diện FE đã có, để BE làm khớp.
- [ ] Nhãn gói ("20 triệu token/tháng") đang chép cứng ở FE (`ENTERPRISE_PACKAGE_TOKENS` trong `src/services/school.service.ts`) — đổi sang đọc `totalSchoolTokenQuota` hoặc API gói khi BE có. Bỏ chữ "/tháng" nếu BE xác nhận quỹ không nạp lại hằng tháng.
- [ ] Chưa test trên trình duyệt với BE thật: import học sinh (multipart), in phiếu tài khoản, ghi chú bản đồ cá nhân, CRUD tài khoản (sửa/khóa/xóa/reset/cấp token), các hộp thoại ở màn 375px.
- [ ] Chọn hàng loạt (khóa, cấp token…) chỉ áp dụng trong trang hiện tại.
