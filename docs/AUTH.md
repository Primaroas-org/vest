# Authentication Setup Guide

## Issues Fixed

1. **Login/Signup Forms**: Fixed forms to actually capture and use input values
2. **Error Display**: Added error message display to show authentication errors
3. **Database Sync**: Created trigger to automatically sync Supabase Auth users with the `users` table
4. **Table Mismatch**: Updated AuthContext to use `users` table instead of `profiles`

## Database Setup

### 1. Run the Schema Migration

```bash
pnpm db:migrate
```

### 2. Run Stored Procedures

```bash
pnpm db:functions
```

### 3. Set Up Auth Sync Trigger

This trigger automatically creates a record in the `users` table when a user signs up via Supabase Auth:

```bash
pnpm db:auth-sync
```

### 4. Seed the Database (Optional)

Seed with sample properties:

```bash
pnpm db:seed
```

## Supabase Configuration

### Enable Email Auth Provider

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** > **Providers**
3. Make sure **Email** provider is enabled
4. Configure email templates if needed

### Disable Anonymous Provider (if causing issues)

The error `anonymous_provider_disabled` suggests anonymous signups might be enabled. If you don't need it:

1. Go to **Authentication** > **Providers**
2. Disable **Anonymous** provider if you don't need it

## How It Works

1. **User Signs Up**: User fills out the signup form with email, password, and name
2. **Supabase Auth**: Creates the user in `auth.users` table
3. **Database Trigger**: The `handle_new_user()` trigger automatically creates a corresponding record in the `users` table
4. **Frontend**: The AuthContext fetches the user profile from the `users` table and updates the UI

## Testing

1. Start the frontend: `pnpm dev`
2. Start the backend: `pnpm server:dev`
3. Navigate to the signup page
4. Create an account with:
   - Name
   - Email
   - Password (minimum 6 characters)
5. You should see error messages if something goes wrong
6. On success, you'll be redirected to the dashboard

## Email Confirmation

The app now properly handles email confirmation:

1. **After Signup**: User receives an email with a confirmation link
2. **Clicking the Link**: User is redirected back to the app with authentication tokens
3. **Automatic Login**: The app automatically detects the tokens and logs the user in
4. **Manual Login**: If email isn't confirmed, user will see a helpful error message

### Configure Email Redirect URL

In Supabase Dashboard:
1. Go to **Authentication** > **URL Configuration**
2. Set **Site URL** to your app URL (e.g., `http://localhost:5173` for dev)
3. Add redirect URLs in **Redirect URLs** section:
   - `http://localhost:5173/login` (for development)
   - `https://yourdomain.com/login` (for production)

## Troubleshooting

### "Email not confirmed" Error

If you see this error after confirming your email:
1. **Clear browser cache and cookies** - Sometimes old sessions interfere
2. **Check the confirmation link** - Make sure you clicked the full link from the email
3. **Check Supabase Dashboard** - Go to Authentication > Users and verify the user's email is confirmed
4. **Try logging in again** - After confirmation, the session should be established automatically

### "anonymous_provider_disabled" Error

This means anonymous signups are disabled. Make sure you're using the Email provider for signup.

### User Created in Auth but Not in Users Table

1. Check if the trigger is installed: `pnpm db:auth-sync`
2. Check Supabase logs for trigger errors
3. Manually create the user record if needed

### Can't See Error Messages

- Check browser console for errors
- Make sure the error state is being set correctly in the forms
- Verify the error display component is rendering

### Email Confirmation Not Working

1. **Check Supabase Email Settings**:
   - Go to **Authentication** > **Email Templates**
   - Make sure email confirmation is enabled
   - Check that SMTP is configured (or use Supabase's default)

2. **Check Redirect URL**:
   - The redirect URL in the email must match your app's URL
   - Update in Supabase Dashboard > Authentication > URL Configuration

3. **Check Browser Console**:
   - Look for errors when clicking the confirmation link
   - The app should automatically detect tokens in the URL hash
