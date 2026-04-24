import { supabase } from '../lib/supabase'
import { DEFAULT_IMAGES } from '../utils/images'

/**
 * Service for synchronizing images between Zustand store and Supabase
 * Handles URL-based images and metadata (storage paths synced in Story 9.2)
 */
export class ImageSyncService {
  /**
   * Load all images for a user
   */
  static async loadImages(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_images')
        .select('url')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return data.map((row) => row.url)
    } catch (err) {
      console.error('Error loading images:', err)
      throw err
    }
  }

  /**
   * Save a new image
   */
  static async saveImage(userId: string, url: string, storagePath?: string): Promise<void> {
    try {
      // Don't save default images
      if (this.isDefaultImage(url)) {
        return
      }

      // Check if image already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('user_images')
        .select('id')
        .eq('user_id', userId)
        .eq('url', url)
        .maybeSingle()

      if (existing) {
        // Image already exists, skip insert
        return
      }

      const { error } = await supabase.from('user_images').insert({
        user_id: userId,
        url: url,
        storage_path: storagePath || url,
      })

      if (error) throw error
    } catch (err) {
      console.error('Error saving image:', err)
      throw err
    }
  }

  /**
   * Delete an image
   */
  static async deleteImage(userId: string, url: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_images')
        .delete()
        .eq('user_id', userId)
        .eq('url', url)

      if (error) throw error
    } catch (err) {
      console.error('Error deleting image:', err)
      throw err
    }
  }

  /**
   * Check if image is a default image
   */
  private static isDefaultImage(url: string): boolean {
    return DEFAULT_IMAGES.includes(url)
  }

  /**
   * Get storage path from URL
   */
  static getStoragePathFromUrl(url: string): string | null {
    // Extract storage path from Supabase Storage URL
    const match = url.match(/\/storage\/v1\/object\/public\/user-images\/(.+)/)
    return match ? match[1] : null
  }

  /**
   * Upload image file to Supabase Storage
   */
  static async uploadImage(
    userId: string,
    file: File,
  ): Promise<{ url: string; storagePath: string }> {
    try {
      this.validateImageFile(file)

      const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const fileExt = file.name.split('.').pop()
      const storagePath = `${userId}/${imageId}.${fileExt}`

      const { error } = await supabase.storage.from('user-images').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('user-images').getPublicUrl(storagePath)

      return {
        url: urlData.publicUrl,
        storagePath: storagePath,
      }
    } catch (err) {
      console.error('Error uploading image:', err)
      throw err
    }
  }

  /**
   * Delete image file from Storage
   */
  static async deleteImageFile(storagePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from('user-images').remove([storagePath])

      if (error) throw error
    } catch (err) {
      console.error('Error deleting image file:', err)
      throw err
    }
  }

  /**
   * Validate image file
   */
  private static validateImageFile(file: File): void {
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Image file too large (max 10 MB)')
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid image file type (allowed: .jpg, .jpeg, .png, .webp)')
    }
  }

  /**
   * Save image with file
   */
  static async saveImageWithFile(userId: string, file: File): Promise<string> {
    try {
      const { url, storagePath } = await this.uploadImage(userId, file)

      const { error } = await supabase.from('user_images').insert({
        user_id: userId,
        url: url,
        storage_path: storagePath,
      })

      if (error) throw error

      return url
    } catch (err) {
      console.error('Error saving image with file:', err)
      throw err
    }
  }

  /**
   * Delete image with file
   */
  static async deleteImageWithFile(userId: string, url: string): Promise<void> {
    try {
      const { data, error: fetchError } = await supabase
        .from('user_images')
        .select('storage_path')
        .eq('user_id', userId)
        .eq('url', url)
        .single()

      if (fetchError) throw fetchError

      await this.deleteImage(userId, url)

      if (data?.storage_path) {
        await this.deleteImageFile(data.storage_path)
      }
    } catch (err) {
      console.error('Error deleting image with file:', err)
      throw err
    }
  }
}
