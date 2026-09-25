import { NextRequest } from "next/server";
import { authMiddleware } from "./middlewares/auth.middleware";

export function proxy(request: NextRequest) {
  const response = authMiddleware(request);
  const path = request.nextUrl.pathname;
  if (["/staff", "/profile", "/chat", "/chat-history", "/payment", "/saved", "/library", "/map", "/quiz", "/home", "/login", "/register", "/forgot-password", "/reset-password", "/auth"].some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    response.headers.set("X-Robots-Tag", "noindex, follow");
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)",
  ],
};
