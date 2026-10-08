import { PrismaClient, type Category } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORY_IMAGE, PRODUCTS } from "./products";
import { LEGACY_PRODUCTS } from "./legacy-products";
import { familyOf } from "../src/lib/families";
import { ACHIEVEMENTS, unlockedIds, type AchievementContext } from "../src/lib/achievements";
import { breakdownByCategory, calculateScore, countProducts } from "../src/lib/score";

const prisma = new PrismaClient();

/* -------------------------------------------------------------------------
 * Catalogue
 * ---------------------------------------------------------------------- */

async function seedProducts() {
  const all = [...PRODUCTS, ...LEGACY_PRODUCTS];
  console.log(
    `→ Seeding ${all.length} products (${PRODUCTS.length} current, ${LEGACY_PRODUCTS.length} legacy)…`
  );

  const slugs = new Set<string>();
  for (const product of all) {
    if (slugs.has(product.slug)) throw new Error(`Duplicate product slug: ${product.slug}`);
    slugs.add(product.slug);
  }

  for (const product of all) {
    const category = product.category as Category;
    const data = {
      name: product.name,
      category,
      family: product.family ?? familyOf(product.name, category),
      priceUSD: product.priceUSD,
      currentPriceUSD: product.currentPriceUSD ?? null,
      year: product.year,
      legacy: product.legacy ?? false,
      image: CATEGORY_IMAGE[category],
    };
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: data,
      create: { slug: product.slug, ...data },
    });
  }

  const total = await prisma.product.count();
  const legacy = await prisma.product.count({ where: { legacy: true } });
  console.log(`✓ Product catalogue ready (${total} products, ${legacy} legacy).`);
}

/* -------------------------------------------------------------------------
 * Demo accounts (opt-in)
 * ---------------------------------------------------------------------- */

type DemoUser = {
  username: string;
  displayName?: string;
  bio?: string;
  avatarEmoji?: string;
  avatarHue?: number;
  /** slug → [quantity, pricePaidUSD?] */
  owns: Record<string, number | [number, number]>;
  follows?: string[];
  /** Days ago the account was created. */
  joinedDaysAgo: number;
};

const DEMO_USERS: DemoUser[] = [
  {
    username: "tim",
    displayName: "Tim",
    bio: "Good morning! Running Apple Park on three MacBook Pros and vibes.",
    avatarEmoji: "🍎",
    avatarHue: 215,
    joinedDaysAgo: 120,
    owns: {
      "iphone-17-pro-max": 2,
      "macbook-pro-16-m4-max": 1,
      "mac-studio-m3-ultra": 1,
      "pro-display-xdr": 2,
      "pro-stand": 2,
      "apple-vision-pro-m5": 1,
      "apple-watch-ultra-3": 1,
      "airpods-pro-3": 2,
      "ipad-pro-13-m4": 1,
      "apple-pencil-pro": 1,
      "homepod-2": 2,
    },
    follows: ["steve", "jony", "lisa"],
  },
  {
    username: "steve",
    displayName: "Steve",
    bio: "One more thing.",
    avatarEmoji: "🖤",
    avatarHue: 0,
    joinedDaysAgo: 110,
    owns: {
      "iphone-16-pro": 1,
      "macbook-pro-14-m4-pro": 1,
      "studio-display": 1,
      "ipad-air-11-m3": 1,
      "apple-watch-series-11": 1,
      "airpods-max-usb-c": 1,
      "homepod-2": 2,
      "macintosh-128k": 1,
      "imac-g3": 1,
      "ipod-1st-gen": 1,
      "iphone-1st-gen": 1,
    },
    follows: ["tim", "woz"],
  },
  {
    username: "woz",
    displayName: "Woz",
    bio: "I still have the garage receipts.",
    avatarEmoji: "🔧",
    avatarHue: 45,
    joinedDaysAgo: 100,
    owns: {
      "apple-i": 1,
      "apple-ii": 2,
      "apple-lisa": 1,
      "macintosh-128k": 1,
      "newton-messagepad": 1,
      "ipod-5th-gen-video": 1,
      "iphone-15": 1,
      "macbook-air-13-m4": 1,
    },
    follows: ["steve"],
  },
  {
    username: "jony",
    displayName: "Jony",
    bio: "Unapologetically aluminium.",
    avatarEmoji: "✏️",
    avatarHue: 190,
    joinedDaysAgo: 90,
    owns: {
      "iphone-air": 1,
      "macbook-air-15-m4": 1,
      "apple-watch-ultra-3": 1,
      "airpods-pro-3": 1,
      "power-mac-g4-cube": 1,
      "imac-g4": 1,
      "ipod-mini": 2,
      "studio-display-nano": 1,
    },
    follows: ["tim", "steve"],
  },
  {
    username: "lisa",
    displayName: "Lisa",
    bio: "Collector of iPads and opinions.",
    avatarEmoji: "📝",
    avatarHue: 280,
    joinedDaysAgo: 75,
    owns: {
      "ipad-pro-13-m4": 1,
      "ipad-mini-a17-pro": 1,
      "ipad-air-13-m2": 1,
      "apple-pencil-pro": 2,
      "magic-keyboard-ipad-pro-13": 1,
      "iphone-16": 1,
      "airpods-4-anc": 1,
    },
    follows: ["tim"],
  },
  {
    username: "alex",
    displayName: "Alex",
    joinedDaysAgo: 60,
    owns: {
      "iphone-15": 1,
      "macbook-air-13-m4": 1,
      "airpods-4": 1,
      "apple-watch-se-3": 1,
    },
    follows: ["tim", "jony"],
  },
  {
    username: "sam",
    displayName: "Sam",
    bio: "Bought everything second-hand. Score says otherwise.",
    avatarEmoji: "🏷️",
    avatarHue: 150,
    joinedDaysAgo: 45,
    owns: {
      "iphone-14-pro": [1, 550],
      "macbook-pro-14-m3": [1, 1100],
      "airpods-pro-2": [1, 150],
      "apple-watch-series-9": [1, 220],
      "mac-mini-m2": [1, 400],
    },
    follows: ["alex"],
  },
  {
    username: "morgan",
    displayName: "Morgan",
    joinedDaysAgo: 30,
    owns: {
      "iphone-17-pro": 1,
      "apple-watch-series-11": 1,
      "airpods-pro-3": 3,
      "airtag-4-pack": 2,
    },
    follows: ["tim", "lisa"],
  },
  {
    username: "riley",
    displayName: "Riley",
    joinedDaysAgo: 20,
    owns: {
      "macbook-pro-16-m4-pro": 1,
      "mac-mini-m4-pro": 1,
      "studio-display": 2,
      "magic-keyboard-touch-id-numeric": 1,
      "magic-trackpad-usb-c": 1,
    },
    follows: ["steve"],
  },
  {
    username: "jamie",
    displayName: "Jamie",
    joinedDaysAgo: 12,
    owns: {
      "iphone-16e": 1,
      "airpods-4": 1,
    },
  },
  {
    username: "casey",
    displayName: "Casey",
    bio: "Budget mode: engaged.",
    avatarEmoji: "💸",
    avatarHue: 320,
    joinedDaysAgo: 8,
    owns: {
      "iphone-se-3": 1,
      "airpods-2": 1,
      "polishing-cloth": 1,
    },
    follows: ["tim"],
  },
  {
    username: "taylor",
    displayName: "Taylor",
    joinedDaysAgo: 3,
    owns: {
      "apple-watch-ultra-3": 1,
      "iphone-17": 1,
    },
    follows: ["morgan"],
  },
];

function daysAgo(days: number, hours = 0): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000 - hours * 60 * 60 * 1000);
}

async function seedDemoUsers() {
  if (process.env.SEED_DEMO_USERS !== "true") {
    console.log("→ Skipping demo users (set SEED_DEMO_USERS=true to create them).");
    return;
  }

  const password = process.env.SEED_DEMO_PASSWORD ?? "applescore123";
  const passwordHash = await bcrypt.hash(password, 12);

  console.log(`→ Seeding ${DEMO_USERS.length} demo users…`);

  const products = await prisma.product.findMany();
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  for (const demo of DEMO_USERS) {
    const email = `${demo.username}@example.com`;
    const createdAt = daysAgo(demo.joinedDaysAgo);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        displayName: demo.displayName ?? null,
        bio: demo.bio ?? null,
        avatarEmoji: demo.avatarEmoji ?? null,
        avatarHue: demo.avatarHue ?? null,
      },
      create: {
        username: demo.username,
        email,
        passwordHash,
        displayName: demo.displayName ?? null,
        bio: demo.bio ?? null,
        avatarEmoji: demo.avatarEmoji ?? null,
        avatarHue: demo.avatarHue ?? null,
        onboardedAt: createdAt,
        createdAt,
      },
    });

    // Rebuild the collection and its history from scratch so re-seeding is idempotent.
    await prisma.activityEvent.deleteMany({ where: { userId: user.id } });
    await prisma.userProduct.deleteMany({ where: { userId: user.id } });
    await prisma.userAchievement.deleteMany({ where: { userId: user.id } });

    const entries = Object.entries(demo.owns);
    let running = 0;
    let index = 0;

    for (const [slug, spec] of entries) {
      const product = bySlug.get(slug);
      if (!product) {
        console.warn(`  ! Unknown product slug "${slug}" for ${demo.username} — skipped.`);
        continue;
      }

      const [quantity, pricePaidUSD] = Array.isArray(spec) ? spec : [spec, null];
      // Spread additions across the account's lifetime, most recent last.
      const span = Math.max(1, demo.joinedDaysAgo - 1);
      const when = daysAgo(Math.max(0, span - Math.round((span * (index + 1)) / entries.length)), index);
      index += 1;

      await prisma.userProduct.create({
        data: { userId: user.id, productId: product.id, quantity, pricePaidUSD, createdAt: when, updatedAt: when },
      });

      const scoreDelta = (pricePaidUSD ?? product.priceUSD) * quantity;
      running += scoreDelta;

      await prisma.activityEvent.create({
        data: {
          userId: user.id,
          productId: product.id,
          productName: product.name,
          type: "ADD",
          quantityDelta: quantity,
          scoreDelta,
          scoreAfter: running,
          createdAt: when,
        },
      });
    }
  }

  // Follows
  for (const demo of DEMO_USERS) {
    for (const target of demo.follows ?? []) {
      const [follower, following] = await Promise.all([
        prisma.user.findUnique({ where: { username: demo.username }, select: { id: true } }),
        prisma.user.findUnique({ where: { username: target }, select: { id: true } }),
      ]);
      if (!follower || !following) continue;
      await prisma.follow.upsert({
        where: { followerId_followingId: { followerId: follower.id, followingId: following.id } },
        update: {},
        create: { followerId: follower.id, followingId: following.id },
      });
    }
  }

  // Achievements, evaluated with the same rules the app uses.
  const totalUsers = await prisma.user.count({ where: { isPublic: true } });
  const scores = new Map<string, number>();

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.findUnique({ where: { username: demo.username } });
    if (!user) continue;
    const items = await prisma.userProduct.findMany({
      where: { userId: user.id, quantity: { gt: 0 } },
      include: { product: true },
    });
    scores.set(user.id, calculateScore(items));
  }

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.findUnique({ where: { username: demo.username } });
    if (!user) continue;

    const items = await prisma.userProduct.findMany({
      where: { userId: user.id, quantity: { gt: 0 } },
      include: { product: true },
    });
    const [followers, following, activeDays] = await Promise.all([
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.$queryRaw<{ days: number }[]>`
        SELECT COUNT(DISTINCT DATE_TRUNC('day', "createdAt"))::int AS "days"
        FROM "ActivityEvent" WHERE "userId" = ${user.id}
      `.then((rows) => rows[0]?.days ?? 0),
    ]);

    const score = calculateScore(items);
    const rank = [...scores.values()].filter((other) => other > score).length + 1;

    const context: AchievementContext = {
      score,
      productCount: countProducts(items),
      distinctProducts: items.length,
      items,
      breakdown: breakdownByCategory(items),
      rank: score > 0 ? rank : null,
      totalUsers,
      followers,
      following,
      activeDays,
    };

    const ids = unlockedIds(context);
    const lastEvent = await prisma.activityEvent.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    await prisma.userAchievement.createMany({
      data: ids.map((achievementId) => ({
        userId: user.id,
        achievementId,
        unlockedAt: lastEvent?.createdAt ?? new Date(),
      })),
      skipDuplicates: true,
    });
  }

  console.log(
    `✓ Demo users ready (password: "${password}"). ${ACHIEVEMENTS.length} achievement rules evaluated.`
  );
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
