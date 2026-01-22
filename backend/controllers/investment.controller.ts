import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { MNT } from '../utils/numeric';
import {
    InvestRequest,
    InvestResponse,
    ErrorResponse,
    User,
    Property,
    Investment,
    Transaction
} from '../types';

/**
 * POST /invest
 * Allows a user to invest in a property by purchasing shares
 */
export async function invest(req: Request, res: Response): Promise<void> {
    const { property_id, shares }: InvestRequest = req.body;
    const user = req.user as User;

    try {
        // Validation
        if (!property_id || !shares) {
            res.status(400).json({
                success: false,
                error: 'Property ID and shares are required'
            } as ErrorResponse);
            return;
        }

        if (!Number.isInteger(shares) || shares <= 0) {
            res.status(400).json({
                success: false,
                error: 'Shares must be a positive integer'
            } as ErrorResponse);
            return;
        }

        // Begin transaction using Supabase RPC or manual transaction handling
        // Note: Supabase doesn't have built-in transactions in the client library,
        // so we'll use PostgreSQL's row locking with SELECT FOR UPDATE

        // 1. Fetch and lock the property row
        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('*')
            .eq('id', property_id)
            .single();

        if (propertyError || !property) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        // 2. Check property status
        if (property.status !== 'active') {
            res.status(400).json({
                success: false,
                error: 'Property is not available for investment',
                code: 'PROPERTY_NOT_ACTIVE'
            } as ErrorResponse);
            return;
        }

        // 3. Check share availability
        if (property.available_shares < shares) {
            res.status(400).json({
                success: false,
                error: `Insufficient shares available. Only ${property.available_shares} shares remaining.`,
                code: 'SOLD_OUT'
            } as ErrorResponse);
            return;
        }

        // 4. Calculate total cost
        const totalCost = MNT.multiply(property.price_per_share, shares);

        // 5. Check user balance
        if (MNT.lt(user.wallet_balance, totalCost)) {
            res.status(400).json({
                success: false,
                error: `Insufficient funds. Required: ${MNT.format(totalCost)}, Available: ${MNT.format(user.wallet_balance)}`,
                code: 'INSUFFICIENT_FUNDS'
            } as ErrorResponse);
            return;
        }

        // 6. Perform atomic transaction using Supabase RPC function
        // We'll create a stored procedure for this
        const { data: result, error: transactionError } = await supabase
            .rpc('process_investment', {
                p_user_id: user.id,
                p_property_id: property_id,
                p_shares: shares,
                p_price_per_share: property.price_per_share,
                p_total_cost: totalCost
            });

        if (transactionError) {
            console.error('Investment transaction error:', transactionError);

            // Handle specific errors
            if (transactionError.message.includes('SOLD_OUT')) {
                res.status(400).json({
                    success: false,
                    error: 'Property shares sold out during transaction',
                    code: 'SOLD_OUT'
                } as ErrorResponse);
                return;
            }

            if (transactionError.message.includes('INSUFFICIENT_FUNDS')) {
                res.status(400).json({
                    success: false,
                    error: 'Insufficient funds',
                    code: 'INSUFFICIENT_FUNDS'
                } as ErrorResponse);
                return;
            }

            res.status(500).json({
                success: false,
                error: 'Investment transaction failed'
            } as ErrorResponse);
            return;
        }

        // 7. Fetch the created records
        const { data: investment } = await supabase
            .from('investments')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', property_id)
            .single();

        const { data: transaction } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('property_id', property_id)
            .eq('transaction_type', 'investment')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // 8. Get updated balance
        const { data: updatedUser } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('id', user.id)
            .single();

        res.status(201).json({
            success: true,
            message: `Successfully invested ${MNT.format(totalCost)} in ${property.name}`,
            data: {
                investment: investment as Investment,
                transaction: transaction as Transaction,
                new_balance: updatedUser?.wallet_balance || '0.00'
            }
        } as InvestResponse);

    } catch (error) {
        console.error('Investment error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your investment'
        } as ErrorResponse);
    }
}
