import { memo, useCallback, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import { exportAllSettings, parseSettingsFile } from '../../utils/exportSettings'
import './StatusBar.css'
import { AuthButton } from '../Auth/AuthButton'

export const StatusBar = memo(function StatusBar() {
  const {
    tiles,
    favorites,
    openFavoritesView,
    fonts,
    generateTiles,
    randomize,
    settings,
    textInputs,
    images,
    toolbarOpen,
    importAllSettings,
  } = useStore()
  const { filter, clearFilter } = useFontFilter()
  const importRef = useRef<HTMLInputElement>(null)
  const [exporting, setExporting] = useState(false)

  const totalTiles = tiles.length
  const filteredTiles = filter
    ? tiles.filter((t) => t.fontIds[filter.layerIndex] === filter.fontId).length
    : totalTiles

  const filterFontName = filter
    ? (fonts.find((f) => f.id === filter.fontId)?.name ?? filter.fontId)
    : null

  const handleReset = useCallback(() => {
    clearFilter()
    generateTiles()
  }, [clearFilter, generateTiles])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      await exportAllSettings({ settings, textInputs, fonts, images, favorites, toolbarOpen })
    } catch (err) {
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }, [settings, textInputs, fonts, images, favorites, toolbarOpen])

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        const data = await parseSettingsFile(file)
        importAllSettings(data)
      } catch (err) {
        console.error('Import error:', err)
        alert('Failed to import settings. Make sure the file is a valid export.')
      } finally {
        if (importRef.current) importRef.current.value = ''
      }
    },
    [importAllSettings],
  )

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        {favorites.length > 0 && (
          <button className="status-bar__favorites" onClick={() => openFavoritesView(0)}>
            <HeartIcon />
            <span>{favorites.length}</span>
          </button>
        )}

        <span className="status-bar__count">
          {filter && filteredTiles !== totalTiles
            ? `${filteredTiles} / ${totalTiles}`
            : `${totalTiles}`}
          {' variations'}
        </span>

        {filter && filterFontName && (
          <span className="status-bar__filter">
            Layer {filter.layerIndex + 1}: <strong>{filterFontName}</strong>
            <button className="status-bar__filter-clear" onClick={clearFilter} title="Clear filter">
              ×
            </button>
          </span>
        )}
      </div>

      <div className="status-bar__right">
        <button
          className="status-bar__action-btn status-bar__action-btn--outline"
          onClick={randomize}
        >
          <ShuffleIcon />
          <span>Randomize</span>
        </button>
        <button
          className="status-bar__action-btn status-bar__action-btn--outline"
          onClick={handleReset}
        >
          <RefreshIcon />
          <span>Reset</span>
        </button>
        <button
          className="status-bar__action-btn status-bar__action-btn--outline"
          onClick={handleExport}
          disabled={exporting}
          title="Export settings"
        >
          <ExportIcon /> Export
        </button>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleImport}
        />
        <button
          className="status-bar__action-btn status-bar__action-btn--outline"
          onClick={() => importRef.current?.click()}
          title="Import settings"
        >
          <ImportIcon /> Import
        </button>
        <AuthButton />
      </div>
    </div>
  )
})

function HeartIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function ShuffleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
