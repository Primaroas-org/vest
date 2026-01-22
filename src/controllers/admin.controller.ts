import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { MNT } from '../utils/numeric';
import {
    DistributeRentRequest,
    DistributeRentResponse,
    ErrorResponse,
    Transaction
} from '../types';

/**
 * POST /admin/distribute-rent
 * Distributes rental income proportionally to all shareholders of a property
 */
export async function distributeRent(req: Request, res: Response): Promise<void> {
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

        // 2. Fetch all shareholders (investments) for this property
        const { data: investments, error: investmentsError } = await supabase
            .from('investments')
            .select('*, user:users(id, full_name, wallet_balance)')
            .eq('property_id', property_id);

        if (investmentsError) {
            console.error('Investments fetch error:', investmentsError);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch property shareholders'
            } as ErrorResponse);
            return;
        }

        if (!investments || investments.length === 0) {
            res.status(400).json({
                success: false,
                error: 'No shareholders found for this property'
            } as ErrorResponse);
            return;
        }

        // 3. Calculate shares owned by investors vs total shares sold
        const totalSharesSold = property.total_shares - property.available_shares;

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
        const { data: transactions } = await supabase
            .from('transactions')
            .select('*')
            .eq('property_id', property_id)
            .eq('transaction_type', 'dividend')
            .order('created_at', { ascending: false })
            .limit(investments.length);

        res.status(200).json({
            success: true,
            message: `Successfully distributed ${MNT.format(total_rent)} to ${investments.length} shareholders`,
            data: {
                property_id: property.id,
                property_name: property.name,
                total_rent: total_rent,
                shareholders_count: investments.length,
                transactions: transactions as Transaction[]
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
