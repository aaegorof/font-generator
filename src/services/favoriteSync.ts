import { supabase } from '../lib/supabase'
import type { FavoriteItem } from '../types'
import type { Json } from '../types/database.types'

/**
 * Service for synchronizing favorites between Zustand store and Supabase
 * Handles full snapshot of tile + settings + textInputs
 */
export class FavoriteSyncService {
  /**
   * Load all favorites for a user from Supabase
   */
  static async loadFavorites(userId: string): Promise<FavoriteItem[]> {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('favorite_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!data || data.length === 0) {
        return []
      }

      return data.map((row) => row.favorite_data as unknown as FavoriteItem)
    } catch (err) {
      console.error('Error loading favorites:', err)
      throw err
    }
  }

  /**
   * Save a new favorite to Supabase
   */
  static async saveFavorite(userId: string, favorite: FavoriteItem): Promise<void> {
    try {
      // Validate favorite data before saving
      this.validateFavorite(favorite)

      const { error } = await supabase.from('user_favorites').insert({
        user_id: userId,
        favorite_data: favorite as unknown as Json,
      })

      if (error) throw error
    } catch (err) {
      console.error('Error saving favorite:', err)
      throw err
    }
  }

  /**
   * Delete a favorite from Supabase
   */
  static async deleteFavorite(userId: string, favoriteId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('favorite_data->id', favoriteId)

      if (error) throw error
    } catch (err) {
      console.error('Error deleting favorite:', err)
      throw err
    }
  }

  /**
   * Validate favorite data structure
   */
  private static validateFavorite(favorite: FavoriteItem): void {
    if (!favorite.id || typeof favorite.id !== 'string') {
      throw new Error('Invalid favorite id')
    }

    if (!favorite.tile || typeof favorite.tile !== 'object') {
      throw new Error('Invalid favorite tile')
    }

    if (!favorite.tile.id || !favorite.tile.imageUrl || !Array.isArray(favorite.tile.fontIds)) {
      throw new Error('Invalid tile data')
    }

    if (!favorite.settings || typeof favorite.settings !== 'object') {
      throw new Error('Invalid favorite settings')
    }

    if (!Array.isArray(favorite.textInputs) || favorite.textInputs.length === 0) {
      throw new Error('Invalid favorite textInputs')
    }

    favorite.textInputs.forEach((textInput) => {
      if (!textInput.id || typeof textInput.text !== 'string') {
        throw new Error('Invalid textInput data')
      }
    })

    if (typeof favorite.savedAt !== 'number') {
      throw new Error('Invalid favorite savedAt timestamp')
    }
  }
}
