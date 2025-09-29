import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { presignPut } from "@/lib/s3";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const { filename, mime } = await req.json();
  const key = `${(session as any).user.id}/${randomUUID()}-${filename}`;
  const { url } = await presignPut(key, mime || "application/octet-stream");
  await prisma.file.create({
    data: { ownerId: (session as any).user.id, key, filename, bytes: 0, mime: mime || "application/octet-stream" },
  });
  return NextResponse.json({ url, key });
}
