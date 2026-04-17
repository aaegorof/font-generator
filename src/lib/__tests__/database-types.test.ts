import { describe, it, expect } from 'vitest'
import { supabase } from '../supabase'
import type { Tables, TablesInsert, TablesUpdate } from '../../types/supabase'

describe('Database Types', () => {
  it('should have correct type for user_profiles', () => {
    type UserProfile = Tables<'user_profiles'>

    const profile: UserProfile = {
      id: '123',
      settings: {},
      text_inputs: {},
      toolbar_open: true,
      layer_font_pins: {},
      disabled_images: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    expect(profile.id).toBe('123')
    expect(profile.toolbar_open).toBe(true)
  })

  it('should have correct type for user_profiles insert', () => {
    type UserProfileInsert = TablesInsert<'user_profiles'>

    const newProfile: UserProfileInsert = {
      id: '123',
      settings: { columns: 4 },
      text_inputs: [],
    }

    expect(newProfile.id).toBe('123')
  })

  it('should have correct type for user_profiles update', () => {
    type UserProfileUpdate = TablesUpdate<'user_profiles'>

    const update: UserProfileUpdate = {
      toolbar_open: false,
      settings: { columns: 6 },
    }

    expect(update.toolbar_open).toBe(false)
  })

  it('should have correct type for user_images', () => {
    type UserImage = Tables<'user_images'>

    const image: UserImage = {
      id: '123',
      user_id: '456',
      storage_path: 'images/test.jpg',
      url: 'https://example.com/test.jpg',
      created_at: new Date().toISOString(),
    }

    expect(image.storage_path).toBe('images/test.jpg')
  })

  it('should have correct type for user_fonts', () => {
    type UserFont = Tables<'user_fonts'>

    const font: UserFont = {
      id: '123',
      user_id: '456',
      font_def: { family: 'Arial', weight: 400 },
      storage_path: null,
      created_at: new Date().toISOString(),
    }

    expect(font.storage_path).toBeNull()
  })

  it('should have correct type for user_favorites', () => {
    type UserFavorite = Tables<'user_favorites'>

    const favorite: UserFavorite = {
      id: '123',
      user_id: '456',
      favorite_data: { tile: {}, settings: {} },
      created_at: new Date().toISOString(),
    }

    expect(favorite.user_id).toBe('456')
  })

  it('should have typed supabase client', async () => {
    // This test verifies that the supabase client is properly typed
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1)

    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)

    // TypeScript should know the shape of data
    if (data && data.length > 0) {
      const profile = data[0]
      expect(profile).toHaveProperty('id')
      expect(profile).toHaveProperty('settings')
      expect(profile).toHaveProperty('toolbar_open')
    }
  })
})
