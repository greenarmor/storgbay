import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { buildResetUrl, createResetToken, sendResetEmail } from "@/lib/password-reset";
import { z } from "zod";

const ForgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address."),
});

export async function POST(request: Request) {
  let parsed: z.infer<typeof ForgotPasswordSchema>;
  try {
    parsed = ForgotPasswordSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const email = parsed.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (user?.passwordHash) {
    const { token, tokenHash, expiresAt } = createResetToken();
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    });

    const delivery = await sendResetEmail(email, buildResetUrl(token, request));
    void audit({
      action: "auth.password.reset_requested",
      actorId: user.id,
      resource: `user/${user.id}`,
      metadata: { delivery },
      request,
    });
  }

  return Response.json({ ok: true });
}
