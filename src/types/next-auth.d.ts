import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
    } & DefaultSession["user"];
  }

  interface User {
    username: string;
    /** Mirrors `User.sessionVersion`; a mismatch invalidates the session. */
    sessionVersion: number;
  }
}

/**
 * `next-auth/jwt` is only a re-export (`export * from "@auth/core/jwt"`), so
 * augmenting that specifier does not merge into the JWT interface. The
 * declaring module has to be augmented directly.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    username: string;
    sessionVersion: number;
    /** Epoch ms of the last database check of `sessionVersion`. */
    verifiedAt?: number;
  }
}

export {};
