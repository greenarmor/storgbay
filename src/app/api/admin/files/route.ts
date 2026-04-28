import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const [files, folders] = await Promise.all([
    prisma.file.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    }),
  ]);

  const fileItems = files.map((file) => ({
    kind: "file" as const,
    id: file.id,
    filename: file.filename,
    mime: file.mime,
    bytes: file.bytes,
    createdAt: file.createdAt.toISOString(),
    ownerId: file.ownerId,
    ownerName: file.owner?.name ?? null,
    ownerEmail: file.owner?.email ?? null,
    url: publicUrl(file.key),
  }));

  const folderItems = folders.map((folder) => ({
    kind: "folder" as const,
    id: folder.id,
    title: folder.title,
    visibility: folder.visibility,
    itemCount: folder._count.items,
    createdAt: folder.createdAt.toISOString(),
    ownerId: folder.ownerId,
    ownerName: folder.owner?.name ?? null,
    ownerEmail: folder.owner?.email ?? null,
  }));

  const payload = [...fileItems, ...folderItems].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return Response.json(payload);
}
