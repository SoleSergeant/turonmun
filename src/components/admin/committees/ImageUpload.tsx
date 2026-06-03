import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageChange: (imageUrl: string) => void;
  onImageRemove: () => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImageUrl, 
  onImageChange, 
  onImageRemove 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Reset loading states when image changes
  useEffect(() => {
    if (currentImageUrl) {
      setIsImageLoading(true);
      setImageError(false);
    }
  }, [currentImageUrl]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Reset states
    setImageError(false);
    setIsImageLoading(true);

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.some(type => file.type === type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a valid image file (JPEG, PNG, WebP, AVIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `Please select an image smaller than 5MB (current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`,
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Create unique filename with better naming
      const fileExt = file.name.split('.').pop();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileName = `committee-${timestamp}-${randomString}.${fileExt}`;
      const filePath = `committees/${fileName}`;

      // Upload to Supabase Storage with progress tracking
      const { data, error } = await supabase.storage
        .from('committees')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(error.message);
      }

      // Get public URL with cache busting
      const { data: { publicUrl } } = supabase.storage
        .from('committees')
        .getPublicUrl(filePath, {
          download: false
        });
      
      // Add timestamp to force cache refresh
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      
      onImageChange(cacheBustedUrl);
      toast({
        title: "Upload Successful",
        description: "Committee image has been uploaded successfully",
      });

    } catch (error: any) {
      console.error('Error uploading file:', error);
      setImageError(true);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extract file path from URL for Supabase storage files
      if (currentImageUrl.includes('supabase.co')) {
        const urlParts = currentImageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `committees/${fileName}`;

        // Delete from storage
        const { error } = await supabase.storage
          .from('committees')
          .remove([filePath]);

        if (error) {
          console.error('Error deleting file:', error);
          // Don't throw error if file doesn't exist
        }
      }

      onImageRemove();
      
      toast({
        title: "Image Removed",
        description: "Committee image has been removed",
      });

    } catch (error: any) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "Failed to remove image from storage",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div
          className={cn(
            'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200',
            isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-gray-300 hover:border-gray-400',
            isUploading && 'opacity-70 pointer-events-none'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          aria-disabled={isUploading}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <div className="text-sm font-medium text-gray-700">Uploading image...</div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-10 w-10 text-gray-400 mb-2" />
              <div className="text-sm text-gray-600">
                <span className="font-medium text-blue-600 hover:text-blue-700">Click to upload</span> or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, WebP, AVIF up to 5MB
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Recommended: 800x450px (16:9)
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/jpeg, image/png, image/webp, image/avif"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </div>
      </div>

      {currentImageUrl && (
        <div className="mt-4 relative group">
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-gray-400 animate-spin" />
              </div>
            )}
            {!imageError ? (
              <>
                <img
                  src={currentImageUrl}
                  alt="Committee preview"
                  className={cn(
                    'w-full h-full object-cover transition-opacity duration-300',
                    isImageLoading ? 'opacity-0' : 'opacity-100'
                  )}
                  onLoad={() => {
                    setIsImageLoading(false);
                    setImageError(false);
                  }}
                  onError={() => {
                    setIsImageLoading(false);
                    setImageError(true);
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageRemove();
                  }}
                  className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-red-500 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-red-50">
                <X className="h-8 w-8 text-red-400 mb-2" />
                <p className="text-sm text-red-600">Failed to load image</p>
                <button
                  type="button"
                  onClick={() => {
                    setIsImageLoading(true);
                    setImageError(false);
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
          {!isImageLoading && !imageError && (
            <div className="mt-1 text-xs text-gray-500 text-right">
              Click to change or drag a new image
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload; 