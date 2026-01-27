import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { User, KYCStatus } from '../types/index.js';

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

/**
 * Authentication middleware
 * Verifies the JWT token and attaches user to request
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        console.log('[Auth Middleware] Starting authentication');
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[Auth Middleware] Missing or invalid authorization header');
            res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
            return;
        }

        const token = authHeader.substring(7);
        console.log('[Auth Middleware] Token extracted, length:', token.length);

        // Verify token with Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
            console.log('[Auth Middleware] Token verification failed:', authError?.message || 'No auth user');
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }

        console.log('[Auth Middleware] Token verified, user ID:', authUser.id);

        // Fetch full user data from database using Drizzle
        console.log('[Auth Middleware] Querying users table for ID:', authUser.id);
        
        const userResults = await db
            .select()
            .from(users)
            .where(eq(users.id, authUser.id))
            .limit(1);

        console.log('[Auth Middleware] Query result - users found:', userResults?.length || 0);

        if (!userResults || userResults.length === 0) {
            console.log('[Auth Middleware] User not found in database');
            res.status(404).json({
                success: false,
                error: 'User not found in database. Please contact support.'
            });
            return;
        }

        const dbUser = userResults[0];
        console.log('[Auth Middleware] User found:', dbUser.email, 'ID:', dbUser.id);

        console.log('[Auth Middleware] User found, calling next()');

        if (!dbUser.isActive) {
            res.status(403).json({
                success: false,
                error: 'Account is inactive'
            });
            return;
        }

        // Map Drizzle camelCase to snake_case for compatibility with existing types
        const user: User = {
            id: dbUser.id,
            email: dbUser.email,
            phone: dbUser.phone || undefined,
            full_name: dbUser.fullName,
            e_mongolia_id: dbUser.eMongoliaId || undefined,
            kyc_status: dbUser.kycStatus as KYCStatus,
            kyc_verified_at: dbUser.kycVerifiedAt || undefined,
            kyc_data: dbUser.kycData as Record<string, any> || undefined,
            wallet_balance: dbUser.walletBalance,
            created_at: dbUser.createdAt,
            updated_at: dbUser.updatedAt,
            is_active: dbUser.isActive,
            is_admin: dbUser.isAdmin,
        };

        // Attach user to request
        req.user = user;
        console.log('[Auth Middleware] User attached to request, proceeding to route handler');
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({
            success: false,
            error: 'Authentication failed'
        });
    }
}

/**
 * KYC verification middleware
 * Ensures user has completed KYC before accessing certain endpoints
 * Allows 'pending' status (KYC submitted) and 'verified' status
 */
export function requireKYC(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    // Allow access if KYC is pending (submitted) or verified
    // Only block if KYC hasn't been started (null/undefined) or was rejected
    if (!req.user.kyc_status || req.user.kyc_status === 'rejected') {
        res.status(403).json({
            success: false,
            error: req.user.kyc_status === 'rejected' 
                ? 'KYC verification was rejected. Please resubmit your documents.'
                : 'KYC verification required. Please complete your KYC verification to continue.',
            code: 'KYC_NOT_VERIFIED'
        });
        return;
    }

    next();
}

/**
 * Admin authorization middleware
 * Ensures user has admin privileges
 */
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }

    if (!req.user.is_admin) {
        res.status(403).json({
            success: false,
            error: 'Admin privileges required'
        });
        return;
    }

    next();
}
