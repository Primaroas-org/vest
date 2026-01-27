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

// Distribute rental income
app.post('/api/admin/distribute-rent', authenticate, requireAdmin, distributeRent);

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
            .set({ status: status as any })
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
            data: data
        });
    } catch (error) {
        console.error('Property update error:', error);
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
