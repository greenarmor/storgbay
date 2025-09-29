import NextAuth, { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import { compare } from "bcryptjs";

export type AppSession = DefaultSession & { user: { id: string; role: "USER" | "ADMIN" } };

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
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
      if (user) (session as any).user.role = (user as any).role;
      return session;
    },
  },
});
