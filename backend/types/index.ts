// Type definitions for Vest Platform

export type KYCStatus = 'pending' | 'verified' | 'rejected';
export type PropertyStatus = 'draft' | 'active' | 'fully_funded' | 'closed';
export type PropertyType = 'apartment' | 'commercial' | 'mixed';
export type TransactionType = 'deposit' | 'withdrawal' | 'investment' | 'dividend' | 'refund';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

// =====================================================
// USER INTERFACES
// =====================================================

export interface User {
    id: string;
    email: string;
    phone?: string;
    full_name: string;
    e_mongolia_id?: string;
    kyc_status: KYCStatus;
    kyc_verified_at?: Date;
    kyc_data?: Record<string, any>;
    wallet_balance: string; // Stored as string to preserve precision
    created_at: Date;
    updated_at: Date;
    is_active: boolean;
    is_admin: boolean;
}

export interface UserCreateInput {
    email: string;
    phone?: string;
    full_name: string;
    e_mongolia_id?: string;
}

// =====================================================
// PROPERTY INTERFACES
// =====================================================

export interface Property {
    id: string;
    name: string;
    description?: string;
    address: string;
    property_type: PropertyType;
    district?: string;
    latitude?: string;
    longitude?: string;
    total_valuation: string;
    price_per_share: string;
    total_shares: number;
    available_shares: number;
    expected_annual_yield?: string;
    monthly_rent: string;
    images: string[];
    documents: string[];
    status: PropertyStatus;
    created_at: Date;
    updated_at: Date;
    funded_at?: Date;
}

export interface PropertyCreateInput {
    name: string;
    description?: string;
    address: string;
    property_type: PropertyType;
    district?: string;
    total_valuation: string;
    price_per_share: string;
    total_shares: number;
    expected_annual_yield?: string;
    monthly_rent?: string;
}

// =====================================================
// INVESTMENT INTERFACES
// =====================================================

export interface Investment {
    id: string;
    user_id: string;
    property_id: string;
    shares_owned: number;
    purchase_price_per_share: string;
    total_invested: string;
    total_dividends_received: string;
    invested_at: Date;
    updated_at: Date;
}

export interface InvestmentWithProperty extends Investment {
    property: Property;
}

export interface InvestmentCreateInput {
    user_id: string;
    property_id: string;
    shares_owned: number;
    purchase_price_per_share: string;
    total_invested: string;
}

// =====================================================
// TRANSACTION INTERFACES
// =====================================================

export interface Transaction {
    id: string;
    user_id: string;
    property_id?: string;
    transaction_type: TransactionType;
    amount: string;
    balance_before: string;
    balance_after: string;
    description?: string;
    metadata: Record<string, any>;
    status: TransactionStatus;
    created_at: Date;
    related_transaction_id?: string;
}

export interface TransactionCreateInput {
    user_id: string;
    property_id?: string;
    transaction_type: TransactionType;
    amount: string;
    balance_before: string;
    balance_after: string;
    description?: string;
    metadata?: Record<string, any>;
    status?: TransactionStatus;
}

// =====================================================
// API REQUEST/RESPONSE INTERFACES
// =====================================================

export interface InvestRequest {
    property_id: string;
    shares: number;
}

export interface InvestResponse {
    success: boolean;
    message: string;
    data?: {
        investment: Investment;
        transaction: Transaction;
        new_balance: string;
    };
}

export interface PortfolioResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            full_name: string;
            wallet_balance: string;
        };
        investments: PortfolioInvestment[];
        summary: {
            total_invested: string;
            total_current_value: string;
            total_dividends_received: string;
            total_return: string;
            total_return_percentage: string;
        };
    };
}

export interface PortfolioInvestment {
    property_id: string;
    property_name: string;
    property_address: string;
    shares_owned: number;
    total_shares: number;
    ownership_percentage: string;
    purchase_price_per_share: string;
    current_price_per_share: string;
    total_invested: string;
    current_value: string;
    total_dividends_received: string;
    total_return: string;
    total_return_percentage: string;
    expected_annual_yield?: string;
    invested_at: Date;
}

export interface DistributeRentRequest {
    property_id: string;
    total_rent: string;
}

export interface DistributeRentResponse {
    success: boolean;
    message: string;
    data?: {
        property_id: string;
        property_name: string;
        total_rent: string;
        shareholders_count: number;
        transactions: Transaction[];
    };
}

export interface ErrorResponse {
    success: false;
    error: string;
    code?: string;
}

// =====================================================
// UTILITY TYPES
// =====================================================

export interface KYCVerificationResult {
    success: boolean;
    e_mongolia_id: string;
    full_name: string;
    verified: boolean;
    message?: string;
}

// All types are exported above using ES module syntax
