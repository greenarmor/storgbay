import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageGallery } from "@/lib/gallery-permissions";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const AddItemsSchema = z.object({
  fileIds: z.array(z.string().min(1)).min(1),
});

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

  return Response.json({ added: orderedIds.length });
}
