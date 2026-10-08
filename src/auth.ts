import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

/**
 * A real 60-character bcrypt hash of an unguessable value. Comparing against it
 * when the email is unknown keeps sign-in timing constant, and bcryptjs skips the
 * work entirely for strings that are not exactly 60 characters long.
 */
const DUMMY_HASH = `$2a$12$${"a".repeat(53)}`;

/** How often a session re-checks `sessionVersion` against the database. */
const SESSION_RECHECK_MS = 60 * 1000;

export const {
  handlers,
  signIn,
  signOut,
  auth,
  unstable_update: updateSession,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            username: true,
            email: true,
            passwordHash: true,
            sessionVersion: true,
          },
        });

        // Always run a hash comparison so timing does not reveal whether the
        // email exists.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) return null;

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.username,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    /**
     * Besides stamping the token at sign-in, this periodically confirms the
     * account still exists and its `sessionVersion` has not moved (it moves on
     * password change). Returning null signs the session out.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id ?? token.sub ?? "";
        token.username = user.username;
        token.sessionVersion = user.sessionVersion;
        token.verifiedAt = Date.now();
        return token;
      }

      if (trigger === "update" && session && typeof session.sessionVersion === "number") {
        token.sessionVersion = session.sessionVersion;
        token.verifiedAt = Date.now();
        return token;
      }

      const stale = !token.verifiedAt || Date.now() - token.verifiedAt > SESSION_RECHECK_MS;
      if (stale && token.id) {
        const current = await prisma.user.findUnique({
          where: { id: token.id },
          select: { sessionVersion: true },
        });
        if (!current || current.sessionVersion !== (token.sessionVersion ?? 0)) return null;
        token.verifiedAt = Date.now();
      }

      return token;
    },
  },
});
