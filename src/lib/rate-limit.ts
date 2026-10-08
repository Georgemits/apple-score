import "server-only";

import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiting backed by the `RateLimit` table, so limits hold
 * across serverless instances and restarts. One atomic upsert per check.
 */

export type RateLimitResult = {
  ok: boolean;
  /** Attempts left in the current window (0 when blocked). */
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
};

type Row = { count: number; resetAt: Date };

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const rows = await prisma.$queryRaw<Row[]>`
      INSERT INTO "RateLimit" ("key", "count", "resetAt")
      VALUES (${key}, 1, now() + make_interval(secs => ${windowSeconds}::double precision))
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."resetAt" <= now() THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "resetAt" = CASE
          WHEN "RateLimit"."resetAt" <= now()
            THEN now() + make_interval(secs => ${windowSeconds}::double precision)
          ELSE "RateLimit"."resetAt"
        END
      RETURNING "count", "resetAt"
    `;

    const row = rows[0];
    if (!row) return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };

    // Opportunistic cleanup of stale windows, roughly once every 50 checks.
    if (Math.random() < 0.02) {
      void prisma.rateLimit
        .deleteMany({ where: { resetAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } })
        .catch(() => undefined);
    }

    const retryAfterSeconds = Math.max(0, Math.ceil((row.resetAt.getTime() - Date.now()) / 1000));
    return {
      ok: row.count <= limit,
      remaining: Math.max(0, limit - row.count),
      retryAfterSeconds,
    };
  } catch (error) {
    // Fail open: a broken limiter should not lock every user out. The request
    // still needs the database for anything meaningful, so this is rare.
    console.error("rateLimit:", error);
    return { ok: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Best-effort client address for keying limits. Falls back to a shared bucket. */
export async function clientAddress(): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || requestHeaders.get("x-real-ip") || "unknown";
}

export function retryMessage(result: RateLimitResult): string {
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
  return `Too many attempts. Try again in ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
}
