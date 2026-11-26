# DEJAVU

Curated social dining for strangers. Small groups matched on interests sit down
for a Sunday lunch at a carefully chosen table — not dating, not a meetup, just
a table.

DEJAVU is a [Next.js](https://nextjs.org) (App Router) + PostgreSQL app with a
public site, a registration/join flow with Razorpay checkout (or a simulated
demo mode), and an admin panel at `/admin` for members, payments, events,
bookings, plans, FAQs, testimonials and site content.

## Stack

- Next.js 16 (App Router, RSC) · React 19 · TypeScript (strict)
- PostgreSQL via Drizzle ORM + `node-postgres`
- Tailwind CSS 4 · GSAP + Lenis (scroll experience)
- Zod (validation) · Razorpay (payments)
- Drizzle Kit for migrations (`drizzle/`)

## Quickstart

Requires Node.js ≥ 20 and a PostgreSQL database.

```bash
npm install
cp .env.example .env        # then edit values (see below)
# create the database, e.g.: createdb app_db
npx drizzle-kit push        # create tables from src/db/schema.ts (or: npm run db:migrate)
npm run dev
```

Open http://localhost:3000 — first request seeds default categories, plans,
FAQs, demo events and settings (idempotent; guarded by a `_seeded` settings
flag).

## Environment variables

See [.env.example](.env.example) for the full list with comments.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | **Required.** PostgreSQL connection string. |
| `ADMIN_PASSWORD` | `/admin` password. Unset → temporary demo password `dejavu-demo-admin` with a visible warning. |
| `ADMIN_SESSION_SECRET` | HMAC key for admin session cookies. Unset → random per-process secret (sessions reset on restart). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay API keys. Unset → payments run in clearly-labelled demo mode and nothing is charged. |
| `RAZORPAY_WEBHOOK_SECRET` | Enables `/api/razorpay/webhook` for server-side reconciliation (captures/failures/refunds) if the browser closes mid-checkout. |
| `NEXT_PUBLIC_SITE_URL` | Public origin for metadata/OG tags. |
| `COOKIE_INSECURE` | `1` drops the `Secure` attribute on the admin cookie. Only for plain-HTTP deployments behind TLS-terminating proxies; prefer HTTPS. |

> **Note:** without `RAZORPAY_*` keys the app boots in demo mode and
> `/api/payments/demo` simulates payment outcomes. Demo mode is automatically
> disabled once real keys are set. Set `ADMIN_PASSWORD` and
> `ADMIN_SESSION_SECRET` before going live.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration tests (Vitest; booking logic runs against a real in-memory Postgres via pglite, no server needed) |
| `npm run db:generate` | Generate a SQL migration from schema changes into `drizzle/` |
| `npm run db:push` | Push the current schema directly to the database (dev) |
| `npm run db:migrate` | Apply committed migrations from `drizzle/` |

Migrations are committed under `drizzle/`. The initial migration
(`0000_init.sql`) captures the full schema, including a partial unique index
that allows at most one live booking per member per experience (re-booking
after cancellation stays possible). Deleting a member who has any payment
rows is refused (409) so the payment audit trail can never be cascade-deleted
silently.

## Testing & CI

`npm test` runs Vitest: pure-function tests (validation schema, Razorpay and
session signatures, `upcomingSundays`) plus integration tests for the booking
capacity/duplicate logic that boot a real in-memory Postgres (pglite) and
apply the committed migration — no database server required.

`.github/workflows/ci.yml` runs on every push to `main` and every pull
request: `npm ci` → lint → typecheck → tests → production build (deliberately
without `DATABASE_URL`; the build must not depend on one).

## Admin panel

`/admin` is protected by a password cookie session (12h, `HttpOnly`,
`SameSite=Lax`). Login attempts are throttled per IP with a bounded,
self-sweeping in-memory limiter (best-effort; in a multi-instance deployment
put a real limiter/WAF in front). Members with payment rows can't be deleted
from the panel — remove their contact details manually if erasure is
required. Members without payments can be deleted, which cascades to their
bookings.

## Images

The files under `public/images/` are AI-generated illustrative placeholders
created for this project — swap them for real, rights-cleared photography
before a public launch (and swap the licence accordingly). Admin-editable
image URLs (category `imageUrl`, gallery settings) must point at files that
exist or at hosts allowed by `next.config.ts`.

## Legal

The pages under `/legal/*` are drafts flagged for review by counsel (refund
policy in particular). Do not launch publicly before legal sign-off.

## Deployment notes

- Set all env vars from `.env.example` (except demo-payment keys) in your
  platform; never commit `.env`.
- Run migrations as part of release (`npm run db:migrate`), or `drizzle-kit push` for a fresh dev database.
- `GET /api/health` returns 200 when the database is reachable — wire it into your platform's healthcheck.
