"use server";

import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/lib/validations";
import { failure, type ActionResult } from "@/actions/types";

const BCRYPT_ROUNDS = 12;

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Please fix the highlighted fields.", parsed.error.flatten().fieldErrors);
  }

  const { username, email, password } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });

  if (existing) {
    return existing.email === email
      ? failure("That email is already registered.", { email: ["That email is already registered."] })
      : failure("That username is taken.", { username: ["That username is taken."] });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    await prisma.user.create({ data: { username, email, passwordHash } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = Array.isArray(error.meta?.target) ? error.meta.target.join(",") : "";
      return target.includes("email")
        ? failure("That email is already registered.", { email: ["That email is already registered."] })
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

  try {
    await signIn("credentials", { ...parsed.data, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? failure("Incorrect email or password.")
        : failure("Could not sign you in. Please try again.");
    }
    throw error;
  }

  return { ok: true };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
