import { NextRequest, NextResponse } from "next/server";

const CONTENT_ADMIN_HOME = "/staff";
const SYSTEM_ADMIN_HOME = "/staff/admin";
const AUTH_REQUIRED_ROUTES = ["/chat", "/chat-history"];

const isContentAdminRole = (role: string | undefined) =>
  role === "CONTENT_ADMIN";

const isSystemAdminRole = (role: string | undefined) =>
  role === "SYSTEM_ADMIN";

const isAdminRole = (role: string | undefined) =>
  isContentAdminRole(role) || isSystemAdminRole(role);

const isPathOrChild = (pathname: string, basePath: string) =>
  pathname === basePath || pathname.startsWith(`${basePath}/`);

const isPublicAssetPath = (pathname: string) =>
  /\.[a-zA-Z0-9]+$/.test(pathname);

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;
  const role = request.cookies.get("auth-role")?.value;

  const isStaffRoute = isPathOrChild(pathname, CONTENT_ADMIN_HOME);
  const isSystemAdminRoute = isPathOrChild(pathname, SYSTEM_ADMIN_HOME);
  const isAuthRequiredRoute = AUTH_REQUIRED_ROUTES.some((route) =>
    isPathOrChild(pathname, route),
  );

  if (!token && (isStaffRoute || isAuthRequiredRoute)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Staff roles are restricted to staff-only pages, not marketing/customer pages.
  if (token && isAdminRole(role) && !isStaffRoute) {
    const home = isSystemAdminRole(role) ? SYSTEM_ADMIN_HOME : CONTENT_ADMIN_HOME;
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Content Admin uses the content staff UI and cannot access System Admin pages.
  if (token && isContentAdminRole(role) && isSystemAdminRoute) {
    return NextResponse.redirect(new URL(CONTENT_ADMIN_HOME, request.url));
  }

  // System Admin uses the admin/account/subscription area.
  if (token && isSystemAdminRole(role) && !isSystemAdminRoute) {
    return NextResponse.redirect(new URL(SYSTEM_ADMIN_HOME, request.url));
  }

  if (token && isStaffRoute && !isAdminRole(role)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}
