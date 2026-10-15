import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { notify } from "@/lib/notifications";
import { buildResetUrl, createResetToken, RESET_TOKEN_TTL_MINUTES } from "@/lib/password-reset";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

const RoleEnum = z.enum(["USER", "UPLOADER", "ADMIN"]);

const CreateUserSchema = z.object({
  name: z.string().trim().optional().nullable(),
  email: z.string().email(),
  // Omit the password to invite: the account is created passwordless and the invitee
  // receives a one-time link to choose their own.
  password: z.string().min(6).optional(),
  role: RoleEnum.default("UPLOADER"),
});

function sanitizeUser<T extends { passwordHash: string | null }>(user: T): Omit<T, "passwordHash"> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return Response.json(users.map(sanitizeUser));
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const json = await request.json();
  let data;
  try {
    data = CreateUserSchema.parse(json);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  // Invite mode reuses the password-reset token rather than adding a second token model:
  // it is hashed at rest, single use, expiring, and already exercised end to end.
  const invite = data.password ? null : createResetToken();
  const inviteUrl = invite ? buildResetUrl(invite.token, request) : null;
  const passwordHash = data.password ? await hash(data.password, 12) : null;
  const email = data.email.trim().toLowerCase();

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email,
        passwordHash,
        role: data.role as unknown as Prisma.UserCreateInput["role"],
        ...(invite
          ? { passwordResetTokenHash: invite.tokenHash, passwordResetExpiresAt: invite.expiresAt }
          : {}),
      },
    });

    // With a password the administrator typed a credential, so the new owner should still
    // replace it. Without one, the invite link does the work.
    const delivery =
      invite && inviteUrl
        ? await notify({
            kind: "account.invited",
            to: email,
            role: data.role,
            inviteUrl,
            expiresInMinutes: RESET_TOKEN_TTL_MINUTES,
          })
        : await notify({ kind: "account.created", to: email, role: data.role, request });

    void audit({
      action: invite ? "admin.user.invite" : "admin.user.create",
      actorId: session.user.id,
      resource: `user/${user.id}`,
      metadata: { email, role: data.role, delivery },
      request,
    });

    // Returning the invite URL mirrors the reset-link endpoint: with no mail transport
    // configured the administrator still needs a link to hand over.
    return Response.json(
      {
        ...sanitizeUser(user),
        invited: Boolean(invite),
        delivery,
        ...(inviteUrl ? { inviteUrl } : {}),
        ...(invite ? { inviteExpiresAt: invite.expiresAt.toISOString() } : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new Response("A user with this email already exists.", { status: 409 });
    }
    throw error;
  }
}
