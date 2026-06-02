import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  const [user, files, galleries, managedGalleries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.file.findMany({
      where: { ownerId: userId },
      select: { id: true, filename: true, bytes: true, mime: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.gallery.findMany({
      where: { ownerId: userId },
      select: { id: true, title: true, visibility: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.galleryManager.findMany({
      where: { userId },
      select: {
        gallery: { select: { id: true, title: true, visibility: true } },
        createdAt: true,
      },
    }),
  ]);

  void audit({ action: "account.data.export", actorId: userId, resource: `user/${userId}` });

  return Response.json({
    exportedAt: new Date().toISOString(),
    user,
    files,
    ownedGalleries: galleries,
    managedGalleries: managedGalleries.map((mg) => ({
      ...mg.gallery,
      managerSince: mg.createdAt,
    })),
  });
}
