-- Fix for infinite recursion in RLS policies
-- The problem: Admin policies that query the users table cause infinite recursion
-- Solution: Remove admin-specific policies and handle admin checks in backend

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;

-- Create simpler policies without recursion
-- Policy 1: Users can view their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own data
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Users can insert their own data (for auth trigger)
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Note: Admin access will be handled by the backend using service role key
-- which bypasses RLS entirely

-- Fix properties policies too
DROP POLICY IF EXISTS "Admins can manage properties" ON properties;

-- Properties can be managed only via backend (which uses service role key)
-- This policy is kept for clarity but backend bypasses RLS anyway

-- Fix investments policies
DROP POLICY IF EXISTS "Admins can view all investments" ON investments;

-- Fix transactions policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
