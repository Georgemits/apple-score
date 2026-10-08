import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Emoji for server-rendered images. Satori (next/og) has no colour-emoji font
 * and would otherwise fetch glyphs from a CDN at request time, so the handful
 * of emoji the app uses for avatars, tiers and categories are vendored as
 * Twemoji SVGs in `src/assets/emoji` and inlined as data URIs.
 */

const EMOJI_DIR = path.join(process.cwd(), "src/assets/emoji");
const cache = new Map<string, Promise<string | null>>();

/** "🖥️" → "1f5a5" — Twemoji's file naming (variation selectors dropped). */
export function emojiCode(emoji: string): string {
  return [...emoji]
    .map((char) => char.codePointAt(0)!.toString(16))
    .filter((hex) => hex !== "fe0f")
    .join("-");
}

/** A data URI for the emoji's SVG, or null when it is not vendored. */
export function emojiDataUri(emoji: string | null | undefined): Promise<string | null> {
  if (!emoji) return Promise.resolve(null);
  const code = emojiCode(emoji);
  let pending = cache.get(code);
  if (!pending) {
    pending = readFile(path.join(EMOJI_DIR, `${code}.svg`))
      .then((buffer) => `data:image/svg+xml;base64,${buffer.toString("base64")}`)
      .catch(() => null);
    cache.set(code, pending);
  }
  return pending;
}
