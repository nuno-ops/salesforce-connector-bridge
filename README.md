# Salesforce Saver

Finds wasted Salesforce spend: inactive users, integration accounts on full licenses, users who could move to Platform licenses, unassigned seats, unused package seats, storage pressure and extra sandboxes. Live at https://salesforcesaver.com.

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Tailwind 4)
- **Supabase Auth** for sign-in (magic link and Google); **Postgres** via **Drizzle ORM** for data
- **Salesforce** OAuth web-server flow with PKCE; tokens encrypted at rest (AES-256-GCM) and only used server-side
- **Stripe** for the $39/month Savings Monitor, the $99 one-off audit and paid consultations
- **Claude** for the connected-app review and reading prices from contract PDFs
- **Vitest** for the savings engine, Salesforce client, billing rules and a database integration test

## How it works

1. A signed-in user connects an org (`/api/salesforce/connect` → Salesforce → `/api/salesforce/callback`).
2. A scan (`src/lib/scan.ts`) runs the read-only queries in `src/lib/salesforce/collect.ts` and stores a snapshot.
3. The pure savings engine (`src/lib/savings/engine.ts`) prices the snapshot. Each user lands in at most one bucket (inactive → integration → platform), so savings are never double counted. Editing prices re-prices the stored snapshot without calling Salesforce.
4. Access (`src/lib/billing/access.ts`): with `BILLING_ENABLED=false` everyone sees the full report, matching today's site. With billing on, free users see totals and recommendations; an audit unlocks the full report for `AUDIT_ACCESS_HOURS`; Monitor adds weekly rescans and history.

## Setup

```bash
cp .env.example .env.local   # fill in the values
npm install
npm run db:migrate           # creates tables (RLS enabled, no policies: only the server connection reads them)
npm run dev
```

### Salesforce Connected App

- Callback URL: `${NEXT_PUBLIC_APP_URL}/api/salesforce/callback`
- OAuth scopes: `api`, `refresh_token`
- Enable "Require Proof Key for Code Exchange (PKCE)"; the client secret is optional when PKCE is required.

### Supabase

Enable the Email (magic link) and Google providers, and add `${NEXT_PUBLIC_APP_URL}/auth/callback` to the redirect allow list.

### Stripe

Create three prices and set `STRIPE_PRICE_MONITOR` (recurring), `STRIPE_PRICE_AUDIT` and `STRIPE_PRICE_CONSULT` (one-time). Point a webhook at `/api/stripe/webhook` with `checkout.session.completed`, `checkout.session.async_payment_succeeded` and `customer.subscription.*`.

### Weekly rescans

Call `GET /api/cron/rescan` with `Authorization: Bearer $CRON_SECRET` once a week (Vercel Cron, GitHub Actions or any scheduler).

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run lint` / `npm run typecheck` | ESLint / route typegen + `tsc` |
| `npm test` | Unit tests; set `TEST_DATABASE_URL` to also run the database integration test |
| `npm run db:generate` | New migration from `src/lib/db/schema.ts` |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |

The previous Vite + Supabase Edge Functions app lives in git history (last commit `d21b778`).
