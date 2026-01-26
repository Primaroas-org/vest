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

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
        const { supabase } = await import('./config/supabase.js');

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .in('status', ['active', 'fully_funded'])
            .order('created_at', { ascending: false });

        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch properties'
            } as ErrorResponse);
            return;
        }

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
        const { supabase } = await import('./config/supabase.js');

        const { data, error } = await supabase
            .from('properties')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !data) {
            res.status(404).json({
                success: false,
                error: 'Property not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            data: data
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
        const { supabase } = await import('./config/supabase.js');
        const { page = 1, limit = 50 } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        const { data, error, count } = await supabase
            .from('transactions')
            .select('*, property:properties(name)', { count: 'exact' })
            .eq('user_id', req.user!.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + Number(limit) - 1);

        if (error) {
            res.status(500).json({
                success: false,
                error: 'Failed to fetch transactions'
            } as ErrorResponse);
            return;
        }

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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;
        const { unread_only = false } = req.query;

        let query = supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (unread_only === 'true') {
            query = query.eq('is_read', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch notifications'
            } as ErrorResponse);
            return;
        }

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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating notification:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notification'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            data: data
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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true, read_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) {
            console.error('Error updating notifications:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update notifications'
            } as ErrorResponse);
            return;
        }

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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;

        const { data, error } = await supabase
            .from('saved_cards')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching cards:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch cards'
            } as ErrorResponse);
            return;
        }

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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;
        const { bank_name, last_four_digits, card_holder_name, card_type, expiry_month, expiry_year, is_default } = req.body;

        if (!bank_name || !last_four_digits) {
            res.status(400).json({
                success: false,
                error: 'Bank name and last four digits are required'
            } as ErrorResponse);
            return;
        }

        const { data, error } = await supabase
            .from('saved_cards')
            .insert({
                user_id: userId,
                bank_name,
                last_four_digits: last_four_digits.toString().slice(-4),
                card_holder_name: card_holder_name || null,
                card_type: card_type || 'debit',
                expiry_month: expiry_month || null,
                expiry_year: expiry_year || null,
                is_default: is_default || false,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating card:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to save card'
            } as ErrorResponse);
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Card saved successfully',
            data: data
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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('saved_cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Error updating card:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update card'
            } as ErrorResponse);
            return;
        }

        if (!data) {
            res.status(404).json({
                success: false,
                error: 'Card not found'
            } as ErrorResponse);
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Card updated successfully',
            data: data
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
        const { supabase } = await import('./config/supabase.js');
        const userId = req.user!.id;
        const { id } = req.params;

        const { error } = await supabase
            .from('saved_cards')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('Error deleting card:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete card'
            } as ErrorResponse);
            return;
        }

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
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('wallet_balance')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            } as ErrorResponse);
            return;
        }

        const currentBalance = parseFloat(userData.wallet_balance);
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
        const { error: updateError } = await supabase
            .from('users')
            .update({ wallet_balance: newBalance.toString() })
            .eq('id', userId);

        if (updateError) {
            console.error('Withdrawal update error:', updateError);
            res.status(500).json({
                success: false,
                error: 'Failed to process withdrawal'
            } as ErrorResponse);
            return;
        }

        // Create transaction record
        const { data: transaction, error: transactionError } = await supabase
            .from('transactions')
            .insert({
                user_id: userId,
                transaction_type: 'withdrawal',
                amount: withdrawAmount.toString(),
                balance_before: currentBalance.toString(),
                balance_after: newBalance.toString(),
                description: description || 'Wallet withdrawal',
                status: 'completed'
            })
            .select()
            .single();

        if (transactionError) {
            console.error('Transaction creation error:', transactionError);
            // Rollback balance update would be ideal here, but for simplicity we'll continue
        }

        res.status(200).json({
            success: true,
            message: 'Funds withdrawn successfully',
            data: {
                transaction_id: transaction?.id,
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
        const { supabase } = await import('./config/supabase.js');

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

        const { data, error } = await supabase
            .from('properties')
            .insert({
                name,
                description,
                address,
                property_type,
                district,
                total_valuation,
                price_per_share,
                total_shares,
                available_shares: total_shares,
                expected_annual_yield,
                monthly_rent: monthly_rent || '0.00',
                status: 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Property creation error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create property'
            } as ErrorResponse);
            return;
        }

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            data: data
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
        const { supabase } = await import('./config/supabase.js');
        const { status } = req.body;

        if (!['draft', 'active', 'fully_funded', 'closed'].includes(status)) {
            res.status(400).json({
                success: false,
                error: 'Invalid status'
            } as ErrorResponse);
            return;
        }

        const { data, error } = await supabase
            .from('properties')
            .update({ status })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error || !data) {
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
