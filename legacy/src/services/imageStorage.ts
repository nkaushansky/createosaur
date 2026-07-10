import { supabase } from '@/lib/supabase'

export interface ImageUploadResult {
  success: boolean
  publicUrl?: string
  error?: string
}

export class ImageStorageService {
  private static readonly BUCKET_NAME = 'creature-images'

  /**
   * Convert a URL or blob to a File object for upload
   */
  private static async urlToFile(url: string, filename: string): Promise<File> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new File([blob], filename, { type: blob.type || 'image/png' })
    } catch (error) {
      console.error('Error converting URL to file:', error)
      throw new Error('Failed to fetch image from URL')
    }
  }

  /**
   * Generate a unique filename for the image
   */
  private static generateFilename(userId: string, extension: string = 'png'): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8)
    return `${userId}/${timestamp}-${random}.${extension}`
  }

  /**
   * Upload an image to Supabase Storage and return the public URL
   */
  static async uploadImage(
    imageUrl: string, 
    userId: string,
    originalFilename?: string
  ): Promise<ImageUploadResult> {
    try {
      // Check if Supabase is properly configured
      if (!supabase || typeof supabase.storage?.from !== 'function') {
        console.warn('Supabase storage not configured, skipping image upload')
        return {
          success: false,
          error: 'Storage not configured'
        }
      }

      // If the URL is already a permanent URL (not blob or data), return as-is
      if (imageUrl.startsWith('http') && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')) {
        // Check if it's already a Supabase URL
        if (imageUrl.includes('supabase.co')) {
          return {
            success: true,
            publicUrl: imageUrl
          }
        }
      }

      // Generate a unique filename
      const filename = this.generateFilename(userId)
      
      // Convert URL to File
      const file = await this.urlToFile(imageUrl, filename)

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return {
          success: false,
          error: uploadError.message
        }
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filename)

      if (!urlData?.publicUrl) {
        return {
          success: false,
          error: 'Failed to get public URL'
        }
      }

      return {
        success: true,
        publicUrl: urlData.publicUrl
      }

    } catch (error) {
      console.error('Image upload failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!supabase || typeof supabase.storage?.from !== 'function') {
        return false
      }

      // Extract filename from Supabase URL
      const match = imageUrl.match(/\/storage\/v1\/object\/public\/creature-images\/(.+)$/)
      if (!match) {
        return false
      }

      const filename = match[1]
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filename])

      return !error
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  }
}