# Database Setup Instructions

Since Supabase doesn't allow direct `psql` connections for security reasons, you have two options:

## Option 1: Use Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run each SQL file one by one:

### Step 1: Run Schema
- Copy contents of `schema.sql`
- Paste into SQL Editor
- Click "Run"

### Step 2: Run Stored Procedures
- Copy contents of `migrations/001_stored_procedures.sql`
- Paste into SQL Editor
- Click "Run"

### Step 3: Run Auth Sync Trigger
- Copy contents of `migrations/002_auth_sync_trigger.sql`
- Paste into SQL Editor
- Click "Run"

### Step 4: Seed Data (Optional)
- Copy contents of `supabase/seed.sql`
- Paste into SQL Editor
- Click "Run"

## Option 2: Use Supabase CLI

If you have Supabase CLI installed:

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

## Option 3: Use Direct PostgreSQL Connection

If you have the direct PostgreSQL connection string:

1. Get connection string from Supabase Dashboard:
   - Go to **Settings** > **Database**
   - Copy the **Connection string** (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

2. Add to `.env` file:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

3. Run the scripts:
   ```bash
   pnpm db:migrate
   pnpm db:functions
   pnpm db:auth-sync
   pnpm db:seed
   ```

## Quick Setup Script

You can also use this helper script to copy SQL to clipboard (macOS):

```bash
# Copy schema to clipboard
cat schema.sql | pbcopy
echo "✅ Schema copied to clipboard! Paste it in Supabase SQL Editor."

# Copy migrations
cat migrations/001_stored_procedures.sql | pbcopy
echo "✅ Stored procedures copied to clipboard!"

cat migrations/002_auth_sync_trigger.sql | pbcopy
echo "✅ Auth sync trigger copied to clipboard!"

cat supabase/seed.sql | pbcopy
echo "✅ Seed data copied to clipboard!"
```
