import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json([], { status: 200 });
  const files = await prisma.file.findMany({ where: { ownerId: (session as any).user.id }, orderBy: { createdAt: "desc" } });
  return Response.json(files.map(f => ({ ...f, url: publicUrl(f.key) })));
}
