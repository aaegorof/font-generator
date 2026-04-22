import { supabase } from '../lib/supabase'
import type { FontDef } from '../types'
import { DEFAULT_FONTS } from '../utils/fonts'

/**
 * Service for synchronizing fonts between Zustand store and Supabase
 * Handles Google Fonts, local fonts, and uploaded fonts
 */
export class FontSyncService {
  /**
   * Load all fonts for a user from Supabase
   */
  static async loadFonts(userId: string): Promise<FontDef[]> {
    try {
      const { data, error } = await supabase
        .from('user_fonts')
        .select('font_def, storage_path')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        return []
      }

      return data.map((row) => {
        const fontDef = row.font_def as FontDef
        return {
          ...fontDef,
          uploadUrl: row.storage_path ? this.getStorageUrl(row.storage_path) : fontDef.uploadUrl,
        }
      })
    } catch (err) {
      console.error('Error loading fonts:', err)
      throw err
    }
  }

  /**
   * Save a new font to Supabase
   */
  static async saveFont(userId: string, font: FontDef): Promise<void> {
    try {
      // Don't save default fonts
      if (this.isDefaultFont(font)) {
        return
      }

      const { error } = await supabase.from('user_fonts').insert({
        user_id: userId,
        font_def: font,
        storage_path: font.source === 'upload' ? font.uploadUrl : null,
      })

      if (error) throw error
    } catch (err) {
      console.error('Error saving font:', err)
      throw err
    }
  }

  /**
   * Update an existing font (e.g., toggle isActive)
   */
  static async updateFont(
    userId: string,
    fontId: string,
    updates: Partial<FontDef>,
  ): Promise<void> {
    try {
      // Get current font_def
      const { data, error: fetchError } = await supabase
        .from('user_fonts')
        .select('font_def')
        .eq('user_id', userId)
        .eq('font_def->id', fontId)
        .single()

      if (fetchError) throw fetchError

      // Merge updates
      const currentFontDef = data.font_def as FontDef
      const updatedFontDef = { ...currentFontDef, ...updates }

      // Update in database
      const { error: updateError } = await supabase
        .from('user_fonts')
        .update({ font_def: updatedFontDef })
        .eq('user_id', userId)
        .eq('font_def->id', fontId)

      if (updateError) throw updateError
    } catch (err) {
      console.error('Error updating font:', err)
      throw err
    }
  }

  /**
   * Delete a font from Supabase
   */
  static async deleteFont(userId: string, fontId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_fonts')
        .delete()
        .eq('user_id', userId)
        .eq('font_def->id', fontId)

      if (error) throw error
    } catch (err) {
      console.error('Error deleting font:', err)
      throw err
    }
  }

  /**
   * Check if a font is a default font (should not be saved to DB)
   */
  private static isDefaultFont(font: FontDef): boolean {
    return DEFAULT_FONTS.some((df) => df.id === font.id)
  }

  /**
   * Get public URL for uploaded font from storage
   */
  private static getStorageUrl(path: string): string {
    const { data } = supabase.storage.from('user-fonts').getPublicUrl(path)
    return data.publicUrl
  }
}
