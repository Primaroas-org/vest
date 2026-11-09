# Vest

Fractional real-estate investing for Mongolia. Investors buy shares of a property (for example 500,000 ₮ per share of a 500M ₮ apartment), see their holdings grow, and receive their share of the rent as dividends. Admins list properties, review identity documents (KYC) and pay out rental income.

It is a full-stack TypeScript app: a React frontend, an Express API and a PostgreSQL database (on Supabase) where the money-moving logic lives in SQL functions that run as single transactions.

**Status:** working prototype, not in production. Payments are simulated (see [Limitations](#limitations)).

## What it does

**Investors**
- Browse and filter properties, with pagination and a map of each property's location
- Sign up, sign in and reset a password (Supabase Auth)
- Complete KYC: upload identity documents; progress is saved between visits
- Buy shares: pick an amount and a saved card, confirm, and download a receipt
- Wallet: deposit and withdraw funds
- Dashboard: holdings, portfolio value over time, dividends received and an asset breakdown
- Notifications, and the whole interface in Mongolian or English

**Admins**
- Dashboard of totals: assets, capital raised, investors, average yield
- Create and edit properties, or prefill one from a unegui.mn listing link
- Review KYC submissions and approve or reject them
- Distribute a month's rent to every shareholder of a property
- See all investors and transactions; add funds to a user's wallet

## Tech stack

| Layer | Tools |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS |
| API | Node.js, Express, TypeScript (helmet, cors, morgan) |
| Database | PostgreSQL on Supabase: Drizzle ORM for queries, plain SQL for the schema, PL/pgSQL functions, triggers and row-level security |
| Auth and files | Supabase Auth (JWT), Supabase Storage for KYC documents |

## How it fits together

```
Browser (React, Vite on :3001)
   │  /api/* requests are proxied in development
   ▼
Express API (:3000)
   │  middleware/auth.ts verifies the Supabase JWT, loads the user,
   │  and checks is_active, KYC status or is_admin per route
   ├─► Drizzle queries ──────────────┐
   └─► RPC calls to SQL functions ───┤
                                     ▼
                     PostgreSQL (Supabase)
                     tables + RLS policies + PL/pgSQL functions
```

## Database design

The schema is in [`schema.sql`](schema.sql), with later changes in [`migrations/`](migrations). The parts I'd point to first:

- **Money is `NUMERIC(20, 2)`**, never a float column, and travels as a string between the database and the API.
- **Buying shares is one SQL function, `process_investment`.** It locks the investor's row and the property's row with `SELECT … FOR UPDATE`, checks there are enough shares and enough balance, then updates the wallet, the property's available shares and the investor's holding, and records the transaction. Because it all runs in one transaction, two people buying the last shares at the same moment can't both succeed: the second waits for the lock, then gets `SOLD_OUT`.
- **Rent payouts are one SQL function, `distribute_rental_income`.** It locks every holding of the property and pays each investor `shares_owned / total_shares_sold × rent`, rounded to 2 decimals, crediting wallets and writing dividend transactions.
- **A trigger creates the app's user row on sign-up.** Supabase Auth stores accounts in `auth.users`; the `handle_new_user` trigger inserts the matching row in `public.users` (wallet balance, KYC status). It is `SECURITY DEFINER` so row-level security doesn't block the insert.
- **Row-level security** limits investors to their own investments, transactions, notifications and saved cards.
- **Indexes match the queries:** for example `(user_id, created_at)` on transactions for the history page, and a unique `(user_id, property_id)` on investments so each investor has one holding per property.

## Run it locally

You need Node.js 20+, [pnpm](https://pnpm.io) and a free [Supabase](https://supabase.com) project.

```bash
pnpm install
cp .env.example .env   # then fill in your Supabase URL, keys and DATABASE_URL
```

Set up the database in the Supabase SQL editor by running these in order:

1. `schema.sql`
2. each file in `migrations/`, in number order (`001` to `005`)
3. optionally `supabase/seed.sql` for three sample properties

Start the API and the web app in two terminals:

```bash
pnpm server:dev   # Express API on http://localhost:3000
pnpm dev          # web app on http://localhost:3001
```

Sign up in the app, then make your account an admin in the SQL editor:

```sql
UPDATE users SET is_admin = true WHERE email = 'you@example.com';
```

Check types for both the frontend and the API with `pnpm typecheck`.

## Project layout

```
App.tsx, index.tsx       app shell and routes
components/              pages and UI (Admin/ for the admin portal, Wallet/ for deposits and withdrawals)
contexts/                auth and language state
utils/                   API cache, receipt download, translations, Supabase client
backend/
  server.ts              Express app and routes
  controllers/           investment, portfolio, dashboard, KYC and admin logic
  db/                    Drizzle client and table definitions
  middleware/auth.ts     JWT check, active/KYC/admin guards
schema.sql               core tables, indexes and RLS policies
migrations/              SQL functions, the sign-up trigger, later tables
supabase/seed.sql        sample properties
docs/                    API reference, database and auth setup
```

## Limitations

- **Payments are simulated.** The QPay and bank screens are interface only; a deposit credits the wallet directly through the `add_wallet_funds` SQL function, and no payment provider is connected.
- **e-Mongolia identity checks are a mock** (`backend/utils/kyc.ts`). An admin approves KYC by reviewing the uploaded documents.
- There are no automated tests yet.

## More docs

- [docs/BACKEND.md](docs/BACKEND.md): API endpoints and request/response examples
- [docs/DATABASE.md](docs/DATABASE.md): database setup in detail
- [docs/AUTH.md](docs/AUTH.md): Supabase Auth configuration
