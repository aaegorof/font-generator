import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { supabase } from '../lib/supabase'
import type { Settings, TextInput, FontDef, FavoriteItem } from '../types'
import type { Json } from '../types/database.types'
import { validateUserProfile } from '../utils/validation'

export interface UseSupabaseSyncReturn {
  syncing: boolean
  lastSynced: Date | null
  error: Error | null
  forceSave: () => Promise<void>
}

interface PersistedState {
  settings: Settings
  textInputs: TextInput[]
  fonts: FontDef[]
  images: string[]
  disabledImages: string[]
  favorites: FavoriteItem[]
  toolbarOpen: boolean
  layerFontPins: Record<number, string>
}

export function useSupabaseSync(userId: string | null): UseSupabaseSyncReturn {
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState<Date | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const lastStateRef = useRef<string | undefined>(undefined)

  // Load data on mount FIRST
  useEffect(() => {
    if (!userId) {
      // User logged out - reset sync state
      setInitialLoadComplete(false)
      setLastSynced(null)
      setError(null)
      lastStateRef.current = undefined
      
      // Clear any pending saves
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
        saveTimeoutRef.current = undefined
      }
      
      console.log('✓ Sync disabled - user logged out, localStorage will be used')
      return
    }
    
    loadFromSupabase(userId)
  }, [userId])

  // Subscribe to store changes ONLY after initial load
  useEffect(() => {
    if (!userId || !initialLoadComplete) return

    const unsubscribe = useStore.subscribe((state) => {
      // Get only persisted state
      const persistedState = {
        settings: state.settings,
        textInputs: state.textInputs,
        fonts: state.fonts,
        images: state.images,
        disabledImages: state.disabledImages,
        favorites: state.favorites,
        toolbarOpen: state.toolbarOpen,
        layerFontPins: state.layerFontPins,
      }

      const stateJson = JSON.stringify(persistedState)

      // Skip if state hasn't changed
      if (stateJson === lastStateRef.current) return
      lastStateRef.current = stateJson

      // Debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveToSupabase(userId, persistedState)
      }, 2000)
    })

    return () => {
      unsubscribe()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [userId, initialLoadComplete])

  const saveToSupabase = async (userId: string, state: PersistedState) => {
    setSyncing(true)
    setError(null)

    try {
      // Validate data before saving
      const dataToValidate = {
        settings: state.settings,
        textInputs: state.textInputs,
        toolbarOpen: state.toolbarOpen,
        layerFontPins: state.layerFontPins,
        disabledImages: state.disabledImages,
      }
      validateUserProfile(dataToValidate)

      const { error: saveError } = await supabase
        .from('user_profiles')
        .update({
          settings: state.settings as unknown as Json,
          text_inputs: state.textInputs as unknown as Json,
          toolbar_open: state.toolbarOpen,
          layer_font_pins: state.layerFontPins as unknown as Json,
          disabled_images: state.disabledImages as unknown as Json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (saveError) throw saveError

      setLastSynced(new Date())
    } catch (err) {
      console.error('Error saving to Supabase:', err)
      setError(err as Error)
    } finally {
      setSyncing(false)
    }
  }

  const loadFromSupabase = async (userId: string) => {
    try {
      const { data, error: loadError } = await supabase
        .from('user_profiles')
        .select(
          'settings, text_inputs, toolbar_open, layer_font_pins, disabled_images, updated_at',
        )
        .eq('id', userId)
        .single()

      if (loadError) throw loadError
      if (!data) {
        // No data in DB yet - mark as loaded and let subscription start
        setInitialLoadComplete(true)
        return
      }

      // Update store with loaded data
      const store = useStore.getState()

      // Settings
      if (data.settings) {
        store.updateSettings(data.settings as unknown as Settings)
      }

      // Text inputs
      if (data.text_inputs && Array.isArray(data.text_inputs)) {
        // Clear existing text inputs
        const currentInputs = [...store.textInputs]
        currentInputs.forEach((input) => {
          if (store.textInputs.length > 1) {
            store.removeTextInput(input.id)
          }
        })

        // Add loaded text inputs
        const loadedInputs = data.text_inputs as unknown as TextInput[]
        if (loadedInputs.length > 0) {
          // Remove the last remaining default input if we have data to load
          if (store.textInputs.length === 1) {
            store.removeTextInput(store.textInputs[0].id)
          }

          // Add all loaded inputs
          loadedInputs.forEach((input) => {
            const newInput = store.textInputs[store.textInputs.length - 1]
            store.updateTextInput(newInput.id, {
              text: input.text,
              fontSize: input.fontSize,
              letterSpacing: input.letterSpacing,
              lineHeight: input.lineHeight,
              textColor: input.textColor,
              textShadow: input.textShadow,
              textWrap: input.textWrap,
              alignment: input.alignment,
              verticalAlignment: input.verticalAlignment,
            })
          })
        }
      }

      // Toolbar open
      if (typeof data.toolbar_open === 'boolean') {
        if (data.toolbar_open !== store.toolbarOpen) {
          store.toggleToolbar()
        }
      }

      // Layer font pins
      if (data.layer_font_pins && typeof data.layer_font_pins === 'object') {
        const loadedPins = data.layer_font_pins as unknown as Record<string, string>

        // Clear existing pins
        Object.keys(store.layerFontPins).forEach((key) => {
          store.setLayerFontPin(Number(key), null)
        })

        // Set loaded pins
        Object.entries(loadedPins).forEach(([key, value]) => {
          store.setLayerFontPin(Number(key), value)
        })
      }

      // Disabled images
      if (data.disabled_images && Array.isArray(data.disabled_images)) {
        const loadedDisabledImages = data.disabled_images as unknown as string[]
        const currentDisabledImages = [...store.disabledImages]

        // Enable images that are not in loaded disabled list
        currentDisabledImages.forEach((url) => {
          if (!loadedDisabledImages.includes(url)) {
            store.toggleImageDisabled(url)
          }
        })

        // Disable images that are in loaded disabled list
        loadedDisabledImages.forEach((url) => {
          if (!currentDisabledImages.includes(url)) {
            store.toggleImageDisabled(url)
          }
        })
      }

      setLastSynced(new Date(data.updated_at))

      // CRITICAL: Set the current state as baseline BEFORE enabling subscription
      // This prevents the subscription from treating loaded data as a "change"
      const loadedState = useStore.getState()
      const persistedState = {
        settings: loadedState.settings,
        textInputs: loadedState.textInputs,
        fonts: loadedState.fonts,
        images: loadedState.images,
        disabledImages: loadedState.disabledImages,
        favorites: loadedState.favorites,
        toolbarOpen: loadedState.toolbarOpen,
        layerFontPins: loadedState.layerFontPins,
      }
      lastStateRef.current = JSON.stringify(persistedState)

      // For authenticated users, clear localStorage - Supabase is the source of truth
      // This prevents conflicts between localStorage and database
      try {
        localStorage.removeItem('font-generator-store')
        console.log('✓ localStorage cleared - using Supabase as source of truth')
      } catch (e) {
        console.warn('Could not clear localStorage:', e)
      }

      // Now it's safe to enable subscription - data is loaded and baseline is set
      setInitialLoadComplete(true)
    } catch (err) {
      console.error('Error loading from Supabase:', err)
      setError(err as Error)
      // Still mark as complete to avoid hanging the app
      setInitialLoadComplete(true)
    }
  }

  const forceSave = async () => {
    if (!userId) return

    const state = useStore.getState()
    const persistedState = {
      settings: state.settings,
      textInputs: state.textInputs,
      fonts: state.fonts,
      images: state.images,
      disabledImages: state.disabledImages,
      favorites: state.favorites,
      toolbarOpen: state.toolbarOpen,
      layerFontPins: state.layerFontPins,
    }

    await saveToSupabase(userId, persistedState)
  }

  return {
    syncing,
    lastSynced,
    error,
    forceSave,
  }
}
