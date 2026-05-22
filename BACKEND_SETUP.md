# Backend Setup Guide

Dự án hỗ trợ 2 backend khác nhau cùng chung 1 frontend codebase.

## Quick Switch

```powershell
# Chạy với Spring Boot
.\switch-backend.ps1 spring

# Chạy với Node.js
.\switch-backend.ps1 nodejs

# Sau đó start dev server
npm run dev
```

## File Structure

```
.env.spring      # Config cho Spring Boot backend
.env.nodejs      # Config cho Node.js backend
.env.local       # File đang active (đừng commit!)
switch-backend.ps1  # Script switch nhanh
```

## Git Workflow

### Cách 1: Chỉ dùng main branch (Khuyến nghị)

```bash
# 1. Code feature trên main
git checkout main
git pull origin main
# ... sửa code ...
git add .
git commit -m "feat: landmark filter"
git push origin main

# 2. Test với Spring
.\switch-backend.ps1 spring
npm run dev

# 3. Test với Node.js
.\switch-backend.ps1 nodejs
npm run dev
```

### Cách 2: Có branch riêng cho từng backend (Nếu cần hotfix riêng)

```bash
# Setup lần đầu
git checkout -b backend-spring
copy .env.spring .env.local
git add .env.spring switch-backend.ps1 BACKEND_SETUP.md
git commit -m "chore: setup spring backend config"

git checkout main
git checkout -b backend-nodejs
copy .env.nodejs .env.local
git add .env.nodejs
git commit -m "chore: setup nodejs backend config"

# Workflow hàng ngày
git checkout backend-spring
git merge main  # Lấy code mới nhất từ main
npm run dev     # Test Spring backend

git checkout backend-nodejs
git merge main  # Lấy code mới nhất từ main
npm run dev     # Test Node.js backend
```

## Checklist Khi Sửa Feature

- [ ] Code trên main branch
- [ ] Test với Spring: `.\switch-backend.ps1 spring`
- [ ] Test với Node.js: `.\switch-backend.ps1 nodejs`
- [ ] Commit & push lên main

## Lưu Ý

- `.env.local` đã có trong `.gitignore` → không sợ commit nhầm
- 2 backend **phải** trả về response giống nhau
- Nếu backend nào chưa implement endpoint → sẽ lỗi 404 (bình thường)
