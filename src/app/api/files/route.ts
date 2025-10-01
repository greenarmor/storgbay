import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json([], { status: 200 });
  const files = await prisma.file.findMany({ where: { ownerId: session.user.id }, orderBy: { createdAt: "desc" } });
  type FileRecord = (typeof files)[number];
  const filesWithUrls = files.map((file: FileRecord) => {
    const url = publicUrl(file.key);
    return { ...file, url };
  });
  return Response.json(filesWithUrls);
}
