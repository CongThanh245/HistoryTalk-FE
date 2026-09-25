# Triển khai SEO lên Vercel

**Cập nhật 25/09/2026:** server đã bật, API trả 200. Bản sửa local build thành công với API production; HTML chứa 10 nhân vật trang 1, 2 nhân vật trang 2 và 13 sự kiện; link trang 2 đã kiểm chứng. Website production vẫn không có bản ghi trong HTML. Cần deploy source mới, không chỉ redeploy commit cũ. Các lỗi timeout ghi bên dưới là lịch sử kiểm tra khi server chưa bật.

Đã xác nhận với chủ dự án:

- Frontend: `https://historytalk.online`, deploy bằng Vercel.
- Backend: `https://historytalk.app/Historical-tell/api/v1`.

## Cấu hình Production

Trong project Vercel → Settings → Environment Variables, đặt các giá trị sau cho **Production**:

| Biến | Giá trị |
|---|---|
| NEXT_PUBLIC_SITE_URL | https://historytalk.online |
| NEXT_PUBLIC_API_BASE_URL | https://historytalk.app |
| NEXT_PUBLIC_API_BASE_PATH | /Historical-tell/api/v1 |

Không gộp đường dẫn API vào BASE_URL vì code ghép BASE_URL + BASE_PATH. File `.env.vercel.example` có sẵn các giá trị công khai để sao chép; Vercel không tự đọc file example. Giữ các cấu hình OAuth/payment/voice/WebSocket đang hoạt động; không ghi đè chúng bằng giá trị localhost từ `.env.example`.

Verification và ngày sửa nội dung: nhập giá trị thật khi có, có thể để trống. Không đặt GA ID mẫu `G-XXXXXXXXXX` lên production.

Sau khi code SEO được đưa lên nhánh mà Vercel dùng cho Production, tạo deployment mới với các biến trên. **Redeploy commit cũ chỉ đổi env sẽ không có các thay đổi SEO đang nằm local.** NEXT_PUBLIC được đưa vào bundle lúc build; thay env cần build/deploy mới.

Chưa push code, chưa thay cài đặt Vercel hoặc deploy trong phiên kiểm tra này.

## Domain

Domain chính đã chọn là non-www. Trong Settings → Domains, đề xuất cấu hình `www.historytalk.online` redirect vĩnh viễn đến `historytalk.online`, giữ path/query. Hiện www trả 200 riêng. Chưa áp dụng thay đổi redirect vì yêu cầu ban đầu cần chủ dự án xác nhận trước khi đổi redirect.

HTTP domain chính đã redirect 308 sang HTTPS, không cần sửa chỉ để đổi sang 301.

## Kiểm tra

```powershell
node scripts/check-seo.mjs https://historytalk.online
node scripts/check-seo-ssr.mjs https://historytalk.online
```

Bài thứ nhất kiểm tra metadata, status, robots, sitemap và assets. Bài thứ hai đối chiếu tên nhân vật/sự kiện từ API với nội dung HTML đã loại bỏ script/style; nếu có trang 2 thì kiểm tra cả link và dữ liệu trang 2. API rỗng hoặc không kết nối được sẽ báo fail, không tính skeleton là SSR đạt.

Để kiểm tra local với backend production mà không sửa `.env.local`, đặt ba biến đã xác nhận ở trên trong process PowerShell, rồi build/start frontend. Chỉ nên thực hiện khi API đã kết nối được. Việc kiểm tra SEO chỉ dùng GET công khai; không đăng nhập hoặc thực hiện thanh toán trên dữ liệu thật.

Lần gọi trực tiếp từ môi trường kiểm tra: cả `/characters?page=1&limit=10` và `/historical-contexts?page=1&limit=100` đều gặp `UND_ERR_CONNECT_TIMEOUT`, kể cả ngoài sandbox. Đây là giới hạn quan sát từ máy kiểm tra, chưa đủ bằng chứng kết luận backend ngừng hoạt động. Cần kiểm tra endpoint từ mạng của chủ dự án và Vercel Function logs trước khi khẳng định SSR production thành công.

## Sau deploy

Xác minh Google Search Console, gửi sitemap và chạy URL Inspection trên năm trang chính. Sau đó đo PageSpeed mobile/desktop và kiểm tra nội dung thật bằng View Source.

Nguồn: [Vercel Environment Variables](https://vercel.com/docs/environment-variables), [Vercel Domain Redirects](https://vercel.com/docs/domains/working-with-domains/deploying-and-redirecting).
