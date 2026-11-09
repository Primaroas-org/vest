import { supabase } from '../config/supabase.js';
import { db } from '../db/index.js';
import { properties, investments, transactions, users } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { MNT } from '../utils/numeric.js';
import type {
    InvestRequest,
    InvestResponse,
    ErrorResponse,
    User,
    Property,
    Investment,
    Transaction
} from '../types/index.js';

/**
 * POST /invest
 * Allows a user to invest in a property by purchasing shares
 */
export async function invest(req: any, res: any): Promise<void> {
    const { property_id, shares, payment_method }: InvestRequest & { payment_method?: string } = req.body;
    const user = req.user as User;
    
    // Note: Currently, all investments use wallet balance regardless of payment_method
    // In the future, payment_method === 'bank' should integrate with payment gateway
    // For now, we validate the payment method but always use wallet
    if (payment_method && payment_method !== 'wallet' && payment_method !== 'bank') {
        res.status(400).json({
            success: false,
            error: 'Invalid payment method'
        } as ErrorResponse);
        return;
    }

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

        // 1. Fetch the property
        const propertyResults = await db
            .select()
            .from(properties)
            .where(eq(properties.id, property_id))
            .limit(1);

        if (!propertyResults || propertyResults.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        const dbProperty = propertyResults[0];
        
        // Map to expected format
        const property: Property = {
            id: dbProperty.id,
            name: dbProperty.name,
            description: dbProperty.description || undefined,
            address: dbProperty.address,
            property_type: dbProperty.propertyType as any,
            district: dbProperty.district || undefined,
            latitude: dbProperty.latitude || undefined,
            longitude: dbProperty.longitude || undefined,
            total_valuation: dbProperty.totalValuation,
            price_per_share: dbProperty.pricePerShare,
            total_shares: dbProperty.totalShares,
            available_shares: dbProperty.availableShares,
            expected_annual_yield: dbProperty.expectedAnnualYield || undefined,
            monthly_rent: dbProperty.monthlyRent ?? '0.00', // column is nullable in schema.sql
            images: (dbProperty.images as any) || [],
            documents: (dbProperty.documents as any) || [],
            status: dbProperty.status as any,
            created_at: dbProperty.createdAt,
            updated_at: dbProperty.updatedAt,
            funded_at: dbProperty.fundedAt || undefined,
        };

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
        if (dbProperty.availableShares < shares) {
            res.status(400).json({
                success: false,
                error: `Insufficient shares available. Only ${dbProperty.availableShares} shares remaining.`,
                code: 'SOLD_OUT'
            } as ErrorResponse);
            return;
        }

        // 4. Calculate total cost
        const totalCost = MNT.multiply(dbProperty.pricePerShare, shares);

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
        // Note: Supabase RPC accepts strings for NUMERIC types, which it will convert
        // Verify we're using service role key (required for RPC functions)
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (serviceKey && !serviceKey.startsWith('eyJ')) {
            console.warn('[Investment] WARNING: Using non-JWT key for RPC call. RPC functions require service role key (JWT starting with "eyJ").');
        }

        const rpcParams = {
            p_user_id: user.id,
            p_property_id: property_id,
            p_shares: shares,
            p_price_per_share: dbProperty.pricePerShare, // Pass as string, Supabase converts to NUMERIC
            p_total_cost: totalCost // Pass as string, Supabase converts to NUMERIC
        };

        console.log('[Investment] Calling process_investment with params:', {
            p_user_id: rpcParams.p_user_id.substring(0, 8) + '...',
            p_property_id: rpcParams.p_property_id.substring(0, 8) + '...',
            p_shares: rpcParams.p_shares,
            p_price_per_share: rpcParams.p_price_per_share,
            p_total_cost: rpcParams.p_total_cost
        });

        const { data: result, error: transactionError } = await supabase
            .rpc('process_investment', rpcParams);

        if (transactionError) {
            // Log full error details for debugging (server-side only)
            console.error('[Investment] Transaction error details:', {
                message: transactionError.message,
                details: transactionError.details,
                hint: transactionError.hint,
                code: transactionError.code,
                fullError: JSON.stringify(transactionError, null, 2)
            });

            // Handle specific errors with user-friendly messages
            if (transactionError.message?.includes('SOLD_OUT') || transactionError.message?.includes('sold out')) {
                res.status(400).json({
                    success: false,
                    error: 'Property shares sold out during transaction',
                    code: 'SOLD_OUT'
                } as ErrorResponse);
                return;
            }

            if (transactionError.message?.includes('INSUFFICIENT_FUNDS') || transactionError.message?.includes('insufficient funds')) {
                res.status(400).json({
                    success: false,
                    error: 'Insufficient funds',
                    code: 'INSUFFICIENT_FUNDS'
                } as ErrorResponse);
                return;
            }

            // Return generic error message to user (hide technical RLS/database errors)
            res.status(500).json({
                success: false,
                error: 'Investment transaction failed. Please try again or contact support if the issue persists.'
            } as ErrorResponse);
            return;
        }

        // 7. Fetch the created records
        const investmentResults = await db
            .select()
            .from(investments)
            .where(and(
                eq(investments.userId, user.id),
                eq(investments.propertyId, property_id)
            ))
            .limit(1);

        const transactionResults = await db
            .select()
            .from(transactions)
            .where(and(
                eq(transactions.userId, user.id),
                eq(transactions.propertyId, property_id),
                eq(transactions.transactionType, 'investment')
            ))
            .orderBy(desc(transactions.createdAt))
            .limit(1);

        // 8. Get updated balance
        const updatedUserResults = await db
            .select({ wallet_balance: users.walletBalance })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        // Map Drizzle results to expected format
        const dbInvestment = investmentResults[0];
        const investment: Investment = dbInvestment ? {
            id: dbInvestment.id,
            user_id: dbInvestment.userId,
            property_id: dbInvestment.propertyId,
            shares_owned: dbInvestment.sharesOwned,
            purchase_price_per_share: dbInvestment.purchasePricePerShare,
            total_invested: dbInvestment.totalInvested,
            total_dividends_received: dbInvestment.totalDividendsReceived,
            invested_at: dbInvestment.investedAt,
            updated_at: dbInvestment.updatedAt,
        } : null as any;

        const dbTransaction = transactionResults[0];
        const transaction: Transaction = dbTransaction ? {
            id: dbTransaction.id,
            user_id: dbTransaction.userId,
            property_id: dbTransaction.propertyId || undefined,
            transaction_type: dbTransaction.transactionType as any,
            amount: dbTransaction.amount,
            balance_before: dbTransaction.balanceBefore,
            balance_after: dbTransaction.balanceAfter,
            description: dbTransaction.description || undefined,
            metadata: (dbTransaction.metadata as Record<string, any>) || {},
            status: dbTransaction.status as any,
            created_at: dbTransaction.createdAt,
            related_transaction_id: dbTransaction.relatedTransactionId || undefined,
        } : null as any;

        res.status(201).json({
            success: true,
            message: `Successfully invested ${MNT.format(totalCost)} in ${property.name}`,
            data: {
                investment: investment,
                transaction: transaction,
                new_balance: updatedUserResults[0]?.wallet_balance || '0.00'
            }
        } as InvestResponse);

    } catch (error) {
        console.error('[Investment] Unexpected error:', error);
        if (error instanceof Error) {
            console.error('[Investment] Error message:', error.message);
            console.error('[Investment] Error stack:', error.stack);
        }
        res.status(500).json({
            success: false,
            error: 'An error occurred while processing your investment',
            details: error instanceof Error ? error.message : 'Unknown error'
        } as ErrorResponse);
    }
}
