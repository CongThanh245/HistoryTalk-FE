# Audit SEO HistoryTalk — 24/09/2026

## Phạm vi và kết quả

### Cập nhật 25/09/2026 — SSR với backend thật

Sau khi chủ dự án bật server, hai API tại `https://historytalk.app/Historical-tell/api/v1` trả 200 và JSON hợp lệ. Production build local dùng API này đã pass cả TypeScript và static generation; biến môi trường chỉ đặt cho tiến trình, không chỉnh `.env.local`.

`check-seo-ssr.mjs` xác nhận bản sửa local có **10 nhân vật trang 1, 2 nhân vật trang 2, 13 sự kiện** trong HTML sau khi loại bỏ script/style, cùng link crawlable từ trang 1 sang trang 2. Không chỉ kiểm tra dữ liệu nhúng để hydration. Website production hiện tại vẫn thất bại với `HTML missing API record` ở cả hai danh mục, nên cần deploy source đã sửa lên Vercel. Chưa push/deploy.

Build đầu tiên trong sandbox bị chặn tải Google Fonts; chạy lại với quyền mạng đã thành công. Kết quả này thay thế giới hạn chưa kiểm tra được dữ liệu backend trong lần audit 24/09.

Kiểm tra hồi quy `check-seo.mjs` trên bản build dùng backend production: **18/18 pass**. Đã dừng server local phục vụ kiểm tra sau khi hoàn tất.

Frontend `HistoryTalk-FE`, Next.js khai báo ^16.1.6, bản cài thực tế 16.2.6, React 19, App Router, TypeScript. Marketing có SSR/SSG; danh mục dùng server prefetch và React Query hydration; nhiều màn hình ứng dụng dùng dữ liệu client. Root head: `src/app/layout.tsx`; auth/redirect: `src/proxy.ts`, `src/middlewares/auth.middleware.ts`.

Trang công khai ưu tiên: `/`, `/features`, `/pricing`, `/characters`, `/events`. `/about` hiện redirect về `/`. App gồm `/home`, `/map`, `/quiz`, `/chat/[id]`, `/profile`, lịch sử chat/thanh toán; `/library` và `/saved` còn placeholder. Staff và auth không phải trang SEO.

Chủ dự án đã xác nhận domain chính thức `https://historytalk.online` và backend đang chạy trên server. Tiếng Việt và thị trường Việt Nam suy ra từ nội dung sản phẩm; từ khóa chưa được xác nhận. Có thể đổi origin bằng `NEXT_PUBLIC_SITE_URL`.

### Kiểm tra production bổ sung

`https://www.historytalk.online` trả 200 thay vì chuyển về domain non-www đã xác nhận; cần cấu hình redirect ở nền tảng hosting sau khi xác định nơi deploy. `/characters` trả 200 nhưng không có H1 trong HTML response, phù hợp với lỗi guard trước hydration ở phiên bản cũ. Hai response này có nén Brotli (`Content-Encoding: br`).

Request GET trực tiếp xác nhận production chưa có các thay đổi SEO local: sitemap vẫn chứa 12 URL; 5 trang công khai thiếu canonical; icon, apple-icon, favicon, manifest và ảnh OG mới trả 404; trang staff chưa có X-Robots-Tag noindex. URL không tồn tại trả đúng 404, robots trả 200. Không nhầm kết quả 18/18 local với trạng thái production.

HTTP domain chính redirect 308 trực tiếp sang HTTPS. Đây là redirect vĩnh viễn; không cần thay thành 301 chỉ vì khác mã. `.env.local` hiện vẫn đặt API tại `http://localhost:8080/Historical-tell/api/v1`, nên kiểm tra local trước đó không phản ánh backend production. Chưa thay URL API khi chưa có địa chỉ chính xác; đã hỏi chủ dự án URL API/Swagger và nền tảng deploy. Chưa push hoặc deploy thay đổi.

Audit trước sửa đã được trình bày trong hội thoại trước khi chỉnh code. Bảng này giữ lại cả trạng thái trước và sau. `[x]`: đạt trong phạm vi đã kiểm tra; `[~]`: còn thiếu/chưa xác minh; `[ ]`: chưa có; `[N/A]`: chưa áp dụng. Không coi build pass là bằng chứng đạt CWV hoặc đã được Google index.

## Checklist trước / sau

| ID | Mục | Trước | Sau | Ưu tiên | Bằng chứng / giới hạn |
|---|---|---|---|---|---|
| A1 | Nội dung HTML ban đầu | [~] | [x] | Cao | Bản sửa local với API production: 10+2 nhân vật và 13 sự kiện có trong HTML, không tính hydration scripts; chưa deploy. |
| A2 | robots đúng, có sitemap | [~] | [x] | Cao | robots.ts cho crawl asset và trang để đọc noindex; chặn API. Auth vẫn bảo vệ tài nguyên riêng tư. |
| A3 | Sitemap URL 200, canonical, lastmod thật | [~] | [~] | Cao | Chỉ 5 URL công khai, tất cả trả 200 local; bỏ auth/about redirect/library. TODO ngày cập nhật thật qua env, chưa tự bịa lastmod. |
| A4 | Không noindex nhầm | [x] | [x] | Cao | 5 trang công khai không có meta noindex trong HTTP local; production header còn cần kiểm tra. |
| A5 | Canonical | [ ] | [x] | Cao | Canonical riêng cho trang index; giữ page/era có ý nghĩa, bỏ tracking và query hiển thị. Trang tìm kiếm noindex. Trang riêng tư không bị canonical nhầm về home. |
| A6 | HTTPS/domain redirect | [~] | [~] | Cao | Dùng origin HTTPS hiện có. Chưa thay redirect hoặc hosting khi chưa được xác nhận domain. |
| A7 | HTTP 404 | [~] | [x] | Cao | URL không tồn tại trả 404 từ production server local; không đổi not-found đã có. |
| A8 | Redirect chain, link hỏng | [~] | [~] | Cao | Sửa footer /settings và typo /character. /terms, /privacy vẫn thiếu; /about vẫn redirect theo hiện trạng. |
| A9 | Noindex trang cần ẩn | [ ] | [x] | Cao | Metadata layout và X-Robots-Tag cho auth/staff/private/utility; search query noindex. Không dùng robots.txt thay thế bảo mật. |
| B1 | Title riêng có brand | [~] | [x] | Cao | 5 trang index có title biên soạn riêng; page>1 có số trang. Không ép độ dài cứng cho tên dài. |
| B2 | Description riêng | [~] | [x] | Cao | 5 trang index có mô tả riêng dựa trên nội dung thật, CTA nhẹ. |
| B3 | Một H1, cấu trúc heading | [~] | [~] | Trung bình | 5 trang công khai có đúng 1 H1 trong response; đổi greeting H1 thành p. Chưa rà mọi trạng thái màn hình riêng tư. |
| B4 | html lang | [x] | [x] | Thấp | Giữ vi. |
| B5 | URL dễ đọc | [x] | [x] | Thấp | Giữ route hiện có, không đổi URL. |
| B6 | Nội dung sâu, không trùng | [~] | [~] | Cao | Chưa có bài kiến thức/chi tiết độc lập; library/saved noindex. Cần biên tập nội dung thật. |
| B7 | Breadcrumb HTML + schema | [~] | [x] | Trung bình | Thêm cho features/pricing và schema phù hợp breadcrumb thật của characters/events. |
| B8 | Pagination crawlable | [~] | [x] | Cao | Đã xác nhận link trang 2 và cả 2 bản ghi trang cuối của danh mục nhân vật. Events hiện có 13 mục; cần phân trang thêm nếu vượt giới hạn lấy 100 mục. |
| C1 | Alt ảnh đúng | [~] | [~] | Trung bình | Có alt trên ảnh marketing; fallback Nguyễn Trãi dùng ảnh Ngô Quyền từ trước, cần cung cấp ảnh thật phù hợp. |
| C2 | Tên file có nghĩa | [~] | [~] | Thấp | Còn 2.png/3.png/card.jpg/feature-pic*. Chưa đổi URL asset để tránh ảnh hưởng nơi tham chiếu. |
| C3 | WebP/AVIF và kích thước | [~] | [~] | Trung bình | Next image tối ưu nhiều ảnh; img thô trong chat/map/staff còn cần rà. |
| C4 | Lazy/LCP | [~] | [~] | Trung bình | Bỏ splash GIF ưu tiên khỏi trang index; hero không lazy. Cần đo nhiều ảnh priority trong carousel. |
| C5 | Responsive ảnh | [~] | [~] | Trung bình | Sizes có trên phần lớn ảnh marketing; chưa chuẩn hóa toàn app. |
| C6 | Favicon/apple/manifest | [~] | [x] | Thấp | ICO 32, PNG 512, apple 180 từ logo hiện có; manifest native Next. |
| D1 | Organization | [ ] | [~] | Trung bình | Có name/url/logo; chưa thêm sameAs, địa chỉ/liên hệ chưa được xác minh. |
| D2 | WebSite | [ ] | [x] | Trung bình | Có name/url/language/publisher. Không thêm SearchAction vì chỉ có tìm kiếm danh mục, không có site-wide search. |
| D3 | BreadcrumbList | [ ] | [x] | Trung bình | Có trên 4 trang con index, dữ liệu khớp breadcrumb HTML. |
| D4 | Schema nội dung | [ ] | [x] | Trung bình | WebApplication cho sản phẩm giáo dục; không bịa Product giá/review hoặc Article không tồn tại. |
| D5 | JSON-LD đúng dữ liệu | [ ] | [x] | Trung bình | JSON.parse pass, escape ký tự <, chỉ dùng thông tin sản phẩm có trong giao diện; Rich Results Test cần chạy sau deploy. |
| E1 | Open Graph đầy đủ | [~] | [x] | Trung bình | Title/description/url/type/locale/siteName riêng; ảnh sinh đúng 1200x630. |
| E2 | Twitter Card | [~] | [x] | Trung bình | Summary large image và nội dung riêng từng trang index. |
| E3 | Absolute image URL | [x] | [x] | Thấp | Giữ Metadata API + metadataBase. |
| F1 | LCP/INP/CLS | [~] | [~] | Cao | Bỏ splash 3,3 giây trên trang công khai. Chưa có Lighthouse/CrUX; không khẳng định ngưỡng đạt. |
| F2 | Viewport/mobile | [~] | [~] | Trung bình | Viewport/breakpoint giữ nguyên; browser tool lỗi khởi tạo, chưa QA hình ảnh. |
| F3 | Bundle/code splitting | [x] | [x] | Trung bình | Giữ Next build/dynamic import, production build pass. |
| F4 | Font | [x] | [x] | Thấp | Giữ next/font, swap, Vietnamese subset. |
| F5 | Resource hints/script | [x] | [x] | Thấp | Giữ next/font/image và GA afterInteractive. |
| F6 | Compression/cache | [~] | [~] | Trung bình | Native Next có sẵn; cần kiểm tra CDN/hosting và header production. |
| F7 | Interstitial | [~] | [x] | Cao | Không render WelcomeScreen trên 5 trang index, giữ hành vi trong ứng dụng. |
| G1 | Menu/footer, <=3 click | [~] | [x] | Trung bình | 5 trang index đi được trực tiếp từ menu/footer. |
| G2 | Anchor text | [x] | [x] | Thấp | Giữ nhãn rõ nghĩa. |
| G3 | a href thật | [~] | [~] | Cao | Sửa pagination characters; card chat/modal vẫn là thao tác app, chưa có trang chi tiết public để link. |
| G4 | Link ngoài rel | [~] | [x] | Trung bình | Link ngoài đã có noopener noreferrer; thêm nofollow cho URL trong câu trả lời AI. |
| G5 | Orphan pages | [~] | [~] | Trung bình | Trang index chính có link; chưa audit toàn bộ dữ liệu động khi backend có dữ liệu. |
| H1 | hreflang | [N/A] | [N/A] | Thấp | Một ngôn ngữ; không thêm hreflang giả. |
| H2 | LocalBusiness/NAP | [N/A] | [N/A] | Thấp | Nền tảng online; chưa có doanh nghiệp địa phương xác nhận. |
| I1 | About/Contact/Privacy/Terms | [~] | [~] | Cao | Cần nội dung được chủ dự án duyệt, không tự soạn cam kết xử lý dữ liệu hoặc đổi redirect /about. |
| I2 | Tác giả/ngày bài viết | [N/A] | [N/A] | Trung bình | Chưa có route bài viết; cần có khi xây dựng trang kiến thức. |
| I3 | Liên hệ thật | [~] | [~] | Cao | Footer có hello@historytalk.vn từ trước; TODO xác nhận quyền sở hữu và khả năng nhận mail. |
| J1 | Analytics | [x] | [x] | Thấp | Giữ GA và Vercel Analytics, cần ID GA thật khi deploy. |
| J2 | Search Console/Bing | [ ] | [x] | Trung bình | Có env và Metadata verification; chủ domain phải nhập token và xác minh. |

## Kiểm tra đã thực hiện

- `npm run build`: pass, gồm TypeScript và static generation.
- `node node_modules/typescript/bin/tsc --noEmit --incremental false`: pass.
- ESLint trên module SEO mới, robots/sitemap/manifest/OG/proxy: 0 errors; 4 warning inline style trong ImageResponse (ảnh server sử dụng style của Satori, không phải CSS giao diện thông thường).
- `node scripts/check-seo.mjs`: 18/18 pass trên production server local. Kiểm tra metadata, H1 SSR, không có splash, schema parse, noindex search/auth/payment, header noindex staff, 404, 5 URL sitemap, robots, manifest, favicon/apple/icon và kích thước PNG. Đã build lại sau khi thêm favicon để xác nhận asset trả 200.
- Lần đầu smoke test so sánh canonical `/` bằng chuỗi hậu tố đã thất bại vì Next chuẩn hóa root URL không có slash. Đã sửa phép kiểm tra sang URL pathname/search; không thay canonical đúng của ứng dụng.
- Quan sát HTML danh mục: có heading và bộ lọc; chưa có card dữ liệu/page link trong lần chạy. Không dùng kết quả smoke test để khẳng định dữ liệu backend đã SSR thành công.
- Detector UI: một cảnh báo gradient text có sẵn trong greeting; giữ nguyên phong cách vì phạm vi SEO chỉ sửa H1 thành p.
- `npx tsc --noEmit` ban đầu cố tải package và lỗi quyền mạng; thay bằng binary TypeScript đã cài, pass.
- Browser không khởi tạo được (`sandboxPolicy` missing). Chưa có QA ảnh desktop/mobile hoặc đo Lighthouse; không triển khai public.

## TODO chủ dự án và triển khai

1. Xác nhận `NEXT_PUBLIC_SITE_URL=https://historytalk.online`, thị trường, ngôn ngữ và bộ từ khóa. Rebuild khi đổi biến NEXT_PUBLIC.
2. Điền `GOOGLE_SITE_VERIFICATION`, `BING_SITE_VERIFICATION`, GA ID thật. Xác minh quyền sở hữu Search Console (có thể dùng DNS) và Bing; gửi `/sitemap.xml`, Inspect URL rồi request indexing cho trang chính.
3. Điền `SEO_CONTENT_UPDATED_AT` bằng ngày sửa nội dung thật theo ISO 8601, không dùng ngày hiện tại tự động mỗi request. Khi nội dung các trang cập nhật độc lập, thay bằng ngày riêng từng trang từ CMS.
4. Xác nhận domain chính rồi cấu hình HTTPS và redirect 301 một bước từ HTTP/www ở hosting; kiểm tra không có header noindex của staging trên production. Việc đổi redirect chưa thực hiện vì yêu cầu người dùng cần hỏi trước.
5. Kết nối backend public có dữ liệu, kiểm tra View Source chứa nhân vật/sự kiện và link page=2; thử trang cuối, bộ lọc, API timeout. Chạy lại `node scripts/check-seo.mjs https://DOMAIN` sau deploy.
6. Cung cấp nội dung About, Contact, điều khoản, chính sách riêng tư, tên đơn vị và liên hệ thật; xác nhận email footer. Thống nhất trước khi thay redirect /about. Các link /terms và /privacy hiện còn 404.
7. Cung cấp ảnh đúng nhân vật (đặc biệt fallback Nguyễn Trãi); rà nguồn, bản quyền ảnh và nguồn sử liệu. Không thêm rating/review/giá vào schema nếu chưa có dữ liệu thật.
8. Chạy PageSpeed/Lighthouse mobile và desktop, Rich Results Test, theo dõi CWV thực tế trong Search Console. Mục tiêu LCP <2,5s, INP <200ms, CLS <0,1 cần được đo; tối ưu tiếp theo dựa trên trace.
9. Rà cấu hình gzip/brotli, cache immutable asset có hash, cache HTML đúng người dùng tại CDN. Không cache công khai trang tài khoản.

## Đề xuất tiếp theo

- Xây dựng trang đọc công khai cho từng nhân vật/sự kiện, có nguồn sử liệu, tác giả/biên tập viên và ngày cập nhật thật; giữ chat là trải nghiệm tương tác riêng. Lập mapping URL và hỏi trước khi đổi route/redirect.
- Mở rộng nội dung theo cụm: nhân vật lịch sử Việt Nam, sự kiện theo triều đại, câu hỏi lịch sử, học lịch sử bằng AI. Đây là đề xuất từ nội dung sản phẩm, chưa phải nghiên cứu volume/độ khó từ khóa.
- Liên kết bài giới thiệu nhân vật với sự kiện, niên đại và bài liên quan; bổ sung pagination server cho events khi vượt 100 mục.
- Kiếm liên kết từ nguồn giáo dục, câu lạc bộ lịch sử, bài viết chuyên môn có nội dung hữu ích; tránh mua link hoặc nội dung hàng loạt không kiểm chứng.
- Chỉ mở index cho map/quiz/home khi có nội dung công khai ổn định, HTML đủ nghĩa và metadata riêng; hiện noindex cho màn hình ứng dụng.

## Nguồn kỹ thuật

- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata): metadataBase, canonical, verification, robots.
- [Next.js metadata và ảnh OG](https://nextjs.org/docs/app/getting-started/metadata-and-og-images): native metadata/image routes.
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): rendering, noindex và khả năng đọc nội dung.
- [Google canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls): canonical và sitemap là tín hiệu, không bảo đảm URL được chọn/index.

## File thay đổi

Danh sách cụ thể được ghi trong `seo-changed-files.txt` cùng thư mục. Không chỉnh `.env` backend hoặc thông tin bí mật; không sửa chức năng thanh toán/đăng nhập hay redirect hiện hành.
