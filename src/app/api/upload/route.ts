import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canManageGallery } from "@/lib/gallery-permissions";
import { sanitizeFilename } from "@/lib/file-utils";
import { presignPut } from "@/lib/s3";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return new NextResponse("Unauthorized", { status: 401 });
  const payload = await req.json();
  const rawFilename = typeof payload?.filename === "string" ? payload.filename : undefined;
  const filename = rawFilename ? sanitizeFilename(rawFilename) : undefined;
  const mime = typeof payload?.mime === "string" && payload.mime.trim() ? payload.mime : "application/octet-stream";
  const rawSize = Number(payload?.size);
  const size = Number.isFinite(rawSize) && rawSize > 0 ? rawSize : 0;

  if (size > MAX_UPLOAD_BYTES) {
    return new NextResponse(`File size exceeds the maximum allowed (${MAX_UPLOAD_BYTES / (1024 * 1024)} MB).`, { status: 413 });
  }
  const rawGalleryIds: unknown[] = Array.isArray(payload?.galleryIds) ? payload.galleryIds : [];
  const galleryIds: string[] = Array.from(
    new Set(rawGalleryIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0))
  );
  if (!filename) {
    return new NextResponse("Filename is required", { status: 400 });
  }

  if (galleryIds.length > 0) {
    const galleries = await prisma.gallery.findMany({
      where: { id: { in: galleryIds } },
      include: { managers: { select: { userId: true } } },
    });

    if (galleries.length !== galleryIds.length) {
      return new NextResponse("One or more folders were not found.", { status: 404 });
    }

    const canManageAll = galleries.every((gallery: { ownerId: string; managers: Array<{ userId: string }> }) =>
      canManageGallery(gallery, session)
    );
    if (!canManageAll) {
      return new NextResponse("You do not have permission to upload to one or more folders.", { status: 403 });
    }
  }

  const key = `${session.user.id}/${randomUUID()}-${filename}`;
  const { url } = await presignPut(key, mime, size || undefined);
  const file = await prisma.file.create({
    data: { ownerId: session.user.id, key, filename, bytes: size, mime },
    select: { id: true },
  });

  if (galleryIds.length > 0) {
    const maxPositions = await prisma.galleryItem.groupBy({
      by: ["galleryId"],
      where: { galleryId: { in: galleryIds } },
      _max: { position: true },
    });
    const currentByGallery = new Map<string, number>(
      maxPositions.map((item: { galleryId: string; _max: { position: number | null } }) => [
        item.galleryId,
        item._max.position ?? -1,
      ])
    );

    await prisma.$transaction(
      galleryIds.map((galleryId) => {
        const nextPosition = (currentByGallery.get(galleryId) ?? -1) + 1;
        currentByGallery.set(galleryId, nextPosition);
        return prisma.galleryItem.create({
          data: {
            galleryId,
            fileId: file.id,
            position: nextPosition,
          },
        });
      })
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  void audit({ action: "file.upload", actorId: session.user.id, resource: `file/${file.id}`, ipAddress: ip, metadata: { filename, bytes: size, mime } });

  return NextResponse.json({ url, key });
}
