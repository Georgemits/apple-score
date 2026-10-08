import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Every test creates its own users with a unique prefix and deletes them
 * afterwards, so suites can share one database without stepping on each
 * other. The product catalogue is expected to be seeded already.
 */
export const TEST_PREFIX = "t_";

export async function createTestUser(
  overrides: { username?: string; password?: string; isPublic?: boolean } = {}
) {
  const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
  const username = overrides.username ?? `${TEST_PREFIX}${suffix}`;
  const password = overrides.password ?? "correct horse battery staple";
  const user = await prisma.user.create({
    data: {
      username,
      email: `${username}@test.example`,
      passwordHash: await bcrypt.hash(password, 4),
      isPublic: overrides.isPublic ?? true,
    },
  });
  return { ...user, password };
}

export async function deleteTestUsers() {
  await prisma.user.deleteMany({ where: { username: { startsWith: TEST_PREFIX } } });
}

export async function product(slug: string) {
  const row = await prisma.product.findUnique({ where: { slug } });
  if (!row) throw new Error(`Catalogue is not seeded: missing product "${slug}". Run \`npm run db:seed\`.`);
  return row;
}

export async function own(userId: string, slug: string, quantity = 1, pricePaidUSD: number | null = null) {
  const row = await product(slug);
  await prisma.userProduct.upsert({
    where: { userId_productId: { userId, productId: row.id } },
    update: { quantity, pricePaidUSD },
    create: { userId, productId: row.id, quantity, pricePaidUSD },
  });
  return row;
}
