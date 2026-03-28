import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FontDef, TileData, Settings, FavoriteItem } from '../types';
import type { SettingsExport } from '../utils/exportSettings';
import { DEFAULT_FONTS, injectUploadedFont } from '../utils/fonts';
import { DEFAULT_IMAGES } from '../utils/images';
import { generateAllTiles, randomizeTiles } from '../utils/tileGenerator';

const DEFAULT_SETTINGS: Settings = {
  fontSize: 56,
  columns: 4,
  letterSpacing: 0.02,
  padding: 24,
  textWrap: true,
  alignment: 'center',
  overlayOpacity: 0.25,
  lineHeight: 1.0,
  textColor: '#ffffff',
  textShadow: true,
  grayscale: false,
};

interface AppState {
  // Persisted
  settings: Settings;
  textContent: string;
  fonts: FontDef[];
  images: string[];
  favorites: FavoriteItem[];
  toolbarOpen: boolean;

  // Transient
  tiles: TileData[];
  favoritesViewOpen: boolean;
  favoritesViewIndex: number;
  fontManagerOpen: boolean;
}

interface AppActions {
  updateSettings: (partial: Partial<Settings>) => void;
  setTextContent: (text: string) => void;

  addFont: (font: FontDef) => void;
  removeFont: (id: string) => void;
  toggleFontActive: (id: string) => void;

  addImage: (url: string) => void;
  removeImage: (url: string) => void;

  generateTiles: () => void;
  randomize: () => void;
  randomizeSingleTile: (tileId: string) => void;

  addFavorite: (tile: TileData) => void;
  removeFavorite: (id: string) => void;

  toggleToolbar: () => void;
  openFavoritesView: (index: number) => void;
  closeFavoritesView: () => void;
  setFavoritesViewIndex: (idx: number) => void;
  setFontManagerOpen: (open: boolean) => void;
  importAllSettings: (data: SettingsExport) => void;
}

type AppStore = AppState & AppActions;

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      settings: DEFAULT_SETTINGS,
      textContent: 'de\nTribe',
      fonts: DEFAULT_FONTS,
      images: DEFAULT_IMAGES,
      favorites: [],
      toolbarOpen: true,
      tiles: [],
      favoritesViewOpen: false,
      favoritesViewIndex: 0,
      fontManagerOpen: false,

      // Settings
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),

      // Text
      setTextContent: (textContent) => {
        set({ textContent });
        // Regenerate tiles when text changes (line count may change)
        const { fonts, images } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },

      // Fonts
      addFont: (font) => {
        set((state) => ({ fonts: [...state.fonts, font] }));
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },
      removeFont: (id) => {
        set((state) => ({ fonts: state.fonts.filter((f) => f.id !== id) }));
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },
      toggleFontActive: (id) => {
        set((state) => ({
          fonts: state.fonts.map((f) =>
            f.id === id ? { ...f, isActive: !f.isActive } : f
          ),
        }));
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },

      // Images
      addImage: (url) => {
        set((state) => ({ images: [...state.images, url] }));
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },
      removeImage: (url) => {
        set((state) => ({ images: state.images.filter((i) => i !== url) }));
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },

      // Tiles
      generateTiles: () => {
        const { fonts, images, textContent } = get();
        set({ tiles: generateAllTiles(fonts, images, textContent) });
      },
      randomize: () => {
        const { fonts, images, textContent } = get();
        set({ tiles: randomizeTiles(fonts, images, textContent, 60) });
      },
      randomizeSingleTile: (tileId) => {
        const { fonts, images, textContent } = get();
        const lines = textContent.split('\n').filter((l) => l.length > 0);
        const numLines = Math.max(lines.length, 1);
        const activeFonts = fonts.filter((f) => f.isActive !== false);
        if (activeFonts.length === 0) return;

        set((state) => ({
          tiles: state.tiles.map((t) =>
            t.id === tileId
              ? {
                  ...t,
                  id: `rand-${Date.now()}`,
                  fontIds: Array.from({ length: numLines }, () => {
                    return activeFonts[Math.floor(Math.random() * activeFonts.length)].id;
                  }),
                  imageUrl: images[Math.floor(Math.random() * images.length)],
                }
              : t
          ),
        }));
      },

      // Favorites
      addFavorite: (tile) => {
        const { settings, textContent } = get();
        const favorite: FavoriteItem = {
          id: `fav-${Date.now()}`,
          tile,
          settings: { ...settings },
          textContent,
          savedAt: Date.now(),
        };
        set((state) => ({ favorites: [favorite, ...state.favorites] }));
      },
      removeFavorite: (id) =>
        set((state) => ({ favorites: state.favorites.filter((f) => f.id !== id) })),

      // UI
      toggleToolbar: () => set((state) => ({ toolbarOpen: !state.toolbarOpen })),
      openFavoritesView: (index) =>
        set({ favoritesViewOpen: true, favoritesViewIndex: index }),
      closeFavoritesView: () => set({ favoritesViewOpen: false }),
      setFavoritesViewIndex: (idx) => set({ favoritesViewIndex: idx }),
      setFontManagerOpen: (open) => set({ fontManagerOpen: open }),

      // Import / Export
      importAllSettings: (data) => {
        const mergedSettings: Settings = { ...DEFAULT_SETTINGS, ...data.settings };
        set({
          settings: mergedSettings,
          textContent: data.textContent ?? get().textContent,
          fonts: data.fonts ?? get().fonts,
          images: data.images ?? get().images,
          favorites: data.favorites ?? get().favorites,
          toolbarOpen: data.toolbarOpen ?? get().toolbarOpen,
        });
        // Re-inject uploaded fonts that came in as data URLs
        const fonts = data.fonts ?? [];
        fonts
          .filter((f) => f.source === 'upload' && f.uploadUrl)
          .forEach((f) => injectUploadedFont(f));
        // Regenerate tiles
        const { textContent, images } = get();
        set({ tiles: generateAllTiles(fonts.length ? fonts : get().fonts, images, textContent) });
      },
    }),
    {
      name: 'font-generator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        textContent: state.textContent,
        fonts: state.fonts,
        images: state.images,
        favorites: state.favorites,
        toolbarOpen: state.toolbarOpen,
      }),
    }
  )
);
