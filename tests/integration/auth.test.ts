import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";

const signInCalls = vi.hoisted(() => ({ count: 0, fail: false }));

// `next-auth` pulls in Next's server runtime, which Vitest cannot resolve.
// The action only needs the AuthError class for `instanceof` checks.
vi.mock("next-auth", () => {
  class AuthError extends Error {
    type = "AuthError";
  }
  return { AuthError, default: () => ({}) };
});

vi.mock("@/auth", async () => {
  const { AuthError } = await import("next-auth");
  class CredentialsSignin extends AuthError {
    override type = "CredentialsSignin";
  }
  return {
    auth: async () => null,
    signIn: async () => {
      signInCalls.count += 1;
      if (signInCalls.fail) throw new CredentialsSignin();
    },
    signOut: async () => undefined,
  };
});

import { prisma } from "@/lib/prisma";
import { loginAction, signupAction } from "@/actions/auth";
import { TEST_PREFIX, deleteTestUsers } from "./helpers";

describe("sign up", () => {
  beforeAll(async () => {
    await deleteTestUsers();
  });

  afterAll(async () => {
    await deleteTestUsers();
    await prisma.rateLimit.deleteMany({ where: { key: { contains: "127.0.0.1" } } });
    await prisma.rateLimit.deleteMany({ where: { key: { contains: TEST_PREFIX } } });
    await prisma.$disconnect();
  });

  it("creates a user with a hashed password and signs them in", async () => {
    const username = `${TEST_PREFIX}signup${Date.now().toString(36)}`;
    const result = await signupAction({
      username: username.toUpperCase(),
      email: `${username}@Test.Example`,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
    });
    expect(result.ok).toBe(true);

    const user = await prisma.user.findUnique({ where: { username } });
    expect(user).not.toBeNull();
    expect(user!.email).toBe(`${username}@test.example`);
    expect(user!.passwordHash).not.toContain("correct horse");
    expect(await bcrypt.compare("correct horse battery staple", user!.passwordHash)).toBe(true);
    expect(signInCalls.count).toBeGreaterThan(0);
  });

  it("rejects duplicates, reserved names and mismatched passwords", async () => {
    const username = `${TEST_PREFIX}dupe${Date.now().toString(36)}`;
    const base = {
      username,
      email: `${username}@test.example`,
      password: "correct horse battery staple",
      confirmPassword: "correct horse battery staple",
    };
    expect((await signupAction(base)).ok).toBe(true);

    const dupeEmail = await signupAction({ ...base, username: `${username}x` });
    expect(dupeEmail.ok).toBe(false);
    if (!dupeEmail.ok) expect(dupeEmail.fieldErrors?.email).toBeDefined();

    const dupeName = await signupAction({ ...base, email: `other-${username}@test.example` });
    expect(dupeName.ok).toBe(false);
    if (!dupeName.ok) expect(dupeName.fieldErrors?.username).toBeDefined();

    const reserved = await signupAction({
      ...base,
      username: "admin",
      email: `admin-${username}@test.example`,
    });
    expect(reserved.ok).toBe(false);

    const mismatch = await signupAction({
      ...base,
      username: `${username}y`,
      email: `y-${username}@test.example`,
      confirmPassword: "nope",
    });
    expect(mismatch.ok).toBe(false);
  });
});

describe("log in", () => {
  afterAll(async () => {
    await prisma.rateLimit.deleteMany({ where: { key: { contains: "127.0.0.1" } } });
    await prisma.rateLimit.deleteMany({ where: { key: { contains: "limited" } } });
  });

  it("returns a friendly error for bad credentials", async () => {
    signInCalls.fail = true;
    const result = await loginAction({ email: "nobody@test.example", password: "wrong" });
    signInCalls.fail = false;
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/incorrect/i);
  });

  it("rate limits repeated attempts on one account", async () => {
    const email = `limited-${Date.now().toString(36)}@test.example`;
    let blocked = false;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const result = await loginAction({ email, password: "x" });
      if (!result.ok && /too many attempts/i.test(result.error)) {
        blocked = true;
        break;
      }
    }
    expect(blocked).toBe(true);
  });
});
