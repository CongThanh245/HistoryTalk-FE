import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/"];
const STAFF_ROUTES = ["/staff"];

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Đọc auth từ cookie (Zustand persist lưu vào localStorage,
  // nên dùng cookie riêng hoặc check qua Next middleware khác)
  // Tạm thời dùng cookie "auth-token" set thủ công khi login
  const token = request.cookies.get("auth-token")?.value;
  const role = request.cookies.get("auth-role")?.value;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isStaffRoute = STAFF_ROUTES.some((r) => pathname.startsWith(r));
  if (!token && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isStaffRoute && role !== "STAFF" && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}
