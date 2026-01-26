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
    getPerformance
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
