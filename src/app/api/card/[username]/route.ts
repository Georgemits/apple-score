import { NextResponse } from "next/server";
import { getStanding } from "@/lib/leaderboard";
import { getProfile } from "@/lib/queries";
import { isShareFormat, renderShareCard, shareCardData, SHARE_FORMAT_KEYS } from "@/lib/share-card";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ username: string }> };

/** Keeps the download filename to characters every OS accepts. */
function safeFilename(username: string): string {
  return username.toLowerCase().replace(/[^a-z0-9_-]/g, "") || "collector";
}

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

  const requested = searchParams.get("format") ?? "og";
  if (!isShareFormat(requested)) {
    return NextResponse.json(
      { error: `Unknown format. Use one of: ${SHARE_FORMAT_KEYS.join(", ")}.` },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }
  const format = requested;
  const download = searchParams.get("download") === "1";

  const profile = await getProfile(username, null);
  if (!profile) {
    return NextResponse.json(
      { error: "Profile not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const standing = await getStanding(profile.user.id);
  const png = await renderShareCard(shareCardData(profile, standing), format);
  const filename = `apple-score-${safeFilename(profile.user.username)}-${format}.png`;

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
