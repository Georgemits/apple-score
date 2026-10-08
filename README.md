# 🍎 Apple Score

> How much Apple do you own?

Apple Score turns your Apple collection into one number: **the total you have
spent on Apple hardware, in US dollars.**

```
Apple Score = Σ ( price paid ?? launch MSRP ) × quantity

MacBook Pro 16" (M4 Max)   $3,499
iPhone 17 Pro Max          $1,199  × 2
AirPods Pro 3                $249
Apple Watch Ultra 3          $799
-----------------------------------
Apple Score               $6,945
```

Add what you own, watch the score climb, unlock achievements, compare with
friends, and fight for a spot on **Band for Band** — the global leaderboard.

- **Collection** — a catalogue of 233 Apple products (2025 back to the Apple I)
  with launch MSRPs; add quantities, record what you actually paid, edit,
  remove, search, filter, sort, group.
- **Band for Band** — boards for overall, iPhone, Mac, iPad, Apple Watch,
  AirPods, Vision, vintage, most products, biggest purchase and the people you
  follow. Podium, rank movement this week, percentile, the collectors just
  above and below you.
- **Achievements** — ~60 of them, from _First Purchase_ to _Apple Billionaire_,
  _Cheese Grater_ (own a Mac Pro) to _Lost & Found_ (three pairs of the same
  AirPods), with rarity and "N% of collectors have this".
- **Profiles & share cards** — public profiles at `/u/<username>` with Open
  Graph previews, downloadable score cards for Instagram, X, Discord and
  Messages, and head-to-head compare pages (`/u/you/vs/them`).
- **Dashboard** — score history chart, spending by category, your standing,
  recent activity, what's next, quick add.
- **What-if simulator** — a wishlist that tells you the score and rank each
  purchase would give you.
- **Onboarding** — a sixty-second welcome flow that gets a new user on the
  board with their iPhone, Mac and the rest of the ecosystem.
- Light / dark / system themes, a mobile tab bar, loading skeletons, playful
  empty states, confetti where it counts.

Apple Score is an unofficial, for-fun project. Not affiliated with Apple Inc.

---

## Contents

- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [How the score works](#how-the-score-works)
- [Testing](#testing)
- [Deploying](#deploying)
- [Architecture](#architecture)
- [Adding products](#adding-products)

## Quick start

**Prerequisites:** Node.js 20+ and PostgreSQL 14+ (local, Docker, Supabase,
Neon — anything).

```bash
git clone https://github.com/Georgemits/apple-score.git
cd apple-score
npm install
cp .env.example .env           # fill in DATABASE_URL / DIRECT_URL / AUTH_SECRET

npx prisma migrate deploy      # create the tables
npm run db:seed                # load the Apple catalogue
# optional: demo accounts so the leaderboard has company
SEED_DEMO_USERS=true npm run db:seed

npm run dev
```

Open <http://localhost:3000>. Demo accounts (when seeded): `tim`, `steve`,
`woz`, `jony`, `lisa`, `alex`, `sam`, `morgan`, `riley`, `jamie`, `casey`,
`taylor` — email `<name>@example.com`, password `applescore123`.

### Local Postgres with Docker

```bash
docker run -d --name apple-score-db \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=apple_score \
  -p 5432:5432 postgres:16-alpine
```

Then in `.env`:

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/apple_score"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/apple_score"
```

## Environment variables

| Variable              | Required | Purpose                                                           |
| --------------------- | -------- | ----------------------------------------------------------------- |
| `DATABASE_URL`        | ✅       | Postgres connection used by the app (pooled on Supabase/Neon)     |
| `DIRECT_URL`          | ✅       | Non-pooled connection used by `prisma migrate`                    |
| `AUTH_SECRET`         | ✅       | Signs session JWTs — `openssl rand -base64 32`                    |
| `AUTH_URL`            | —        | Canonical URL. Optional on Vercel                                 |
| `AUTH_TRUST_HOST`     | —        | `true` behind a proxy (Vercel sets this)                          |
| `NEXT_PUBLIC_APP_URL` | —        | Public origin for metadata, share cards and the sitemap           |
| `TEST_DATABASE_URL`   | —        | Separate database for the integration and E2E suites              |
| `SEED_DEMO_USERS`     | —        | `true` to create demo accounts when seeding (never in production) |
| `SEED_DEMO_PASSWORD`  | —        | Password for the demo accounts (default `applescore123`)          |

## Database

Prisma manages the schema. Migrations live in `prisma/migrations`.

```bash
npx prisma migrate deploy                 # apply migrations (CI / production)
npx prisma migrate dev --name my_change   # create a migration after editing schema.prisma
npm run db:seed                           # idempotent catalogue seed (upserts by slug)
npx prisma studio                         # browse the data
```

The seed is safe to re-run. With `SEED_DEMO_USERS=true` it also rebuilds the
demo accounts, their collections, follows, activity history and achievements.

## Scripts

| Script                     | What it does                                                   |
| -------------------------- | -------------------------------------------------------------- |
| `npm run dev`              | Development server                                             |
| `npm run build`            | `prisma generate` + production build                           |
| `npm run start`            | Serve the production build                                     |
| `npm run lint`             | ESLint                                                         |
| `npm run typecheck`        | `tsc --noEmit`                                                 |
| `npm run format`           | Prettier (write) · `format:check` to verify                    |
| `npm test`                 | Unit + integration tests (Vitest)                              |
| `npm run test:unit`        | Pure-function tests only                                       |
| `npm run test:integration` | Data layer + server actions against Postgres                   |
| `npm run test:e2e`         | Playwright journey against a production build                  |
| `npm run check`            | lint + typecheck + test                                        |
| `npm run db:*`             | Prisma helpers (`migrate`, `deploy`, `push`, `seed`, `studio`) |

## How the score works

The formula is in [`src/lib/score.ts`](src/lib/score.ts):

```ts
export function lineTotal(item: ScorableItem): number {
  return (item.pricePaidUSD ?? item.product.priceUSD) * item.quantity;
}
```

- **Launch MSRP** of the base configuration, in whole US dollars, is the
  default price for every product.
- **Price paid** can be recorded per owned line (second-hand, on sale, or the
  higher configuration you actually bought) and replaces the MSRP for that
  line only. It is bounded to $0–$50,000.
- **Legacy hardware** scores at its original sticker price — a $2,495
  Macintosh 128K is worth $2,495. No inflation adjustment, no bonus.
- **No multipliers of any kind.** More money spent on Apple is a higher score.
  That is the whole idea.

The score is never stored; it is computed from the ownership table on every
read (and in SQL for the leaderboard), so it cannot drift or be tampered with.
Rank movement is reconstructed from the append-only activity log. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the details.

## Testing

```bash
npm run test:unit            # no database needed
npm run test:integration     # needs a seeded Postgres (DATABASE_URL or TEST_DATABASE_URL)
npm run build && npm run test:e2e   # Playwright; installs nothing, starts `next start` itself
```

Integration tests create their own users (prefixed `t_`) and delete them
afterwards; the E2E suite creates one user per run (`e2e_…`). Both are safe to
run against a development database.

CI runs lint, typecheck, format check, migrations + seed, unit + integration
tests, the production build and the E2E suite on every pull request.

## Deploying

### Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new).
2. Add the environment variables from `.env.example` (`DATABASE_URL`,
   `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`,
   `NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app`).
3. Deploy. The build runs `prisma generate` first.
4. Apply migrations and seed once, from your machine, pointing at the
   production database:

   ```bash
   DATABASE_URL="<prod pooled url>" DIRECT_URL="<prod direct url>" npx prisma migrate deploy
   DATABASE_URL="<prod pooled url>" DIRECT_URL="<prod direct url>" npm run db:seed
   ```

   To migrate automatically on every deploy, set the build command to
   `prisma migrate deploy && prisma generate && next build`.

### Anywhere else

`npm run build && npm run start` behind any reverse proxy. Set `AUTH_URL` to
the public origin. Share-card images render on the Node runtime with vendored
fonts, so no outbound network is required.

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): data model, request flow,
leaderboard SQL, achievement engine, security review, caching and testing.

## Adding products

Edit `prisma/products.ts` (current hardware) or `prisma/legacy-products.ts`
(discontinued) and re-run `npm run db:seed`. Each entry needs a unique `slug`,
`name`, `category`, launch `priceUSD` and `year`; `family` is derived from the
name (`src/lib/families.ts`) unless set explicitly. Artwork is category-based
line art from `public/product-art/`.

## Disclaimer

Apple Score is an unofficial, for-fun project and is **not affiliated with,
endorsed by, or sponsored by Apple Inc.** Apple, product names and trademarks
belong to Apple Inc. Prices are US launch MSRPs for the base configuration and
are a scoring reference, not a valuation of your hardware.
