import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

const RoleEnum = z.enum(["USER", "UPLOADER", "ADMIN"]);

type RouteContext = { params: Promise<{ id: string }> };

const UpdateUserSchema = z
  .object({
    role: RoleEnum.optional(),
    password: z.string().min(6).optional(),
  })
  .refine((data) => typeof data.role !== "undefined" || typeof data.password !== "undefined", {
    message: "No updates supplied.",
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

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const body = await request.json();
  let data;
  try {
    data = UpdateUserSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issue = error.issues.at(0);
      return new Response(issue?.message ?? "Invalid request payload.", { status: 400 });
    }
    throw error;
  }

  const { id } = await context.params;

  if (data.role && id === session.user.id) {
    return new Response("You cannot change your own role.", { status: 400 });
  }

  const updateData: { role?: Role; passwordHash?: string } = {};

  if (data.role) {
    updateData.role = data.role;
  }

  if (data.password) {
    updateData.passwordHash = await hash(data.password, 12);
  }

  try {
    const user = await prisma.user.update({ where: { id }, data: updateData });
    return Response.json(sanitizeUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return new Response("User not found.", { status: 404 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return new Response("Forbidden", { status: 403 });
  }

  const { id } = await context.params;

  if (id === session.user.id) {
    return new Response("You cannot delete your own account.", { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return new Response("User not found.", { status: 404 });
    }
    throw error;
  }
}
