import NextAuth, { DefaultSession, getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export type AppSessionUser = DefaultSession["user"] & {
  id: string;
  role: "USER" | "UPLOADER" | "ADMIN";
};

export type AppSession = DefaultSession & {
  user: AppSessionUser;
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email as string } });
        if (!user?.passwordHash) return null;
        const ok = await compare(creds.password as string, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email!, name: user.name, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as AppSessionUser["role"],
        } as AppSessionUser;
      }
      return session as AppSession;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

export const auth = async () =>
  (await getServerSession(authOptions)) as AppSession | null;

