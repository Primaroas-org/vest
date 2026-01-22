import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { User } from '../types';

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
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Missing or invalid authorization header'
            });
            return;
        }

        const token = authHeader.substring(7);

        // Verify token with Supabase
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !authUser) {
            res.status(401).json({
                success: false,
                error: 'Invalid or expired token'
            });
            return;
        }

        // Fetch full user data from database
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single();

        if (userError || !user) {
            res.status(404).json({
                success: false,
                error: 'User not found'
            });
            return;
        }

        if (!user.is_active) {
            res.status(403).json({
                success: false,
                error: 'Account is inactive'
            });
            return;
        }

        // Attach user to request
        req.user = user;
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

    if (req.user.kyc_status !== 'verified') {
        res.status(403).json({
            success: false,
            error: 'KYC verification required',
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
