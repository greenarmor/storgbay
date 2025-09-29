import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: Request) {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session || (session as any).user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", url));
    }
  }
}

export const config = { matcher: ["/admin/:path*"] };
