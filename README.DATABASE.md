# Database Setup Guide

This guide explains how to set up your Supabase database for the Vest platform.

## Quick Start

The easiest way is to use the Supabase Dashboard SQL Editor:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Open **SQL Editor**
4. Run the SQL files in this order:

### Step 1: Create Schema
```bash
# Copy schema to clipboard (macOS)
pnpm db:copy-schema

# Or manually open schema.sql and copy its contents
# Then paste in Supabase SQL Editor and click "Run"
```

### Step 2: Create Stored Procedures
```bash
pnpm db:copy-functions
# Paste in Supabase SQL Editor and run
```

### Step 3: Set Up Auth Sync Trigger
```bash
pnpm db:copy-auth-sync
# Paste in Supabase SQL Editor and run
```

### Step 4: Seed Sample Data (Optional)
```bash
pnpm db:copy-seed
# Paste in Supabase SQL Editor and run
```

## Using Direct PostgreSQL Connection

If you prefer to use `psql` directly:

### 1. Get Connection String

1. Go to Supabase Dashboard
2. Navigate to **Settings** > **Database**
3. Find **Connection string** section
4. Copy the **URI** format connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your actual database password

### 2. Set Environment Variable

Add to your `.env` file:

```env
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
```

### 3. Run Migrations

```bash
# Run schema
psql $DATABASE_URL -f schema.sql

# Run stored procedures
psql $DATABASE_URL -f migrations/001_stored_procedures.sql

# Run auth sync trigger
psql $DATABASE_URL -f migrations/002_auth_sync_trigger.sql

# Seed data (optional)
psql $DATABASE_URL -f supabase/seed.sql
```

Or use the npm scripts (they'll use DATABASE_URL if set):

```bash
pnpm db:migrate
pnpm db:functions
pnpm db:auth-sync
pnpm db:seed
```

## Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations (if you have them in supabase/migrations folder)
supabase db push
```

## Verification

After running the migrations, verify in Supabase Dashboard:

1. **Table Editor** - Check that these tables exist:
   - `users`
   - `properties`
   - `investments`
   - `transactions`

2. **SQL Editor** - Run this query to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE';
   ```

3. **Database Functions** - Check that these functions exist:
   - `process_investment`
   - `distribute_rental_income`
   - `add_wallet_funds`
   - `handle_new_user`

## Troubleshooting

### "Connection refused" or "Database does not exist"

- Make sure `DATABASE_URL` is set correctly in `.env`
- Verify the connection string from Supabase Dashboard
- Check that your IP is allowed (if using connection pooling)

### "Permission denied" errors

- Make sure you're using the **service role key** or **database password** (not the anon key)
- Check Row Level Security (RLS) policies if querying from the app

### "Function does not exist"

- Make sure you ran `migrations/001_stored_procedures.sql`
- Check that the function was created in the `public` schema

### Trigger not working

- Verify the trigger was created: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Check that the function `handle_new_user()` exists
- Make sure you ran `migrations/002_auth_sync_trigger.sql`

## Next Steps

After database setup:

1. ✅ Configure Supabase Auth (see `README.AUTH.md`)
2. ✅ Set up environment variables (see `.env.example`)
3. ✅ Start the backend server: `pnpm server:dev`
4. ✅ Test authentication flow
