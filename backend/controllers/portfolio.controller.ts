import { db } from '../db/index.js';
import { investments, properties } from '../db/schema.js';
import { eq } from 'drizzle-orm';
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
        // Fetch all user investments with property details using Drizzle relations
        const userInvestments = await db.query.investments.findMany({
            where: eq(investments.userId, user.id),
            with: {
                property: true,
            },
        });

        if (!userInvestments || userInvestments.length === 0) {
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

        const portfolioInvestments: PortfolioInvestment[] = userInvestments.map((inv) => {
            const property = inv.property;
            // total_dividends_received is nullable in schema.sql; treat a missing value as zero
            const dividendsReceived = inv.totalDividendsReceived ?? '0.00';

            // Current value = shares_owned * current_price_per_share
            const currentValue = MNT.multiply(property.pricePerShare, inv.sharesOwned.toString());

            // Ownership percentage = (shares_owned / total_shares) * 100
            const ownershipPercentage = MNT.percentage(
                inv.sharesOwned.toString(),
                property.totalShares.toString()
            );

            // Total return = current_value + dividends - invested
            const totalReturn = MNT.add(
                MNT.subtract(currentValue, inv.totalInvested),
                dividendsReceived
            );

            // Return percentage = (total_return / total_invested) * 100
            const returnPercentage = MNT.percentage(totalReturn, inv.totalInvested);

            // Accumulate totals
            totalInvested = MNT.add(totalInvested, inv.totalInvested);
            totalCurrentValue = MNT.add(totalCurrentValue, currentValue);
            totalDividendsReceived = MNT.add(totalDividendsReceived, dividendsReceived);

            return {
                property_id: property.id,
                property_name: property.name,
                property_address: property.address,
                shares_owned: inv.sharesOwned,
                total_shares: property.totalShares,
                ownership_percentage: ownershipPercentage,
                purchase_price_per_share: inv.purchasePricePerShare,
                current_price_per_share: property.pricePerShare,
                total_invested: inv.totalInvested,
                current_value: currentValue,
                total_dividends_received: dividendsReceived,
                total_return: totalReturn,
                total_return_percentage: returnPercentage,
                expected_annual_yield: property.expectedAnnualYield || undefined,
                invested_at: inv.investedAt
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
