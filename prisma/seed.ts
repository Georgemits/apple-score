import { PrismaClient, type Category } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORY_IMAGE, PRODUCTS } from "./products";

const prisma = new PrismaClient();

/** Demo accounts are only created when SEED_DEMO_USERS is explicitly enabled. */
const DEMO_USERS: { username: string; email: string; owns: Record<string, number> }[] = [
  {
    username: "tim",
    email: "tim@example.com",
    owns: {
      "iphone-17-pro-max": 2,
      "macbook-pro-16-m4-max": 1,
      "mac-studio-m3-ultra": 1,
      "pro-display-xdr": 2,
      "apple-vision-pro-m5": 1,
      "apple-watch-ultra-3": 1,
      "airpods-pro-3": 2,
      "ipad-pro-13-m4": 1,
    },
  },
  {
    username: "steve",
    email: "steve@example.com",
    owns: {
      "iphone-16-pro": 1,
      "macbook-pro-14-m4-pro": 1,
      "studio-display": 1,
      "ipad-air-11-m3": 1,
      "apple-watch-series-11": 1,
      "airpods-max-usb-c": 1,
      "homepod-2": 2,
    },
  },
  {
    username: "alex",
    email: "alex@example.com",
    owns: {
      "iphone-15": 1,
      "macbook-air-13-m4": 1,
      "airpods-4": 1,
      "apple-watch-se-3": 1,
    },
  },
  {
    username: "casey",
    email: "casey@example.com",
    owns: {
      "iphone-se-3": 1,
      "airpods-2": 1,
      "polishing-cloth": 1,
    },
  },
];

async function seedProducts() {
  console.log(`→ Seeding ${PRODUCTS.length} products…`);

  for (const product of PRODUCTS) {
    const category = product.category as Category;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        category,
        priceUSD: product.priceUSD,
        year: product.year,
        image: CATEGORY_IMAGE[category],
      },
      create: {
        slug: product.slug,
        name: product.name,
        category,
        priceUSD: product.priceUSD,
        year: product.year,
        image: CATEGORY_IMAGE[category],
      },
    });
  }

  const total = await prisma.product.count();
  console.log(`✓ Product catalogue ready (${total} products).`);
}

async function seedDemoUsers() {
  if (process.env.SEED_DEMO_USERS !== "true") {
    console.log("→ Skipping demo users (set SEED_DEMO_USERS=true to create them).");
    return;
  }

  const password = process.env.SEED_DEMO_PASSWORD ?? "applescore123";
  const passwordHash = await bcrypt.hash(password, 12);

  console.log(`→ Seeding ${DEMO_USERS.length} demo users…`);

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { username: demo.username, email: demo.email, passwordHash },
    });

    for (const [slug, quantity] of Object.entries(demo.owns)) {
      const product = await prisma.product.findUnique({ where: { slug } });
      if (!product) {
        console.warn(`  ! Unknown product slug "${slug}" for ${demo.username} — skipped.`);
        continue;
      }

      await prisma.userProduct.upsert({
        where: { userId_productId: { userId: user.id, productId: product.id } },
        update: { quantity },
        create: { userId: user.id, productId: product.id, quantity },
      });
    }
  }

  console.log(`✓ Demo users ready (password: "${password}").`);
}

async function main() {
  await seedProducts();
  await seedDemoUsers();
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
