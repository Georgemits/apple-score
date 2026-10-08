import "server-only";

import { auth } from "@/auth";

export type SessionUser = { userId: string; username: string };

/**
 * The signed-in user for a server action, or null. Every action re-reads the
 * session on the server; nothing about identity is ever taken from the client.
 */
export async function requireUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, username: session.user.username };
}
