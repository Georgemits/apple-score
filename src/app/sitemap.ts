import type { MetadataRoute } from "next";
import { siteUrl } from "@/components/landing/brand";
import { getPublicUsernames } from "@/lib/queries";

// Reads the user table, so it is built per request rather than at build time.
export const dynamic = "force-dynamic";

const STATIC_ROUTES: {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly";
}[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/leaderboard", priority: 0.9, changeFrequency: "daily" },
  { path: "/achievements", priority: 0.7, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.5, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  const users = await getPublicUsernames().catch((error: unknown) => {
    console.error("[sitemap] public usernames unavailable", error);
    return [] as { username: string; updatedAt: Date }[];
  });

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${base}${route.path}`,
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...users.map((user) => ({
      url: `${base}/u/${encodeURIComponent(user.username)}`,
      lastModified: user.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
