import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

interface FileItemPayload {
  kind: "file";
  id: string;
  filename: string;
  mime: string | null;
  bytes: number;
  createdAt: string;
  url: string;
}

interface GalleryItemPayload {
  kind: "gallery";
  id: string;
  title: string;
  visibility: "PUBLIC" | "PRIVATE";
  ownerId: string;
  ownerLabel: string;
  role: "OWNER" | "MANAGER";
  itemCount: number;
  createdAt: string;
}

type LibraryItemPayload = FileItemPayload | GalleryItemPayload;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json([] satisfies LibraryItemPayload[]);
  }

  const userId = session.user.id;

  const [files, galleries] = await Promise.all([
    prisma.file.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gallery.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { managers: { some: { userId } } },
        ],
      },
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

  const fileItems: FileItemPayload[] = files.map((file) => ({
    kind: "file",
    id: file.id,
    filename: file.filename,
    mime: file.mime,
    bytes: file.bytes,
    createdAt: file.createdAt.toISOString(),
    url: publicUrl(file.key) ?? "",
  }));

  const galleryItems: GalleryItemPayload[] = galleries.map((gallery) => ({
    kind: "gallery",
    id: gallery.id,
    title: gallery.title,
    visibility: gallery.visibility,
    ownerId: gallery.ownerId,
    ownerLabel: gallery.owner?.name ?? gallery.owner?.email ?? "Unknown owner",
    role: gallery.ownerId === userId ? "OWNER" : "MANAGER",
    itemCount: gallery._count.items,
    createdAt: gallery.createdAt.toISOString(),
  }));

  return Response.json([...fileItems, ...galleryItems]);
}
