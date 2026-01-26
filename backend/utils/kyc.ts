import type { KYCVerificationResult } from '../types/index.js';

/**
 * Mock e-Mongolia KYC Verification Function
 *
 * In production, this would integrate with e-Mongolia's actual API
 * to verify citizen identity using their national ID system.
 *
 * For development/testing purposes, this mock function simulates
 * the verification process.
 */
export async function verifyEMongoliaKYC(
    eMongoliaId: string,
    fullName: string
): Promise<KYCVerificationResult> {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock validation logic
    // In production, this would call e-Mongolia's actual verification API

    // Basic format validation (mock format: XX12345678)
    const idPattern = /^[A-Z]{2}\d{8}$/;

    if (!idPattern.test(eMongoliaId)) {
        return {
            success: false,
            e_mongolia_id: eMongoliaId,
            full_name: fullName,
            verified: false,
            message: 'Invalid e-Mongolia ID format. Expected format: XX12345678'
        };
    }

    // Mock: Reject certain test IDs to simulate failed verification
    const rejectedIds = ['XX00000000', 'XX11111111'];
    if (rejectedIds.includes(eMongoliaId)) {
        return {
            success: false,
            e_mongolia_id: eMongoliaId,
            full_name: fullName,
            verified: false,
            message: 'KYC verification failed. Identity could not be verified with e-Mongolia system.'
        };
    }

    // Mock: Name validation (simple check)
    if (!fullName || fullName.trim().length < 3) {
        return {
            success: false,
            e_mongolia_id: eMongoliaId,
            full_name: fullName,
            verified: false,
            message: 'Invalid full name provided'
        };
    }

    // Mock: Successful verification
    return {
        success: true,
        e_mongolia_id: eMongoliaId,
        full_name: fullName,
        verified: true,
        message: 'KYC verification successful'
    };
}

/**
 * Production Integration Guide:
 *
 * To integrate with the real e-Mongolia system:
 *
 * 1. Obtain API credentials from e-Mongolia
 * 2. Install required SDK or use HTTP client
 * 3. Replace this mock function with actual API calls:
 *
 * Example:
 * ```typescript
 * import { EMongoliaClient } from 'e-mongolia-sdk';
 *
 * const client = new EMongoliaClient({
 *     apiKey: process.env.E_MONGOLIA_API_KEY,
 *     apiSecret: process.env.E_MONGOLIA_API_SECRET
 * });
 *
 * export async function verifyEMongoliaKYC(
 *     eMongoliaId: string,
 *     fullName: string
 * ): Promise<KYCVerificationResult> {
 *     try {
 *         const result = await client.verifyIdentity({
 *             citizenId: eMongoliaId,
 *             fullName: fullName
 *         });
 *
 *         return {
 *             success: result.verified,
 *             e_mongolia_id: eMongoliaId,
 *             full_name: fullName,
 *             verified: result.verified,
 *             message: result.message
 *         };
 *     } catch (error) {
 *         return {
 *             success: false,
 *             e_mongolia_id: eMongoliaId,
 *             full_name: fullName,
 *             verified: false,
 *             message: 'KYC verification service unavailable'
 *         };
 *     }
 * }
 * ```
 */
