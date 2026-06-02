import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/s3";
import { compare } from "bcryptjs";
import { z } from "zod";

const DeleteAccountSchema = z.object({
  password: z.string().min(1, "Password confirmation is required."),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  let data: z.infer<typeof DeleteAccountSchema>;
  try {
    const json = await request.json();
    data = DeleteAccountSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.passwordHash) {
    return new Response("Password authentication is not enabled for this account.", { status: 400 });
  }

  const matches = await compare(data.password, user.passwordHash);
  if (!matches) {
    return new Response("Password is incorrect.", { status: 403 });
  }

  const files = await prisma.file.findMany({
    where: { ownerId: userId },
    select: { key: true },
  });

  for (const file of files) {
    try {
      await deleteObject(file.key);
    } catch (error) {
      console.error("Failed to delete file from object storage during account deletion", { key: file.key, error });
    }
  }

  void audit({ action: "account.delete", actorId: userId, resource: `user/${userId}`, metadata: { fileCount: files.length } });

  await prisma.user.delete({ where: { id: userId } });

  return Response.json({ success: true });
}
