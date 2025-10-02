import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const CreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  fileIds: z.array(z.string()).default([]),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });
  const body = await req.json();
  const { title, description, visibility, fileIds } = CreateSchema.parse(body);
  const gallery = await prisma.gallery.create({
    data: {
      title,
      description,
      visibility,
      ownerId: session.user.id,
      items: { create: fileIds.map((id: string, i: number) => ({ fileId: id, position: i })) },
    },
    include: { items: true },
  });
  return Response.json(gallery);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope");

  if (scope === "mine") {
    const session = await auth();
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });
    const galleries = await prisma.gallery.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { managers: { some: { userId: session.user.id } } },
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
      },
    });
    const payload = galleries.map((gallery) => ({
      id: gallery.id,
      title: gallery.title,
      visibility: gallery.visibility,
      ownerId: gallery.ownerId,
      ownerLabel: gallery.owner?.name ?? gallery.owner?.email ?? "Unknown owner",
      role: gallery.ownerId === session.user.id ? "OWNER" : "MANAGER",
    }));
    return Response.json(payload);
  }

  const galleries = await prisma.gallery.findMany({
    where: { visibility: "PUBLIC" },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { file: true } } },
  });
  return Response.json(galleries);
}
