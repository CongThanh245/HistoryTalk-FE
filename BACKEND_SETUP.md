# Backend Setup Guide

Dự án hỗ trợ 2 backend khác nhau cùng chung 1 frontend codebase.

## Lần đầu clone về (Cả 2 team đều làm như nhau)

```bash
# 1. Clone repo
git clone <repo-url>
cd core-app-fe

# 2. Cài dependencies
npm install

# 3. Tạo env file - Copy từ template rồi sửa URL cho đúng backend đang dùng
copy .env.example .env.local        # Windows
cp .env.example .env.local         # Mac/Linux

# 4. Mở .env.local và sửa URL theo backend bạn đang chạy:
#    - Team Spring Boot: dùng port 8080
#    - Team Node.js: dùng port 3001

# 5. Chạy dev server
npm run dev
```

## Đổi backend nhanh bằng script

Script `switch-backend.ps1` (Windows) hoặc `switch-backend.sh` (Mac/Linux) dùng để:
- **Test cùng 1 feature** với cả 2 backend trước khi push code
- **Switch nhanh** khi muốn đổi backend mà không cần sửa file thủ công

```powershell
# Windows - Chạy script rồi start dev server riêng
.\switch-backend.ps1 spring
npm run dev

# Sau đó muốn test với Node.js
.\switch-backend.ps1 nodejs
npm run dev
```

```bash
# Mac/Linux
./switch-backend.sh spring
npm run dev
```

**Lưu ý:** Script chỉ copy file env, bạn vẫn phải tự restart dev server.

## File Structure

```
.env.spring      # Config cho Spring Boot backend
.env.nodejs      # Config cho Node.js backend
.env.local       # File đang active (đừng commit!)
switch-backend.ps1  # Script switch nhanh
```

## Git Workflow (Chỉ dùng 1 branch chung)

**Nguyên tắc:** Cả 2 team đều push code lên cùng 1 branch (`main` hoặc `master`)

```bash
# 1. Lấy code mới nhất
git checkout main
git pull origin main

# 2. Code feature...

# 3. Test với cả 2 backend trước khi push
.\switch-backend.ps1 spring   # Test Spring → Ctrl+C khi xong
.\switch-backend.ps1 nodejs   # Test Node.js → Ctrl+C khi xong

# 4. Push code
git add .
git commit -m "feat: landmark filter"
git push origin main
```

## Checklist trước khi push code

- [ ] Code trên main branch
- [ ] Test với Spring: `.\switch-backend.ps1 spring`
- [ ] Test với Node.js: `.\switch-backend.ps1 nodejs`
- [ ] Commit & push lên main

## Lưu Ý

- `.env.local` đã có trong `.gitignore` → không sợ commit nhầm
- 2 backend **phải** trả về response giống nhau
- Nếu backend nào chưa implement endpoint → sẽ lỗi 404 (bình thường)
