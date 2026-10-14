import NextAuth, { DefaultSession, getServerSession } from "next-auth";
import type { NextAuthOptions, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { audit } from "@/lib/audit";
import { compare, hash } from "bcryptjs";

export type AppSessionUser = DefaultSession["user"] & {
  id: string;
  role: "USER" | "UPLOADER" | "ADMIN";
};

export type AppSession = DefaultSession & {
  user: AppSessionUser;
};

type UserWithRole = User & { role: AppSessionUser["role"] };
type TokenWithRole = JWT & {
  id?: string;
  role?: AppSessionUser["role"];
};

async function authorizeBootstrapAdmin(email: string, password: string): Promise<UserWithRole | null> {
  const bootstrapEmail = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!bootstrapEmail || !bootstrapPassword) return null;
  if (email.trim().toLowerCase() !== bootstrapEmail) return null;

  const passwordHash = await hash(bootstrapPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: bootstrapEmail },
    create: { email: bootstrapEmail, passwordHash, role: "ADMIN", name: "Admin" },
    update: { passwordHash, role: "ADMIN", name: "Admin" },
  });

  const ok = await compare(password, admin.passwordHash ?? passwordHash);
  if (!ok) return null;

  return {
    id: admin.id,
    email: admin.email ?? bootstrapEmail,
    name: admin.name,
    role: admin.role,
  };
}

async function authorizeCredentials(
  creds: Partial<Record<"email" | "password", string>> | undefined,
): Promise<UserWithRole | null> {
  if (!creds?.email || !creds?.password) {
    void audit({ action: "auth.login.failed", metadata: { reason: "missing_credentials" } });
    return null;
  }
  const emailAttempt = creds.email.trim().toLowerCase();

  const bootstrapAdmin = await authorizeBootstrapAdmin(creds.email, creds.password);
  if (bootstrapAdmin) return bootstrapAdmin;

  const user = await prisma.user.findUnique({ where: { email: emailAttempt } });
  if (!user?.passwordHash) {
    void audit({ action: "auth.login.failed", metadata: { reason: "user_not_found", email: emailAttempt } });
    return null;
  }
  const ok = await compare(creds.password, user.passwordHash);
  if (!ok) {
    void audit({ action: "auth.login.failed", actorId: user.id, metadata: { reason: "wrong_password" } });
    return null;
  }
  const userWithRole: UserWithRole = {
    id: user.id,
    email: user.email ?? emailAttempt,
    name: user.name,
    role: user.role,
  };
  return userWithRole;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production" ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        try {
          return await authorizeCredentials(creds);
        } catch (error) {
          // NextAuth swallows thrown errors and returns a bare 401, which makes
          // a broken database schema or misconfigured env look like bad
          // credentials. Surface the real cause in server logs and the audit trail.
          console.error(
            "[auth] credentials authorize threw:",
            error instanceof Error ? (error.stack ?? error.message) : error,
          );
          void audit({
            action: "auth.login.failed",
            metadata: {
              reason: "authorize_exception",
              error: error instanceof Error ? error.message : String(error),
            },
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const tokenWithRole = token as TokenWithRole;
      if (user) {
        const userWithRole = user as UserWithRole;
        tokenWithRole.id = userWithRole.id;
        tokenWithRole.role = userWithRole.role;
      }
      return tokenWithRole;
    },
    async session({ session, token }) {
      if (session.user && token) {
        const tokenWithRole = token as TokenWithRole;
        const userWithRole: AppSessionUser = {
          ...session.user,
          id: tokenWithRole.id ?? "",
          role: tokenWithRole.role ?? "USER",
        };
        session.user = userWithRole;
      }
      return session as AppSession;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const auth = async () =>
  (await getServerSession(authOptions)) as AppSession | null;
