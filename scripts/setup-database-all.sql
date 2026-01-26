-- Vest Platform - PostgreSQL Database Schema
-- Fractional Real Estate Investment Platform for Mongolia

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    full_name VARCHAR(255) NOT NULL,

    -- e-Mongolia Integration
    e_mongolia_id VARCHAR(100) UNIQUE,

    -- KYC Status
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
    kyc_verified_at TIMESTAMP WITH TIME ZONE,
    kyc_data JSONB, -- Store additional KYC information

    -- Wallet Balance (stored in MNT as numeric to avoid floating point errors)
    wallet_balance NUMERIC(20, 2) DEFAULT 0.00 CHECK (wallet_balance >= 0),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false
);

-- Index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_e_mongolia_id ON users(e_mongolia_id);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Property Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    property_type VARCHAR(50) NOT NULL, -- apartment, commercial, mixed

    -- Location (for future map integration)
    district VARCHAR(100),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),

    -- Financials (all in MNT)
    total_valuation NUMERIC(20, 2) NOT NULL CHECK (total_valuation > 0),
    price_per_share NUMERIC(20, 2) NOT NULL CHECK (price_per_share > 0),
    total_shares INTEGER NOT NULL CHECK (total_shares > 0),
    available_shares INTEGER NOT NULL CHECK (available_shares >= 0),

    -- Rental Information
    expected_annual_yield NUMERIC(5, 2), -- Stored as percentage (e.g., 8.50 for 8.5%)
    monthly_rent NUMERIC(20, 2) DEFAULT 0.00,

    -- Property Images and Documents
    images JSONB DEFAULT '[]', -- Array of image URLs
    documents JSONB DEFAULT '[]', -- Array of document URLs

    -- Status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'fully_funded', 'closed')),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    funded_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT check_available_shares CHECK (available_shares <= total_shares)
);

-- Indexes
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_district ON properties(district);

-- =====================================================
-- INVESTMENTS TABLE
-- =====================================================
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    -- Investment Details
    shares_owned INTEGER NOT NULL CHECK (shares_owned > 0),
    purchase_price_per_share NUMERIC(20, 2) NOT NULL CHECK (purchase_price_per_share > 0),
    total_invested NUMERIC(20, 2) NOT NULL CHECK (total_invested > 0),

    -- Performance Tracking
    total_dividends_received NUMERIC(20, 2) DEFAULT 0.00,

    -- Metadata
    invested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure unique user-property combinations
    CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);

-- Indexes for faster queries
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_investments_property_id ON investments(property_id);
CREATE INDEX idx_investments_user_property ON investments(user_id, property_id);

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL, -- NULL for deposits

    -- Transaction Details
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'investment', 'dividend', 'refund')),
    amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),

    -- Balance Snapshot (for audit trail)
    balance_before NUMERIC(20, 2) NOT NULL,
    balance_after NUMERIC(20, 2) NOT NULL,

    -- Additional Context
    description TEXT,
    metadata JSONB DEFAULT '{}', -- Store additional transaction data (shares purchased, etc.)

    -- Status
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Reference to related transaction (for reversals)
    related_transaction_id UUID REFERENCES transactions(id)
);

-- Indexes for transaction history and reporting
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_property_id ON transactions(property_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can only view and update their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users" ON users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Properties table policies
-- Everyone can view active properties
CREATE POLICY "Anyone can view active properties" ON properties
    FOR SELECT
    USING (status IN ('active', 'fully_funded') OR auth.uid() IS NOT NULL);

-- Only admins can insert/update/delete properties
CREATE POLICY "Admins can manage properties" ON properties
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Investments table policies
-- Users can only view their own investments
CREATE POLICY "Users can view own investments" ON investments
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own investments (via application logic)
CREATE POLICY "Users can create own investments" ON investments
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all investments
CREATE POLICY "Admins can view all investments" ON investments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- Transactions table policies
-- Users can only view their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own transactions (via application logic)
CREATE POLICY "Users can create own transactions" ON transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid() AND users.is_admin = true
        )
    );

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update property status when fully funded
CREATE OR REPLACE FUNCTION check_property_funding_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.available_shares = 0 AND OLD.available_shares > 0 THEN
        NEW.status = 'fully_funded';
        NEW.funded_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_property_funding_status BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION check_property_funding_status();

-- =====================================================
-- SEED DATA (Optional - for development)
-- =====================================================

-- Insert a sample admin user (you should change this in production)
-- INSERT INTO users (id, email, full_name, kyc_status, wallet_balance, is_admin)
-- VALUES (
--     uuid_generate_v4(),
--     'admin@vest.mn',
--     'Admin User',
--     'verified',
--     0.00,
--     true
-- );

-- Insert sample properties (for testing)
-- INSERT INTO properties (name, description, address, property_type, total_valuation, price_per_share, total_shares, available_shares, expected_annual_yield, status)
-- VALUES
-- (
--     'Central Tower Apartment 501',
--     'Luxury 2-bedroom apartment in the heart of Ulaanbaatar',
--     'Central Tower, Sukhbaatar District, Ulaanbaatar',
--     'apartment',
--     500000000.00, -- 500M MNT
--     500000.00,     -- 500K MNT per share
--     1000,          -- 1000 shares
--     1000,          -- All available
--     8.50,          -- 8.5% expected yield
--     'active'
-- );
-- Stored Procedures for Vest Platform
-- These functions ensure atomic transactions for critical operations

-- =====================================================
-- FUNCTION: Process Investment Transaction
-- =====================================================
CREATE OR REPLACE FUNCTION process_investment(
    p_user_id UUID,
    p_property_id UUID,
    p_shares INTEGER,
    p_price_per_share NUMERIC(20, 2),
    p_total_cost NUMERIC(20, 2)
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_balance NUMERIC(20, 2);
    v_available_shares INTEGER;
    v_property_name VARCHAR(255);
    v_balance_after NUMERIC(20, 2);
    v_investment_id UUID;
    v_transaction_id UUID;
    v_existing_investment RECORD;
BEGIN
    -- Lock user row for update
    SELECT wallet_balance INTO v_user_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    -- Lock property row for update
    SELECT available_shares, name INTO v_available_shares, v_property_name
    FROM properties
    WHERE id = p_property_id
    FOR UPDATE;

    -- Check share availability
    IF v_available_shares < p_shares THEN
        RAISE EXCEPTION 'SOLD_OUT: Only % shares available', v_available_shares;
    END IF;

    -- Check user balance
    IF v_user_balance < p_total_cost THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Balance %.2f, Required %.2f', v_user_balance, p_total_cost;
    END IF;

    -- Calculate new balance
    v_balance_after := v_user_balance - p_total_cost;

    -- Update user balance
    UPDATE users
    SET wallet_balance = v_balance_after,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Update property available shares
    UPDATE properties
    SET available_shares = available_shares - p_shares,
        updated_at = NOW()
    WHERE id = p_property_id;

    -- Check if investment already exists for this user-property combination
    SELECT * INTO v_existing_investment
    FROM investments
    WHERE user_id = p_user_id AND property_id = p_property_id;

    IF v_existing_investment IS NOT NULL THEN
        -- Update existing investment
        UPDATE investments
        SET shares_owned = shares_owned + p_shares,
            total_invested = total_invested + p_total_cost,
            updated_at = NOW()
        WHERE id = v_existing_investment.id
        RETURNING id INTO v_investment_id;
    ELSE
        -- Create new investment record
        INSERT INTO investments (
            user_id,
            property_id,
            shares_owned,
            purchase_price_per_share,
            total_invested
        ) VALUES (
            p_user_id,
            p_property_id,
            p_shares,
            p_price_per_share,
            p_total_cost
        )
        RETURNING id INTO v_investment_id;
    END IF;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        property_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        metadata,
        status
    ) VALUES (
        p_user_id,
        p_property_id,
        'investment',
        p_total_cost,
        v_user_balance,
        v_balance_after,
        'Investment in ' || v_property_name,
        json_build_object(
            'shares', p_shares,
            'price_per_share', p_price_per_share
        ),
        'completed'
    )
    RETURNING id INTO v_transaction_id;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'investment_id', v_investment_id,
        'transaction_id', v_transaction_id,
        'new_balance', v_balance_after
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in PostgreSQL for failed transactions
        RAISE;
END;
$$;

-- =====================================================
-- FUNCTION: Distribute Rental Income
-- =====================================================
CREATE OR REPLACE FUNCTION distribute_rental_income(
    p_property_id UUID,
    p_total_rent NUMERIC(20, 2),
    p_total_shares_sold INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_investment RECORD;
    v_dividend_amount NUMERIC(20, 2);
    v_user_balance NUMERIC(20, 2);
    v_new_balance NUMERIC(20, 2);
    v_property_name VARCHAR(255);
    v_transactions_count INTEGER := 0;
BEGIN
    -- Get property name
    SELECT name INTO v_property_name
    FROM properties
    WHERE id = p_property_id;

    -- Loop through all shareholders
    FOR v_investment IN
        SELECT id, user_id, shares_owned, total_dividends_received
        FROM investments
        WHERE property_id = p_property_id
        FOR UPDATE
    LOOP
        -- Calculate proportional dividend
        -- dividend = (shares_owned / total_shares_sold) * total_rent
        v_dividend_amount := ROUND((v_investment.shares_owned::NUMERIC / p_total_shares_sold::NUMERIC) * p_total_rent, 2);

        -- Get current user balance
        SELECT wallet_balance INTO v_user_balance
        FROM users
        WHERE id = v_investment.user_id
        FOR UPDATE;

        -- Calculate new balance
        v_new_balance := v_user_balance + v_dividend_amount;

        -- Update user wallet balance
        UPDATE users
        SET wallet_balance = v_new_balance,
            updated_at = NOW()
        WHERE id = v_investment.user_id;

        -- Update investment dividends received
        UPDATE investments
        SET total_dividends_received = total_dividends_received + v_dividend_amount,
            updated_at = NOW()
        WHERE id = v_investment.id;

        -- Create dividend transaction
        INSERT INTO transactions (
            user_id,
            property_id,
            transaction_type,
            amount,
            balance_before,
            balance_after,
            description,
            metadata,
            status
        ) VALUES (
            v_investment.user_id,
            p_property_id,
            'dividend',
            v_dividend_amount,
            v_user_balance,
            v_new_balance,
            'Rental dividend from ' || v_property_name,
            json_build_object(
                'shares_owned', v_investment.shares_owned,
                'total_rent', p_total_rent
            ),
            'completed'
        );

        v_transactions_count := v_transactions_count + 1;
    END LOOP;

    -- Return success response
    RETURN json_build_object(
        'success', true,
        'transactions_created', v_transactions_count,
        'total_distributed', p_total_rent
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Rollback is automatic in PostgreSQL for failed transactions
        RAISE;
END;
$$;

-- =====================================================
-- FUNCTION: Add Funds to User Wallet
-- =====================================================
CREATE OR REPLACE FUNCTION add_wallet_funds(
    p_user_id UUID,
    p_amount NUMERIC(20, 2),
    p_description TEXT DEFAULT 'Wallet deposit'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_balance NUMERIC(20, 2);
    v_new_balance NUMERIC(20, 2);
    v_transaction_id UUID;
BEGIN
    -- Validate amount
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be positive';
    END IF;

    -- Lock user row
    SELECT wallet_balance INTO v_current_balance
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_current_balance IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- Calculate new balance
    v_new_balance := v_current_balance + p_amount;

    -- Update user balance
    UPDATE users
    SET wallet_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_user_id;

    -- Create transaction record
    INSERT INTO transactions (
        user_id,
        transaction_type,
        amount,
        balance_before,
        balance_after,
        description,
        status
    ) VALUES (
        p_user_id,
        'deposit',
        p_amount,
        v_current_balance,
        v_new_balance,
        p_description,
        'completed'
    )
    RETURNING id INTO v_transaction_id;

    RETURN json_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'new_balance', v_new_balance
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;
-- Trigger to automatically create user record when Supabase auth user is created
-- This ensures that when a user signs up via Supabase Auth, a corresponding record
-- is created in the users table

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, wallet_balance, kyc_status, is_active, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    '0.00',
    'pending',
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Create trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow users to insert their own record (backup policy, though SECURITY DEFINER should handle it)
DROP POLICY IF EXISTS "Users can insert own data" ON users;
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);
-- Vest Platform - Seed Data
-- This script seeds the database with initial data for development/testing

-- =====================================================
-- SAMPLE USERS
-- =====================================================

-- Note: These are sample users. In production, users are created via Supabase Auth
-- and synced to the users table via the handle_new_user() trigger.

-- Sample admin user (you'll need to create this user in Supabase Auth first)
-- Then update the UUID below to match the auth user's ID
-- INSERT INTO users (id, email, full_name, kyc_status, wallet_balance, is_admin, is_active)
-- VALUES (
--     '00000000-0000-0000-0000-000000000001', -- Replace with actual auth user ID
--     'admin@vest.mn',
--     'Admin User',
--     'verified',
--     1000000.00, -- 1M MNT
--     true,
--     true
-- );

-- =====================================================
-- SAMPLE PROPERTIES
-- =====================================================

INSERT INTO properties (
    name,
    description,
    address,
    property_type,
    district,
    total_valuation,
    price_per_share,
    total_shares,
    available_shares,
    expected_annual_yield,
    monthly_rent,
    status,
    images
) VALUES
(
    'Central Tower Apartment 501',
    'Luxury 2-bedroom apartment in the heart of Ulaanbaatar with stunning city views. Fully furnished and ready for rental.',
    'Central Tower, Sukhbaatar District, Ulaanbaatar',
    'apartment',
    'Sukhbaatar',
    500000000.00, -- 500M MNT
    500000.00,     -- 500K MNT per share
    1000,          -- 1000 shares
    1000,          -- All available
    8.50,          -- 8.5% expected yield
    3500000.00,    -- 3.5M MNT monthly rent
    'active',
    '[]'::jsonb
),
(
    'Bayangol Commercial Complex',
    'Modern commercial space in Bayangol district, ideal for retail and office use. High foot traffic area.',
    'Bayangol District, Ulaanbaatar',
    'commercial',
    'Bayangol',
    1200000000.00, -- 1.2B MNT
    1000000.00,    -- 1M MNT per share
    1200,          -- 1200 shares
    1200,          -- All available
    9.00,          -- 9% expected yield
    9000000.00,    -- 9M MNT monthly rent
    'active',
    '[]'::jsonb
),
(
    'Khan-Uul Mixed Development',
    'Mixed-use development with residential and commercial units. Prime location with excellent growth potential.',
    'Khan-Uul District, Ulaanbaatar',
    'mixed',
    'Khan-Uul',
    800000000.00, -- 800M MNT
    400000.00,    -- 400K MNT per share
    2000,         -- 2000 shares
    2000,         -- All available
    7.75,         -- 7.75% expected yield
    5166666.67,   -- ~5.17M MNT monthly rent
    'active',
    '[]'::jsonb
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- NOTES
-- =====================================================

-- To seed with actual users:
-- 1. Create users via Supabase Auth (signup/login)
-- 2. The handle_new_user() trigger will automatically create records in the users table
-- 3. You can then update their wallet_balance, kyc_status, etc. as needed

-- To create an admin user:
-- 1. Sign up a user via the app
-- 2. Note their user ID from Supabase Auth
-- 3. Update the users table:
--    UPDATE users SET is_admin = true WHERE id = 'user-id-here';
