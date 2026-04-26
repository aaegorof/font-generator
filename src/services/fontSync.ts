import { supabase } from '../lib/supabase'
import type { FontDef } from '../types'
import type { Json } from '../types/database.types'
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
        const fontDef = row.font_def as unknown as FontDef
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

      // Check if font already exists to avoid duplicates
      const { data: existing } = await supabase
        .from('user_fonts')
        .select('id')
        .eq('user_id', userId)
        .contains('font_def', { id: font.id })
        .maybeSingle()

      if (existing) {
        // Font already exists, skip insert
        return
      }

      const { error } = await supabase.from('user_fonts').insert({
        user_id: userId,
        font_def: font as unknown as Json,
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
   * For DEFAULT_FONTS that don't exist in DB yet, this will create them
   */
  static async updateFont(
    userId: string,
    fontId: string,
    updates: Partial<FontDef>,
  ): Promise<void> {
    try {
      // Try to get current font_def
      const { data, error: fetchError } = await supabase
        .from('user_fonts')
        .select('font_def')
        .eq('user_id', userId)
        .contains('font_def', { id: fontId })
        .maybeSingle()

      if (fetchError) throw fetchError

      if (data) {
        // Font exists - update it
        const currentFontDef = data.font_def as unknown as FontDef
        const updatedFontDef = { ...currentFontDef, ...updates }

        const { error: updateError } = await supabase
          .from('user_fonts')
          .update({ font_def: updatedFontDef as unknown as Json })
          .eq('user_id', userId)
          .contains('font_def', { id: fontId })

        if (updateError) throw updateError
      } else {
        // Font doesn't exist (likely a DEFAULT_FONT being updated for the first time)
        // Find the default font definition and create it with updates
        const defaultFont = DEFAULT_FONTS.find((f) => f.id === fontId)
        if (defaultFont) {
          const fontToSave = { ...defaultFont, ...updates }
          const { error: insertError } = await supabase.from('user_fonts').insert({
            user_id: userId,
            font_def: fontToSave as unknown as Json,
            storage_path: null,
          })
          if (insertError) throw insertError
        } else {
          throw new Error(`Font ${fontId} not found in database or default fonts`)
        }
      }
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
      console.log('[deleteFont] Input params:', { userId, fontId, userIdType: typeof userId, fontIdType: typeof fontId })
      
      const { error } = await supabase
        .from('user_fonts')
        .delete()
        .eq('user_id', userId)
        .contains('font_def', { id: fontId })

      console.log('[deleteFont] Delete result:', { error })

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

  /**
   * Upload font file to Supabase Storage
   */
  static async uploadFont(
    userId: string,
    file: File,
    fontId: string,
  ): Promise<{ url: string; storagePath: string }> {
    try {
      this.validateFontFile(file)

      const fileExt = file.name.split('.').pop()
      const storagePath = `${userId}/${fontId}.${fileExt}`

      const { error } = await supabase.storage.from('user-fonts').upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('user-fonts').getPublicUrl(storagePath)

      return {
        url: urlData.publicUrl,
        storagePath: storagePath,
      }
    } catch (err) {
      console.error('Error uploading font:', err)
      throw err
    }
  }

  /**
   * Delete font file from Storage
   */
  static async deleteFontFile(storagePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage.from('user-fonts').remove([storagePath])

      if (error) throw error
    } catch (err) {
      console.error('Error deleting font file:', err)
      throw err
    }
  }

  /**
   * Validate font file
   */
  private static validateFontFile(file: File): void {
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Font file too large (max 5 MB)')
    }

    const allowedExtensions = ['woff2', 'woff', 'ttf', 'otf']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error('Invalid font file type (allowed: .woff2, .woff, .ttf, .otf)')
    }
  }

  /**
   * Save font with storage metadata
   */
  static async saveFontWithFile(userId: string, font: FontDef, file: File): Promise<void> {
    try {
      const { url, storagePath } = await this.uploadFont(userId, file, font.id)

      const fontWithUrl: FontDef = {
        ...font,
        uploadUrl: url,
        source: 'upload',
      }

      const { error } = await supabase.from('user_fonts').insert({
        user_id: userId,
        font_def: fontWithUrl as unknown as Json,
        storage_path: storagePath,
      })

      if (error) throw error
    } catch (err) {
      console.error('Error saving font with file:', err)
      throw err
    }
  }

  /**
   * Delete font with file
   */
  static async deleteFontWithFile(userId: string, fontId: string): Promise<void> {
    try {
      console.log('[deleteFontWithFile] Input params:', { userId, fontId, userIdType: typeof userId, fontIdType: typeof fontId })
      
      const { data, error: fetchError } = await supabase
        .from('user_fonts')
        .select('storage_path')
        .eq('user_id', userId)
        .contains('font_def', { id: fontId })
        .single()

      console.log('[deleteFontWithFile] Fetch result:', { data, fetchError })

      if (fetchError) throw fetchError

      await this.deleteFont(userId, fontId)

      if (data?.storage_path) {
        await this.deleteFontFile(data.storage_path)
      }
    } catch (err) {
      console.error('Error deleting font with file:', err)
      throw err
    }
  }
}
