import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presignPut } from "@/lib/s3";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const payload = await req.json();
  const filename = typeof payload?.filename === "string" ? payload.filename : undefined;
  const mime = typeof payload?.mime === "string" && payload.mime.trim() ? payload.mime : "application/octet-stream";
  const rawSize = Number(payload?.size);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;
  if (!filename) {
    return new NextResponse("Filename is required", { status: 400 });
  }
  const key = `${session.user.id}/${randomUUID()}-${filename}`;
  const { url } = await presignPut(key, mime, size || undefined);
  await prisma.file.create({
    data: { ownerId: session.user.id, key, filename, bytes: size, mime },
  });
  return NextResponse.json({ url, key });
}
