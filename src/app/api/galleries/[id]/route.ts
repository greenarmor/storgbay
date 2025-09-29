import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewGallery, isGalleryOwner } from "@/lib/gallery-permissions";
import { z } from "zod";

const UpdateSchema = z.object({ title: z.string().optional(), description: z.string().optional(), visibility: z.enum(["PUBLIC","PRIVATE"]).optional() });

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const g = await prisma.gallery.findUnique({ where: { id }, include: { items: { include: { file: true } }, owner: true } });
  if (!g) return new Response("Not found", { status: 404 });
  const session = await auth();
  if (!canViewGallery(g, session)) return new Response("Forbidden", { status: 403 });
  return Response.json(g);
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
  const g = await prisma.gallery.findUnique({ where: { id } });
  if (!g || !isGalleryOwner(g, session)) return new Response("Forbidden", { status: 403 });
  const data = UpdateSchema.parse(await req.json());
  const updated = await prisma.gallery.update({ where: { id: g.id }, data });
  return Response.json(updated);
}
