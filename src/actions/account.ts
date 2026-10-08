"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import bcrypt from "bcryptjs";
import { auth, signOut, updateSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, retryMessage } from "@/lib/rate-limit";
import { changePasswordSchema, deleteAccountSchema, profileSchema } from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

const BCRYPT_ROUNDS = 12;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { userId: session.user.id, username: session.user.username };
}

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const me = await requireUser();
  if (!me) return failure("You need to be signed in to do that.");

  try {
    await prisma.user.update({ where: { id: me.userId }, data: parsed.data });
  } catch (error) {
    console.error("updateProfileAction:", error);
    return failure("Could not save your profile. Please try again.");
  }

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/leaderboard");
  revalidatePath(`/u/${me.username}`);
  revalidateTag("community");

  return { ok: true };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const me = await requireUser();
  if (!me) return failure("You need to be signed in to do that.");

  const user = await prisma.user.findUnique({
    where: { id: me.userId },
    select: { passwordHash: true },
  });
  if (!user) return failure("Account not found.");

  // A live session must not be able to brute-force the real password.
  const limited = await rateLimit(`password:user:${me.userId}`, 5, 15 * 60);
  if (!limited.ok) return failure(retryMessage(limited));

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return failure("Your current password is incorrect.", {
      currentPassword: ["Your current password is incorrect."],
    });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_ROUNDS);
  // Bumping the version signs out every other device; this session is
  // updated in place so the owner stays signed in.
  const updated = await prisma.user.update({
    where: { id: me.userId },
    data: { passwordHash, sessionVersion: { increment: 1 } },
    select: { sessionVersion: true },
  });
  await updateSession({ sessionVersion: updated.sessionVersion } as unknown as Parameters<
    typeof updateSession
  >[0]);

  return { ok: true };
}

/**
 * Permanently deletes the account and everything it owns (cascades), after
 * re-checking the password. Signs the user out afterwards.
 */
export async function deleteAccountAction(input: unknown): Promise<ActionResult> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const me = await requireUser();
  if (!me) return failure("You need to be signed in to do that.");

  const user = await prisma.user.findUnique({
    where: { id: me.userId },
    select: { passwordHash: true },
  });
  if (!user) return failure("Account not found.");

  const limited = await rateLimit(`password:user:${me.userId}`, 5, 15 * 60);
  if (!limited.ok) return failure(retryMessage(limited));

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return failure("Incorrect password.", { password: ["Incorrect password."] });

  await prisma.user.delete({ where: { id: me.userId } });
  revalidatePath("/leaderboard");
  revalidateTag("community");

  await signOut({ redirectTo: "/?deleted=1" });
  return { ok: true };
}

/** Marks the welcome flow as skipped without adding anything. */
export async function skipOnboardingAction(): Promise<ActionResult> {
  const me = await requireUser();
  if (!me) return failure("You need to be signed in to do that.");

  await prisma.user.update({
    where: { id: me.userId },
    data: { onboardedAt: new Date() },
  });
  revalidatePath("/home");
  return { ok: true };
}
