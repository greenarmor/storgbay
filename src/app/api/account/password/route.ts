import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(6, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  let data: z.infer<typeof UpdatePasswordSchema>;
  try {
    const json = await request.json();
    data = UpdatePasswordSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user || !user.passwordHash) {
    return new Response("Password authentication is not enabled for this account.", { status: 400 });
  }

  const matches = await compare(data.currentPassword, user.passwordHash);
  if (!matches) {
    return new Response("Current password is incorrect.", { status: 403 });
  }

  const passwordHash = await hash(data.newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  return new Response(null, { status: 204 });
}
