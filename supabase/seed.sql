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
