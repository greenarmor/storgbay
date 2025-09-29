import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export type AppSessionUser = DefaultSession["user"] & {
  id: string;
  role: "USER" | "ADMIN";
};

export type AppSession = DefaultSession & {
  user: AppSessionUser;
};

const authConfig = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "database" },
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user = {
          ...session.user,
          id: user.id,
          role: (user as any).role,
        } as AppSessionUser;
      }
      return session as AppSession;
    },
  },
});

export const {
  handlers: { GET, POST },
  auth: baseAuth,
  signIn,
  signOut,
} = authConfig;

export const auth = baseAuth as () => Promise<AppSession | null>;
