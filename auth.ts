import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/utils/db";
import { authConfig } from "./auth.config";

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return false;
  if (now > record.resetAt) {
    loginAttempts.delete(key);
    return false;
  }
  return record.count >= 5;
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record || now > record.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.count += 1;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const rawEmail = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!rawEmail || !password) return null;

        const email = rawEmail.trim().toLowerCase();
        const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
        const ip = forwardedIp || request.headers.get("x-real-ip") || "unknown";
        const rateLimitKey = `${ip}:${email}`;

        if (isRateLimited(rateLimitKey)) {
          throw new Error("Too many failed login attempts. Please try again in 15 minutes.");
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) {
          recordFailedLogin(rateLimitKey);
          return null;
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
          recordFailedLogin(rateLimitKey);
          return null;
        }
        loginAttempts.delete(rateLimitKey);

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
  ],
});
