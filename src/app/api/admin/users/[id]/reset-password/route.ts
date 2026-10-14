import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildResetUrl, createResetToken } from "@/lib/password-reset";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await context.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return new Response("User not found.", { status: 404 });
  }

  const { token, tokenHash, expiresAt } = createResetToken();
  await prisma.user.update({
    where: { id },
    data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
  });

  void audit({
    action: "admin.user.password_reset_link",
    actorId: session.user.id,
    resource: `user/${id}`,
    request,
  });

  return Response.json({
    email: user.email,
    resetUrl: buildResetUrl(token, request),
    expiresAt: expiresAt.toISOString(),
  });
}
