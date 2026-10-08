# Apple Score — architecture

This document explains how the app is put together and why. It is written for
a developer who has just cloned the repository.

## The one rule

**Apple Score = Σ (price paid ?? launch MSRP) × quantity**, in whole US dollars.

That is the entire scoring model. There are no multipliers, bonuses, weights or
decay. "Price paid" is optional and recorded per owned line; when it is absent
the product's launch MSRP for its base configuration is used. Discontinued
("legacy") hardware scores at face value.

The formula lives in exactly one place for TypeScript — `src/lib/score.ts` —
and is mirrored once in SQL for ranking — `src/lib/leaderboard.ts`. The unit
test `tests/unit/score.test.ts` pins the formula; the integration test
`tests/integration/leaderboard.test.ts` pins the SQL to the same numbers.

The score is **never stored**. It is derived from the ownership table on
every read, so it cannot drift from the collection and cannot be tampered with
by a client. The only persisted "score" values are the `scoreAfter` snapshots
in the activity log, which exist for charting history, not for ranking.

## Stack

| Layer      | Choice                                                       |
| ---------- | ------------------------------------------------------------ |
| Framework  | Next.js 15 App Router, React 19, Server Components + Actions |
| Language   | TypeScript (strict, `noUncheckedIndexedAccess`)              |
| Styling    | Tailwind CSS 3, shadcn/ui primitives (Radix), framer-motion  |
| Data       | PostgreSQL via Prisma 6                                      |
| Auth       | Auth.js v5 (NextAuth) credentials provider, JWT sessions     |
| Validation | Zod (server) + React Hook Form (client)                      |
| Images     | `next/og` (Satori) for Open Graph and shareable score cards  |
| Tests      | Vitest (unit + integration against Postgres), Playwright E2E |

## Directory map

```
prisma/
  schema.prisma            data model (see below)
  migrations/              SQL migrations, applied with `prisma migrate deploy`
  products.ts              current catalogue (launch MSRPs)
  legacy-products.ts       discontinued hardware
  seed.ts                  idempotent catalogue seed, opt-in demo accounts
src/
  auth.ts / auth.config.ts Auth.js instance and its edge-safe half (middleware)
  middleware.ts            route protection
  actions/                 server actions — the only way the client mutates data
    products.ts            add / set quantity / reprice / remove / onboarding
    social.ts              follow, wishlist
    account.ts             profile, password, delete account
    auth.ts                sign up / log in / log out (rate limited)
    simulate.ts            "what if I buy this?" projections (read-only)
  lib/
    score.ts               THE formula, milestones, tiers, percentile, breakdowns
    achievements.ts        achievement definitions (pure)
    achievement-sync.ts    evaluate + persist unlocks (server)
    leaderboard.ts         boards, standings, podium, rank simulation (SQL)
    queries.ts             everything else the pages read
    rate-limit.ts          DB-backed fixed-window limiter
    validations.ts         zod schemas, shared limits
    families.ts            product-line derivation from names
    share-card.tsx         JSX for score-card images
  app/                     routes (see Routes)
  components/              UI; `components/ui` are shadcn primitives
tests/
  unit/                    pure functions
  integration/             data layer + actions against a real database
  e2e/                     Playwright journey against a production build
```

## Routes

| Route                       | Who      | What                                                        |
| --------------------------- | -------- | ----------------------------------------------------------- |
| `/`                         | public   | Landing page with a live demo score, podium and the formula |
| `/login`, `/signup`         | guests   | Credentials auth; sign-up continues to `/welcome`           |
| `/welcome`                  | members  | Four-step onboarding ending in the score reveal             |
| `/home`                     | members  | Dashboard: hero, history, standing, categories, activity    |
| `/collection`               | members  | Owned products: search, sort, group, edit, remove           |
| `/catalog`                  | members  | Add products; what-if rank preview in the add dialog        |
| `/wishlist`                 | members  | Saved products and the purchase simulator                   |
| `/leaderboard?board=…`      | public   | Band for Band boards, podium, standing, pagination          |
| `/achievements`             | public   | All achievements; progress and unlocks when signed in       |
| `/u/<username>`             | public\* | Social profile with OG image (`opengraph-image.tsx`)        |
| `/u/<username>/card`        | public\* | Share cards (OG, square, story) with download and share     |
| `/u/<a>/vs/<b>`             | public\* | Head-to-head comparison                                     |
| `/p/<slug>`                 | public   | Product page: price, owners, siblings, add/wishlist         |
| `/stats`                    | public   | Community census                                            |
| `/settings`, `/profile`     | members  | Profile editor, password, export, delete; `/profile` → own  |
| `/api/card/<username>`      | public\* | PNG score card (`?format=og\|square\|story`, `?download=1`) |
| `/api/me/export`            | members  | JSON export of the signed-in user's data                    |
| `/api/catalog`              | members  | Slim catalogue for the ⌘K palette                           |
| `/api/health`               | public   | Liveness + database check                                   |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | public | SEO and PWA metadata |

\* Private profiles respond 404 to everyone but their owner. Old links to
`/products/add` redirect to `/catalog`.

## Data model

```
User ──< UserProduct >── Product
 │  ├──< ActivityEvent >── Product (nullable)
 │  ├──< UserAchievement
 │  ├──< WishlistItem >── Product
 │  └──< Follow (followerId, followingId)
RateLimit (key, count, resetAt)
```

- **UserProduct** is the source of truth: `(userId, productId)` is unique,
  `quantity ≥ 1`, optional `pricePaidUSD`. Deleting a user or product cascades.
- **Product** carries `priceUSD` (launch MSRP — the scoring price),
  `currentPriceUSD` (reserved for a future "current value" view; never scored),
  `family` ("MacBook Pro", "iPad mini") derived from the name for grouping,
  `year`, `legacy`.
- **ActivityEvent** is an append-only log written inside the same transaction
  as every inventory change: `type` (ADD / REMOVE / REPRICE), `quantityDelta`,
  `scoreDelta`, `scoreAfter`. It powers the activity feed, the score chart and
  rank movement: _score 7 days ago = score now − Σ scoreDelta since_, which
  makes "↑ 7 positions this week" computable with no cron and no snapshots.
- **UserAchievement** records _when_ an achievement was earned. Definitions
  live in code; unlocks are permanent.
- **Follow** is one-directional and feeds the "Following" board.
- **RateLimit** holds fixed-window counters so limits survive serverless
  cold starts and multiple instances.

Indexes cover every access path the pages use (`userId`, `productId`,
`(userId, createdAt)`, `family`, `year`, `isPublic`).

## Request flow

1. A page (server component) calls `auth()` and the query layer, renders HTML.
2. The client calls a **server action** with plain data.
3. The action validates with zod, derives the user **from the session only**,
   and runs the change inside one Prisma transaction (`applyChanges` in
   `src/actions/products.ts`): read current rows → compute deltas → upsert /
   delete → append `ActivityEvent` rows.
4. After the transaction, `syncAchievements` evaluates all definitions against
   fresh data and persists any new unlocks; `getStanding` fetches the new rank.
5. The action returns a `ScoreUpdate` (score, delta, milestone, tier change,
   unlocked achievements, rank). `useScoreAction` turns that into toasts and
   confetti and calls `router.refresh()` so every server-rendered number on the
   page updates.

No client-supplied value is ever trusted for user id, price (other than the
user's own "price paid", which is bounded and only affects their own score),
score, rank or permissions.

## Leaderboard ("Band for Band")

`getBoardPage(key, { page, viewerId })` builds one SQL statement per board:

```
inv     — owned rows joined to products, filtered by the board (category / legacy)
deltas  — Σ scoreDelta / quantityDelta per user over the last 7 days
totals  — per public user: dollars, units, distinct, most expensive unit (+ name)
ranked  — RANK() for now and for "7 days ago", users strictly below (for
          percentile), min/max/avg over the board
```

Boards: overall, following (viewer + who they follow), per category (iPhone,
Mac, iPad, Apple Watch, AirPods, Vision), vintage (legacy hardware), most
products (units), biggest purchase (most expensive single unit).

Only users with something on that board appear (a $0 collection is not "on
the board"); private profiles never appear. Ties share a rank (1, 2, 2, 4).
`getStanding` returns one user's row with the two neighbours either side, the
gaps to them, their percentile and the board average.

## Achievements

`src/lib/achievements.ts` holds ~60 definitions, each a pure
`progress(context) → 0..1`. The context (`buildAchievementContext`) is built
from authoritative data: inventory, breakdown, rank, follower counts and the
number of distinct days with activity. Rarity tiers are static; "N% of
collectors have this" is computed live from `UserAchievement` and cached for a
minute. Secret achievements are masked until unlocked.

## Security

- Passwords: bcrypt, 12 rounds; a constant-time dummy compare hides whether an
  email exists at sign-in.
- Sessions: JWT (30 days) in an HTTP-only cookie managed by Auth.js. The user
  id and username in the token are set at sign-in only.
- Rate limiting: sign-up 5/hour per address; sign-in 30/15 min per address and
  10/15 min per account. Database-backed, fails open with a logged error.
- Authorisation: every action loads the user from the session; every query
  that returns private data takes the session user id. Private profiles are
  only returned to their owner. Reserved usernames cannot be registered.
- Redirects: `callbackUrl` is validated by `safeCallbackUrl` (same-origin
  relative paths only).
- Headers: CSP (`default-src 'self'`, no third-party scripts), HSTS, nosniff,
  frame-ancestors none, referrer policy, permissions policy
  (`next.config.ts`).
- Input: every action parses with zod, with bounds on quantity (1–99), price
  (0–50,000), bio (160), display name (40), onboarding batch (12).
- Errors: server actions log and return generic messages; `error.tsx` shows a
  digest, never a stack.

## Caching

- The catalogue, ownership counts, achievement rarity and community stats use
  `unstable_cache` with a 60 s TTL and tags (`catalogue`, `community`) that
  actions revalidate.
- Pages that read the session are dynamic. Public profile pages respond 404
  for unknown users because they have no `loading.tsx` boundary (a streamed
  shell would commit a 200 before `notFound()` runs).

## Testing

- `npm run test:unit` — formula, milestones, tiers, percentile, achievements,
  validation, formatting, redirect safety.
- `npm run test:integration` — boards, standings, simulation and every server
  action against PostgreSQL (`TEST_DATABASE_URL` or `DATABASE_URL`), with the
  catalogue seeded. Tests create their own users and clean up.
- `npm run test:e2e` — Playwright against `next start`: sign up → add product
  → score everywhere → profile → share card → log out/in, plus 404 and
  redirect checks, on desktop and a phone viewport.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, format check, migrations

- seed, unit + integration tests, the production build and the E2E suite
  against a Postgres service container.

## Deployment

Any Node host works; Vercel is the simplest. Set the variables from
`.env.example`, run `npx prisma migrate deploy` and `npm run db:seed` against
the production database once, deploy. The build runs `prisma generate` first.
Share-card and Open Graph images render on the Node runtime using the vendored
Inter subsets in `src/assets/fonts`.
