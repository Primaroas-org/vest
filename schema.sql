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
