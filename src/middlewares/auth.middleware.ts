import { NextRequest, NextResponse } from "next/server";

const STAFF_ROUTES = ["/staff"];
const SYSTEM_ADMIN_ROUTES = ["/staff/admin"];

const isContentAdminRole = (role: string | undefined) =>
  role === "CONTENT_ADMIN";

const isSystemAdminRole = (role: string | undefined) =>
  role === "SYSTEM_ADMIN";

const isAdminRole = (role: string | undefined) =>
  isContentAdminRole(role) || isSystemAdminRole(role);

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("auth-token")?.value;
  const role = request.cookies.get("auth-role")?.value;

  const isStaffRoute = STAFF_ROUTES.some((r) => pathname.startsWith(r));
  const isSystemAdminRoute = SYSTEM_ADMIN_ROUTES.some((r) =>
    pathname.startsWith(r)
  );

  if (!token && isStaffRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Content Admin uses the current staff UI and cannot access System Admin pages.
  if (
    token &&
    isContentAdminRole(role) &&
    (!isStaffRoute || isSystemAdminRoute)
  ) {
    return NextResponse.redirect(new URL("/staff", request.url));
  }

  // System Admin uses the admin/account/subscription area.
  if (token && isSystemAdminRole(role) && !isSystemAdminRoute) {
    return NextResponse.redirect(new URL("/staff/admin", request.url));
  }

  if (token && isStaffRoute && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}
