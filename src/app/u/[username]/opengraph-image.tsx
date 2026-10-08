import { getStanding } from "@/lib/leaderboard";
import { getProfile } from "@/lib/queries";
import {
  renderGenericShareCard,
  renderShareCard,
  shareCardData,
  SHARE_FORMATS,
} from "@/lib/share-card";

export const alt = "Apple Score card";
export const size = { width: SHARE_FORMATS.og.width, height: SHARE_FORMATS.og.height };
export const contentType = "image/png";
export const dynamic = "force-dynamic";

type ImageProps = { params: Promise<{ username: string }> };

function png(bytes: ArrayBuffer): Response {
  return new Response(bytes, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "public, max-age=300",
    },
  });
}

/**
 * The 1200×630 image crawlers pick up for `/u/[username]`. Unknown and
 * private profiles get the generic brand card rather than an error, so a
 * shared link to a profile that has since gone private still unfurls.
 */
export default async function ProfileOpenGraphImage({ params }: ImageProps) {
  const { username } = await params;

  const profile = await getProfile(username, null).catch((error: unknown) => {
    console.error("[og] profile unavailable", error);
    return null;
  });
  if (!profile) return png(await renderGenericShareCard("og"));

  const standing = await getStanding(profile.user.id).catch((error: unknown) => {
    console.error("[og] standing unavailable", error);
    return null;
  });

  return png(await renderShareCard(shareCardData(profile, standing), "og"));
}
