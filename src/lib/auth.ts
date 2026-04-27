import NextAuth, { DefaultSession, getServerSession } from "next-auth";
import type { NextAuthOptions, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
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
  if (password !== bootstrapPassword) return null;

  const passwordHash = await hash(bootstrapPassword, 12);
  const admin = await prisma.user.upsert({
    where: { email: bootstrapEmail },
    create: { email: bootstrapEmail, passwordHash, role: "ADMIN", name: "Admin" },
    update: { passwordHash, role: "ADMIN", name: "Admin" },
  });

  return {
    id: admin.id,
    email: admin.email ?? bootstrapEmail,
    name: admin.name,
    role: admin.role,
  };
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        if (!creds?.email || !creds?.password) return null;
        const bootstrapAdmin = await authorizeBootstrapAdmin(
          creds.email as string,
          creds.password as string,
        );
        if (bootstrapAdmin) return bootstrapAdmin;

        const user = await prisma.user.findUnique({ where: { email: creds.email as string } });
        if (!user?.passwordHash) return null;
        const ok = await compare(creds.password as string, user.passwordHash);
        if (!ok) return null;
        const userWithRole: UserWithRole = {
          id: user.id,
          email: user.email ?? creds.email ?? "",
          name: user.name,
          role: user.role,
        };
        return userWithRole;
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
