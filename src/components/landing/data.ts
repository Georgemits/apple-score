import "server-only";
import { cache } from "react";
import { getCommunityStats, type CommunityStats } from "@/lib/queries";
import { getPodium, type BoardRow } from "@/lib/leaderboard";

/**
 * Landing-page data loaders. The landing page is marketing: it must render
 * even when the database is unreachable, so each loader swallows failures
 * into an empty result and the sections degrade (zeros, hidden podium)
 * instead of taking the whole page down. `cache` dedupes the calls when
 * several sections in the same render ask for the same data.
 */

const EMPTY_STATS: CommunityStats = {
  users: 0,
  collectors: 0,
  products: 0,
  totalDollars: 0,
  averageScore: 0,
  totalUnits: 0,
};

export const loadCommunityStats = cache(async (): Promise<CommunityStats> => {
  try {
    return await getCommunityStats();
  } catch (error) {
    console.error("[landing] community stats unavailable", error);
    return EMPTY_STATS;
  }
});

export const loadPodium = cache(async (): Promise<BoardRow[]> => {
  try {
    return await getPodium("overall");
  } catch (error) {
    console.error("[landing] podium unavailable", error);
    return [];
  }
});
