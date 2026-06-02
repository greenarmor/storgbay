import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";

const RoleEnum = z.enum(["USER", "UPLOADER", "ADMIN"]);

const CreateUserSchema = z.object({
  name: z.string().trim().optional().nullable(),
  email: z.string().email(),
  password: z.string().min(6),
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

  const passwordHash = await hash(data.password, 12);

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name ?? null,
        email: data.email,
        passwordHash,
        role: data.role as unknown as Prisma.UserCreateInput["role"],
      },
    });
    void audit({ action: "admin.user.create", actorId: session.user.id, resource: `user/${user.id}`, metadata: { email: data.email, role: data.role } });
    return Response.json(sanitizeUser(user), { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return new Response("A user with this email already exists.", { status: 409 });
    }
    throw error;
  }
}
