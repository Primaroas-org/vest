import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Import middleware
import { authenticate, requireKYC, requireAdmin } from './middleware/auth.js';

// Import controllers
import { invest } from './controllers/investment.controller.js';
import { getPortfolio } from './controllers/portfolio.controller.js';
import { distributeRent } from './controllers/admin.controller.js';
import { submitKYC, saveKYCProgress, getKYCProgress } from './controllers/kyc.controller.js';
import {
    getDashboardStats,
    getAssets,
    getDividends,
    getHoldings,
    getPerformance,
    getPerformanceGraph,
    getAssetBreakdown
} from './controllers/dashboard.controller.js';

// Import types
import { ErrorResponse } from './types/index.js';

// Initialize Express app
const app: Express = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

// Body parser middleware - increased limit for KYC file uploads (base64 encoded images)
const jsonLimit = '10mb';
const urlEncodedLimit = '10mb';
console.log(`[Server] Body parser limits set: JSON=${jsonLimit}, URL-encoded=${urlEncodedLimit}`);
app.use(express.json({ limit: jsonLimit }));
app.use(express.urlencoded({ extended: true, limit: urlEncodedLimit }));

// Logging middleware
app.use(morgan('combined'));

// Request ID middleware (for tracing)
app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] ||
        `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    next();
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Vest API is running',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get all active properties
app.get('/api/properties', async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { inArray, desc } = await import('drizzle-orm');

        const data = await db
            .select()
            .from(properties)
            .where(inArray(properties.status, ['active', 'fully_funded']))
            .orderBy(desc(properties.createdAt));

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Properties fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get single property details
app.get('/api/properties/:id', async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');

        const data = await db
            .select()
            .from(properties)
            .where(eq(properties.id, req.params.id))
            .limit(1);

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        console.error('Property fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get single property details (admin - includes drafts)
app.get('/api/admin/properties/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');

        const data = await db
            .select()
            .from(properties)
            .where(eq(properties.id, req.params.id))
            .limit(1);

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        console.error('Admin property fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// AUTHENTICATED ROUTES (Require JWT)
// =====================================================

// Get current user profile
app.get('/api/user/me', authenticate, (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        data: {
            id: req.user!.id,
            email: req.user!.email,
            full_name: req.user!.full_name,
            kyc_status: req.user!.kyc_status,
            wallet_balance: req.user!.wallet_balance,
            is_admin: req.user!.is_admin
        }
    });
});

// Get user transaction history
app.get('/api/user/transactions', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { transactions, properties } = await import('./db/schema.js');
        const { eq, desc } = await import('drizzle-orm');
        const { page = 1, limit = 50 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const data = await db.query.transactions.findMany({
            where: eq(transactions.userId, req.user!.id),
            with: {
                property: {
                    columns: {
                        name: true,
                    },
                },
            },
            orderBy: desc(transactions.createdAt),
            limit: Number(limit),
            offset: offset,
        });

        // Get total count
        const countResult = await db
            .select()
            .from(transactions)
            .where(eq(transactions.userId, req.user!.id));
        const count = countResult.length;

        res.status(200).json({
            success: true,
            data: data,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: count
            }
        });
    } catch (error) {
        console.error('Transactions fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// KYC ROUTES (Require Authentication)
// =====================================================

// Save KYC progress (so user can resume later)
app.post('/api/kyc/save-progress', authenticate, saveKYCProgress);

// Get saved KYC progress
app.get('/api/kyc/progress', authenticate, getKYCProgress);

// Submit KYC documents
console.log('[Server] Registering KYC route: POST /api/kyc/submit');
app.post('/api/kyc/submit', (req, res, next) => {
    console.log('[KYC Route] Request received at /api/kyc/submit');
    console.log('[KYC Route] Method:', req.method);
    console.log('[KYC Route] Headers:', req.headers.authorization ? 'Authorization present' : 'No authorization');
    next();
}, authenticate, submitKYC);

// =====================================================
// INVESTMENT ROUTES (Require KYC)
// =====================================================

// Invest in a property
app.post('/api/invest', authenticate, requireKYC, invest);

// Get user portfolio
app.get('/api/portfolio', authenticate, requireKYC, getPortfolio);

// =====================================================
// DASHBOARD ROUTES (Require Authentication)
// =====================================================

// Get dashboard statistics
app.get('/api/dashboard/stats', authenticate, getDashboardStats);

// Get user assets
app.get('/api/dashboard/assets', authenticate, getAssets);

// Get user dividends
app.get('/api/dashboard/dividends', authenticate, getDividends);

// Get user holdings
app.get('/api/dashboard/holdings', authenticate, getHoldings);

// Get user performance
app.get('/api/dashboard/performance', authenticate, getPerformance);

// Get user performance graph data
app.get('/api/dashboard/performance/graph', authenticate, getPerformanceGraph);

// Get asset breakdown by property type
app.get('/api/dashboard/asset-breakdown', authenticate, getAssetBreakdown);

// Get user notifications
app.get('/api/notifications', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { notifications } = await import('./db/schema.js');
        const { eq, and, desc } = await import('drizzle-orm');
        const userId = req.user!.id;
        const { unread_only = false } = req.query;

        let query = db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(desc(notifications.createdAt))
            .limit(50);

        if (unread_only === 'true') {
            const data = await db
                .select()
                .from(notifications)
                .where(and(
                    eq(notifications.userId, userId),
                    eq(notifications.isRead, false)
                ))
                .orderBy(desc(notifications.createdAt))
                .limit(50);
            
            res.status(200).json({
                success: true,
                data: data || []
            });
            return;
        }

        const data = await query;

        res.status(200).json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Notifications fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Mark notification as read
app.patch('/api/notifications/:id/read', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { notifications } = await import('./db/schema.js');
        const { eq, and } = await import('drizzle-orm');
        const userId = req.user!.id;
        const { id } = req.params;

        const data = await db
            .update(notifications)
            .set({ 
                isRead: true, 
                readAt: new Date() 
            })
            .where(and(
                eq(notifications.id, id),
                eq(notifications.userId, userId)
            ))
            .returning();

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Notification not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            data: data[0]
        });
    } catch (error) {
        console.error('Notification update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Mark all notifications as read
app.patch('/api/notifications/read-all', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { notifications } = await import('./db/schema.js');
        const { eq, and } = await import('drizzle-orm');
        const userId = req.user!.id;

        await db
            .update(notifications)
            .set({ 
                isRead: true, 
                readAt: new Date() 
            })
            .where(and(
                eq(notifications.userId, userId),
                eq(notifications.isRead, false)
            ));

        res.status(200).json({
            success: true,
            message: 'All notifications marked as read'
        });
    } catch (error) {
        console.error('Notifications update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// SAVED CARDS ROUTES (Require Authentication)
// =====================================================

// Get user's saved cards
app.get('/api/cards', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { savedCards } = await import('./db/schema.js');
        const { eq, and, desc } = await import('drizzle-orm');
        const userId = req.user!.id;

        const data = await db
            .select()
            .from(savedCards)
            .where(and(
                eq(savedCards.userId, userId),
                eq(savedCards.isActive, true)
            ))
            .orderBy(desc(savedCards.isDefault), desc(savedCards.createdAt));

        res.status(200).json({
            success: true,
            data: data || []
        });
    } catch (error) {
        console.error('Cards fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Add a new saved card
app.post('/api/cards', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = req.user!.id;
        const { bank_name, last_four_digits, card_holder_name, card_type, expiry_month, expiry_year, is_default } = req.body;

        if (!bank_name || !last_four_digits) {
            res.status(400).json({
                success: false,
                error: 'Bank name and last four digits are required'
            } as ErrorResponse);
            return;
        }

        const { db } = await import('./db/index.js');
        const { savedCards } = await import('./db/schema.js');
        
        const data = await db
            .insert(savedCards)
            .values({
                userId: userId,
                bankName: bank_name,
                lastFourDigits: last_four_digits.toString().slice(-4),
                cardHolderName: card_holder_name || null,
                cardType: (card_type || 'debit') as any,
                expiryMonth: expiry_month || null,
                expiryYear: expiry_year || null,
                isDefault: is_default || false,
                isActive: true
            })
            .returning();

        if (!data || data.length === 0) {
            console.error('Error creating card: No data returned');
            res.status(500).json({
                success: false,
                error: 'Failed to save card'
            } as ErrorResponse);
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Card saved successfully',
            data: data[0]
        });
    } catch (error) {
        console.error('Card creation error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Update card (set as default, etc.)
app.patch('/api/cards/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { savedCards } = await import('./db/schema.js');
        const { eq, and } = await import('drizzle-orm');
        const userId = req.user!.id;
        const { id } = req.params;
        const updates: any = {};
        
        // Map snake_case to camelCase
        if (req.body.bank_name) updates.bankName = req.body.bank_name;
        if (req.body.last_four_digits) updates.lastFourDigits = req.body.last_four_digits;
        if (req.body.card_holder_name !== undefined) updates.cardHolderName = req.body.card_holder_name;
        if (req.body.card_type) updates.cardType = req.body.card_type;
        if (req.body.expiry_month !== undefined) updates.expiryMonth = req.body.expiry_month;
        if (req.body.expiry_year !== undefined) updates.expiryYear = req.body.expiry_year;
        if (req.body.is_default !== undefined) updates.isDefault = req.body.is_default;
        if (req.body.is_active !== undefined) updates.isActive = req.body.is_active;

        const data = await db
            .update(savedCards)
            .set(updates)
            .where(and(
                eq(savedCards.id, id),
                eq(savedCards.userId, userId)
            ))
            .returning();

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Card not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Card updated successfully',
            data: data[0]
        });
    } catch (error) {
        console.error('Card update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Delete a saved card
app.delete('/api/cards/:id', authenticate, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { savedCards } = await import('./db/schema.js');
        const { eq, and } = await import('drizzle-orm');
        const userId = req.user!.id;
        const { id } = req.params;

        await db
            .update(savedCards)
            .set({ isActive: false })
            .where(and(
                eq(savedCards.id, id),
                eq(savedCards.userId, userId)
            ));

        res.status(200).json({
            success: true,
            message: 'Card deleted successfully'
        });
    } catch (error) {
        console.error('Card deletion error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// WALLET ROUTES (Require Authentication)
// =====================================================

// Deposit funds to wallet
app.post('/api/wallet/deposit', authenticate, async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('./config/supabase.js');
        const { amount, description } = req.body;
        const userId = req.user!.id;

        if (!amount || parseFloat(amount) <= 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid amount'
            } as ErrorResponse);
            return;
        }

        const { data, error } = await supabase
            .rpc('add_wallet_funds', {
                p_user_id: userId,
                p_amount: amount,
                p_description: description || 'Wallet deposit'
            });

        if (error) {
            console.error('Deposit error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to deposit funds'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Funds deposited successfully',
            data: data
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Withdraw funds from wallet
app.post('/api/wallet/withdraw', authenticate, async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('./config/supabase.js');
        const { amount, description } = req.body;
        const userId = req.user!.id;

        if (!amount || parseFloat(amount) <= 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid amount'
            } as ErrorResponse);
            return;
        }

        // Check user balance
        const { db } = await import('./db/index.js');
        const { users, transactions } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');
        
        const userData = await db
            .select({ walletBalance: users.walletBalance })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!userData || userData.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            } as ErrorResponse);
            return;
        }

        const currentBalance = parseFloat(userData[0].walletBalance);
        const withdrawAmount = parseFloat(amount);

        if (currentBalance < withdrawAmount) {
            res.status(400).json({
                success: false,
                error: 'Insufficient funds'
            } as ErrorResponse);
            return;
        }

        // Perform withdrawal transaction
        const newBalance = currentBalance - withdrawAmount;

        // Update user balance
        await db
            .update(users)
            .set({ walletBalance: newBalance.toString() })
            .where(eq(users.id, userId));

        // Create transaction record
        const transaction = await db
            .insert(transactions)
            .values({
                userId: userId,
                transactionType: 'withdrawal',
                amount: withdrawAmount.toString(),
                balanceBefore: currentBalance.toString(),
                balanceAfter: newBalance.toString(),
                description: description || 'Wallet withdrawal',
                status: 'completed'
            })
            .returning();

        res.status(200).json({
            success: true,
            message: 'Funds withdrawn successfully',
            data: {
                transaction_id: transaction[0]?.id,
                new_balance: newBalance.toString()
            }
        });
    } catch (error) {
        console.error('Withdrawal error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// ADMIN ROUTES (Require Admin Role)
// =====================================================

// Get admin dashboard statistics
app.get('/api/admin/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { users, properties, investments } = await import('./db/schema.js');
        const { eq, sql } = await import('drizzle-orm');

        // Get total assets value (sum of all property valuations)
        const totalAssetsResult = await db.execute(sql`
            SELECT COALESCE(SUM(total_valuation::numeric), 0)::text as total
            FROM properties
            WHERE status = 'active'
        `);

        // Get active investors count (users with verified KYC)
        const activeInvestorsResult = await db.execute(sql`
            SELECT COUNT(*)::int as count
            FROM users
            WHERE kyc_status = 'verified'
        `);

        // Get total capital raised (sum of all investments)
        const totalCapitalResult = await db.execute(sql`
            SELECT COALESCE(SUM(total_invested::numeric), 0)::text as total
            FROM investments
        `);

        // Get average annual yield (average of all active properties)
        const avgYieldResult = await db.execute(sql`
            SELECT COALESCE(AVG(expected_annual_yield::numeric), 0)::numeric as avg
            FROM properties
            WHERE status = 'active' AND expected_annual_yield IS NOT NULL
        `);

        const totalAssets = (totalAssetsResult[0] as any)?.total || '0';
        const activeInvestors = Number((activeInvestorsResult[0] as any)?.count || 0);
        const totalCapital = (totalCapitalResult[0] as any)?.total || '0';
        const avgYield = (avgYieldResult[0] as any)?.avg || 0;

        res.status(200).json({
            success: true,
            data: {
                totalAssetsValue: `₮${(parseFloat(String(totalAssets)) / 1000000000).toFixed(1)}B`,
                activeInvestors: activeInvestors,
                totalCapitalRaised: `₮${(parseFloat(String(totalCapital)) / 1000000).toFixed(0)}M`,
                avgAnnualYield: `${parseFloat(String(avgYield)).toFixed(1)}%`
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get all investors (admin only)
app.get('/api/admin/investors', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { users } = await import('./db/schema.js');
        const { desc, sql } = await import('drizzle-orm');
        const { page = 1, limit = 50 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Get users with their total invested amount using raw SQL for aggregation
        const investorsData = await db.execute(sql`
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.kyc_status,
                u.created_at,
                COALESCE(SUM(i.total_invested::numeric), 0) as total_invested
            FROM users u
            LEFT JOIN investments i ON u.id = i.user_id
            GROUP BY u.id, u.email, u.full_name, u.kyc_status, u.created_at
            ORDER BY u.created_at DESC
            LIMIT ${Number(limit)}
            OFFSET ${offset}
        `);

        // Get total count
        const countResult = await db.execute(sql`SELECT COUNT(*)::int as count FROM users`);
        const total = Number((countResult[0] as any)?.count || 0);

        res.status(200).json({
            success: true,
            data: investorsData.map((row: any) => ({
                id: row.id,
                email: row.email,
                full_name: row.full_name,
                kyc_status: row.kyc_status,
                created_at: row.created_at,
                total_invested: row.total_invested
            })),
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: total
            }
        });
    } catch (error) {
        console.error('Admin investors error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get all transactions (admin only)
app.get('/api/admin/transactions', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { transactions, properties, users, transactionTypeEnum } = await import('./db/schema.js');
        const { desc, eq: eqOp } = await import('drizzle-orm');
        const { limit = 100, type } = req.query;

        // Only filter by a real transaction type; an unknown ?type= is ignored
        const typeFilter = transactionTypeEnum.enumValues.find((t) => t === type);

        const data = await db.query.transactions.findMany({
            where: typeFilter ? eqOp(transactions.transactionType, typeFilter) : undefined,
            with: {
                property: {
                    columns: {
                        name: true,
                    },
                },
                user: {
                    columns: {
                        fullName: true,
                        email: true,
                    },
                },
            },
            orderBy: desc(transactions.createdAt),
            limit: Number(limit),
        });

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Admin transactions error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get all properties (admin only - includes drafts)
app.get('/api/admin/properties', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { desc } = await import('drizzle-orm');

        const data = await db
            .select()
            .from(properties)
            .orderBy(desc(properties.createdAt));

        res.status(200).json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Admin properties error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Distribute rental income
app.post('/api/admin/distribute-rent', authenticate, requireAdmin, distributeRent);

// Scrape listing from unegui.mn
app.post('/api/admin/scrape-listing', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            res.status(400).json({ success: false, error: 'URL is required' });
            return;
        }

        // Only fetch real unegui.mn pages. Checking the parsed hostname (not a substring of the
        // whole URL) stops the server from being pointed at arbitrary hosts.
        let parsedUrl: URL;
        try {
            parsedUrl = new URL(url);
        } catch {
            res.status(400).json({ success: false, error: 'Invalid URL' });
            return;
        }
        const host = parsedUrl.hostname.toLowerCase();
        if (parsedUrl.protocol !== 'https:' || (host !== 'unegui.mn' && !host.endsWith('.unegui.mn'))) {
            res.status(400).json({ success: false, error: 'Only https://unegui.mn URLs are supported' });
            return;
        }

        // One plain request. If the site blocks it, the admin pastes the page HTML instead
        // (handled by /api/admin/parse-listing-html), so we never try to get around the block.
        let html = '';
        try {
            const response = await fetch(parsedUrl, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'mn-MN,mn;q=0.9,en;q=0.8',
                },
                redirect: 'follow',
            });
            if (response.ok) {
                html = await response.text();
            } else {
                console.log(`[Listing import] Fetch returned status ${response.status}`);
            }
        } catch (fetchErr) {
            console.log(`[Listing import] Fetch error: ${(fetchErr as Error).message}`);
        }

        if (!html) {
            res.status(400).json({
                success: false,
                error: 'unegui.mn did not allow the page to be fetched. Please use the manual import option below.'
            });
            return;
        }

        // Extract title - multiple strategies
        let title = '';
        const titlePatterns = [
            /<h1[^>]*>([\s\S]*?)<\/h1>/i,
            /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
            /<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i,
            /<title[^>]*>([\s\S]*?)<\/title>/i,
        ];
        for (const pat of titlePatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                title = m[1].replace(/<[^>]+>/g, '').trim();
                title = title.replace(/\s*[-|–—].*unegui\.mn.*/i, '').trim();
                title = title.replace(/\s*[-|–—]\s*Unegui\.mn.*/i, '').trim();
                if (title.length > 3) break;
            }
        }

        // Extract price - multiple patterns
        let price = '';
        const pricePatterns = [
            /data-price="(\d+)"/,
            /"price"\s*:\s*"?(\d[\d,.]*)"?/,
            /class="[^"]*price[^"]*"[^>]*>([\s\S]*?)</i,
            /(\d[\d\s,.]+)\s*₮/,
            /(\d[\d\s,.]+)\s*сая/i,
        ];
        for (const pat of pricePatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                let rawPrice = m[1].replace(/<[^>]+>/g, '').replace(/\s/g, '').replace(/,/g, '');
                // Handle "сая" (million)
                if (pat.source.includes('сая') && rawPrice) {
                    const num = parseFloat(rawPrice);
                    if (!isNaN(num)) rawPrice = String(num * 1000000);
                }
                if (rawPrice && /^\d+(\.\d+)?$/.test(rawPrice)) {
                    price = rawPrice;
                    break;
                }
            }
        }

        // Extract description
        let description = '';
        const descPatterns = [
            /<div[^>]*class="[^"]*js-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
            /<meta[^>]*content="([^"]+)"[^>]*property="og:description"/i,
            /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
        ];
        for (const pat of descPatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                description = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (description.length > 10) break;
            }
        }

        // Extract location
        let location = '';
        const locPatterns = [
            /Байршил[^:]*:\s*([^<\n]+)/i,
            /Дүүрэг[^:]*:\s*([^<\n]+)/i,
            /Хаяг[^:]*:\s*([^<\n]+)/i,
            /<span[^>]*class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
            /<div[^>]*class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            // Try extracting from breadcrumbs
            /Улаанбаатар[^<]*/i,
        ];
        for (const pat of locPatterns) {
            const m = html.match(pat);
            if (m) {
                const loc = (m[1] || m[0]).replace(/<[^>]+>/g, '').trim();
                if (loc.length > 3 && loc.length < 200) {
                    location = loc;
                    break;
                }
            }
        }

        // Extract images - comprehensive patterns for unegui.mn
        const images: string[] = [];
        const imgPatterns = [
            /data-full="([^"]+)"/g,
            /data-zoom-image="([^"]+)"/g,
            /"big"\s*:\s*"([^"]+)"/g,
            /"original"\s*:\s*"([^"]+)"/g,
            /src="(https?:\/\/[^"]*unegui[^"]*\/original\/[^"]+)"/g,
            /src="(https?:\/\/[^"]*unegui[^"]*\/big\/[^"]+)"/g,
            /href="(https?:\/\/[^"]*unegui[^"]*\/original\/[^"]+)"/g,
            // CDN image patterns
            /src="(https?:\/\/[^"]*cdn[^"]*unegui[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/gi,
            /(https?:\/\/[a-z0-9.-]*unegui\.mn\/[^"'\s]*\.(jpg|jpeg|png|webp))/gi,
        ];
        for (const pattern of imgPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let imgUrl = match[1].replace(/\\\//g, '/');
                // Ensure proper URL
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                if (!images.includes(imgUrl) && imgUrl.startsWith('http') && !imgUrl.includes('logo') && !imgUrl.includes('favicon')) {
                    images.push(imgUrl);
                }
            }
        }

        // Also extract from og:image meta tags
        const ogPatterns = [
            /property="og:image"[^>]*content="([^"]+)"/g,
            /content="([^"]+)"[^>]*property="og:image"/g,
        ];
        for (const pattern of ogPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let imgUrl = match[1].replace(/\\\//g, '/');
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                if (!images.includes(imgUrl) && imgUrl.startsWith('http')) {
                    images.push(imgUrl);
                }
            }
        }

        // Extract additional property details (area, rooms, floor, etc.)
        let details: Record<string, string> = {};
        const detailPatterns = [
            { key: 'area', pattern: /(\d+[\d.]*)\s*м²/i },
            { key: 'rooms', pattern: /(\d+)\s*өрөө/i },
            { key: 'floor', pattern: /(\d+)\s*давхар/i },
        ];
        for (const { key, pattern } of detailPatterns) {
            const m = html.match(pattern);
            if (m && m[1]) details[key] = m[1];
        }

        console.log(`[Scraper] Extracted: title="${title}", price="${price}", images=${images.length}, location="${location}"`);

        res.json({
            success: true,
            data: {
                title,
                price,
                description,
                location,
                images: images.slice(0, 20),
                details,
                source_url: url,
            }
        });
    } catch (error: any) {
        console.error('Scraping error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to scrape listing' });
    }
});

// Parse listing HTML from unegui.mn (when direct scrape is blocked by Cloudflare)
app.post('/api/admin/parse-listing-html', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { html, source_url } = req.body;
        if (!html || typeof html !== 'string') {
            res.status(400).json({ success: false, error: 'HTML content is required' });
            return;
        }

        if (html.length < 100) {
            res.status(400).json({ success: false, error: 'HTML content too short - make sure you copied the full page source' });
            return;
        }

        // Extract title
        let title = '';
        const titlePatterns = [
            /<h1[^>]*>([\s\S]*?)<\/h1>/i,
            /<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i,
            /<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i,
            /<title[^>]*>([\s\S]*?)<\/title>/i,
        ];
        for (const pat of titlePatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                title = m[1].replace(/<[^>]+>/g, '').trim();
                title = title.replace(/\s*[-|–—].*unegui\.mn.*/i, '').trim();
                if (title.length > 3) break;
            }
        }

        // Extract price
        let price = '';
        const pricePatterns = [
            /data-price="(\d+)"/,
            /"price"\s*:\s*"?(\d[\d,.]*)"?/,
            /class="[^"]*price[^"]*"[^>]*>([\s\S]*?)</i,
            /(\d[\d\s,.]+)\s*₮/,
            /(\d[\d\s,.]+)\s*сая/i,
        ];
        for (const pat of pricePatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                let rawPrice = m[1].replace(/<[^>]+>/g, '').replace(/\s/g, '').replace(/,/g, '');
                if (pat.source.includes('сая') && rawPrice) {
                    const num = parseFloat(rawPrice);
                    if (!isNaN(num)) rawPrice = String(num * 1000000);
                }
                if (rawPrice && /^\d+(\.\d+)?$/.test(rawPrice)) {
                    price = rawPrice;
                    break;
                }
            }
        }

        // Extract description
        let description = '';
        const descPatterns = [
            /<div[^>]*class="[^"]*js-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<meta[^>]*property="og:description"[^>]*content="([^"]+)"/i,
            /<meta[^>]*name="description"[^>]*content="([^"]+)"/i,
        ];
        for (const pat of descPatterns) {
            const m = html.match(pat);
            if (m && m[1]) {
                description = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                if (description.length > 10) break;
            }
        }

        // Extract location
        let location = '';
        const locPatterns = [
            /Байршил[^:]*:\s*([^<\n]+)/i,
            /Дүүрэг[^:]*:\s*([^<\n]+)/i,
            /Хаяг[^:]*:\s*([^<\n]+)/i,
            /<span[^>]*class="[^"]*address[^"]*"[^>]*>([\s\S]*?)<\/span>/i,
        ];
        for (const pat of locPatterns) {
            const m = html.match(pat);
            if (m) {
                const loc = (m[1] || m[0]).replace(/<[^>]+>/g, '').trim();
                if (loc.length > 3 && loc.length < 200) { location = loc; break; }
            }
        }

        // Extract images
        const images: string[] = [];
        const imgPatterns = [
            /data-full="([^"]+)"/g,
            /data-zoom-image="([^"]+)"/g,
            /"big"\s*:\s*"([^"]+)"/g,
            /"original"\s*:\s*"([^"]+)"/g,
            /src="(https?:\/\/[^"]*unegui[^"]*\/original\/[^"]+)"/g,
            /src="(https?:\/\/[^"]*unegui[^"]*\/big\/[^"]+)"/g,
            /(https?:\/\/[a-z0-9.-]*unegui\.mn\/[^"'\s]*\.(jpg|jpeg|png|webp))/gi,
        ];
        for (const pattern of imgPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let imgUrl = match[1].replace(/\\\//g, '/');
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                if (!images.includes(imgUrl) && imgUrl.startsWith('http') && !imgUrl.includes('logo') && !imgUrl.includes('favicon')) {
                    images.push(imgUrl);
                }
            }
        }

        // og:image
        const ogPatterns = [
            /property="og:image"[^>]*content="([^"]+)"/g,
            /content="([^"]+)"[^>]*property="og:image"/g,
        ];
        for (const pattern of ogPatterns) {
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let imgUrl = match[1];
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                if (!images.includes(imgUrl) && imgUrl.startsWith('http')) images.push(imgUrl);
            }
        }

        console.log(`[Parser] Extracted: title="${title}", price="${price}", images=${images.length}, location="${location}"`);

        res.json({
            success: true,
            data: {
                title,
                price,
                description,
                location,
                images: images.slice(0, 20),
                source_url: source_url || '',
            }
        });
    } catch (error: any) {
        console.error('HTML parsing error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to parse HTML' });
    }
});

// Create new property (admin only)
app.post('/api/admin/properties', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {

        const {
            name,
            description,
            address,
            property_type,
            district,
            total_valuation,
            price_per_share,
            total_shares,
            expected_annual_yield,
            monthly_rent
        } = req.body;

        // Validation
        if (!name || !address || !property_type || !total_valuation || !price_per_share || !total_shares) {
            res.status(400).json({
                success: false,
                error: 'Missing required fields'
            } as ErrorResponse);
            return;
        }

        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        
        const data = await db
            .insert(properties)
            .values({
                name,
                description: description || null,
                address,
                propertyType: property_type,
                district: district || null,
                totalValuation: total_valuation,
                pricePerShare: price_per_share,
                totalShares: total_shares,
                availableShares: total_shares,
                expectedAnnualYield: expected_annual_yield || null,
                monthlyRent: monthly_rent || '0.00',
                images: req.body.images ? req.body.images : [],
                status: 'draft'
            })
            .returning();

        if (!data || data.length === 0) {
            console.error('Property creation error: No data returned');
            res.status(500).json({
                success: false,
                error: 'Failed to create property'
            } as ErrorResponse);
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: data[0]
        });
    } catch (error) {
        console.error('Property creation error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Update property (admin only)
app.patch('/api/admin/properties/:id', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const {
            name,
            description,
            address,
            property_type,
            district,
            total_valuation,
            price_per_share,
            total_shares,
            expected_annual_yield,
            monthly_rent,
            status
        } = req.body;

        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (address !== undefined) updates.address = address;
        if (property_type !== undefined) updates.propertyType = property_type;
        if (district !== undefined) updates.district = district;
        if (total_valuation !== undefined) updates.totalValuation = total_valuation;
        if (price_per_share !== undefined) updates.pricePerShare = price_per_share;
        if (total_shares !== undefined) {
            updates.totalShares = total_shares;
            // If available_shares wasn't explicitly set, adjust it to maintain consistency
            if (req.body.available_shares === undefined) {
                const existing = await db.select().from(properties).where(eq(properties.id, req.params.id)).limit(1);
                if (existing[0]) {
                    const currentSold = existing[0].totalShares - existing[0].availableShares;
                    updates.availableShares = Math.max(0, total_shares - currentSold);
                }
            }
        }
        if (req.body.available_shares !== undefined) updates.availableShares = req.body.available_shares;
        if (expected_annual_yield !== undefined) updates.expectedAnnualYield = expected_annual_yield;
        if (monthly_rent !== undefined) updates.monthlyRent = monthly_rent;
        if (status !== undefined) {
            if (!['draft', 'active', 'fully_funded', 'closed'].includes(status)) {
                res.status(400).json({
                    success: false,
                    error: 'Invalid status'
                } as ErrorResponse);
                return;
            }
            updates.status = status as any;
        }
        // Handle images array
        if (req.body.images !== undefined) {
            updates.images = req.body.images;
        }
        updates.updatedAt = new Date();
        
        const data = await db
            .update(properties)
            .set(updates)
            .where(eq(properties.id, req.params.id))
            .returning();

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Property updated',
            data: data[0]
        });
    } catch (error) {
        console.error('Property update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Update property status (admin only)
app.patch('/api/admin/properties/:id/status', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        if (!['draft', 'active', 'fully_funded', 'closed'].includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status'
            } as ErrorResponse);
            return;
        }

        const { db } = await import('./db/index.js');
        const { properties } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');
        
        const data = await db
            .update(properties)
            .set({ status: status as any, updatedAt: new Date() })
            .where(eq(properties.id, req.params.id))
            .returning();

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Property status updated',
            data: data[0]
        });
    } catch (error) {
        console.error('Property update error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Get all KYC submissions (admin only)
app.get('/api/admin/kyc', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { db } = await import('./db/index.js');
        const { users } = await import('./db/schema.js');
        const { desc, sql, isNotNull } = await import('drizzle-orm');

        // Get all users with KYC data (those who have submitted KYC)
        const kycData = await db.execute(sql`
            SELECT 
                u.id,
                u.email,
                u.full_name,
                u.kyc_status,
                u.kyc_data,
                u.created_at,
                u.kyc_verified_at,
                u.e_mongolia_id as rd_number
            FROM users u
            WHERE u.kyc_data IS NOT NULL
            ORDER BY u.created_at DESC
        `);

        const submissions = kycData.map((row: any) => {
            const kycData = row.kyc_data || {};
            // Handle both old format (front_document, back_document, selfie) 
            // and new format (front_document_url, back_document_url, selfie_url)
            return {
                id: row.id,
                user_id: row.id,
                user_email: row.email,
                user_name: row.full_name,
                rd_number: row.rd_number || kycData.rd_number || 'N/A',
                document_type: kycData.document_type || 'unknown',
                kyc_status: row.kyc_status,
                kyc_data: {
                    rd_number: kycData.rd_number,
                    document_type: kycData.document_type,
                    front_document: kycData.front_document || kycData.front_document_url || null,
                    back_document: kycData.back_document || kycData.back_document_url || null,
                    selfie: kycData.selfie || kycData.selfie_url || null
                },
                created_at: row.created_at,
                kyc_verified_at: row.kyc_verified_at
            };
        });

        res.status(200).json({
            success: true,
            data: submissions
        });
    } catch (error) {
        console.error('Admin KYC fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Verify user KYC (admin only)
app.post('/api/admin/users/:userId/verify-kyc', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const { status } = req.body; // 'verified' or 'rejected'

        if (!status || !['verified', 'rejected'].includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Status must be "verified" or "rejected"'
            } as ErrorResponse);
            return;
        }

        const { db } = await import('./db/index.js');
        const { users } = await import('./db/schema.js');
        const { eq } = await import('drizzle-orm');

        const updateData: any = {
            kycStatus: status as any,
            updatedAt: new Date(),
        };

        if (status === 'verified') {
            updateData.kycVerifiedAt = new Date();
        } else if (status === 'rejected') {
            updateData.kycVerifiedAt = null;
        }

        const data = await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, userId))
            .returning();

        if (!data || data.length === 0) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: `KYC status updated to ${status}`,
            data: {
                user_id: userId,
                kyc_status: data[0].kycStatus,
                kyc_verified_at: data[0].kycVerifiedAt
            }
        });
    } catch (error) {
        console.error('KYC verification error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// Add funds to user wallet (admin only - for testing/demo purposes)
app.post('/api/admin/users/:userId/add-funds', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const { supabase } = await import('./config/supabase.js');
        const { amount, description } = req.body;
        const { userId } = req.params;

        if (!amount || parseFloat(amount) <= 0) {
            res.status(400).json({
                success: false,
                error: 'Invalid amount'
            } as ErrorResponse);
            return;
        }

        const { data, error } = await supabase
            .rpc('add_wallet_funds', {
                p_user_id: userId,
                p_amount: amount,
                p_description: description || 'Admin deposit'
            });

        if (error) {
            console.error('Add funds error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add funds'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Funds added successfully',
            data: data
        });
    } catch (error) {
        console.error('Add funds error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred'
        } as ErrorResponse);
    }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    } as ErrorResponse);
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    } as ErrorResponse);
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
    console.log(`🚀 Vest API server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

export default app;
