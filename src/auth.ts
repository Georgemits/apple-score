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

export const { handlers, signIn, signOut, auth } = NextAuth({
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
          select: { id: true, username: true, email: true, passwordHash: true },
        });

        // Always run a hash comparison so timing does not reveal whether the
        // email exists.
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) return null;

        return { id: user.id, username: user.username, email: user.email, name: user.username };
      },
    }),
  ],
});
