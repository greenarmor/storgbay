import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicUrl } from "@/lib/s3";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const files = await prisma.file.findMany({
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

  const payload = files.map((file) => {
    const url = publicUrl(file.key);

    return {
      id: file.id,
      filename: file.filename,
      mime: file.mime,
      bytes: file.bytes,
      createdAt: file.createdAt.toISOString(),
      ownerId: file.ownerId,
      ownerName: file.owner?.name ?? null,
      ownerEmail: file.owner?.email ?? null,
      url,
    };
  });

  return Response.json(payload);
}
