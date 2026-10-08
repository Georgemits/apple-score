import type { Category } from "@prisma/client";

export const CATEGORIES = [
  "IPHONE",
  "MAC",
  "IPAD",
  "WATCH",
  "AIRPODS",
  "VISION",
  "DISPLAY",
  "TV_HOME",
  "ACCESSORY",
  "IPOD",
  "CLASSIC",
] as const satisfies readonly Category[];

export const CATEGORY_LABEL: Record<Category, string> = {
  IPHONE: "iPhone",
  IPAD: "iPad",
  MAC: "Mac",
  WATCH: "Apple Watch",
  AIRPODS: "AirPods",
  IPOD: "iPod",
  VISION: "Vision",
  DISPLAY: "Displays",
  TV_HOME: "TV & Home",
  ACCESSORY: "Accessories",
  CLASSIC: "Classic",
};

/** Lower-case URL slug for category boards and filters (`?board=iphone`). */
export const CATEGORY_SLUG: Record<Category, string> = {
  IPHONE: "iphone",
  IPAD: "ipad",
  MAC: "mac",
  WATCH: "watch",
  AIRPODS: "airpods",
  IPOD: "ipod",
  VISION: "vision",
  DISPLAY: "display",
  TV_HOME: "tv-home",
  ACCESSORY: "accessory",
  CLASSIC: "classic",
};

export function categoryFromSlug(slug: string): Category | null {
  const match = (Object.entries(CATEGORY_SLUG) as [Category, string][]).find(
    ([, value]) => value === slug
  );
  return match ? match[0] : null;
}

export const CATEGORY_EMOJI: Record<Category, string> = {
  IPHONE: "📱",
  IPAD: "📝",
  MAC: "💻",
  WATCH: "⌚",
  AIRPODS: "🎧",
  IPOD: "🎵",
  VISION: "🥽",
  DISPLAY: "🖥️",
  TV_HOME: "📺",
  ACCESSORY: "🔌",
  CLASSIC: "🕰️",
};

/** Extra words that should match a category in the product search box. */
export const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  IPHONE: ["iphone", "phone"],
  IPAD: ["ipad", "tablet"],
  MAC: ["mac", "macbook", "imac", "mac mini", "mac studio", "mac pro", "laptop", "desktop"],
  WATCH: ["watch", "apple watch", "ultra", "series", "se"],
  AIRPODS: ["airpods", "earbuds", "headphones", "max"],
  IPOD: ["ipod", "nano", "shuffle", "classic", "touch", "mini", "music", "mp3", "hi-fi"],
  VISION: ["vision", "vision pro", "headset", "spatial"],
  DISPLAY: ["display", "monitor", "studio display", "xdr", "screen"],
  TV_HOME: ["apple tv", "tv", "homepod", "home", "speaker"],
  ACCESSORY: [
    "accessory",
    "accessories",
    "magic mouse",
    "magic keyboard",
    "magic trackpad",
    "apple pencil",
    "pencil",
    "airtag",
    "charger",
    "cable",
    "case",
    "band",
  ],
  CLASSIC: [
    "classic",
    "vintage",
    "retro",
    "apple i",
    "apple ii",
    "apple iii",
    "lisa",
    "newton",
    "messagepad",
    "emate",
    "quicktake",
  ],
};

/** Tailwind classes used for the tinted product-image tile, per category. */
export const CATEGORY_TINT: Record<Category, string> = {
  IPHONE: "from-sky-500/15 to-blue-500/5",
  IPAD: "from-violet-500/15 to-purple-500/5",
  MAC: "from-slate-500/15 to-zinc-500/5",
  WATCH: "from-rose-500/15 to-red-500/5",
  AIRPODS: "from-teal-500/15 to-emerald-500/5",
  IPOD: "from-pink-500/15 to-rose-500/5",
  VISION: "from-fuchsia-500/15 to-indigo-500/5",
  DISPLAY: "from-amber-500/15 to-orange-500/5",
  TV_HOME: "from-indigo-500/15 to-sky-500/5",
  ACCESSORY: "from-lime-500/15 to-green-500/5",
  CLASSIC: "from-stone-500/20 to-amber-500/10",
};
