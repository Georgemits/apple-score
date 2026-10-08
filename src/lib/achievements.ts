import type { Category } from "@prisma/client";
import { lineTotal, unitPrice, type CategoryBreakdown } from "@/lib/score";

/**
 * Achievement definitions.
 *
 * Every achievement is a pure function of an {@link AchievementContext}, which
 * the server builds from authoritative data (inventory, rank, follows, activity).
 * `src/lib/achievement-sync.ts` evaluates these after each change and persists
 * new unlocks with a timestamp; unlocks are permanent even if the condition
 * later stops holding (you earned it).
 *
 * Progress is a 0–1 number so the UI can draw a bar; `>= 1` means unlocked.
 */

export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type AchievementGroup =
  | "milestone"
  | "collection"
  | "iphone"
  | "mac"
  | "ipad"
  | "watch"
  | "audio"
  | "home"
  | "vintage"
  | "spending"
  | "social"
  | "leaderboard"
  | "habit";

export type AchievementItem = {
  quantity: number;
  pricePaidUSD: number | null;
  product: {
    slug: string;
    name: string;
    category: Category;
    family: string;
    priceUSD: number;
    year: number;
    legacy: boolean;
  };
};

export type AchievementContext = {
  score: number;
  /** Total units owned. */
  productCount: number;
  /** Distinct catalogue entries owned. */
  distinctProducts: number;
  items: readonly AchievementItem[];
  breakdown: readonly CategoryBreakdown[];
  /** Competition rank among public users, or null when unranked. */
  rank: number | null;
  totalUsers: number;
  followers: number;
  following: number;
  /** Distinct calendar days on which the user changed their collection. */
  activeDays: number;
};

export type AchievementDefinition = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  rarity: AchievementRarity;
  group: AchievementGroup;
  /** Hidden (title and description masked) until unlocked. */
  secret?: boolean;
  /** 0–1 progress toward unlocking. Values ≥ 1 unlock. */
  progress: (context: AchievementContext) => number;
};

export const RARITY_ORDER: readonly AchievementRarity[] = [
  "common",
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const RARITY_LABEL: Record<AchievementRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

export const GROUP_LABEL: Record<AchievementGroup, string> = {
  milestone: "Milestones",
  collection: "Collection",
  iphone: "iPhone",
  mac: "Mac",
  ipad: "iPad",
  watch: "Apple Watch",
  audio: "AirPods",
  home: "Home",
  vintage: "Vintage",
  spending: "Spending",
  social: "Social",
  leaderboard: "Leaderboard",
  habit: "Habits",
};

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

function ratio(value: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(1, Math.max(0, value / target));
}

function unitsIn(context: AchievementContext, category: Category): number {
  return context.breakdown.find((entry) => entry.category === category)?.units ?? 0;
}

function distinctIn(context: AchievementContext, category: Category): number {
  return context.items.filter((item) => item.product.category === category).length;
}

function units(context: AchievementContext, predicate: (item: AchievementItem) => boolean): number {
  return context.items.filter(predicate).reduce((sum, item) => sum + item.quantity, 0);
}

function owns(context: AchievementContext, predicate: (item: AchievementItem) => boolean): number {
  return context.items.some(predicate) ? 1 : 0;
}

function distinctYears(context: AchievementContext, category: Category): number {
  return new Set(
    context.items
      .filter((item) => item.product.category === category)
      .map((item) => item.product.year)
  ).size;
}

const DESKTOP_FAMILIES = new Set(["iMac", "Mac mini", "Mac Studio", "Mac Pro"]);
const LAPTOP_FAMILIES = new Set(["MacBook", "MacBook Air", "MacBook Pro"]);

/* -------------------------------------------------------------------------
 * Definitions
 * ---------------------------------------------------------------------- */

export const ACHIEVEMENTS: readonly AchievementDefinition[] = [
  // ---------------------------------------------------------- Milestones
  {
    id: "first-purchase",
    title: "First Purchase",
    description: "Add your first Apple product.",
    emoji: "🌱",
    rarity: "common",
    group: "milestone",
    progress: (c) => ratio(c.productCount, 1),
  },
  {
    id: "apple-starter",
    title: "Apple Starter",
    description: "Reach an Apple Score of $1,000.",
    emoji: "🍏",
    rarity: "common",
    group: "milestone",
    progress: (c) => ratio(c.score, 1_000),
  },
  {
    id: "apple-addict",
    title: "Apple Addict",
    description: "Reach an Apple Score of $5,000.",
    emoji: "💊",
    rarity: "common",
    group: "milestone",
    progress: (c) => ratio(c.score, 5_000),
  },
  {
    id: "apple-enthusiast",
    title: "Apple Enthusiast",
    description: "Reach an Apple Score of $10,000.",
    emoji: "🔥",
    rarity: "uncommon",
    group: "milestone",
    progress: (c) => ratio(c.score, 10_000),
  },
  {
    id: "apple-lifestyle",
    title: "Apple Lifestyle",
    description: "Reach an Apple Score of $25,000.",
    emoji: "💎",
    rarity: "rare",
    group: "milestone",
    progress: (c) => ratio(c.score, 25_000),
  },
  {
    id: "apple-devotee",
    title: "Apple Devotee",
    description: "Reach an Apple Score of $50,000.",
    emoji: "🏛️",
    rarity: "rare",
    group: "milestone",
    progress: (c) => ratio(c.score, 50_000),
  },
  {
    id: "apple-billionaire",
    title: "Apple Billionaire",
    description: "Reach an Apple Score of $100,000. Not a real billionaire. Close enough.",
    emoji: "👑",
    rarity: "epic",
    group: "milestone",
    progress: (c) => ratio(c.score, 100_000),
  },
  {
    id: "the-one-percent",
    title: "The 1%",
    description: "Reach an Apple Score of $250,000.",
    emoji: "🏦",
    rarity: "legendary",
    group: "milestone",
    progress: (c) => ratio(c.score, 250_000),
  },
  {
    id: "infinite-loop",
    title: "Infinite Loop",
    description: "Reach an Apple Score of $1,000,000. There is no exit.",
    emoji: "♾️",
    rarity: "legendary",
    group: "milestone",
    secret: true,
    progress: (c) => ratio(c.score, 1_000_000),
  },

  // ---------------------------------------------------------- Collection
  {
    id: "starter-pack",
    title: "Starter Pack",
    description: "Own 3 Apple products.",
    emoji: "📦",
    rarity: "common",
    group: "collection",
    progress: (c) => ratio(c.productCount, 3),
  },
  {
    id: "curator",
    title: "Curator",
    description: "Own 10 different products.",
    emoji: "🗂️",
    rarity: "uncommon",
    group: "collection",
    progress: (c) => ratio(c.distinctProducts, 10),
  },
  {
    id: "hoarder",
    title: "Hoarder",
    description: "Own 25 Apple products in total.",
    emoji: "🧺",
    rarity: "rare",
    group: "collection",
    progress: (c) => ratio(c.productCount, 25),
  },
  {
    id: "backroom",
    title: "Apple Store Backroom",
    description: "Own 50 Apple products in total.",
    emoji: "🏬",
    rarity: "epic",
    group: "collection",
    progress: (c) => ratio(c.productCount, 50),
  },
  {
    id: "private-museum",
    title: "Private Museum",
    description: "Own 100 Apple products in total.",
    emoji: "🏛",
    rarity: "legendary",
    group: "collection",
    progress: (c) => ratio(c.productCount, 100),
  },
  {
    id: "full-ecosystem",
    title: "Full Ecosystem",
    description: "Own products in 5 different categories.",
    emoji: "🌐",
    rarity: "uncommon",
    group: "collection",
    progress: (c) => ratio(c.breakdown.filter((entry) => entry.units > 0).length, 5),
  },
  {
    id: "everything-store",
    title: "The Everything Store",
    description: "Own products in 8 different categories.",
    emoji: "🧩",
    rarity: "epic",
    group: "collection",
    progress: (c) => ratio(c.breakdown.filter((entry) => entry.units > 0).length, 8),
  },

  // -------------------------------------------------------------- iPhone
  {
    id: "hello-iphone",
    title: "Hello, iPhone",
    description: "Own an iPhone.",
    emoji: "📱",
    rarity: "common",
    group: "iphone",
    progress: (c) => ratio(unitsIn(c, "IPHONE"), 1),
  },
  {
    id: "iphone-collector",
    title: "iPhone Collector",
    description: "Own 3 iPhones.",
    emoji: "📲",
    rarity: "uncommon",
    group: "iphone",
    progress: (c) => ratio(unitsIn(c, "IPHONE"), 3),
  },
  {
    id: "iphone-museum",
    title: "iPhone Museum",
    description: "Own 5 different iPhone models.",
    emoji: "🏺",
    rarity: "rare",
    group: "iphone",
    progress: (c) => ratio(distinctIn(c, "IPHONE"), 5),
  },
  {
    id: "go-pro-max",
    title: "Go Pro Max",
    description: "Own any iPhone Pro Max.",
    emoji: "📸",
    rarity: "uncommon",
    group: "iphone",
    progress: (c) => owns(c, (item) => item.product.name.includes("Pro Max")),
  },
  {
    id: "annual-upgrader",
    title: "Annual Upgrader",
    description: "Own iPhones from 3 different release years.",
    emoji: "🔁",
    rarity: "rare",
    group: "iphone",
    progress: (c) => ratio(distinctYears(c, "IPHONE"), 3),
  },

  // ----------------------------------------------------------------- Mac
  {
    id: "think-different",
    title: "Think Different",
    description: "Own a Mac.",
    emoji: "💻",
    rarity: "common",
    group: "mac",
    progress: (c) => ratio(unitsIn(c, "MAC"), 1),
  },
  {
    id: "mac-collector",
    title: "Mac Collector",
    description: "Own 3 Macs.",
    emoji: "🖥️",
    rarity: "uncommon",
    group: "mac",
    progress: (c) => ratio(unitsIn(c, "MAC"), 3),
  },
  {
    id: "best-of-both",
    title: "Best of Both",
    description: "Own both a MacBook and a desktop Mac.",
    emoji: "⚖️",
    rarity: "uncommon",
    group: "mac",
    progress: (c) =>
      ratio(
        owns(c, (item) => LAPTOP_FAMILIES.has(item.product.family)) +
          owns(c, (item) => DESKTOP_FAMILIES.has(item.product.family)),
        2
      ),
  },
  {
    id: "ultra-instinct",
    title: "Ultra Instinct",
    description: "Own a Mac with an Ultra chip.",
    emoji: "⚡",
    rarity: "rare",
    group: "mac",
    progress: (c) =>
      owns(c, (item) => item.product.category === "MAC" && /\bUltra\b/.test(item.product.name)),
  },
  {
    id: "cheese-grater",
    title: "Cheese Grater",
    description: "Own a Mac Pro.",
    emoji: "🧀",
    rarity: "epic",
    group: "mac",
    progress: (c) => owns(c, (item) => item.product.family === "Mac Pro"),
  },

  // ---------------------------------------------------------------- iPad
  {
    id: "tablet-tycoon",
    title: "Tablet Tycoon",
    description: "Own 2 iPads.",
    emoji: "📝",
    rarity: "uncommon",
    group: "ipad",
    progress: (c) => ratio(unitsIn(c, "IPAD"), 2),
  },
  {
    id: "pencil-pusher",
    title: "Pencil Pusher",
    description: "Own an iPad and an Apple Pencil.",
    emoji: "✏️",
    rarity: "uncommon",
    group: "ipad",
    progress: (c) =>
      ratio(
        owns(c, (item) => item.product.category === "IPAD") +
          owns(c, (item) => item.product.name.startsWith("Apple Pencil")),
        2
      ),
  },

  // --------------------------------------------------------------- Watch
  {
    id: "wrist-game",
    title: "Wrist Game",
    description: "Own an Apple Watch.",
    emoji: "⌚",
    rarity: "common",
    group: "watch",
    progress: (c) => ratio(unitsIn(c, "WATCH"), 1),
  },
  {
    id: "two-wrists",
    title: "Two Wrists",
    description: "Own 2 Apple Watches. You only have two wrists.",
    emoji: "🙌",
    rarity: "uncommon",
    group: "watch",
    progress: (c) => ratio(unitsIn(c, "WATCH"), 2),
  },
  {
    id: "ultra-wrist",
    title: "Ultra Wrist",
    description: "Own an Apple Watch Ultra.",
    emoji: "🏔️",
    rarity: "uncommon",
    group: "watch",
    progress: (c) => owns(c, (item) => item.product.family === "Apple Watch Ultra"),
  },
  {
    id: "gold-standard",
    title: "Gold Standard",
    description: "Own the 18-carat gold Apple Watch Edition.",
    emoji: "🥇",
    rarity: "legendary",
    group: "watch",
    secret: true,
    progress: (c) => owns(c, (item) => item.product.slug === "apple-watch-edition-gold"),
  },

  // --------------------------------------------------------------- Audio
  {
    id: "audiophile",
    title: "Audiophile",
    description: "Own 2 pairs of AirPods.",
    emoji: "🎧",
    rarity: "uncommon",
    group: "audio",
    progress: (c) => ratio(unitsIn(c, "AIRPODS"), 2),
  },
  {
    id: "max-volume",
    title: "Max Volume",
    description: "Own AirPods Max.",
    emoji: "🔊",
    rarity: "uncommon",
    group: "audio",
    progress: (c) => owns(c, (item) => item.product.family === "AirPods Max"),
  },
  {
    id: "lost-and-found",
    title: "Lost & Found",
    description: "Own 3 or more of the same AirPods. You keep losing them, don't you?",
    emoji: "🔍",
    rarity: "rare",
    group: "audio",
    progress: (c) =>
      ratio(
        Math.max(
          0,
          ...c.items
            .filter((item) => item.product.category === "AIRPODS")
            .map((item) => item.quantity)
        ),
        3
      ),
  },

  // ---------------------------------------------------------------- Home
  {
    id: "spatial-pioneer",
    title: "Spatial Pioneer",
    description: "Own an Apple Vision Pro.",
    emoji: "🥽",
    rarity: "epic",
    group: "home",
    progress: (c) => ratio(unitsIn(c, "VISION"), 1),
  },
  {
    id: "homebody",
    title: "Homebody",
    description: "Own 2 Apple TV or HomePod devices.",
    emoji: "🏠",
    rarity: "uncommon",
    group: "home",
    progress: (c) => ratio(unitsIn(c, "TV_HOME"), 2),
  },
  {
    id: "stand-not-included",
    title: "Stand Not Included",
    description: "Own a Pro Display XDR.",
    emoji: "🖼️",
    rarity: "epic",
    group: "home",
    progress: (c) => owns(c, (item) => item.product.slug.startsWith("pro-display-xdr")),
  },
  {
    id: "stand-included",
    title: "Stand Included",
    description: "Own the $999 Pro Stand. Yes, the stand.",
    emoji: "🦵",
    rarity: "rare",
    group: "home",
    secret: true,
    progress: (c) => owns(c, (item) => item.product.slug === "pro-stand"),
  },
  {
    id: "dongle-life",
    title: "Dongle Life",
    description: "Own 5 accessories.",
    emoji: "🔌",
    rarity: "uncommon",
    group: "home",
    progress: (c) => ratio(unitsIn(c, "ACCESSORY"), 5),
  },
  {
    id: "shiny",
    title: "Shiny",
    description: "Own the Polishing Cloth. $19 of pure microfibre.",
    emoji: "✨",
    rarity: "common",
    group: "home",
    secret: true,
    progress: (c) => owns(c, (item) => item.product.slug === "polishing-cloth"),
  },

  // ------------------------------------------------------------- Vintage
  {
    id: "time-traveller",
    title: "Time Traveller",
    description: "Own a product released before 2010.",
    emoji: "🕰️",
    rarity: "uncommon",
    group: "vintage",
    progress: (c) => owns(c, (item) => item.product.year < 2010),
  },
  {
    id: "click-wheel",
    title: "Click Wheel",
    description: "Own an iPod.",
    emoji: "🎵",
    rarity: "uncommon",
    group: "vintage",
    progress: (c) => ratio(unitsIn(c, "IPOD"), 1),
  },
  {
    id: "vintage-collector",
    title: "Vintage Collector",
    description: "Own 5 different legacy products.",
    emoji: "📼",
    rarity: "rare",
    group: "vintage",
    progress: (c) => ratio(c.items.filter((item) => item.product.legacy).length, 5),
  },
  {
    id: "the-original",
    title: "The Original",
    description: "Own the first-generation iPhone.",
    emoji: "🕯️",
    rarity: "rare",
    group: "vintage",
    progress: (c) => owns(c, (item) => item.product.slug === "iphone-1st-gen"),
  },
  {
    id: "eat-up-martha",
    title: "Eat Up Martha",
    description: "Own a Newton MessagePad.",
    emoji: "📟",
    rarity: "rare",
    group: "vintage",
    secret: true,
    progress: (c) => owns(c, (item) => item.product.slug === "newton-messagepad"),
  },
  {
    id: "garage-days",
    title: "Garage Days",
    description: "Own an Apple I. Call a museum.",
    emoji: "🏚️",
    rarity: "legendary",
    group: "vintage",
    secret: true,
    progress: (c) => owns(c, (item) => item.product.slug === "apple-i"),
  },

  // ------------------------------------------------------------ Spending
  {
    id: "big-spender",
    title: "Big Spender",
    description: "Spend $3,000 or more on a single product.",
    emoji: "💸",
    rarity: "uncommon",
    group: "spending",
    progress: (c) => ratio(Math.max(0, ...c.items.map((item) => lineTotal(item))), 3_000),
  },
  {
    id: "whale",
    title: "Whale",
    description: "Own a single unit that cost $5,000 or more.",
    emoji: "🐋",
    rarity: "rare",
    group: "spending",
    progress: (c) => ratio(Math.max(0, ...c.items.map((item) => unitPrice(item))), 5_000),
  },
  {
    id: "bargain-hunter",
    title: "Bargain Hunter",
    description: "Record a below-MSRP price on 3 products.",
    emoji: "🏷️",
    rarity: "uncommon",
    group: "spending",
    progress: (c) =>
      ratio(
        c.items.filter(
          (item) => item.pricePaidUSD !== null && item.pricePaidUSD < item.product.priceUSD
        ).length,
        3
      ),
  },
  {
    id: "mostly-mac",
    title: "Mac Person",
    description: "Have more than half of your score in Macs.",
    emoji: "🍎",
    rarity: "uncommon",
    group: "spending",
    progress: (c) => {
      const share = c.breakdown.find((entry) => entry.category === "MAC")?.share ?? 0;
      return c.score > 0 && share > 0.5 ? 1 : ratio(share, 0.5);
    },
  },

  // -------------------------------------------------------------- Social
  {
    id: "social-butterfly",
    title: "Social Butterfly",
    description: "Follow 5 other collectors.",
    emoji: "🦋",
    rarity: "uncommon",
    group: "social",
    progress: (c) => ratio(c.following, 5),
  },
  {
    id: "influencer",
    title: "Influencer",
    description: "Be followed by 5 collectors.",
    emoji: "📣",
    rarity: "rare",
    group: "social",
    progress: (c) => ratio(c.followers, 5),
  },

  // --------------------------------------------------------- Leaderboard
  {
    id: "top-ten",
    title: "Top 10",
    description: "Reach the top 10 on Band for Band, with at least 10 collectors on the board.",
    emoji: "🔟",
    rarity: "uncommon",
    group: "leaderboard",
    progress: (c) => (c.rank !== null && c.rank <= 10 && c.totalUsers >= 10 ? 1 : 0),
  },
  {
    id: "podium",
    title: "Podium",
    description: "Reach the top 3 on Band for Band, with at least 5 collectors on the board.",
    emoji: "🏅",
    rarity: "rare",
    group: "leaderboard",
    progress: (c) => (c.rank !== null && c.rank <= 3 && c.totalUsers >= 5 ? 1 : 0),
  },
  {
    id: "band-leader",
    title: "Band Leader",
    description: "Hold #1 on Band for Band, with at least 5 collectors on the board.",
    emoji: "🏆",
    rarity: "epic",
    group: "leaderboard",
    progress: (c) => (c.rank === 1 && c.totalUsers >= 5 ? 1 : 0),
  },

  // -------------------------------------------------------------- Habits
  {
    id: "habit",
    title: "Habit",
    description: "Update your collection on 3 different days.",
    emoji: "📅",
    rarity: "uncommon",
    group: "habit",
    progress: (c) => ratio(c.activeDays, 3),
  },
  {
    id: "regular",
    title: "Regular",
    description: "Update your collection on 7 different days.",
    emoji: "🗓️",
    rarity: "rare",
    group: "habit",
    progress: (c) => ratio(c.activeDays, 7),
  },
] as const;

const BY_ID = new Map(ACHIEVEMENTS.map((definition) => [definition.id, definition]));

export function getAchievementDefinition(id: string): AchievementDefinition | undefined {
  return BY_ID.get(id);
}

export type AchievementEvaluation = {
  id: string;
  progress: number;
  unlocked: boolean;
};

/** Evaluates every definition against the context. Pure; no side effects. */
export function evaluateAchievements(context: AchievementContext): AchievementEvaluation[] {
  return ACHIEVEMENTS.map((definition) => {
    const progress = Math.min(1, Math.max(0, definition.progress(context)));
    return { id: definition.id, progress, unlocked: progress >= 1 };
  });
}

/** Ids whose condition currently holds. */
export function unlockedIds(context: AchievementContext): string[] {
  return evaluateAchievements(context)
    .filter((evaluation) => evaluation.unlocked)
    .map((evaluation) => evaluation.id);
}
