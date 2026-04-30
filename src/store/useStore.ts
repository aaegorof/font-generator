import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FontDef, TileData, Settings, FavoriteItem, TextInput } from '../types'
import type { SettingsExport } from '../utils/exportSettings'
import { DEFAULT_FONTS, injectUploadedFont } from '../utils/fonts'
import { DEFAULT_IMAGES } from '../utils/images'
import { generateAllTiles, randomizeTiles } from '../utils/tileGenerator'
import { FontSyncService } from '../services/fontSync'
import { ImageSyncService } from '../services/imageSync'
import { FavoriteSyncService } from '../services/favoriteSync'
import { getCurrentUserId } from '../utils/auth'

const DEFAULT_SETTINGS: Settings = {
  columns: 4,
  padding: 24,
  overlayOpacity: 0.25,
  grayscale: false,
}

export const DEFAULT_TEXT_INPUT_STYLE: Omit<TextInput, 'id' | 'text'> = {
  fontSize: 56,
  letterSpacing: 0.02,
  lineHeight: 1.0,
  textColor: '#ffffff',
  textShadow: true,
  textWrap: true,
  alignment: 'center',
  verticalAlignment: 'center',
}

const DEFAULT_TEXT_INPUTS: TextInput[] = [
  { id: 'input-default-1', text: 'de Tribe', ...DEFAULT_TEXT_INPUT_STYLE },
]

interface AppState {
  // Persisted
  settings: Settings
  textInputs: TextInput[]
  fonts: FontDef[]
  images: string[]
  disabledImages: string[]
  favorites: FavoriteItem[]
  toolbarOpen: boolean
  layerFontPins: Record<number, string>

  // Transient
  tiles: TileData[]
  favoritesViewOpen: boolean
  favoritesViewIndex: number
  fontManagerOpen: boolean
}

interface AppActions {
  updateSettings: (partial: Partial<Settings>) => void

  addTextInput: (input?: TextInput) => void
  removeTextInput: (id: string) => void
  updateTextInput: (id: string, partial: Partial<Omit<TextInput, 'id'>>) => void

  addFont: (font: FontDef) => Promise<void>
  setUserFonts: (fonts: FontDef[]) => void
  removeFont: (id: string) => void
  toggleFontActive: (id: string) => void
  setLayerFontPin: (layerIndex: number, fontId: string | null) => void

  addImage: (url: string) => void
  setUserImages: (images: string[]) => void
  removeImage: (url: string) => void
  toggleImageDisabled: (url: string) => void

  generateTiles: () => void
  randomize: () => void
  randomizeSingleTile: (tileId: string) => void

  addFavorite: (tile: TileData) => void
  removeFavorite: (id: string) => void
  setUserFavorites: (favorites: FavoriteItem[]) => void

  toggleToolbar: () => void
  openFavoritesView: (index: number) => void
  closeFavoritesView: () => void
  setFavoritesViewIndex: (idx: number) => void
  setFontManagerOpen: (open: boolean) => void
  importAllSettings: (data: SettingsExport) => void
}

type AppStore = AppState & AppActions

export const useStore = create<AppStore>()(
  persist(
    (set, get) => {
      const activeImages = () => {
        const { images, disabledImages } = get()
        return images.filter((img) => !disabledImages.includes(img))
      }

      return {
        // Initial state
        settings: DEFAULT_SETTINGS,
        textInputs: DEFAULT_TEXT_INPUTS,
        fonts: DEFAULT_FONTS,
        images: DEFAULT_IMAGES,
        disabledImages: [],
        favorites: [],
        toolbarOpen: true,
        layerFontPins: {},
        tiles: [],
        favoritesViewOpen: false,
        favoritesViewIndex: 0,
        fontManagerOpen: false,

        // Settings
        updateSettings: (partial) =>
          set((state) => ({ settings: { ...state.settings, ...partial } })),

        // Text Inputs
        addTextInput: (input) => {
          const newInput = input ?? DEFAULT_TEXT_INPUTS[0]
          set((state) => ({ textInputs: [...state.textInputs, newInput] }))
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },
        removeTextInput: (id) => {
          set((state) => {
            return { textInputs: state.textInputs.filter((t) => t.id !== id) }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },
        updateTextInput: (id, partial) => {
          set((state) => ({
            textInputs: state.textInputs.map((t) => (t.id === id ? { ...t, ...partial } : t)),
          }))
        },

        // Fonts
        addFont: (font) => {
          // Check if font already exists to avoid duplicates
          const currentFonts = get().fonts
          if (currentFonts.find((f) => f.id === font.id)) {
            return Promise.resolve()
          }

          set((state) => ({ fonts: [...state.fonts, font] }))
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })

          // Sync to Supabase if user is logged in
          return getCurrentUserId()
            .then((userId) => {
              if (userId) {
                return FontSyncService.saveFont(userId, font)
              }
            })
            .catch((err) => {
              console.error(err)
              throw err
            })
        },
       
        setUserFonts: (userFonts) => {
          // Used only for loading fonts from Supabase - does NOT trigger sync
          set((state) => {
            // Database is the source of truth
            // DEFAULT_FONTS in DB (if modified) override the constants
            // DEFAULT_FONTS not in DB are added with their default state
            const defaultFontIds = new Set(DEFAULT_FONTS.map((f) => f.id))
            const userFontsMap = new Map(userFonts.map((f) => [f.id, f]))

            // Start with DEFAULT_FONTS, but use DB version if it exists
            const mergedDefaultFonts = DEFAULT_FONTS.map((defaultFont) => {
              const dbVersion = userFontsMap.get(defaultFont.id)
              return dbVersion || defaultFont
            })

            // Add non-default fonts from DB
            const nonDefaultUserFonts = userFonts.filter((f) => !defaultFontIds.has(f.id))

            const fonts = [...mergedDefaultFonts, ...nonDefaultUserFonts]
            const validFontIds = new Set(fonts.map((font) => font.id))
            const layerFontPins = Object.fromEntries(
              Object.entries(state.layerFontPins).filter(([, fontId]) => validFontIds.has(fontId)),
            )

            return { fonts, layerFontPins }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },
        removeFont: (id) => {
          set((state) => {
            const fonts = state.fonts.filter((f) => f.id !== id)
            const layerFontPins = Object.fromEntries(
              Object.entries(state.layerFontPins).filter(([, fId]) => fId !== id),
            )
            return { fonts, layerFontPins }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })

          // Sync to Supabase if user is logged in
          getCurrentUserId()
            .then((userId) => {
              if (userId) {
                return FontSyncService.deleteFont(userId, id)
              }
            })
            .catch(console.error)
        },
        toggleFontActive: (id) => {
          set((state) => {
            const fonts = state.fonts.map((f) =>
              f.id === id ? { ...f, isActive: !f.isActive } : f,
            )
            const isCurrentlyActive = state.fonts.find((f) => f.id === id)?.isActive !== false
            const layerFontPins = isCurrentlyActive
              ? Object.fromEntries(
                  Object.entries(state.layerFontPins).filter(([, fId]) => fId !== id),
                )
              : state.layerFontPins
            return { fonts, layerFontPins }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })

          // Sync to Supabase if user is logged in
          const font = get().fonts.find((f) => f.id === id)
          if (font) {
            getCurrentUserId()
              .then((userId) => {
                if (userId) {
                  return FontSyncService.updateFont(userId, id, { isActive: font.isActive })
                }
              })
              .catch(console.error)
          }
        },
        setLayerFontPin: (layerIndex, fontId) => {
          set((state) => {
            const pins = { ...state.layerFontPins }
            if (fontId === null) {
              delete pins[layerIndex]
            } else {
              pins[layerIndex] = fontId
            }
            return { layerFontPins: pins }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },

        // Images
        addImage: (url) => {
          // Check if image already exists to avoid duplicates
          const currentImages = get().images
          if (currentImages.includes(url)) {
            return
          }

          set((state) => ({ images: [...state.images, url] }))
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })

          // Sync to Supabase if user is logged in
          getCurrentUserId()
            .then((userId) => {
              if (userId) {
                const storagePath = ImageSyncService.getStoragePathFromUrl(url)
                return ImageSyncService.saveImage(userId, url, storagePath || undefined)
              }
            })
            .catch(console.error)
        },
        
        setUserImages: (userImages) => {
          // Used only for loading images from Supabase - does NOT trigger sync
          set((state) => {
            // Merge DEFAULT_IMAGES with user images
            const allImages = [...DEFAULT_IMAGES, ...userImages]
            // Remove duplicates while preserving order
            const images = [...new Set(allImages)]
            const imagesSet = new Set(images)
            const disabledImages = state.disabledImages.filter((img) => imagesSet.has(img))
            return { images, disabledImages }
          })
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },
        removeImage: (url) => {
          set((state) => ({
            images: state.images.filter((i) => i !== url),
            disabledImages: state.disabledImages.filter((u) => u !== url),
          }))
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })

          // Sync to Supabase if user is logged in
          getCurrentUserId()
            .then((userId) => {
              if (userId) {
                return ImageSyncService.deleteImage(userId, url)
              }
            })
            .catch(console.error)
        },
        toggleImageDisabled: (url) => {
          set((state) => ({
            disabledImages: state.disabledImages.includes(url)
              ? state.disabledImages.filter((u) => u !== url)
              : [...state.disabledImages, url],
          }))
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },

        // Tiles
        generateTiles: () => {
          const { fonts, textInputs, layerFontPins } = get()
          set({ tiles: generateAllTiles(fonts, activeImages(), textInputs.length, layerFontPins) })
        },
        randomize: () => {
          const { fonts, textInputs, layerFontPins } = get()
          set({
            tiles: randomizeTiles(fonts, activeImages(), textInputs.length, 60, layerFontPins),
          })
        },
        randomizeSingleTile: (tileId) => {
          const { fonts, textInputs, layerFontPins } = get()
          const imgs = activeImages()
          const numInputs = Math.max(textInputs.length, 1)
          const activeFonts = fonts.filter((f) => f.isActive !== false)
          if (activeFonts.length === 0) return

          set((state) => ({
            tiles: state.tiles.map((t) =>
              t.id === tileId
                ? {
                    ...t,
                    id: `rand-${Date.now()}`,
                    fontIds: Array.from({ length: numInputs }, (__, i) => {
                      const pinId = layerFontPins[i]
                      if (pinId) {
                        const pinFont = activeFonts.find((f) => f.id === pinId)
                        if (pinFont) return pinFont.id
                      }
                      return activeFonts[Math.floor(Math.random() * activeFonts.length)].id
                    }),
                    imageUrl: imgs[Math.floor(Math.random() * imgs.length)],
                  }
                : t,
            ),
          }))
        },

        // Favorites
        addFavorite: (tile) => {
          const { settings, textInputs } = get()
          const favorite: FavoriteItem = {
            id: `fav-${Date.now()}`,
            tile,
            settings: { ...settings },
            textInputs: textInputs.map((t) => ({ ...t })),
            savedAt: Date.now(),
          }
          set((state) => ({ favorites: [favorite, ...state.favorites] }))

          // Sync to Supabase if user is logged in
          getCurrentUserId()
            .then((userId) => {
              if (userId) {
                return FavoriteSyncService.saveFavorite(userId, favorite)
              }
            })
            .catch(console.error)
        },
        removeFavorite: (id) => {
          set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) }))

          // Sync to Supabase if user is logged in
          getCurrentUserId()
            .then((userId) => {
              if (userId) {
                return FavoriteSyncService.deleteFavorite(userId, id)
              }
            })
            .catch(console.error)
        },
        setUserFavorites: (userFavorites) => {
          // Used only for loading favorites from Supabase - does NOT trigger sync
          set({ favorites: userFavorites })
        },

        // UI
        toggleToolbar: () => set((state) => ({ toolbarOpen: !state.toolbarOpen })),
        openFavoritesView: (index) => set({ favoritesViewOpen: true, favoritesViewIndex: index }),
        closeFavoritesView: () => set({ favoritesViewOpen: false }),
        setFavoritesViewIndex: (idx) => set({ favoritesViewIndex: idx }),
        setFontManagerOpen: (open) => set({ fontManagerOpen: open }),

        // Import / Export
        importAllSettings: (data) => {
          const mergedSettings: Settings = { ...DEFAULT_SETTINGS, ...data.settings }
          const textInputs = data.textInputs ?? DEFAULT_TEXT_INPUTS
          set({
            settings: mergedSettings,
            textInputs,
            fonts: data.fonts ?? get().fonts,
            images: data.images ?? get().images,
            favorites: data.favorites ?? get().favorites,
            toolbarOpen: data.toolbarOpen ?? get().toolbarOpen,
          })
          const fonts = data.fonts ?? []
          fonts
            .filter((f) => f.source === 'upload' && f.uploadUrl)
            .forEach((f) => injectUploadedFont(f))
          const { textInputs: updatedInputs, layerFontPins } = get()
          set({
            tiles: generateAllTiles(
              fonts.length ? fonts : get().fonts,
              activeImages(),
              updatedInputs.length,
              layerFontPins,
            ),
          })
        },
      }
    },
    {
      name: 'font-generator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        textInputs: state.textInputs,
        fonts: state.fonts,
        images: state.images,
        disabledImages: state.disabledImages,
        favorites: state.favorites,
        toolbarOpen: state.toolbarOpen,
        layerFontPins: state.layerFontPins,
      }),
    },
  ),
)
