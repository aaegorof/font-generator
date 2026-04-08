# Architecture Diagram

## Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                           User Browser                           │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                        App.tsx                              │ │
│  │  - Font initialization (Google, local, uploaded)            │ │
│  │  - Routing (main page / favorites)                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                    │
│  ┌───────────────────────────┴──────────────────────────────┐   │
│  │                                                            │   │
│  ▼                          ▼                                ▼   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Toolbar    │  │     Grid     │  │   FavoritesViewer    │  │
│  │              │  │              │  │                      │  │
│  │ - FontsPage  │  │  ┌────────┐  │  │  ┌────────┐         │  │
│  │ - ImagesPage │  │  │  Tile  │  │  │  │  Tile  │         │  │
│  │ - Settings   │  │  └────────┘  │  │  └────────┘         │  │
│  └──────────────┘  │  ┌────────┐  │  │  ┌────────┐         │  │
│                    │  │  Tile  │  │  │  │  Tile  │         │  │
│                    │  └────────┘  │  │  └────────┘         │  │
│                    │      ...      │  │      ...            │  │
│                    └──────────────┘  └──────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                     StatusBar                               │ │
│  │  - Tile count, favorites count                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ State Management
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Zustand Store (useStore.ts)                   │
│                                                                   │
│  Persistent State (localStorage):                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • fonts: FontDef[]                                        │   │
│  │ • images: ImageDef[]                                      │   │
│  │ • textInputs: string[]                                    │   │
│  │ • favorites: Favorite[]                                   │   │
│  │ • fontSettings: FontSettings                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Transient State (not persisted):                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • tiles: TileDef[] (generated on-the-fly)                │   │
│  │ • showFavorites: boolean                                  │   │
│  │ • showToolbar: boolean                                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Actions:                                                         │
│  • addFont(), removeFont()                                       │
│  • addImage(), removeImage()                                     │
│  • addTextInput(), removeTextInput()                             │
│  • toggleFavorite()                                              │
│  • generateAllTiles() ⚠️ Called after every mutation             │
│  • importAllSettings(), exportAllSettings()                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Utilities
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Utils Layer                             │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  fonts.ts    │  │  images.ts   │  │  tileGenerator.ts    │  │
│  │              │  │              │  │                      │  │
│  │ - Google     │  │ - Upload     │  │ - generateAllTiles() │  │
│  │ - Local      │  │ - Remove     │  │ - Combinations       │  │
│  │ - Uploaded   │  │ - List       │  │   (fonts × images    │  │
│  │ - Injection  │  │              │  │    × text)           │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐ │
│  │ exportTile.ts│  │  exportSettings.ts                       │ │
│  │              │  │                                          │ │
│  │ - PNG export │  │ - Import/export all settings as JSON    │ │
│  │ - html-to-   │  │ - Restore app state                     │ │
│  │   image      │  │                                          │ │
│  └──────────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Font Upload
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server (server.js)                    │
│                          Port 3001                               │
│                                                                   │
│  POST /upload-font                                               │
│  - Accepts: multipart/form-data                                  │
│  - Saves to: public/fonts/                                       │
│  - Returns: { fontFamily, fileName, filePath }                   │
│                                                                   │
│  Uses: Multer for file handling                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      public/fonts/                               │
│                                                                   │
│  - Local fonts (.woff2, .woff, .ttf)                             │
│  - Uploaded fonts (user-uploaded)                                │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow: Adding a Font

```
User clicks "Add Font"
        │
        ▼
FontsPage component
        │
        ▼
useStore.addFont(fontDef)
        │
        ├─> Add to fonts array
        │
        ├─> Call generateAllTiles()
        │       │
        │       ├─> For each text input
        │       │   For each font
        │       │   For each image
        │       │       Create TileDef
        │       │
        │       └─> Update tiles array
        │
        └─> Persist to localStorage
                │
                ▼
        Grid re-renders with new tiles
```

## Data Flow: Exporting a Tile

```
User clicks "Export" on Tile
        │
        ▼
Tile component calls exportTileAsPng()
        │
        ├─> Create temporary DOM element
        │
        ├─> Apply styles and fonts
        │
        ├─> Call html-to-image.toPng()
        │       │
        │       └─> Convert DOM to PNG blob
        │
        └─> Download PNG file
```

## Font Injection Flow

```
App.tsx useEffect (on mount)
        │
        ├─> setupGoogleFonts()
        │       │
        │       └─> Inject <link> tag for Google Fonts API
        │
        ├─> injectLocalFontFaces()
        │       │
        │       └─> Inject @font-face rules for local fonts
        │
        └─> For each uploaded font
                │
                └─> injectUploadedFont(font)
                        │
                        └─> Inject <style> tag with @font-face
```

## Component Hierarchy

```
App
├── Router
│   ├── Route: "/"
│   │   ├── Toolbar
│   │   │   ├── FontsPage
│   │   │   ├── ImagesPage
│   │   │   └── SettingsPage
│   │   ├── Grid
│   │   │   └── Tile (multiple)
│   │   └── StatusBar
│   │
│   └── Route: "/favorites"
│       ├── FavoritesViewer
│       │   └── Tile (multiple)
│       └── StatusBar
```

## Type Relationships

```
FontDef
├── id: string
├── fontFamily: string
├── category: 'google' | 'local' | 'uploaded'
└── (optional) loadWeights, fileName, filePath

ImageDef
├── id: string
├── url: string
└── name: string

TileDef
├── id: string
├── fontIds: string[]
├── imageUrl: string
├── text: string
└── fontSettings: FontSettings

Favorite
├── fontIds: string[]
└── imageUrl: string

FontSettings
├── fontSize: number
├── fontColor: string
├── fontWeight: number
├── textAlign: 'left' | 'center' | 'right'
├── verticalAlign: 'top' | 'center' | 'bottom'
└── ... (more settings)
```

## State Update Pattern

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
useStore Action
    │
    ├─> Update state with set()
    │
    ├─> Call generateAllTiles() if needed
    │       │
    │       └─> Regenerate all tiles
    │
    └─> Persist to localStorage (automatic via middleware)
            │
            ▼
    Components re-render (Zustand subscribers)
```

## Key Patterns

### 1. Single Source of Truth
All state lives in one Zustand store. No prop drilling, no context.

### 2. Tile Generation
Tiles are always generated, never manually created. This ensures consistency.

### 3. Font Injection
Three different injection methods for three font sources, all managed in `utils/fonts.ts`.

### 4. Persistence
Only essential data persists. Tiles are regenerated on load.

### 5. Named Exports
All components use named exports for better tree-shaking and refactoring.

## Performance Considerations

- `memo()` on Tile component (many instances)
- `useCallback` for event handlers in memoized components
- Tiles generated once per state change, not per render
- LocalStorage persistence is selective (via `partialize`)
