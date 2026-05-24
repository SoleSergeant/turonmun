import { supabase } from '../integrations/supabase/client';

// File upload utility for Supabase Storage
export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// Allowed file types
const PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const CERTIFICATE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

// Max file sizes (in bytes)
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CERTIFICATE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload photo to Supabase Storage
 * @param file - The photo file to upload
 * @param applicationId - Unique ID for the application
 * @returns Promise with upload result
 */
export const uploadPhoto = async (file: File, applicationId: string): Promise<FileUploadResult> => {
  try {
    // Validate file type
    if (!PHOTO_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid photo format. Please use JPG, PNG, or WebP.'
      };
    }

    // Validate file size
    if (file.size > MAX_PHOTO_SIZE) {
      return {
        success: false,
        error: 'Photo size must be under 5MB.'
      };
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `applications/${applicationId}/photo.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('applications')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (error) {
      console.error('Photo upload error:', error);
      return {
        success: false,
        error: 'Failed to upload photo. Please try again.'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      success: false,
      error: 'Unexpected error during photo upload.'
    };
  }
};

/**
 * Upload certificate/proof document to Supabase Storage
 * @param file - The certificate file to upload
 * @param applicationId - Unique ID for the application
 * @returns Promise with upload result
 */
export const uploadCertificate = async (file: File, applicationId: string): Promise<FileUploadResult> => {
  try {
    // Validate file type
    if (!CERTIFICATE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid certificate format. Please use JPG, PNG, or PDF.'
      };
    }

    // Validate file size
    if (file.size > MAX_CERTIFICATE_SIZE) {
      return {
        success: false,
        error: 'Certificate size must be under 10MB.'
      };
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `applications/${applicationId}/certificate.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('applications')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (error) {
      console.error('Certificate upload error:', error);
      return {
        success: false,
        error: 'Failed to upload certificate. Please try again.'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('Certificate upload error:', error);
    return {
      success: false,
      error: 'Unexpected error during certificate upload.'
    };
  }
};

/**
 * Upload IELTS certificate to Supabase Storage
 * @param file - The IELTS certificate file to upload
 * @param applicationId - Unique ID for the application
 * @returns Promise with upload result
 */
export const uploadIELTSCertificate = async (file: File, applicationId: string): Promise<FileUploadResult> => {
  try {
    // Validate file type
    if (!CERTIFICATE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid IELTS certificate format. Please use JPG, PNG, or PDF.'
      };
    }

    // Validate file size
    if (file.size > MAX_CERTIFICATE_SIZE) {
      return {
        success: false,
        error: 'IELTS certificate size must be under 10MB.'
      };
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `applications/${applicationId}/ielts_certificate.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('applications')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (error) {
      console.error('IELTS certificate upload error:', error);
      return {
        success: false,
        error: 'Failed to upload IELTS certificate. Please try again.'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('IELTS certificate upload error:', error);
    return {
      success: false,
      error: 'Unexpected error during IELTS certificate upload.'
    };
  }
};

/**
 * Upload SAT certificate to Supabase Storage
 * @param file - The SAT certificate file to upload
 * @param applicationId - Unique ID for the application
 * @returns Promise with upload result
 */
export const uploadSATCertificate = async (file: File, applicationId: string): Promise<FileUploadResult> => {
  try {
    // Validate file type
    if (!CERTIFICATE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid SAT certificate format. Please use JPG, PNG, or PDF.'
      };
    }

    // Validate file size
    if (file.size > MAX_CERTIFICATE_SIZE) {
      return {
        success: false,
        error: 'SAT certificate size must be under 10MB.'
      };
    }

    // Get file extension
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
    const fileName = `applications/${applicationId}/sat_certificate.${fileExt}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('applications')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace if exists
      });

    if (error) {
      console.error('SAT certificate upload error:', error);
      return {
        success: false,
        error: 'Failed to upload SAT certificate. Please try again.'
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('applications')
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl
    };

  } catch (error) {
    console.error('SAT certificate upload error:', error);
    return {
      success: false,
      error: 'Unexpected error during SAT certificate upload.'
    };
  }
};

/**
 * Delete file from Supabase Storage
 * @param fileName - Full path of the file to delete
 * @returns Promise with deletion result
 */
export const deleteFile = async (fileName: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.storage
      .from('applications')
      .remove([fileName]);

    if (error) {
      console.error('File deletion error:', error);
      return {
        success: false,
        error: 'Failed to delete file.'
      };
    }

    return { success: true };

  } catch (error) {
    console.error('File deletion error:', error);
    return {
      success: false,
      error: 'Unexpected error during file deletion.'
    };
  }
};

/**
 * Generate unique application ID for file organization
 * @returns Unique string ID
 */
export const generateApplicationId = (): string => {
  return `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}; 