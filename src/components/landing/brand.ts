import { LEADERBOARD_NAME } from "@/lib/branding";

/**
 * Brand constants shared by the landing page and the metadata routes
 * (Open Graph image, touch icon, manifest, robots, sitemap). Kept in one
 * place so the mark and the tagline cannot drift between them.
 */
export const SITE_NAME = "Apple Score";
export const SITE_TAGLINE = "How much Apple do you own?";
export const SITE_DESCRIPTION = `Apple Score is the total you've spent on Apple hardware. Track your collection, climb ${LEADERBOARD_NAME} and unlock achievements.`;

/** The formula, exactly as `src/lib/score.ts` defines it. */
export const FORMULA = "Apple Score = Σ (price paid ?? launch MSRP) × quantity";

/** The same path as `AppleMark` in `src/components/logo.tsx`, for Satori-rendered images. */
export const APPLE_MARK_VIEWBOX = "0 0 32 32";
export const APPLE_MARK_PATH =
  "M22.1 16.9c0-3 2.4-4.4 2.5-4.5-1.4-2-3.5-2.3-4.3-2.3-1.8-.2-3.5 1.1-4.4 1.1-.9 0-2.3-1-3.8-1-2 0-3.8 1.1-4.8 2.9-2 3.5-.5 8.8 1.5 11.6 1 1.4 2.1 3 3.6 2.9 1.5-.1 2-.9 3.8-.9s2.3.9 3.8.9c1.6 0 2.6-1.4 3.5-2.8 1.1-1.6 1.6-3.2 1.6-3.3 0 0-3-1.2-3-4.6ZM19.3 8.2c.8-1 1.4-2.4 1.2-3.8-1.2 0-2.7.8-3.5 1.8-.8.9-1.5 2.3-1.3 3.7 1.3.1 2.7-.7 3.6-1.7Z";

/** Absolute origin of the deployment, without a trailing slash. */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}
