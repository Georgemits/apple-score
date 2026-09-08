# 🍎 Apple Score

> Your Apple ecosystem has a score.

Apple Score turns your Apple collection into a single competitive number. Every product you own
contributes its launch MSRP to your total:

```
Apple Score = Σ (product MSRP × quantity)
```

Own two iPhone 17 Pro Max ($1,199 each) and one MacBook Pro 16" M4 Max ($3,499)?
Your Apple Score is **5,897**.

Add products, watch your score update instantly, and climb a global leaderboard.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Prisma migrations](#prisma-migrations)
- [Seeding the catalogue](#seeding-the-catalogue)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [How the score is calculated](#how-the-score-is-calculated)
- [Deploying to Vercel](#deploying-to-vercel)
- [Accessibility](#accessibility)
- [Disclaimer](#disclaimer)

---

## Features

**Core**

- Email + password authentication (sign up, log in, log out) with hashed passwords and JWT sessions
- A global catalogue of **125+ Apple products** with real launch MSRPs, spanning iPhone, Mac, iPad,
  Watch, AirPods, Vision, Displays, Apple TV & Home, and Accessories
- Add products with a quantity, edit quantities, remove one unit or remove a product entirely
  (with a confirmation dialog)
- Instant score recalculation on every change — home, profile and leaderboard all stay in sync
- Global leaderboard ranked by Apple Score, with gold/silver/bronze styling for the top three and
  your own rank always visible
- Public profile pages at `/u/<username>` with a shareable link

**Extras**

- 10 achievement badges (Mac Collector, iPhone Enthusiast, Spatial Pioneer, The 1%, …)
- Confetti when you cross a score milestone (1k / 5k / 10k / 25k / 50k / 100k)
- Spending-by-category chart and a recent-additions activity feed
- Leaderboard search, catalogue search with instant filtering and category chips
- A playful 🥲 *Lowest Apple Score* badge for whoever is currently at the bottom
- Light / dark / system themes, glassmorphic Apple-inspired UI, Framer Motion transitions
- Loading skeletons, error boundaries, and a fully responsive mobile-first layout

## Tech stack

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Framework  | Next.js 15 (App Router, Server Actions)             |
| Language   | TypeScript (strict, `noUncheckedIndexedAccess`)     |
| Styling    | Tailwind CSS 3 + shadcn/ui (Radix primitives)       |
| Animation  | Framer Motion                                       |
| Icons      | Lucide                                              |
| Database   | PostgreSQL (Supabase or Neon)                       |
| ORM        | Prisma 6                                            |
| Auth       | Auth.js / NextAuth v5 (Credentials provider, JWT)   |
| Validation | Zod + React Hook Form                               |
| Toasts     | Sonner                                              |

## Quick start

**Prerequisites:** Node.js 18.18+ (20 LTS recommended) and a PostgreSQL database.

```bash
git clone <your-repo-url> apple-score
cd apple-score
npm install
cp .env.example .env      # then fill in the values — see below
npx prisma migrate deploy # create the tables
npm run db:seed           # load the Apple product catalogue
npm run dev
```

Open <http://localhost:3000>.

> `npm install` runs `prisma generate` automatically via the `postinstall` script, so the Prisma
> client is always in sync with `prisma/schema.prisma`.

## Environment variables

Copy `.env.example` to `.env` and fill it in:

| Variable              | Required | Purpose                                                                 |
| --------------------- | -------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`        | ✅       | Pooled Postgres connection string used by the app at runtime            |
| `DIRECT_URL`          | ✅       | Direct (non-pooled) connection string used by `prisma migrate`          |
| `AUTH_SECRET`         | ✅       | Secret used to sign session JWTs                                        |
| `AUTH_URL`            | —        | Canonical URL. Optional on Vercel, useful locally                       |
| `AUTH_TRUST_HOST`     | —        | Set to `true` behind a proxy (Vercel sets this for you)                 |
| `NEXT_PUBLIC_APP_URL` | —        | Used for metadata and shareable profile links                           |

Generate a secret with:

```bash
openssl rand -base64 32
```

## Database setup

Any PostgreSQL 14+ database works. Two zero-cost options:

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string**.
3. `DATABASE_URL` — the **Transaction pooler** URI (port `6543`), with
   `?pgbouncer=true&connection_limit=1` appended.
4. `DIRECT_URL` — the **Direct connection** URI (port `5432`).

### Neon

1. Create a project at [neon.tech](https://neon.tech).
2. `DATABASE_URL` — the **pooled** connection string (host contains `-pooler`).
3. `DIRECT_URL` — the **unpooled** connection string.

Both providers require `sslmode=require`, which is included in the strings they give you.

## Prisma migrations

The repository ships with an initial migration in `prisma/migrations/20250101000000_init`.

```bash
# Apply existing migrations (use this in CI and production)
npx prisma migrate deploy

# Create a new migration after editing prisma/schema.prisma (development)
npx prisma migrate dev --name describe_your_change

# Regenerate the Prisma client on its own
npx prisma generate

# Inspect the data
npx prisma studio
```

`prisma migrate dev` needs a shadow database, which is why `DIRECT_URL` must point at a
non-pooled connection.

If you would rather not use migration files at all (prototyping only):

```bash
npx prisma db push
```

## Seeding the catalogue

```bash
npm run db:seed
```

The seed is **idempotent** — it upserts by product slug, so it is safe to re-run after adding new
products to `prisma/products.ts`.

To also create demo accounts (`tim`, `steve`, `alex`, `casey`) so the leaderboard has something to
show, opt in explicitly:

```bash
SEED_DEMO_USERS=true npm run db:seed
```

They all share the password `applescore123` (override with `SEED_DEMO_PASSWORD`).
**Never enable this on a production database.**

### Adding your own products

Edit `prisma/products.ts` and re-run the seed. Each entry needs a unique `slug`, a `name`, a
`category`, the launch `priceUSD` in whole dollars, and the announcement `year`. Artwork is
category-based line art from `public/product-art/`; point `CATEGORY_IMAGE` (or the individual product
records) at your own image URLs if you have real photography.

## Scripts

| Script                 | What it does                                    |
| ---------------------- | ----------------------------------------------- |
| `npm run dev`          | Start the dev server                            |
| `npm run build`        | `prisma generate` + production build            |
| `npm run start`        | Serve the production build                      |
| `npm run lint`         | ESLint                                          |
| `npm run typecheck`    | `tsc --noEmit`                                  |
| `npm run format`       | Prettier (writes)                               |
| `npm run format:check` | Prettier (checks only)                          |
| `npm run db:migrate`   | `prisma migrate dev`                            |
| `npm run db:deploy`    | `prisma migrate deploy`                         |
| `npm run db:push`      | `prisma db push`                                |
| `npm run db:seed`      | Seed the product catalogue                      |
| `npm run db:studio`    | Open Prisma Studio                              |

## Project structure

```
prisma/
  schema.prisma          # User, Product, UserProduct, Category enum
  products.ts            # The Apple catalogue (125+ products)
  seed.ts                # Idempotent seed script
  migrations/            # SQL migrations
public/product-art/         # Category line-art SVGs
src/
  auth.ts                # Auth.js instance (Credentials provider)
  auth.config.ts         # Edge-safe config shared with middleware
  middleware.ts          # Route protection
  actions/
    auth.ts              # signup / login / logout server actions
    products.ts          # add / set quantity / remove server actions
    types.ts             # Discriminated ActionResult type
  app/
    (auth)/login         # /login
    (auth)/signup        # /signup
    home                 # /home
    leaderboard          # /leaderboard
    products/add         # /products/add
    profile              # /profile
    u/[username]         # /u/<username> public profile
    api/auth/[...nextauth]
  components/
    ui/                  # shadcn/ui primitives
    auth/                # login + signup forms
    …                    # ProductCard, LeaderboardTable, CategoryChart, …
  hooks/
    use-score-action.ts  # Runs an action → toast → confetti → refresh
  lib/
    prisma.ts            # Singleton Prisma client
    queries.ts           # Data-access layer (incl. leaderboard SQL)
    score.ts             # The Apple Score formula
    achievements.ts      # Achievement definitions
    validations.ts       # Zod schemas
    categories.ts        # Labels, search keywords, tints
    utils.ts             # cn() and formatters
```

## How the score is calculated

The formula lives in one place — [`src/lib/score.ts`](src/lib/score.ts):

```ts
export function calculateScore(items: readonly ScorableItem[]): number {
  return items.reduce((total, item) => total + item.product.priceUSD * item.quantity, 0);
}
```

The leaderboard cannot express `SUM(price × quantity)` through Prisma's typed `groupBy`, so
[`getLeaderboard()`](src/lib/queries.ts) uses a single window-function query instead of loading
every inventory row into memory:

```sql
WITH scores AS (
  SELECT u.id, u.username, u."createdAt",
         COALESCE(SUM(p."priceUSD" * up.quantity), 0)::int AS score, …
  FROM "User" u
  LEFT JOIN "UserProduct" up ON up."userId" = u.id AND up.quantity > 0
  LEFT JOIN "Product" p ON p.id = up."productId"
  GROUP BY u.id, u.username, u."createdAt"
)
SELECT s.*, RANK() OVER (ORDER BY s.score DESC)::int AS rank FROM scores s ORDER BY rank
```

Ties share a rank (1, 2, 2, 4). Prices are whole US dollars, so scores are always integers.

## Deploying to Vercel

GitHub Pages cannot host this app — it needs a server for authentication, server actions and
database access. Vercel is the natural fit.

1. **Push to GitHub.**

   ```bash
   git remote add origin https://github.com/<you>/apple-score.git
   git push -u origin main
   ```

2. **Import the repo** at [vercel.com/new](https://vercel.com/new). Framework preset: Next.js.

3. **Add the environment variables** from `.env.example` in
   *Project Settings → Environment Variables*:
   `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `AUTH_TRUST_HOST=true`, and
   `NEXT_PUBLIC_APP_URL=https://<your-app>.vercel.app`.

4. **Deploy.** The build script runs `prisma generate` before `next build`.

5. **Apply migrations and seed** once, from your machine, pointing at the production database:

   ```bash
   DATABASE_URL="<prod pooled url>" DIRECT_URL="<prod direct url>" npx prisma migrate deploy
   DATABASE_URL="<prod pooled url>" DIRECT_URL="<prod direct url>" npm run db:seed
   ```

   To run migrations automatically on every deploy instead, change the build command to
   `prisma migrate deploy && prisma generate && next build`.

## Accessibility

- Semantic landmarks, a skip-to-content link, and a real `<table>` with a caption and scoped
  headers for the leaderboard
- Every interactive control is keyboard reachable with a visible `:focus-visible` ring
- Radix primitives handle dialog focus trapping and `aria-*` wiring
- Live regions announce filtered result counts and quantity changes
- All animation is disabled under `prefers-reduced-motion`, including confetti
- Colour is never the only signal — medals, badges and the category chart all carry text labels

## Disclaimer

Apple Score is an unofficial, for-fun project and is **not affiliated with, endorsed by, or
sponsored by Apple Inc.** "Apple", product names and trademarks belong to Apple Inc.

Prices are US launch MSRPs for the base configuration, stored as whole dollars. They are a
scoring reference, not a valuation of your actual hardware.
