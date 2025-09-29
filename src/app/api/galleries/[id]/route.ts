import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateSchema = z.object({ title: z.string().optional(), description: z.string().optional(), visibility: z.enum(["PUBLIC","PRIVATE"]).optional() });

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const g = await prisma.gallery.findUnique({ where: { id: params.id }, include: { items: { include: { file: true } }, owner: true } });
  if(!g) return new Response("Not found", { status: 404 });
  if (g.visibility === "PUBLIC") return Response.json(g);
  const session = await auth();
  if (!session || (session as any).user.id !== g.ownerId) return new Response("Forbidden", { status: 403 });
  return Response.json(g);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const g = await prisma.gallery.findUnique({ where: { id: params.id } });
  if (!g || g.ownerId !== (session as any).user.id) return new Response("Forbidden", { status: 403 });
  const data = UpdateSchema.parse(await req.json());
  const updated = await prisma.gallery.update({ where: { id: g.id }, data });
  return Response.json(updated);
}
