import { supabase } from '../config/supabase.js';
import type { User, ErrorResponse } from '../types/index.js';

interface KYCSubmissionRequest {
    rd_number: string; // Format: "АА12345678" (2 letters + 8 digits)
    document_type: 'mn_id' | 'passport';
    front_document: string; // Base64 encoded file
    back_document: string; // Base64 encoded file
    selfie: string; // Base64 encoded file
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

        // Helper function to upload file
        const uploadFile = async (fileData: string, fileName: string, folder: string): Promise<string | null> => {
            try {
                // Convert base64 to buffer
                const base64Data = fileData.split(',')[1] || fileData;
                const buffer = Buffer.from(base64Data, 'base64');
                
                // Upload to Supabase Storage
                const filePath = `kyc/${userId}/${folder}/${timestamp}_${fileName}`;
                const { data, error } = await supabase.storage
                    .from('kyc-documents')
                    .upload(filePath, buffer, {
                        contentType: fileName.includes('.pdf') ? 'application/pdf' : 'image/jpeg',
                        upsert: false
                    });

                if (error) {
                    console.error(`Error uploading ${fileName}:`, error);
                    return null;
                }

                // Get public URL
                const { data: urlData } = supabase.storage
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
                error: 'Failed to upload KYC documents. Please try again.'
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
        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
                e_mongolia_id: rd_number,
                kyc_data: kycData,
                kyc_status: 'pending', // Will be updated to 'verified' after manual/admin review
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating user KYC data:', updateError);
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
