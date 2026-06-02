import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ConfirmSchema = z.object({
  key: z.string().min(1),
  checksum: z.string().min(1),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const { key, checksum } = ConfirmSchema.parse(body);

  const file = await prisma.file.findUnique({ where: { key } });
  if (!file) return new NextResponse("File not found", { status: 404 });
  if (file.ownerId !== session.user.id) return new NextResponse("Forbidden", { status: 403 });

  await prisma.file.update({ where: { id: file.id }, data: { checksum } });

  return NextResponse.json({ success: true });
}
