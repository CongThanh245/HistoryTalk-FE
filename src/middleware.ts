// src/middleware.ts
import { NextRequest } from "next/server";
import { authMiddleware } from "@/middlewares/auth.middleware";

export function middleware(request: NextRequest) {
  return authMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
