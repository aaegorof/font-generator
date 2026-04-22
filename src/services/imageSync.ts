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
}
