import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Carry the role into the JWT on sign-in (from Credentials provider,
        // which already fetches it from the database).
        token.role = (user as { role?: "USER" | "ADMIN" }).role || "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as "USER" | "ADMIN") || "USER";
      }
      return session;
    },
    authorized({ request, auth: authSession }) {
      const { pathname } = request.nextUrl;
      const loginRoutes = [
        "/cart",
        "/favorites",
        "/reviews",
        "/account",
        "/checkout",
        "/orders",
      ];
      const isLoginRoute = loginRoutes.some((route) =>
        pathname.startsWith(route),
      );
      const isAdminRoute = pathname.startsWith("/admin");

      // Admin routes require BOTH authentication AND the ADMIN role.
      if (isAdminRoute) {
        if (!authSession?.user) return false;
        // A logged-in, non-admin user is redirected back home.
        if (authSession.user.role !== "ADMIN") {
          const url = request.nextUrl.clone();
          url.pathname = "/";
          url.search = "";
          return Response.redirect(url);
        }
        return true;
      }

      // Other protected routes just require being logged in.
      if (isLoginRoute && !authSession?.user) {
        return false;
      }

      return true;
    },
  },
  providers: [], // يترك فارغاً هنا
} satisfies NextAuthConfig;
