# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vest is a fractional real estate investment platform for Mongolia. It enables users to invest in real estate properties by purchasing shares, with KYC verification and e-Mongolia integration. The platform consists of:
- React frontend with TypeScript (Vite)
- Express backend API with TypeScript
- Supabase for authentication and PostgreSQL database
- Row Level Security (RLS) policies for data protection

## Development Commands

### Frontend
```bash
pnpm dev              # Start Vite dev server on port 3001
pnpm build            # Build for production
pnpm preview          # Preview production build
```

### Backend
```bash
pnpm server:dev       # Start backend dev server with tsx watch
pnpm server:build     # Compile TypeScript to dist/
pnpm server:start     # Run compiled server from dist/
```

### Database Setup
Database migrations are managed through Supabase SQL Editor. Commands copy SQL to clipboard (macOS):

```bash
pnpm db:setup         # Show setup instructions
pnpm db:copy-schema   # Copy schema.sql to clipboard
pnpm db:copy-functions # Copy stored procedures to clipboard
pnpm db:copy-auth-sync # Copy auth sync trigger to clipboard
pnpm db:copy-seed     # Copy seed data to clipboard (optional)
```

After copying, paste and run in Supabase Dashboard > SQL Editor. See docs/DATABASE.md for detailed setup instructions.

## Architecture

### Dual-Stack Application Structure

The codebase uses an **unconventional structure** with frontend and backend code at the root level:

- **Frontend**: React components, contexts, and utilities in root (`App.tsx`, `components/`, `contexts/`, `utils/`)
- **Backend**: Express server code in `backend/` directory (`backend/server.ts`, `backend/controllers/`, `backend/middleware/`)
- **Separate TypeScript configs**: `tsconfig.json` (frontend) and `tsconfig.server.json` (backend)

This dual-root structure means:
- Frontend imports use `@/` alias pointing to project root
- Backend uses Node-style ES modules (`.js` extensions in imports)
- No monorepo setup - both stacks share dependencies in single `package.json`

### Authentication Flow

**Dual authentication system** with Supabase Auth and custom database:

1. **Supabase Auth** (`auth.users`): Manages credentials, JWT tokens, email confirmation
2. **Custom Users Table** (`public.users`): Stores additional user data (KYC status, wallet balance, admin flag)
3. **Database Trigger**: `handle_new_user()` automatically creates `users` record when auth signup occurs (see `migrations/002_auth_sync_trigger.sql`)

**Frontend auth** (`contexts/AuthContext.tsx`):
- Uses Supabase client to handle login/signup/logout
- Fetches user profile from `users` table after authentication
- Stores access token in localStorage for API calls
- Handles email confirmation callback from Supabase

**Backend auth** (`backend/middleware/auth.ts`):
- `authenticate`: Verifies JWT from `Authorization: Bearer <token>` header
- `requireKYC`: Ensures user has verified KYC status
- `requireAdmin`: Restricts access to admin users
- Attaches full user object from `users` table to `req.user`

### Database Architecture

**Core Tables**:
- `users`: User profiles with KYC status, wallet balance, e-Mongolia ID
- `properties`: Real estate listings with shares, valuation, rental info
- `investments`: User-property relationships tracking shares owned
- `transactions`: Audit trail for all financial operations

**Key Patterns**:
- All monetary values stored as `NUMERIC(20, 2)` to avoid floating-point errors
- Row Level Security (RLS) policies enforce access control at database level
- Triggers automatically update `updated_at` timestamps and property funding status
- `unique_user_property` constraint ensures one investment record per user-property pair

**Stored Procedures** (see `migrations/001_stored_procedures.sql`):
- `process_investment()`: Atomic transaction for property investment
- `distribute_rental_income()`: Allocate rental income to investors
- `add_wallet_funds()`: Admin function to credit user wallets

### Routing

React Router v7 with nested routes in `App.tsx`:
- `/` - Marketplace view with property listings (paginated)
- `/dashboard/*` - User dashboard (authenticated)
- `/property/:id` - Property detail view
- `/login`, `/signup` - Authentication pages
- `/how-it-works`, `/resources`, `/about`, `/contact`, `/privacy` - Static pages

**Pagination**: Uses URL search params (`?page=N`) to maintain state across navigation.

### State Management

No Redux or Zustand - uses React Context:
- `AuthContext`: User authentication state, login/logout/register functions
- `LanguageContext`: Internationalization (MN/EN switching)

Backend maintains session via JWT tokens; frontend stores in localStorage.

### API Structure

Backend follows RESTful conventions with middleware chaining:

**Public routes**:
- `GET /api/properties` - List active properties
- `GET /api/properties/:id` - Single property details

**Authenticated routes** (require JWT):
- `GET /api/user/me` - Current user profile
- `GET /api/user/transactions` - Transaction history
- `GET /api/dashboard/*` - Dashboard stats, assets, dividends, holdings, performance

**KYC-required routes** (require verified KYC):
- `POST /api/invest` - Invest in property
- `GET /api/portfolio` - User portfolio

**Admin routes** (require admin flag):
- `POST /api/admin/distribute-rent` - Distribute rental income
- `POST /api/admin/properties` - Create property
- `PATCH /api/admin/properties/:id/status` - Update property status
- `POST /api/admin/users/:userId/add-funds` - Credit user wallet

## Configuration

### Environment Variables

**Frontend** (`.env` or `.env.local`):
```
GEMINI_API_KEY=      # Google Gemini API key (defined in vite.config.ts)
```

**Backend** (`.env`):
```
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=        # Optional for direct psql access
```

See `.env.example` for full reference.

### Supabase Configuration

Backend uses **server-side Supabase client** with service role key for admin operations and bypassing RLS when necessary. Frontend uses **anon key** for user-facing operations.

Configuration in `backend/config/supabase.ts` and `utils/supabase.ts`.

**Important**: Email confirmation must be configured in Supabase Dashboard > Authentication > Email Templates with redirect URL set to `{SITE_URL}/login`.

## Key Files

- `App.tsx` - Main application component with routing and layout
- `backend/server.ts` - Express server setup with all route definitions
- `backend/middleware/auth.ts` - Authentication/authorization middleware
- `contexts/AuthContext.tsx` - Frontend authentication state management
- `schema.sql` - Complete database schema with RLS policies
- `migrations/001_stored_procedures.sql` - Database functions for business logic
- `migrations/002_auth_sync_trigger.sql` - Auto-sync Supabase auth to users table

## Important Notes

- **Import extensions**: Backend requires `.js` extensions in imports even for `.ts` files (ES modules)
- **Path aliases**: Frontend uses `@/` for root imports, configured in `vite.config.ts` and `tsconfig.json`
- **No linting/testing**: No test framework or linter configured
- **Mock data**: `App.tsx` contains `mockProperties` array for development - actual data should come from API
- **KYC integration**: e-Mongolia integration stub exists but not fully implemented
- **Financial precision**: Always use `NUMERIC` types for money, never floating-point
