import { supabase } from '../config/supabase.js';
import { MNT } from '../utils/numeric.js';
import type {
    PortfolioResponse,
    PortfolioInvestment,
    ErrorResponse,
    User
} from '../types/index.js';

/**
 * GET /portfolio
 * Returns a user's complete investment portfolio with aggregated data
 */
export async function getPortfolio(req: any, res: any): Promise<void> {
    const user = req.user as User;

    try {
        // Fetch all user investments with property details
        const { data: investments, error: investmentsError } = await supabase
            .from('investments')
            .select(`
                *,
                property:properties (
                    id,
                    name,
                    address,
                    price_per_share,
                    total_shares,
                    expected_annual_yield
                )
            `)
            .eq('user_id', user.id);

        if (investmentsError) {
            console.error('Portfolio fetch error:', investmentsError);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch portfolio data'
            } as ErrorResponse);
            return;
        }

        if (!investments || investments.length === 0) {
            res.status(200).json({
                success: true,
                data: {
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        wallet_balance: user.wallet_balance
                    },
                    investments: [],
                    summary: {
                        total_invested: '0.00',
                        total_current_value: '0.00',
                        total_dividends_received: '0.00',
                        total_return: '0.00',
                        total_return_percentage: '0.00'
                    }
                }
            } as PortfolioResponse);
            return;
        }

        // Calculate portfolio metrics
        let totalInvested = '0.00';
        let totalCurrentValue = '0.00';
        let totalDividendsReceived = '0.00';

        const portfolioInvestments: PortfolioInvestment[] = investments.map((inv: any) => {
            const property = inv.property;

            // Current value = shares_owned * current_price_per_share
            const currentValue = MNT.multiply(property.price_per_share, inv.shares_owned);

            // Ownership percentage = (shares_owned / total_shares) * 100
            const ownershipPercentage = MNT.percentage(
                inv.shares_owned.toString(),
                property.total_shares.toString()
            );

            // Total return = current_value + dividends - invested
            const totalReturn = MNT.add(
                MNT.subtract(currentValue, inv.total_invested),
                inv.total_dividends_received
            );

            // Return percentage = (total_return / total_invested) * 100
            const returnPercentage = MNT.percentage(totalReturn, inv.total_invested);

            // Accumulate totals
            totalInvested = MNT.add(totalInvested, inv.total_invested);
            totalCurrentValue = MNT.add(totalCurrentValue, currentValue);
            totalDividendsReceived = MNT.add(totalDividendsReceived, inv.total_dividends_received);

            return {
                property_id: property.id,
                property_name: property.name,
                property_address: property.address,
                shares_owned: inv.shares_owned,
                total_shares: property.total_shares,
                ownership_percentage: ownershipPercentage,
                purchase_price_per_share: inv.purchase_price_per_share,
                current_price_per_share: property.price_per_share,
                total_invested: inv.total_invested,
                current_value: currentValue,
                total_dividends_received: inv.total_dividends_received,
                total_return: totalReturn,
                total_return_percentage: returnPercentage,
                expected_annual_yield: property.expected_annual_yield,
                invested_at: inv.invested_at
            };
        });

        // Calculate overall portfolio return
        const overallReturn = MNT.add(
            MNT.subtract(totalCurrentValue, totalInvested),
            totalDividendsReceived
        );

        const overallReturnPercentage = MNT.percentage(overallReturn, totalInvested);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    full_name: user.full_name,
                    wallet_balance: user.wallet_balance
                },
                investments: portfolioInvestments,
                summary: {
                    total_invested: totalInvested,
                    total_current_value: totalCurrentValue,
                    total_dividends_received: totalDividendsReceived,
                    total_return: overallReturn,
                    total_return_percentage: overallReturnPercentage
                }
            }
        } as PortfolioResponse);

    } catch (error) {
        console.error('Portfolio error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching your portfolio'
        } as ErrorResponse);
    }
}
