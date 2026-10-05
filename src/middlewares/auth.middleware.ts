import { NextRequest, NextResponse } from "next/server";
import { ROUTES, AUTH_COOKIE_KEYS } from "@/constants/routes";
import {
  getRoleHome,
  isAdminRole,
  isClassMember,
  isSchoolStudent,
  isTeacher,
  isContentAdmin,
  isSchoolAdmin,
  isSystemAdmin,
} from "@/constants/roles";

const CONTENT_ADMIN_HOME = ROUTES.STAFF.HOME;
const SYSTEM_ADMIN_HOME = ROUTES.STAFF.ADMIN.HOME;
const SCHOOL_HOME = ROUTES.SCHOOL.HOME;
const AUTH_REQUIRED_ROUTES = [
  ROUTES.CHAT(""), ROUTES.PROFILE, ROUTES.CLASSES, ROUTES.TEACHING.HOME, ROUTES.MY_ASSIGNMENTS, ROUTES.GRADES,
];

// Routes chỉ dành cho user chưa đăng nhập
const AUTH_ONLY_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.FORGOT_PASSWORD];

const isPathOrChild = (pathname: string, basePath: string) => {
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
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  const isStaffRoute = isPathOrChild(pathname, CONTENT_ADMIN_HOME);
  const isSystemAdminRoute = isPathOrChild(pathname, SYSTEM_ADMIN_HOME);
  const isSchoolRoute = isPathOrChild(pathname, SCHOOL_HOME);
  const isClassRoute = isPathOrChild(pathname, ROUTES.CLASSES);
  const isAuthRequiredRoute = AUTH_REQUIRED_ROUTES.some((route) => isPathOrChild(pathname, route));
  const isAuthOnlyRoute = AUTH_ONLY_ROUTES.some((route) => isPathOrChild(pathname, route));

  // Chưa đăng nhập → redirect về login nếu vào trang protected
  if (!token && (isStaffRoute || isSchoolRoute || isAuthRequiredRoute)) {
    return redirect(ROUTES.LOGIN);
  }
  if (!token) return NextResponse.next();

  // Đã đăng nhập → không cho vào trang login/register
  if (isAuthOnlyRoute) return redirect(getRoleHome(role));

  // Staff roles are restricted to staff-only pages, not marketing/customer pages.
  if (isAdminRole(role)) {
    if (!isStaffRoute) return redirect(getRoleHome(role));
    // Content Admin uses the content staff UI and cannot access System Admin pages.
    if (isContentAdmin(role) && isSystemAdminRoute) return redirect(CONTENT_ADMIN_HOME);
    // System Admin uses the admin/account/subscription area.
    if (isSystemAdmin(role) && !isSystemAdminRoute) return redirect(SYSTEM_ADMIN_HOME);
    return NextResponse.next();
  }

  // School Admin works only in the school area (Role Matrix I–II, VIII row 23).
  if (isSchoolAdmin(role)) {
    return isSchoolRoute ? NextResponse.next() : redirect(SCHOOL_HOME);
  }

  // Teachers, school students and customers use the learning app; staff and school areas are off limits.
  if (isStaffRoute || isSchoolRoute) return redirect(getRoleHome(role));

  // School accounts never buy plans: pricing and payment are B2C only (Role Matrix row 26).
  if (isClassMember(role) && (isPathOrChild(pathname, "/pricing") || isPathOrChild(pathname, ROUTES.PAYMENT))) {
    return redirect(getRoleHome(role));
  }

  // "Lớp học của tôi" is for class members only (Role Matrix row 8).
  if (isClassRoute && !isClassMember(role)) return redirect(ROUTES.HOME);

  // Teaching tools: dashboard, assignments, local history (rows 12, 16, 24).
  if (isPathOrChild(pathname, ROUTES.TEACHING.HOME) && !isTeacher(role)) return redirect(getRoleHome(role));

  // Assigned work is for school students (row 17); the grade book also for customers (row 25).
  if (isPathOrChild(pathname, ROUTES.MY_ASSIGNMENTS) && !isSchoolStudent(role)) return redirect(getRoleHome(role));
  if (isPathOrChild(pathname, ROUTES.GRADES) && !(isSchoolStudent(role) || role === "CUSTOMER")) return redirect(getRoleHome(role));

  return NextResponse.next();
}
