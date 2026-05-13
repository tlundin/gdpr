import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { CredentialsSignin } from "@auth/core/errors";
import bcrypt from "bcryptjs";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type UserWithTenant = {
  id: string;
  email: string | null;
  name: string | null;
  tenantId?: string;
  role?: Role;
};

class UnverifiedEmail extends CredentialsSignin {
  code = "unverified";

  constructor() {
    super();
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      authorize: async (credentials): Promise<UserWithTenant | null> => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        if (!user.emailVerified) {
          throw new UnverifiedEmail();
        }

        const membership = await prisma.membership.findFirst({
          where: { userId: user.id },
          orderBy: { id: "asc" },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: membership?.tenantId,
          role: membership?.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      const u = user as UserWithTenant | undefined;
      if (u) {
        token.tenantId = u.tenantId;
        token.role = u.role;
      }

      if (trigger === "update" && session?.tenantId && typeof session.tenantId === "string") {
        const userId = token.sub;
        if (!userId) return token;
        const mem = await prisma.membership.findFirst({
          where: { userId, tenantId: session.tenantId },
        });
        if (mem) {
          token.tenantId = mem.tenantId;
          token.role = mem.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
      }
      session.tenantId = token.tenantId as string | undefined;
      session.role = token.role as Role | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
