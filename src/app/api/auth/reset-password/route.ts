import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { MIN_PASSWORD_LENGTH, hashResetToken, isExpired } from "@/lib/password-reset";
import { notify } from "@/lib/notifications";
import { hash } from "bcryptjs";
import { z } from "zod";

const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Missing reset token."),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof ResetPasswordSchema>;
  try {
    parsed = ResetPasswordSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { passwordResetTokenHash: hashResetToken(parsed.token) },
  });

  if (!user || isExpired(user.passwordResetExpiresAt)) {
    return new Response("This reset link is invalid or has expired. Request a new one.", {
      status: 400,
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hash(parsed.newPassword, 12),
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
    },
  });

  // A password change is a security event the account owner must hear about even
  // if they did not initiate it.
  const delivery = user.email
    ? await notify({ kind: "password.reset", to: user.email, request })
    : "not-configured";

  void audit({
    action: "auth.password.reset_completed",
    actorId: user.id,
    resource: `user/${user.id}`,
    metadata: { delivery },
    request,
  });

  return new Response(null, { status: 204 });
}
