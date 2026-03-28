import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FontDef, TileData, Settings, FavoriteItem, TextInput } from '../types';
import type { SettingsExport } from '../utils/exportSettings';
import { DEFAULT_FONTS, injectUploadedFont } from '../utils/fonts';
import { DEFAULT_IMAGES } from '../utils/images';
import { generateAllTiles, randomizeTiles } from '../utils/tileGenerator';

const DEFAULT_SETTINGS: Settings = {
  columns: 4,
  padding: 24,
  overlayOpacity: 0.25,
  grayscale: false,
};

export const DEFAULT_TEXT_INPUT_STYLE: Omit<TextInput, 'id' | 'text'> = {
  fontSize: 56,
  letterSpacing: 0.02,
  lineHeight: 1.0,
  textColor: '#ffffff',
  textShadow: true,
  textWrap: true,
  alignment: 'center',
  verticalAlignment: 'center',
};

const DEFAULT_TEXT_INPUTS: TextInput[] = [
  { id: 'input-default-1', text: 'de\nTribe', ...DEFAULT_TEXT_INPUT_STYLE },
];

interface AppState {
  // Persisted
  settings: Settings;
  textInputs: TextInput[];
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

  addTextInput: () => void;
  removeTextInput: (id: string) => void;
  updateTextInput: (id: string, partial: Partial<Omit<TextInput, 'id'>>) => void;

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
      textInputs: DEFAULT_TEXT_INPUTS,
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

      // Text Inputs
      addTextInput: () => {
        const newInput: TextInput = {
          id: `input-${Date.now()}`,
          text: 'Text',
          ...DEFAULT_TEXT_INPUT_STYLE,
          verticalAlignment: 'bottom',
        };
        set((state) => ({ textInputs: [...state.textInputs, newInput] }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      removeTextInput: (id) => {
        set((state) => {
          if (state.textInputs.length <= 1) return state;
          return { textInputs: state.textInputs.filter((t) => t.id !== id) };
        });
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      updateTextInput: (id, partial) => {
        set((state) => ({
          textInputs: state.textInputs.map((t) =>
            t.id === id ? { ...t, ...partial } : t
          ),
        }));
      },

      // Fonts
      addFont: (font) => {
        set((state) => ({ fonts: [...state.fonts, font] }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      removeFont: (id) => {
        set((state) => ({ fonts: state.fonts.filter((f) => f.id !== id) }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      toggleFontActive: (id) => {
        set((state) => ({
          fonts: state.fonts.map((f) =>
            f.id === id ? { ...f, isActive: !f.isActive } : f
          ),
        }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },

      // Images
      addImage: (url) => {
        set((state) => ({ images: [...state.images, url] }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      removeImage: (url) => {
        set((state) => ({ images: state.images.filter((i) => i !== url) }));
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },

      // Tiles
      generateTiles: () => {
        const { fonts, images, textInputs } = get();
        set({ tiles: generateAllTiles(fonts, images, textInputs.length) });
      },
      randomize: () => {
        const { fonts, images, textInputs } = get();
        set({ tiles: randomizeTiles(fonts, images, textInputs.length, 60) });
      },
      randomizeSingleTile: (tileId) => {
        const { fonts, images, textInputs } = get();
        const numInputs = Math.max(textInputs.length, 1);
        const activeFonts = fonts.filter((f) => f.isActive !== false);
        if (activeFonts.length === 0) return;

        set((state) => ({
          tiles: state.tiles.map((t) =>
            t.id === tileId
              ? {
                  ...t,
                  id: `rand-${Date.now()}`,
                  fontIds: Array.from({ length: numInputs }, () => {
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
        const { settings, textInputs } = get();
        const favorite: FavoriteItem = {
          id: `fav-${Date.now()}`,
          tile,
          settings: { ...settings },
          textInputs: textInputs.map((t) => ({ ...t })),
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
        const textInputs = data.textInputs ?? DEFAULT_TEXT_INPUTS;
        set({
          settings: mergedSettings,
          textInputs,
          fonts: data.fonts ?? get().fonts,
          images: data.images ?? get().images,
          favorites: data.favorites ?? get().favorites,
          toolbarOpen: data.toolbarOpen ?? get().toolbarOpen,
        });
        const fonts = data.fonts ?? [];
        fonts
          .filter((f) => f.source === 'upload' && f.uploadUrl)
          .forEach((f) => injectUploadedFont(f));
        const { images } = get();
        set({ tiles: generateAllTiles(fonts.length ? fonts : get().fonts, images, textInputs.length) });
      },
    }),
    {
      name: 'font-generator-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: state.settings,
        textInputs: state.textInputs,
        fonts: state.fonts,
        images: state.images,
        favorites: state.favorites,
        toolbarOpen: state.toolbarOpen,
      }),
    }
  )
);
