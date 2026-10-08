import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getStanding } from "@/lib/leaderboard";
import { getProfile } from "@/lib/queries";
import { clientAddress, rateLimit } from "@/lib/rate-limit";
import {
  isShareFormat,
  renderShareCard,
  shareCardData,
  SHARE_FORMAT_KEYS,
  type ShareFormat,
} from "@/lib/share-card";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ username: string }> };

const ALLOWED_PARAMS = new Set(["format", "download"]);
const NO_STORE = { "Cache-Control": "no-store" } as const;

/** Keeps the download filename to characters every OS accepts. */
function safeFilename(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "collector";
}

/**
 * Rendering a card means a leaderboard query plus a Satori layout and PNG
 * encode, so the bytes are memoised per profile and format for five minutes
 * (as base64 — the cache round-trips through JSON). Actions that change a
 * collection revalidate the "community" tag.
 */
const renderCached = unstable_cache(
  async (username: string, format: ShareFormat): Promise<string | null> => {
    const profile = await getProfile(username, null);
    if (!profile) return null;
    const standing = await getStanding(profile.user.id);
    const png = await renderShareCard(shareCardData(profile, standing), format);
    return Buffer.from(png).toString("base64");
  },
  ["share-card"],
  { revalidate: 300, tags: ["community"] }
);

/**
 * GET /api/card/[username]?format=og|square|story&download=1
 *
 * A PNG share card for a public profile, rendered live from the collection.
 * Private and unknown profiles are indistinguishable (404) so the endpoint
 * cannot be used to probe who has an account.
 */
export async function GET(request: Request, { params }: RouteContext) {
  const { username } = await params;
  const { searchParams } = new URL(request.url);

  // Unknown query parameters would defeat the shared cache; refuse them.
  for (const key of searchParams.keys()) {
    if (!ALLOWED_PARAMS.has(key)) {
      return NextResponse.json(
        { error: "Unsupported query parameter." },
        { status: 400, headers: NO_STORE }
      );
    }
  }

  const requested = searchParams.get("format") ?? "og";
  if (!isShareFormat(requested)) {
    return NextResponse.json(
      { error: `Unknown format. Use one of: ${SHARE_FORMAT_KEYS.join(", ")}.` },
      { status: 400, headers: NO_STORE }
    );
  }
  const format = requested;
  const download = searchParams.get("download") === "1";

  const address = await clientAddress();
  if (address) {
    const limited = await rateLimit(`card:ip:${address}`, 60, 60);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429, headers: { ...NO_STORE, "Retry-After": String(limited.retryAfterSeconds) } }
      );
    }
  }

  const encoded = await renderCached(username.toLowerCase(), format);
  if (!encoded) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404, headers: NO_STORE });
  }

  const png = Buffer.from(encoded, "base64");
  const filename = `apple-score-${safeFilename(username)}-${format}.png`;

  return new Response(png, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.byteLength),
      "Cache-Control": "public, max-age=300",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
