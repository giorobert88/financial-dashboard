import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_SECRET = process.env.SESSION_SECRET || "";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that do not require authentication
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.json" ||
    pathname === "/login"
  ) {
    return NextResponse.next();
  }

  // Check for the auth cookie
  const sessionCookie = request.cookies.get("auth_session");

  // Fail closed if SESSION_SECRET is missing/empty or if cookie is invalid
  if (!SESSION_SECRET || !sessionCookie?.value || sessionCookie.value !== SESSION_SECRET) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Ensure middleware runs on all paths except static files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|login).*)",
  ],
};
