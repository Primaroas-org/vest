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
