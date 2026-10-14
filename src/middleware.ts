import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const RATE_LIMITED_PATHS = ["/api/auth/", "/api/account/"];

function getClientIp(request: NextRequest): string {
  // x-real-ip is written by the reverse proxy from the real peer address, so it
  // cannot be forged. The leading x-forwarded-for entry is client-supplied
  // (nginx appends to it with $proxy_add_x_forwarded_for), so trusting it first
  // let anyone bypass the login rate limit by sending their own header.
  return (
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const response = NextResponse.next();

  const ip = getClientIp(request);
  response.headers.set("x-client-ip", ip);

  const needsLimit = RATE_LIMITED_PATHS.some((prefix) => pathname.startsWith(prefix));
  if (needsLimit) {
    const { allowed, retryAfterMs } = rateLimit(ip);
    if (!allowed) {
      return new NextResponse("Too many requests. Please try again later.", {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryAfterMs / 1000)) },
      });
    }
  }

  return response;
}

export const config = {
  matcher: ["/api/auth/:path*", "/api/account/:path*"],
};
