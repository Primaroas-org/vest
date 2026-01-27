import { supabase } from '../config/supabase.js';
import { db } from '../db/index.js';
import { properties, investments, transactions } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { MNT } from '../utils/numeric.js';
import type { DistributeRentRequest, DistributeRentResponse, ErrorResponse, Transaction } from '../types/index.js';

/**
 * POST /admin/distribute-rent
 * Distributes rental income proportionally to all shareholders of a property
 */
export async function distributeRent(req: any, res: any): Promise<void> {
    const { property_id, total_rent }: DistributeRentRequest = req.body;

    try {
        // Validation
        if (!property_id || !total_rent) {
            res.status(400).json({
                success: false,
                error: 'Property ID and total rent amount are required'
            } as ErrorResponse);
            return;
        }

        if (!MNT.isValid(total_rent) || MNT.lt(total_rent, '0.01')) {
            res.status(400).json({
                success: false,
                error: 'Total rent must be a valid positive amount'
            } as ErrorResponse);
            return;
        }

        // 1. Fetch property details
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

        const property = propertyResults[0];

        // 2. Fetch all shareholders (investments) for this property
        const propertyInvestments = await db.query.investments.findMany({
            where: eq(investments.propertyId, property_id),
            with: {
                user: true,
            },
        });

        if (!propertyInvestments || propertyInvestments.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No shareholders found for this property'
            } as ErrorResponse);
            return;
        }

        // 3. Calculate shares owned by investors vs total shares sold
        const totalSharesSold = property.totalShares - property.availableShares;

        if (totalSharesSold === 0) {
            res.status(400).json({
                success: false,
                error: 'No shares have been sold for this property'
            } as ErrorResponse);
            return;
        }

        // 4. Distribute rent proportionally using database transaction
        const { data: result, error: distributionError } = await supabase
            .rpc('distribute_rental_income', {
                p_property_id: property_id,
                p_total_rent: total_rent,
                p_total_shares_sold: totalSharesSold
            });

        if (distributionError) {
            console.error('Rent distribution error:', distributionError);
            res.status(500).json({
                success: false,
                error: 'Failed to distribute rental income'
            } as ErrorResponse);
            return;
        }

        // 5. Fetch the created transactions
        const dividendTransactions = await db
            .select()
            .from(transactions)
            .where(and(
                eq(transactions.propertyId, property_id),
                eq(transactions.transactionType, 'dividend')
            ))
            .orderBy(desc(transactions.createdAt))
            .limit(propertyInvestments.length);

        // Map transactions to expected format
        const mappedTransactions: Transaction[] = dividendTransactions.map(tx => ({
            id: tx.id,
            user_id: tx.userId,
            property_id: tx.propertyId || undefined,
            transaction_type: tx.transactionType as any,
            amount: tx.amount,
            balance_before: tx.balanceBefore,
            balance_after: tx.balanceAfter,
            description: tx.description || undefined,
            metadata: (tx.metadata as Record<string, any>) || {},
            status: tx.status as any,
            created_at: tx.createdAt,
            related_transaction_id: tx.relatedTransactionId || undefined,
        }));

        res.status(200).json({
            success: true,
            message: `Successfully distributed ${MNT.format(total_rent)} to ${propertyInvestments.length} shareholders`,
            data: {
                property_id: property.id,
                property_name: property.name,
                total_rent: total_rent,
                shareholders_count: propertyInvestments.length,
                transactions: mappedTransactions
            }
        } as DistributeRentResponse);

    } catch (error) {
        console.error('Rent distribution error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while distributing rental income'
        } as ErrorResponse);
    }
}
