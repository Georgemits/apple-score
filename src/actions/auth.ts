"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientAddress, peekRateLimit, rateLimit, retryMessage } from "@/lib/rate-limit";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

const BCRYPT_ROUNDS = 12;

/**
 * Attempts allowed per window. Sign-in buckets only count *failed* attempts,
 * so a legitimate owner cannot be locked out by their own successful logins,
 * and a remote attacker needs the victim's address to exhaust the per-address
 * bucket; the wider per-account bucket caps spraying from many addresses.
 */
const LIMITS = {
  signupPerAddress: { limit: 5, windowSeconds: 60 * 60 },
  loginPerAddress: { limit: 30, windowSeconds: 15 * 60 },
  loginPerAccountAndAddress: { limit: 10, windowSeconds: 15 * 60 },
  loginPerAccount: { limit: 40, windowSeconds: 15 * 60 },
} as const;

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const address = await clientAddress();
  if (address) {
    const limited = await rateLimit(
      `signup:ip:${address}`,
      LIMITS.signupPerAddress.limit,
      LIMITS.signupPerAddress.windowSeconds
    );
    if (!limited.ok) return failure(retryMessage(limited));
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    return existing.email === email
      ? failure("That email is already registered.", {
          email: ["That email is already registered."],
        })
      : failure("That username is taken.", { username: ["That username is taken."] });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.user.create({ data: { username, email, passwordHash } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "";
      return target.includes("email")
        ? failure("That email is already registered.", {
            email: ["That email is already registered."],
          })
        : failure("That username is taken.", { username: ["That username is taken."] });
    }
    console.error("signupAction:", error);
    return failure("Something went wrong creating your account. Please try again.");
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return failure("Account created, but automatic sign-in failed. Please log in.");
    }
    throw error;
  }

  return { ok: true };
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const { email } = parsed.data;
  const address = await clientAddress();

  const buckets = [
    address ? { key: `login:ip:${address}`, ...LIMITS.loginPerAddress } : null,
    address ? { key: `login:acct:${email}:${address}`, ...LIMITS.loginPerAccountAndAddress } : null,
    { key: `login:acct:${email}`, ...LIMITS.loginPerAccount },
  ].filter((bucket): bucket is NonNullable<typeof bucket> => bucket !== null);

  // Refuse up front when a bucket is already exhausted…
  for (const bucket of buckets) {
    const state = await peekRateLimit(bucket.key, bucket.limit);
    if (!state.ok) return failure(retryMessage(state));
  }

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        // …and only failed attempts spend the budget.
        await Promise.all(
          buckets.map((bucket) => rateLimit(bucket.key, bucket.limit, bucket.windowSeconds))
        );
        return failure("Incorrect email or password.");
      }
      return failure("Could not sign you in. Please try again.");
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
