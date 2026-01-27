import { supabase } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { User, ErrorResponse } from '../types/index.js';

// Create a service role client for storage operations that bypass RLS
// This is needed because storage uploads require service role key to bypass RLS
const getStorageClient = () => {
    const supabaseUrl = process.env.SUPABASE_URL || 'https://gozlknklxhwvfksnrmvh.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    // Accept both legacy JWT format (eyJ...) and new publishable format (sb_...)
    if (serviceRoleKey && (serviceRoleKey.startsWith('eyJ') || serviceRoleKey.startsWith('sb_'))) {
        return createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });
    }
    
    // Fallback: use the default client (may have RLS issues)
    return supabase;
};

interface KYCSubmissionRequest {
    rd_number: string; // Format: "АА12345678" (2 letters + 8 digits)
    document_type: 'mn_id' | 'passport';
    front_document: string; // Base64 encoded file
    back_document: string; // Base64 encoded file
    selfie: string; // Base64 encoded file
}

interface KYCProgressRequest {
    step: 'entry' | 'rd-number' | 'document-upload' | 'selfie';
    data: {
        rd_number?: string;
        document_type?: 'mn_id' | 'passport';
        front_document?: string; // Base64 or URL
        back_document?: string; // Base64 or URL
        selfie?: string; // Base64 or URL
    };
}

interface KYCSubmissionResponse {
    success: boolean;
    message?: string;
    error?: string;
    data?: {
        kyc_status: string;
        kyc_verified_at?: Date;
    };
}

/**
 * POST /api/kyc/submit
 * Submits KYC verification documents and updates user status
 */
export async function submitKYC(req: any, res: any): Promise<void> {
    console.log('[KYC Controller] submitKYC called');
    const user = req.user as User;
    const { rd_number, document_type, front_document, back_document, selfie }: KYCSubmissionRequest = req.body;

    try {
        // Validation
        if (!rd_number || !document_type || !front_document || !back_document || !selfie) {
            res.status(400).json({
                success: false,
                error: 'All KYC fields are required'
            } as ErrorResponse);
            return;
        }

        // Validate RD number format (2 Cyrillic letters + 8 digits)
        const rdPattern = /^[А-ЯЁ]{2}\d{8}$/;
        if (!rdPattern.test(rd_number)) {
            res.status(400).json({
                success: false,
                error: 'Invalid RD number format. Expected format: АА12345678'
            } as ErrorResponse);
            return;
        }

        // Upload files to Supabase Storage
        const userId = user.id;
        const timestamp = Date.now();

        // Get storage client (with service role key if available to bypass RLS)
        const storageClient = getStorageClient();
        
        // Helper function to upload file
        const uploadFile = async (fileData: string, fileName: string, folder: string): Promise<string | null> => {
            try {
                // Convert base64 to buffer
                const base64Data = fileData.split(',')[1] || fileData;
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Upload to Supabase Storage
                const filePath = `kyc/${userId}/${folder}/${timestamp}_${fileName}`;
                const { data, error } = await storageClient.storage
                    .from('kyc-documents')
                    .upload(filePath, buffer, {
                        contentType: fileName.includes('.pdf') ? 'application/pdf' : 'image/jpeg',
                        upsert: false
                    });

                if (error) {
                    console.error(`Error uploading ${fileName}:`, error);
                    // Check if it's a bucket not found error
                    if (error.message?.includes('Bucket not found') || (error as any).statusCode === '404' || (error as any).status === 404) {
                        console.error(`[KYC] Storage bucket 'kyc-documents' does not exist. Please create it in Supabase Dashboard > Storage.`);
                    }
                    // Check if it's an RLS policy error
                    if (error.message?.includes('row-level security policy') || (error as any).statusCode === '403' || (error as any).status === 403) {
                        console.error(`[KYC] RLS policy blocking upload. You need to either:`);
                        console.error(`  1. Set SUPABASE_SERVICE_ROLE_KEY in .env with your service role key (JWT starting with 'eyJ')`);
                        console.error(`  2. Or configure Storage bucket RLS policies to allow authenticated users to upload to their own folder`);
                    }
                    return null;
                }

                // Get public URL
                const { data: urlData } = storageClient.storage
                    .from('kyc-documents')
                    .getPublicUrl(filePath);

                return urlData.publicUrl;
            } catch (error) {
                console.error(`Error processing ${fileName}:`, error);
                return null;
            }
        };

        // Upload all documents
        const [frontUrl, backUrl, selfieUrl] = await Promise.all([
            uploadFile(front_document, `front_${document_type}.jpg`, 'documents'),
            uploadFile(back_document, `back_${document_type}.jpg`, 'documents'),
            uploadFile(selfie, 'selfie.jpg', 'selfies')
        ]);

        if (!frontUrl || !backUrl || !selfieUrl) {
            res.status(500).json({
                success: false,
                error: 'Failed to upload KYC documents. Please ensure: 1) The "kyc-documents" bucket exists in Supabase Storage, 2) RLS policies allow uploads, or 3) SUPABASE_SERVICE_ROLE_KEY is set in .env. Contact support if the issue persists.'
            } as ErrorResponse);
            return;
        }

        // Prepare KYC data to store in JSONB field
        const kycData = {
            rd_number,
            document_type,
            front_document_url: frontUrl,
            back_document_url: backUrl,
            selfie_url: selfieUrl,
            submitted_at: new Date().toISOString()
        };

        // Update user record with KYC data
        // Note: We'll set status to 'pending' for manual review, or 'verified' if auto-verification passes
        const updatedUsers = await db
            .update(users)
            .set({
                eMongoliaId: rd_number,
                kycData: kycData as any,
                kycStatus: 'pending', // Will be updated to 'verified' after manual/admin review
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning();

        if (!updatedUsers || updatedUsers.length === 0) {
            console.error('Error updating user KYC data: No user found');
            res.status(500).json({
                success: false,
                error: 'Failed to save KYC data. Please try again.'
            } as ErrorResponse);
            return;
        }

        // For now, we'll set status to 'pending' for manual review
        // In production, you might want to call e-Mongolia API here for auto-verification
        // and set status to 'verified' if verification succeeds

        res.status(200).json({
            success: true,
            message: 'KYC documents submitted successfully. Your verification is pending review.',
            data: {
                kyc_status: 'pending',
                kyc_verified_at: undefined
            }
        } as KYCSubmissionResponse);

    } catch (error) {
        console.error('KYC submission error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while submitting your KYC documents'
        } as ErrorResponse);
    }
}

/**
 * POST /api/kyc/save-progress
 * Saves KYC progress so user can resume later
 */
export async function saveKYCProgress(req: any, res: any): Promise<void> {
    const user = req.user as User;
    const { step, data }: KYCProgressRequest = req.body;

    try {
        if (!step || !data) {
            res.status(400).json({
                success: false,
                error: 'Step and data are required'
            } as ErrorResponse);
            return;
        }

        // Get existing KYC progress or create new
        const existingKYCData = user.kyc_data || {};
        const progress = existingKYCData.progress || {};

        // Update progress for current step
        progress[step] = {
            ...data,
            completed_at: new Date().toISOString()
        };
        progress.last_step = step;

        console.log('[KYC Controller] Saving progress for step:', step);
        console.log('[KYC Controller] Existing KYC data:', JSON.stringify(existingKYCData, null, 2));
        console.log('[KYC Controller] New progress data:', JSON.stringify(progress, null, 2));

        const updatedKYCData = {
            ...existingKYCData,
            progress
        };
        
        console.log('[KYC Controller] Full updated kyc_data:', JSON.stringify(updatedKYCData, null, 2));

        // Update user record with progress
        const updatedUsers = await db
            .update(users)
            .set({
                kycData: updatedKYCData as any,
                updatedAt: new Date(),
            })
            .where(eq(users.id, user.id))
            .returning();

        if (!updatedUsers || updatedUsers.length === 0) {
            console.error('[KYC Controller] Error saving KYC progress: No user found');
            res.status(500).json({
                success: false,
                error: 'Failed to save KYC progress'
            } as ErrorResponse);
            return;
        }

        console.log('[KYC Controller] Progress saved successfully for user:', user.id);
        console.log('[KYC Controller] Verified saved kyc_data:', JSON.stringify(updatedUsers[0]?.kycData, null, 2));
        res.status(200).json({
            success: true,
            message: 'KYC progress saved successfully'
        });

    } catch (error) {
        console.error('KYC progress save error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while saving KYC progress'
        } as ErrorResponse);
    }
}

/**
 * GET /api/kyc/progress
 * Gets saved KYC progress for the current user
 */
export async function getKYCProgress(req: any, res: any): Promise<void> {
    const user = req.user as User;

    try {
        // Refetch user from database to get latest kyc_data (req.user might be stale)
        const freshUsers = await db
            .select({ kycData: users.kycData })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);

        if (!freshUsers || freshUsers.length === 0) {
            console.error('[KYC Controller] Error fetching user: User not found');
            res.status(500).json({
                success: false,
                error: 'Failed to fetch user data'
            } as ErrorResponse);
            return;
        }

        const freshUser = freshUsers[0];

        const kycData = (freshUser?.kycData as any) || {};
        const progress = kycData.progress || {};
        
        // Remove 'last_step' from progress count since it's metadata
        const progressKeys = Object.keys(progress).filter(key => key !== 'last_step');
        const hasProgress = progressKeys.length > 0;

        console.log('[KYC Controller] Getting progress for user:', user.id);
        console.log('[KYC Controller] Fresh kyc_data:', JSON.stringify(kycData, null, 2));
        console.log('[KYC Controller] Progress keys:', progressKeys);
        console.log('[KYC Controller] Last step:', progress.last_step);

        res.status(200).json({
            success: true,
            data: {
                progress,
                last_step: progress.last_step || null,
                has_progress: hasProgress
            }
        });

    } catch (error) {
        console.error('KYC progress get error:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while retrieving KYC progress'
        } as ErrorResponse);
    }
}
