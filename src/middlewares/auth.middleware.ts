import { NextRequest, NextResponse } from "next/server";
import { jwtDecode } from "jwt-decode";
import { Role } from "./constants/enums/role";
import { routeAccessConfig } from "./configs/route.config";
import { DecodeToken } from "./features/auth/models/response";

const authRoutes = ["/login", "/register"];
const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms-of-service",
];

const isStaticAsset = (path: string) =>
  path.startsWith("/_next/") ||
  path.startsWith("/videos/") ||
  /\.(ico|png|jpg|jpeg|mp4|svg|css|js)$/.test(path);

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Skip static files
  if (isStaticAsset(path)) return NextResponse.next();

  const accessToken = req.cookies.get("accessToken")?.value;
  let currentRole: Role | null = null;

  if (accessToken) {
    try {
      const decoded = jwtDecode<DecodeToken>(accessToken);
      currentRole = decoded.role;
    } catch (err) {
      console.error("❌ Token decode error:", err);
    }
  }

  const isPublic = publicRoutes.includes(path);
  const isAuthRoute = authRoutes.includes(path);
  const allowedRoles = routeAccessConfig[path]; // Kiểm tra phân quyền cụ thể

  // ✅ Nếu chưa đăng nhập:
  if (!currentRole) {
    if (isPublic || isAuthRoute) {
      return NextResponse.next(); // Cho phép truy cập
    } else {
      return NextResponse.redirect(new URL("/", req.url)); // Chặn → về home
    }
  }

  // ✅ Nếu đã đăng nhập:
  if (isAuthRoute) {
    // Không cho vào /login, /register khi đã login
    const redirectTo = currentRole === Role.USER ? "/" : "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, req.url));
  }

  // ✅ Nếu route có quy định quyền hạn
  if (allowedRoles && !allowedRoles.includes(currentRole)) {
    const fallback = currentRole === Role.USER ? "/" : "/dashboard";
    return NextResponse.redirect(new URL(fallback, req.url));
  }

  return NextResponse.next(); // ✅ Được phép truy cập
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
