import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const RATE_LIMITED_PATHS = ["/api/auth/", "/api/account/"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsLimit = RATE_LIMITED_PATHS.some((prefix) => pathname.startsWith(prefix));
  if (needsLimit) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";

    const { allowed, retryAfterMs } = rateLimit(ip);
    if (!allowed) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/account/:path*"],
};
