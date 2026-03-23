import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register", "/"];
const STAFF_ROUTES = ["/staff"];

// Tất cả các route thuộc (app) group - chỉ dành cho customer
const CUSTOMER_ROUTES = [
  "/home",
  "/chat",
  "/chat-history",
  "/quiz",
  "/library",
  "/map",
  "/profile",
  "/saved",
  "/characters",
  "/events",
];

const isStaffRole = (role: string | undefined) =>
  role === "STAFF" || role === "ADMIN";

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("auth-token")?.value;
  const role = request.cookies.get("auth-role")?.value;

  const isPublic = PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );
  const isStaffRoute = STAFF_ROUTES.some((r) => pathname.startsWith(r));
  const isCustomerRoute = CUSTOMER_ROUTES.some((r) =>
    pathname.startsWith(r)
  );

  // Chưa đăng nhập nhưng cố vào /staff → về login
  if (!token && isStaffRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // STAFF/ADMIN cố vào trang customer → redirect về /staff
  if (token && isStaffRole(role) && isCustomerRoute) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  // Đã đăng nhập nhưng là customer/marketing → không cho vào /staff
  if (token && isStaffRoute && !isStaffRole(role)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}
