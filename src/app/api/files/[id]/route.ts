import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/s3";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const file = await prisma.file.findUnique({ where: { id } });
  if (!file) {
    return new Response("File not found", { status: 404 });
  }

  const isOwner = file.ownerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    await deleteObject(file.key);
  } catch (error) {
    console.error("Failed to delete file from object storage", error);
    return new Response("Failed to delete file from storage", { status: 500 });
  }

  await prisma.file.delete({ where: { id } });
  const ip = _req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  void audit({ action: "file.delete", actorId: session.user.id, resource: `file/${id}`, ipAddress: ip, metadata: { key: file.key } });
  return Response.json({ success: true });
}
