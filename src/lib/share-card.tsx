import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { emojiDataUri } from "@/lib/emoji-assets";
import {
  APPLE_MARK_PATH,
  APPLE_MARK_VIEWBOX,
  FORMULA,
  SITE_NAME,
  SITE_TAGLINE,
  siteUrl,
} from "@/components/landing/brand";
import { avatarGradient } from "@/components/user-avatar";
import { CATEGORY_LABEL } from "@/lib/categories";
import type { Standing } from "@/lib/leaderboard";
import type { Profile } from "@/lib/queries";
import { formatNumber, formatUSD, initials, profileName } from "@/lib/utils";

/**
 * Share cards — the PNGs behind `/api/card/[username]`, the profile Open Graph
 * image and the `/u/[username]/card` page.
 *
 * Rendered by Satori (via `next/og`), which understands a subset of CSS: flexbox
 * only, explicit sizes, inline style objects, no CSS variables, no grid. Every
 * `div` with more than one child must be `display: flex`.
 */

/* -------------------------------------------------------------------------
 * Formats
 * ---------------------------------------------------------------------- */

export const SHARE_FORMATS = {
  og: {
    width: 1200,
    height: 630,
    label: "Landscape",
    hint: "Link previews on X, Slack, iMessage and LinkedIn.",
  },
  square: {
    width: 1080,
    height: 1080,
    label: "Square",
    hint: "Instagram and Threads posts.",
  },
  story: {
    width: 1080,
    height: 1920,
    label: "Story",
    hint: "Instagram, TikTok and Snapchat stories.",
  },
} as const;

export type ShareFormat = keyof typeof SHARE_FORMATS;

/** The whitelist, in display order. */
export const SHARE_FORMAT_KEYS: readonly ShareFormat[] = ["og", "square", "story"];

export function isShareFormat(value: unknown): value is ShareFormat {
  return typeof value === "string" && (SHARE_FORMAT_KEYS as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------
 * Data
 * ---------------------------------------------------------------------- */

export type ShareCardData = {
  username: string;
  displayName: string | null;
  avatarEmoji: string | null;
  avatarHue: number | null;
  score: number;
  /** Competition rank on the overall board, or null when unranked. */
  rank: number | null;
  /** Collectors on the board (0 when unranked). */
  total: number;
  productCount: number;
  tierName: string;
  /** Empty string renders the tier without an emoji. */
  tierEmoji: string;
  topCategoryLabel: string | null;
  /** 0–100, or null when there is nobody to compare against. */
  percentile: number | null;
  /** Host name printed at the bottom of the card, e.g. "applescore.app". */
  appHost: string;
  /** Inline SVG data URIs for the emoji, resolved from the vendored set. */
  avatarEmojiSrc?: string | null;
  tierEmojiSrc?: string | null;
};

/** The deployment's host, for the card footer. */
export function appHost(): string {
  try {
    return new URL(siteUrl()).host;
  } catch {
    return "localhost:3000";
  }
}

/** Maps a profile and its standing to the plain data the card renders. */
export function shareCardData(profile: Profile, standing: Standing | null): ShareCardData {
  const { user, stats } = profile;
  return {
    username: user.username,
    displayName: user.displayName,
    avatarEmoji: user.avatarEmoji,
    avatarHue: user.avatarHue,
    score: stats.score,
    rank: standing?.me.rank ?? null,
    total: standing?.me.total ?? 0,
    productCount: stats.productCount,
    tierName: stats.tier.name,
    tierEmoji: stats.tier.emoji,
    topCategoryLabel: stats.topCategory ? CATEGORY_LABEL[stats.topCategory] : null,
    percentile: standing && standing.me.total > 1 ? standing.percentile : null,
    appHost: appHost(),
  };
}

/* -------------------------------------------------------------------------
 * Fonts
 * ---------------------------------------------------------------------- */

export type ShareFont = {
  name: "Inter";
  data: Buffer;
  weight: 400 | 600 | 700;
  style: "normal";
};

const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");

let fontsPromise: Promise<ShareFont[]> | null = null;

/** Inter Regular, SemiBold and Bold, read once per server process. */
export function loadShareFonts(): Promise<ShareFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([
      readFile(path.join(FONT_DIR, "Inter-Regular.otf")),
      readFile(path.join(FONT_DIR, "Inter-SemiBold.otf")),
      readFile(path.join(FONT_DIR, "Inter-Bold.otf")),
    ])
      .then(([regular, semibold, bold]): ShareFont[] => [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
        { name: "Inter", data: bold, weight: 700, style: "normal" },
      ])
      .catch((error: unknown) => {
        // Let the next request retry rather than caching the failure forever.
        fontsPromise = null;
        throw error;
      });
  }
  return fontsPromise;
}

/* -------------------------------------------------------------------------
 * Colour helpers (Satori wants hex / rgba, not the app's hsl tokens)
 * ---------------------------------------------------------------------- */

type Rgb = [number, number, number];

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [channel(0), channel(8), channel(4)].map((value) => Math.round(value * 255)) as Rgb;
}

function hex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function rgba([r, g, b]: Rgb, alpha: number): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** The user's avatar gradient stops as hex, plus soft glows for the background. */
export function shareCardPalette(user: { username: string; avatarHue: number | null }) {
  const { hue } = avatarGradient(user);
  const from = hslToRgb(hue, 85, 62);
  const to = hslToRgb((hue + 40) % 360, 80, 48);
  return {
    from: hex(from),
    to: hex(to),
    glowFrom: rgba(from, 0.34),
    glowTo: rgba(to, 0.26),
  };
}

/* -------------------------------------------------------------------------
 * Layout
 * ---------------------------------------------------------------------- */

type Metrics = {
  pad: number;
  avatar: number;
  name: number;
  handle: number;
  eyebrow: number;
  figure: number;
  pill: number;
  pillX: number;
  pillY: number;
  foot: number;
  mark: number;
  wordmark: number;
  tagline: number;
};

/** Type sizes per format, so every card keeps the same proportions. */
const METRICS: Record<ShareFormat, Metrics> = {
  og: {
    pad: 64,
    avatar: 96,
    name: 36,
    handle: 24,
    eyebrow: 22,
    figure: 150,
    pill: 22,
    pillX: 18,
    pillY: 10,
    foot: 24,
    mark: 40,
    wordmark: 28,
    tagline: 0,
  },
  square: {
    pad: 80,
    avatar: 168,
    name: 50,
    handle: 32,
    eyebrow: 30,
    figure: 190,
    pill: 30,
    pillX: 26,
    pillY: 14,
    foot: 30,
    mark: 56,
    wordmark: 36,
    tagline: 0,
  },
  story: {
    pad: 96,
    avatar: 260,
    name: 64,
    handle: 40,
    eyebrow: 38,
    figure: 224,
    pill: 38,
    pillX: 34,
    pillY: 18,
    foot: 36,
    mark: 64,
    wordmark: 44,
    tagline: 44,
  },
};

const BACKGROUND = "linear-gradient(135deg, #0a0a0b 0%, #111118 55%, #0b1326 100%)";
const WHITE = "#ffffff";
const MUTED = "rgba(255,255,255,0.68)";
const FAINT = "rgba(255,255,255,0.5)";

/** Shrinks the dollar figure so very large scores still fit on one line. */
function fitFigure(text: string, maxWidth: number, base: number): number {
  const estimatedEm = text.length * 0.6;
  return Math.max(56, Math.min(base, Math.floor(maxWidth / estimatedEm)));
}

function Glow({
  size,
  color,
  ...position
}: {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}) {
  // Satori throws on style keys whose value is undefined, so only set the
  // edges that were given.
  const style: Record<string, number | string> = {
    position: "absolute",
    width: size,
    height: size,
    borderRadius: size,
    background: `radial-gradient(circle at center, ${color} 0%, rgba(0,0,0,0) 66%)`,
  };
  for (const [edge, value] of Object.entries(position)) {
    if (value !== undefined) style[edge] = value;
  }
  return <div style={style} />;
}

function AppleMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox={APPLE_MARK_VIEWBOX} fill={WHITE}>
      <path d={APPLE_MARK_PATH} />
    </svg>
  );
}

function Avatar({
  data,
  size,
  palette,
}: {
  data: ShareCardData;
  size: number;
  palette: ReturnType<typeof shareCardPalette>;
}) {
  const emoji = data.avatarEmoji;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size,
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        border: `${Math.max(3, Math.round(size * 0.035))}px solid rgba(255,255,255,0.18)`,
        color: WHITE,
        fontSize: emoji ? size * 0.5 : size * 0.38,
        fontWeight: 700,
        letterSpacing: emoji ? 0 : -size * 0.01,
      }}
    >
      {data.avatarEmojiSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={data.avatarEmojiSrc}
          width={Math.round(size * 0.52)}
          height={Math.round(size * 0.52)}
          alt=""
        />
      ) : (
        (emoji ?? initials(data.username))
      )}
    </div>
  );
}

function Pill({
  label,
  emoji,
  emojiSrc,
  metrics,
  upper = true,
}: {
  label: string;
  emoji?: string;
  /** Vendored SVG for the emoji; preferred over the text glyph. */
  emojiSrc?: string;
  metrics: Metrics;
  /** Pills are small caps by default; prose (the formula) keeps its case. */
  upper?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: `${metrics.pillY}px ${metrics.pillX}px`,
        marginRight: Math.round(metrics.pill * 0.5),
        marginBottom: Math.round(metrics.pill * 0.5),
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.16)",
        backgroundColor: "rgba(255,255,255,0.07)",
        color: "rgba(255,255,255,0.92)",
        fontSize: metrics.pill,
        fontWeight: 600,
        letterSpacing: metrics.pill * 0.06,
        whiteSpace: "nowrap",
      }}
    >
      {emojiSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={emojiSrc}
          width={Math.round(metrics.pill * 1.1)}
          height={Math.round(metrics.pill * 1.1)}
          alt=""
          style={{ marginRight: Math.round(metrics.pill * 0.45) }}
        />
      ) : emoji ? (
        <span style={{ marginRight: Math.round(metrics.pill * 0.45) }}>{emoji}</span>
      ) : null}
      <span>{upper ? label.toUpperCase() : label}</span>
    </div>
  );
}

/** The landscape card has the least vertical room; it keeps one row of pills. */
const MAX_PILLS: Record<ShareFormat, number> = { og: 4, square: 6, story: 6 };

type PillSpec = { label: string; emoji?: string; emojiSrc?: string };

function pills(data: ShareCardData, format: ShareFormat): PillSpec[] {
  const list: PillSpec[] = [];
  list.push({
    label: data.rank !== null ? `#${formatNumber(data.rank)} global` : "Unranked",
  });
  list.push({
    label: `${formatNumber(data.productCount)} ${data.productCount === 1 ? "product" : "products"}`,
  });
  list.push({
    label: data.tierName,
    emoji: data.tierEmojiSrc ? undefined : data.tierEmoji || undefined,
    emojiSrc: data.tierEmojiSrc ?? undefined,
  });
  if (data.percentile !== null && data.percentile >= 50) {
    list.push({ label: `Top ${Math.max(1, 100 - data.percentile)}%` });
  }
  if (data.topCategoryLabel) list.push({ label: `Mostly ${data.topCategoryLabel}` });
  return list.slice(0, MAX_PILLS[format]);
}

/**
 * The share card itself: a deep dark gradient tinted with the user's avatar
 * hues, the score as a huge figure, and the facts that make it a position
 * rather than a number.
 */
export function ShareCard({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const { width, height } = SHARE_FORMATS[format];
  const m = METRICS[format];
  const palette = shareCardPalette(data);
  const contentWidth = width - m.pad * 2;
  const stacked = format === "story";

  const figure = formatUSD(data.score);
  const figureSize = fitFigure(figure, contentWidth, m.figure);
  const name = profileName(data);

  const identity = stacked ? (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Avatar data={data} size={m.avatar} palette={palette} />
      <div
        style={{
          marginTop: Math.round(m.name * 0.6),
          fontSize: m.name,
          fontWeight: 700,
          letterSpacing: -m.name * 0.03,
          lineHeight: 1.1,
          color: WHITE,
          width: contentWidth,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </div>
      {data.displayName ? (
        <div style={{ marginTop: Math.round(m.handle * 0.4), fontSize: m.handle, color: MUTED }}>
          {`@${data.username}`}
        </div>
      ) : null}
    </div>
  ) : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
        <Avatar data={data} size={m.avatar} palette={palette} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: Math.round(m.avatar * 0.22),
            minWidth: 0,
          }}
        >
          <div
            style={{
              fontSize: m.name,
              fontWeight: 700,
              letterSpacing: -m.name * 0.03,
              lineHeight: 1.1,
              color: WHITE,
              width: contentWidth - m.avatar - m.mark - Math.round(m.avatar * 0.22) - 40,
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
          {data.displayName ? (
            <div
              style={{ marginTop: Math.round(m.handle * 0.3), fontSize: m.handle, color: MUTED }}
            >
              {`@${data.username}`}
            </div>
          ) : null}
        </div>
      </div>
      <AppleMark size={m.mark} />
    </div>
  );

  const scoreBlock = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: m.eyebrow,
          fontWeight: 600,
          letterSpacing: m.eyebrow * 0.2,
          color: MUTED,
        }}
      >
        APPLE SCORE
      </div>
      <div
        style={{
          marginTop: Math.round(m.eyebrow * 0.5),
          fontSize: figureSize,
          fontWeight: 700,
          letterSpacing: -figureSize * 0.045,
          lineHeight: 1,
          color: WHITE,
          whiteSpace: "nowrap",
        }}
      >
        {figure}
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          marginTop: Math.round(m.pill * 1.4),
          maxWidth: contentWidth,
        }}
      >
        {pills(data, format).map((pill) => (
          <Pill
            key={pill.label}
            label={pill.label}
            emoji={pill.emoji}
            emojiSrc={pill.emojiSrc}
            metrics={m}
          />
        ))}
      </div>
    </div>
  );

  const footer = (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {stacked ? (
        <div
          style={{
            marginBottom: Math.round(m.tagline * 0.8),
            fontSize: m.tagline,
            fontWeight: 600,
            letterSpacing: -m.tagline * 0.02,
            color: MUTED,
          }}
        >
          {SITE_TAGLINE}
        </div>
      ) : null}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: m.foot, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
          {`@${data.username}`}
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          {stacked ? (
            <div style={{ display: "flex", marginRight: Math.round(m.foot * 0.5) }}>
              <AppleMark size={Math.round(m.foot * 1.2)} />
            </div>
          ) : null}
          <div style={{ fontSize: m.foot, color: FAINT }}>{data.appHost}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: m.pad,
        background: BACKGROUND,
        color: WHITE,
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Glow
        size={Math.round(width * 0.62)}
        color={palette.glowFrom}
        top={-Math.round(height * 0.3)}
        right={-Math.round(width * 0.18)}
      />
      <Glow
        size={Math.round(width * 0.55)}
        color={palette.glowTo}
        bottom={-Math.round(height * 0.32)}
        left={-Math.round(width * 0.14)}
      />

      {stacked ? (
        <div style={{ display: "flex", alignItems: "center" }}>
          <AppleMark size={m.mark} />
          <div
            style={{
              marginLeft: Math.round(m.wordmark * 0.5),
              fontSize: m.wordmark,
              fontWeight: 700,
              letterSpacing: -m.wordmark * 0.03,
            }}
          >
            {SITE_NAME}
          </div>
        </div>
      ) : null}

      {identity}
      {scoreBlock}
      {footer}
    </div>
  );
}

/** A brand card for profiles that cannot be shown (unknown or private). */
export function GenericShareCard({ format }: { format: ShareFormat }) {
  const { width, height } = SHARE_FORMATS[format];
  const m = METRICS[format];
  const headline = fitFigure(SITE_TAGLINE, width - m.pad * 2, Math.round(m.figure * 0.55));

  return (
    <div
      style={{
        width,
        height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: m.pad,
        background: BACKGROUND,
        color: WHITE,
        fontFamily: "Inter",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Glow
        size={Math.round(width * 0.6)}
        color="rgba(41,151,255,0.42)"
        top={-Math.round(height * 0.3)}
        right={-Math.round(width * 0.16)}
      />
      <Glow
        size={Math.round(width * 0.5)}
        color="rgba(187,78,255,0.3)"
        bottom={-Math.round(height * 0.3)}
        left={-Math.round(width * 0.12)}
      />

      <div style={{ display: "flex", alignItems: "center" }}>
        <AppleMark size={m.mark} />
        <div
          style={{
            marginLeft: Math.round(m.wordmark * 0.5),
            fontSize: m.wordmark,
            fontWeight: 700,
            letterSpacing: -m.wordmark * 0.03,
          }}
        >
          {SITE_NAME}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: headline,
            fontWeight: 700,
            letterSpacing: -headline * 0.04,
            lineHeight: 1,
          }}
        >
          {SITE_TAGLINE}
        </div>
        <div
          style={{
            marginTop: Math.round(headline * 0.3),
            fontSize: m.handle,
            lineHeight: 1.3,
            color: MUTED,
            maxWidth: Math.round((width - m.pad * 2) * 0.85),
          }}
        >
          Every dollar spent on Apple hardware, added up and ranked.
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Pill label={FORMULA} metrics={m} upper={false} />
        <div style={{ fontSize: m.foot, color: FAINT }}>{appHost()}</div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------
 * Rendering
 * ---------------------------------------------------------------------- */

async function toPng(element: React.ReactElement, format: ShareFormat): Promise<ArrayBuffer> {
  const { width, height } = SHARE_FORMATS[format];
  const fonts = await loadShareFonts();
  return new ImageResponse(element, { width, height, fonts }).arrayBuffer();
}

function hasEmoji(data: ShareCardData): boolean {
  return Boolean(data.avatarEmoji) || data.tierEmoji !== "";
}

/**
 * Renders a profile card to PNG bytes. Emoji glyphs are fetched by `next/og`
 * from a CDN at render time; if that is unreachable the card is rendered again
 * with initials and no tier emoji rather than failing the request.
 */
export async function renderShareCard(
  input: ShareCardData,
  format: ShareFormat
): Promise<ArrayBuffer> {
  // Prefer the vendored SVGs: no network, no font fallback, consistent look.
  const [avatarEmojiSrc, tierEmojiSrc] = await Promise.all([
    emojiDataUri(input.avatarEmoji),
    emojiDataUri(input.tierEmoji),
  ]);
  const data: ShareCardData = {
    ...input,
    avatarEmojiSrc,
    tierEmojiSrc,
    // Only leave text glyphs behind for emoji that are not vendored.
    avatarEmoji: avatarEmojiSrc ? null : input.avatarEmoji,
    tierEmoji: tierEmojiSrc ? "" : input.tierEmoji,
  };

  try {
    return await toPng(<ShareCard data={data} format={format} />, format);
  } catch (error) {
    if (!hasEmoji(data)) throw error;
    console.error("[share-card] Render with emoji failed; retrying without.", error);
    return toPng(
      <ShareCard data={{ ...data, avatarEmoji: null, tierEmoji: "" }} format={format} />,
      format
    );
  }
}

/** Renders the brand fallback card to PNG bytes. */
export function renderGenericShareCard(format: ShareFormat): Promise<ArrayBuffer> {
  return toPng(<GenericShareCard format={format} />, format);
}
