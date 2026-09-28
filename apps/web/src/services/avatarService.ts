import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const MAX_AVATAR_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

export interface AvatarValidationResult {
  isValid: boolean;
  error?: string;
}

export interface AvatarUploadResult {
  success: boolean;
  avatarUrl?: string;
  error?: string;
}

export interface AvatarRemoveResult {
  success: boolean;
  error?: string;
}

/**
 * Validates the uploaded avatar file format and size.
 */
export function validateAvatarFile(file: File): AvatarValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  const mimeType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const hasValidExt = /\.(jpg|jpeg|png|webp)$/i.test(fileName);
  const hasValidMime = ALLOWED_AVATAR_MIME_TYPES.includes(mimeType);

  if (!hasValidMime && !hasValidExt) {
    return {
      isValid: false,
      error: 'Invalid file format. Please upload a JPG, PNG, or WebP image.',
    };
  }

  if (file.size > MAX_AVATAR_FILE_SIZE) {
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File is too large (${sizeInMb} MB). Maximum allowed size is 5 MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Resizes and center-crops the image to a square 512x512 WebP (or JPEG fallback)
 * using client-side HTML5 Canvas.
 */
export async function optimizeAvatarImage(
  file: File,
  targetSize = 512,
  quality = 0.88
): Promise<{ blob: Blob; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      try {
        const canvas = document.createElement('canvas');
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // If 2D context fails, fall back to original file
          resolve({ blob: file, mimeType: file.type || 'image/jpeg' });
          return;
        }

        // Center-crop calculations to produce a clean 1:1 square
        const minSide = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - minSide) / 2;
        const sy = (img.naturalHeight - minSide) / 2;

        // Smooth scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(
          img,
          sx,
          sy,
          minSide,
          minSide,
          0,
          0,
          targetSize,
          targetSize
        );

        // Export to WebP with high quality
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, mimeType: 'image/webp' });
            } else {
              // WebP export fallback to JPEG
              canvas.toBlob(
                (jpegBlob) => {
                  if (jpegBlob) {
                    resolve({ blob: jpegBlob, mimeType: 'image/jpeg' });
                  } else {
                    resolve({ blob: file, mimeType: file.type || 'image/jpeg' });
                  }
                },
                'image/jpeg',
                quality
              );
            }
          },
          'image/webp',
          quality
        );
      } catch (err) {
        // Fallback to original file on canvas processing failure
        console.warn('Canvas optimization notice, using raw file:', err);
        resolve({ blob: file, mimeType: file.type || 'image/jpeg' });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read the image file. Please try another photo.'));
    };

    img.src = objectUrl;
  });
}

class AvatarService {
  private readonly bucketName = 'profile-avatars';

  /**
   * Uploads and optimizes a user's profile avatar to Supabase Storage,
   * updates the database record in `profiles`, and returns the cache-busted URL.
   */
  async uploadAvatar(userId: string, file: File): Promise<AvatarUploadResult> {
    if (!userId) {
      return { success: false, error: 'User ID is required to upload profile photo.' };
    }

    // 1. Validation
    const validation = validateAvatarFile(file);
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    // 2. Client-side Image Optimization
    let optimizedBlob: Blob;
    let mimeType = 'image/webp';
    try {
      const opt = await optimizeAvatarImage(file, 512, 0.88);
      optimizedBlob = opt.blob;
      mimeType = opt.mimeType;
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to process image file.' };
    }

    // 3. Fallback for demo mode (offline / unconfigured Supabase)
    if (!isSupabaseConfigured()) {
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(optimizedBlob);
        });

        return { success: true, avatarUrl: dataUrl };
      } catch (e: any) {
        return { success: false, error: e?.message || 'Failed to encode avatar in offline mode.' };
      }
    }

    // 4. Upload to Supabase Storage
    try {
      const fileExt = mimeType === 'image/webp' ? 'webp' : 'jpg';
      const storagePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(storagePath, optimizedBlob, {
          contentType: mimeType,
          upsert: true,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // 5. Get Public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(storagePath);

      if (!urlData?.publicUrl) {
        return { success: false, error: 'Failed to retrieve uploaded image URL.' };
      }

      // 6. Cache busting timestamp
      const versionTimestamp = Date.now();
      const publicUrlWithVersion = `${urlData.publicUrl}?v=${versionTimestamp}`;

      // 7. Persist to public.profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrlWithVersion,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('Failed to update avatar_url in profiles table:', dbError);
        return { success: false, error: dbError.message };
      }

      // 8. Update Supabase Auth user metadata non-blockingly
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_url: publicUrlWithVersion,
          },
        });
      } catch {
        // Non-blocking
      }

      return { success: true, avatarUrl: publicUrlWithVersion };
    } catch (err: any) {
      console.error('Avatar upload exception:', err);
      return { success: false, error: err?.message || 'Network error occurred while uploading avatar.' };
    }
  }

  /**
   * Permanently removes the user's profile avatar from Supabase Storage
   * and clears avatar_url in the database.
   */
  async removeAvatar(userId: string): Promise<AvatarRemoveResult> {
    if (!userId) {
      return { success: false, error: 'User ID is required to remove profile photo.' };
    }

    if (!isSupabaseConfigured()) {
      return { success: true };
    }

    try {
      // 1. Remove files from storage
      try {
        await supabase.storage.from(this.bucketName).remove([
          `${userId}/avatar.webp`,
          `${userId}/avatar.jpg`,
          `${userId}/avatar.png`,
        ]);
      } catch (storageErr) {
        console.warn('Storage file deletion notice:', storageErr);
      }

      // 2. Clear avatar_url in public.profiles table
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (dbError) {
        console.error('Failed to clear avatar_url in profiles:', dbError);
        return { success: false, error: dbError.message };
      }

      // 3. Clear avatar_url in Supabase Auth user metadata
      try {
        await supabase.auth.updateUser({
          data: {
            avatar_url: null,
            picture: null,
          },
        });
      } catch {
        // Non-blocking
      }

      return { success: true };
    } catch (err: any) {
      console.error('Avatar removal exception:', err);
      return { success: false, error: err?.message || 'Failed to remove avatar photo.' };
    }
  }
}

export const avatarService = new AvatarService();
