-- =====================================================
-- SAVED CARDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Card Details (masked for security)
    card_type VARCHAR(20) DEFAULT 'debit' CHECK (card_type IN ('debit', 'credit')),
    bank_name VARCHAR(100) NOT NULL,
    last_four_digits VARCHAR(4) NOT NULL,
    card_holder_name VARCHAR(255),
    
    -- Card Metadata
    is_default BOOLEAN DEFAULT false,
    expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
    expiry_year INTEGER CHECK (expiry_year >= 2024),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_id ON saved_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_cards_user_active ON saved_cards(user_id, is_active);

-- Row Level Security
ALTER TABLE saved_cards ENABLE ROW LEVEL SECURITY;

-- Users can only view their own cards
CREATE POLICY "Users can view own cards" ON saved_cards
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own cards
CREATE POLICY "Users can create own cards" ON saved_cards
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own cards
CREATE POLICY "Users can update own cards" ON saved_cards
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own cards
CREATE POLICY "Users can delete own cards" ON saved_cards
    FOR DELETE
    USING (auth.uid() = user_id);

-- Function to ensure only one default card per user
CREATE OR REPLACE FUNCTION ensure_single_default_card()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset other default cards for this user
        UPDATE saved_cards
        SET is_default = false
        WHERE user_id = NEW.user_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_single_default_card
    BEFORE INSERT OR UPDATE ON saved_cards
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_card();
