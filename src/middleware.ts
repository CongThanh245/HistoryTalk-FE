// src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
// import { authMiddleware } from "@/middlewares/auth.middleware";

export function middleware(request: NextRequest) {
  // return authMiddleware(request);]
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
