import type { Category } from "@prisma/client";

/**
 * Derives a product's *family* — the line it belongs to within its category —
 * from its catalogue name. Families group the catalogue ("MacBook Pro",
 * "iPad mini"), power search, and feed collection achievements.
 *
 * Rules are checked in order; the first match wins. Accessory-ish rules sit
 * before device rules so "Apple Watch Ocean Band" lands in Watch Bands rather
 * than Apple Watch.
 */
const RULES: readonly (readonly [RegExp, string])[] = [
  // Accessories that mention a device name
  [/Band$|Loop$/, "Watch Bands"],
  [/Charger|Power Adapter|Cable/, "Power & Cables"],
  [/^Magic Keyboard/, "Magic Keyboard"],
  [/^Magic Mouse|^Mighty Mouse/, "Magic Mouse"],
  [/^Magic Trackpad/, "Magic Trackpad"],
  [/^Apple Wireless Keyboard/, "Magic Keyboard"],
  [/^Apple Pencil/, "Apple Pencil"],
  [/^AirTag/, "AirTag"],
  [/^AirPort|^Time Capsule/, "AirPort"],
  [/Travel Case|Polishing Cloth|Siri Remote|Apple Remote|VESA|Pro Stand|iSight/, "Accessories"],

  // iPhone
  [/^iPhone .*Pro/, "iPhone Pro"],
  [/^iPhone SE/, "iPhone SE"],
  [/^iPhone/, "iPhone"],

  // Mac
  [/^MacBook Air/, "MacBook Air"],
  [/^MacBook Pro/, "MacBook Pro"],
  [/^MacBook/, "MacBook"],
  [/^iBook/, "iBook"],
  [/^PowerBook/, "PowerBook"],
  [/^iMac/, "iMac"],
  [/^eMac/, "eMac"],
  [/^Mac mini/, "Mac mini"],
  [/^Mac Studio/, "Mac Studio"],
  [/^Mac Pro/, "Mac Pro"],
  [/^Power Mac/, "Power Mac"],
  [/^Macintosh|^Twentieth Anniversary/, "Macintosh"],

  // iPad
  [/^iPad Pro/, "iPad Pro"],
  [/^iPad Air/, "iPad Air"],
  [/^iPad mini/, "iPad mini"],
  [/^iPad/, "iPad"],

  // Watch
  [/^Apple Watch Ultra/, "Apple Watch Ultra"],
  [/^Apple Watch SE/, "Apple Watch SE"],
  [/^Apple Watch Edition/, "Apple Watch Edition"],
  [/^Apple Watch/, "Apple Watch"],

  // Audio
  [/^AirPods Pro/, "AirPods Pro"],
  [/^AirPods Max/, "AirPods Max"],
  [/^AirPods/, "AirPods"],

  // Vision
  [/^Apple Vision/, "Apple Vision Pro"],

  // Displays
  [/Studio Display/, "Studio Display"],
  [/^Pro Display/, "Pro Display XDR"],
  [/Cinema|Thunderbolt Display/, "Cinema Display"],

  // TV & Home
  [/^Apple TV/, "Apple TV"],
  [/^HomePod/, "HomePod"],

  // iPod
  [/^iPod touch/, "iPod touch"],
  [/^iPod nano/, "iPod nano"],
  [/^iPod shuffle/, "iPod shuffle"],
  [/^iPod/, "iPod"],

  // Classic
  [/^Apple I\b|^Apple II|^Apple III|^Apple Lisa/, "Apple Computer"],
  [/Newton|eMate/, "Newton"],
  [/QuickTake/, "QuickTake"],
];

const CATEGORY_FALLBACK: Record<Category, string> = {
  IPHONE: "iPhone",
  IPAD: "iPad",
  MAC: "Mac",
  WATCH: "Apple Watch",
  AIRPODS: "AirPods",
  VISION: "Apple Vision Pro",
  DISPLAY: "Displays",
  TV_HOME: "TV & Home",
  ACCESSORY: "Accessories",
  IPOD: "iPod",
  CLASSIC: "Classic",
};

export function familyOf(name: string, category: Category): string {
  for (const [pattern, family] of RULES) {
    if (pattern.test(name)) return family;
  }
  return CATEGORY_FALLBACK[category];
}
