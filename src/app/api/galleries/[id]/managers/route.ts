import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { canManageGallery } from "@/lib/gallery-permissions";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

type ManagerResponse = {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  addedAt: string;
};

const AddManagerSchema = z.object({
  email: z.string().email(),
});

const RemoveManagerSchema = z.object({
  userId: z.string().min(1),
});

function serialiseManager(manager: { id: string; userId: string; createdAt: Date; user: { name: string | null; email: string | null } | null }): ManagerResponse {
  return {
    id: manager.id,
    userId: manager.userId,
    name: manager.user?.name ?? null,
    email: manager.user?.email ?? null,
    addedAt: manager.createdAt.toISOString(),
  };
}

async function loadGallery(id: string) {
  return prisma.gallery.findUnique({
    where: { id },
    include: { managers: { include: { user: true } }, owner: true },
  });
}

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const gallery = await loadGallery(id);
  if (!gallery || !canManageGallery(gallery, session)) return new Response("Forbidden", { status: 403 });
  const managers = gallery.managers
    .filter((manager) => manager.userId !== gallery.ownerId)
    .map(serialiseManager)
    .sort((a, b) => a.addedAt.localeCompare(b.addedAt));
  return Response.json(managers);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const gallery = await loadGallery(id);
  if (!gallery || !canManageGallery(gallery, session)) return new Response("Forbidden", { status: 403 });
  const canEdit = session.user.role === "ADMIN" || session.user.id === gallery.ownerId;
  if (!canEdit) return new Response("Forbidden", { status: 403 });

  const { email } = AddManagerSchema.parse(await req.json());
  const trimmedEmail = email.trim();
  const targetUser =
    (await prisma.user.findUnique({ where: { email: trimmedEmail } })) ??
    (await prisma.user.findUnique({ where: { email: trimmedEmail.toLowerCase() } }));
  if (!targetUser) {
    return new Response("User not found", { status: 404 });
  }
  if (targetUser.id === gallery.ownerId) {
    return new Response("Gallery owners already manage their galleries.", { status: 400 });
  }
  if (targetUser.role === "USER") {
    return new Response("Only uploaders or admins can be assigned as gallery managers.", { status: 400 });
  }

  const manager = await prisma.galleryManager.upsert({
    where: { galleryId_userId: { galleryId: gallery.id, userId: targetUser.id } },
    update: {},
    create: { galleryId: gallery.id, userId: targetUser.id },
    include: { user: true },
  });

  void audit({ action: "gallery.manager.add", actorId: session.user.id, resource: `gallery/${gallery.id}`, metadata: { managerUserId: targetUser.id, managerEmail: trimmedEmail } });

  return Response.json(serialiseManager(manager));
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const gallery = await loadGallery(id);
  if (!gallery || !canManageGallery(gallery, session)) return new Response("Forbidden", { status: 403 });
  const canEdit = session.user.role === "ADMIN" || session.user.id === gallery.ownerId;
  if (!canEdit) return new Response("Forbidden", { status: 403 });

  const { userId } = RemoveManagerSchema.parse(await req.json());
  if (userId === gallery.ownerId) {
    return new Response("Cannot remove the gallery owner.", { status: 400 });
  }

  const existing = await prisma.galleryManager.findUnique({ where: { galleryId_userId: { galleryId: gallery.id, userId } } });
  if (!existing) {
    return new Response("Manager not found", { status: 404 });
  }

  await prisma.galleryManager.delete({ where: { galleryId_userId: { galleryId: gallery.id, userId } } });
  void audit({ action: "gallery.manager.remove", actorId: session.user.id, resource: `gallery/${gallery.id}`, metadata: { removedUserId: userId } });

  return Response.json({ removed: true });
}
