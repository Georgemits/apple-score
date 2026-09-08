import type { Category } from "@prisma/client";
import type { CategoryBreakdown } from "@/lib/score";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  /** 0–1 progress toward unlocking. */
  progress: number;
};

type AchievementContext = {
  score: number;
  productCount: number;
  distinctProducts: number;
  breakdown: readonly CategoryBreakdown[];
};

function unitsIn(breakdown: readonly CategoryBreakdown[], category: Category): number {
  return breakdown.find((entry) => entry.category === category)?.units ?? 0;
}

function ratio(value: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(1, value / target);
}

export function getAchievements(context: AchievementContext): Achievement[] {
  const { score, productCount, distinctProducts, breakdown } = context;

  const macs = unitsIn(breakdown, "MAC");
  const iphones = unitsIn(breakdown, "IPHONE");
  const ipads = unitsIn(breakdown, "IPAD");
  const airpods = unitsIn(breakdown, "AIRPODS");
  const visions = unitsIn(breakdown, "VISION");
  const categoriesOwned = breakdown.filter((entry) => entry.units > 0).length;

  const definitions: Achievement[] = [
    {
      id: "first-blood",
      title: "It Begins",
      description: "Add your first Apple product.",
      emoji: "🌱",
      unlocked: productCount >= 1,
      progress: ratio(productCount, 1),
    },
    {
      id: "mac-collector",
      title: "Mac Collector",
      description: "Own 3 or more Macs.",
      emoji: "💻",
      unlocked: macs >= 3,
      progress: ratio(macs, 3),
    },
    {
      id: "iphone-enthusiast",
      title: "iPhone Enthusiast",
      description: "Own 3 or more iPhones.",
      emoji: "📱",
      unlocked: iphones >= 3,
      progress: ratio(iphones, 3),
    },
    {
      id: "tablet-tycoon",
      title: "Tablet Tycoon",
      description: "Own 2 or more iPads.",
      emoji: "📝",
      unlocked: ipads >= 2,
      progress: ratio(ipads, 2),
    },
    {
      id: "audiophile",
      title: "Audiophile",
      description: "Own 2 or more AirPods.",
      emoji: "🎧",
      unlocked: airpods >= 2,
      progress: ratio(airpods, 2),
    },
    {
      id: "spatial-pioneer",
      title: "Spatial Pioneer",
      description: "Own an Apple Vision Pro.",
      emoji: "🥽",
      unlocked: visions >= 1,
      progress: ratio(visions, 1),
    },
    {
      id: "ecosystem",
      title: "Full Ecosystem",
      description: "Own products in 5 different categories.",
      emoji: "🌐",
      unlocked: categoriesOwned >= 5,
      progress: ratio(categoriesOwned, 5),
    },
    {
      id: "curator",
      title: "Curator",
      description: "Own 10 different products.",
      emoji: "🗂️",
      unlocked: distinctProducts >= 10,
      progress: ratio(distinctProducts, 10),
    },
    {
      id: "five-figures",
      title: "Five Figures",
      description: "Reach an Apple Score of 10,000.",
      emoji: "💎",
      unlocked: score >= 10_000,
      progress: ratio(score, 10_000),
    },
    {
      id: "one-percent",
      title: "The 1%",
      description: "Reach an Apple Score of 50,000.",
      emoji: "👑",
      unlocked: score >= 50_000,
      progress: ratio(score, 50_000),
    },
  ];

  return definitions;
}
