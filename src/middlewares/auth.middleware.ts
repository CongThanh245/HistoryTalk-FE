import { NextRequest, NextResponse } from "next/server";
import { ROUTES, AUTH_COOKIE_KEYS } from "@/constants/routes";
import { isAdminRole, isContentAdmin, isSystemAdmin } from "@/constants/roles";

const CONTENT_ADMIN_HOME = ROUTES.STAFF.HOME;
const SYSTEM_ADMIN_HOME = ROUTES.STAFF.ADMIN.HOME;
const AUTH_REQUIRED_ROUTES = [ROUTES.CHAT(""), ROUTES.PROFILE]; // matches "/chat" and "/profile" prefix

const isPathOrChild = (pathname: string, basePath: string) => {
  // Normalize base path for dynamic route placeholders if needed, or check prefix
  const cleanBase = basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;
  return pathname === cleanBase || pathname.startsWith(`${cleanBase}/`);
};

const isPublicAssetPath = (pathname: string) =>
  /\.[a-zA-Z0-9]+$/.test(pathname);

export function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicAssetPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_KEYS.TOKEN)?.value;
  const role = request.cookies.get(AUTH_COOKIE_KEYS.ROLE)?.value;

  const isStaffRoute = isPathOrChild(pathname, CONTENT_ADMIN_HOME);
  const isSystemAdminRoute = isPathOrChild(pathname, SYSTEM_ADMIN_HOME);
  const isAuthRequiredRoute = AUTH_REQUIRED_ROUTES.some((route) =>
    isPathOrChild(pathname, route),
  );

  if (!token && (isStaffRoute || isAuthRequiredRoute)) {
    return NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  // Staff roles are restricted to staff-only pages, not marketing/customer pages.
  if (token && isAdminRole(role) && !isStaffRoute) {
    const home = isSystemAdmin(role) ? SYSTEM_ADMIN_HOME : CONTENT_ADMIN_HOME;
    return NextResponse.redirect(new URL(home, request.url));
  }

  // Content Admin uses the content staff UI and cannot access System Admin pages.
  if (token && isContentAdmin(role) && isSystemAdminRoute) {
    return NextResponse.redirect(new URL(CONTENT_ADMIN_HOME, request.url));
  }

  // System Admin uses the admin/account/subscription area.
  if (token && isSystemAdmin(role) && !isSystemAdminRoute) {
    return NextResponse.redirect(new URL(SYSTEM_ADMIN_HOME, request.url));
  }

  if (token && isStaffRoute && !isAdminRole(role)) {
    return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
  }

  return NextResponse.next();
}
