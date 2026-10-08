import type { NextAuthConfig } from "next-auth";

/** Routes that require a session. */
const PROTECTED_PREFIXES = [
  "/home",
  "/collection",
  "/catalog",
  "/wishlist",
  "/profile",
  "/settings",
  "/welcome",
] as const;

/** Routes a signed-in user should be bounced away from. */
const AUTH_PAGES = ["/login", "/signup"] as const;

/**
 * Edge-safe half of the Auth.js config: no database client and no bcrypt, so it
 * can be imported by `middleware.ts`. Providers are added in `src/auth.ts`.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const { pathname, search } = nextUrl;

      const isProtected = PROTECTED_PREFIXES.some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
      );

      if (isProtected && !isLoggedIn) {
        const redirectUrl = new URL("/login", nextUrl);
        redirectUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
        return Response.redirect(redirectUrl);
      }

      if (isLoggedIn && AUTH_PAGES.some((page) => pathname === page)) {
        return Response.redirect(new URL("/home", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.username = user.username;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.username = token.username;
      return session;
    },
  },
} satisfies NextAuthConfig;
