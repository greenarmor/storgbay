import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canManageGallery, canViewGallery } from "@/lib/gallery-permissions";
import { presignGet, publicUrl } from "@/lib/s3";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const AddItemsSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1),
});

const ListItemsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

export async function GET(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { managers: true },
  });

  if (!gallery || !canViewGallery(gallery, session)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  const query = ListItemsSchema.parse({
    cursor: url.searchParams.get("cursor") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  const items = await prisma.galleryItem.findMany({
    where: { galleryId: id },
    include: { file: true },
    orderBy: [{ position: "asc" }, { file: { createdAt: "desc" } }],
    take: query.limit + 1,
    ...(query.cursor
      ? {
          cursor: { id: query.cursor },
          skip: 1,
        }
      : {}),
  });

  const hasMore = items.length > query.limit;
  const pageItems = hasMore ? items.slice(0, query.limit) : items;
  const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null;

  const files = await Promise.all(
    pageItems.map(async (item) => {
      try {
        const fileUrl =
          gallery.visibility === "PUBLIC" ? publicUrl(item.file.key) : await presignGet(item.file.key);
        return {
          id: item.file.id,
          filename: item.file.filename,
          mime: item.file.mime,
          bytes: item.file.bytes,
          createdAt: item.file.createdAt.toISOString(),
          _url: fileUrl ?? null,
        };
      } catch (error) {
        console.error("Failed to resolve file URL", { key: item.file.key, error });
        return {
          id: item.file.id,
          filename: item.file.filename,
          mime: item.file.mime,
          bytes: item.file.bytes,
          createdAt: item.file.createdAt.toISOString(),
          _url: null,
        };
      }
    })
  );

  return Response.json({
    items: files,
    nextCursor,
    hasMore,
  });
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const gallery = await prisma.gallery.findUnique({
    where: { id },
    include: { items: true, managers: true },
  });
  if (!gallery || !canManageGallery(gallery, session)) {
    return new Response("Forbidden", { status: 403 });
  }

  const { fileIds } = AddItemsSchema.parse(await req.json());
  const uniqueIds = Array.from(new Set(fileIds));
  const alreadyPresent = new Set(gallery.items.map((item) => item.fileId));
  const toAdd = uniqueIds.filter((fileId) => !alreadyPresent.has(fileId));
  if (toAdd.length === 0) {
    return Response.json({ added: 0 });
  }

  const ownedFiles = await prisma.file.findMany({
    where: { id: { in: toAdd }, ownerId: session.user.id },
    select: { id: true },
  });
  if (ownedFiles.length === 0) {
    return Response.json({ added: 0 });
  }

  const ownedSet = new Set(ownedFiles.map((file) => file.id));
  const orderedIds = toAdd.filter((fileId) => ownedSet.has(fileId));
  if (orderedIds.length === 0) {
    return Response.json({ added: 0 });
  }

  const maxPosition = gallery.items.reduce((max, item) => Math.max(max, item.position ?? 0), -1);

  await prisma.$transaction(
    orderedIds.map((fileId, index) =>
      prisma.galleryItem.create({
        data: {
          galleryId: gallery.id,
          fileId,
          position: maxPosition + index + 1,
        },
      })
    )
  );

  void audit({ action: "gallery.items.add", actorId: session.user.id, resource: `gallery/${gallery.id}`, metadata: { addedCount: orderedIds.length } });

  return Response.json({ added: orderedIds.length });
}
