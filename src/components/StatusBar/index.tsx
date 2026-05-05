import { memo, useCallback, useMemo, useState } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import { exportAllSettings } from '../../utils/exportSettings'
import { AuthButton } from '../Auth/AuthButton'
import { Button } from '../ui/button'

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
  } = useStore()
  const { clearFilter, layerFontPins } = useFontFilter()
  const [exporting, setExporting] = useState(false)

  const pinEntries = useMemo(
    () => Object.entries(layerFontPins).filter(([, id]) => id) as [string, string][],
    [layerFontPins],
  )

  const totalTiles = tiles.length
  const filteredTiles = useMemo(() => {
    if (pinEntries.length === 0) return totalTiles
    return tiles.filter((t) =>
      pinEntries.every(([layerKey, fontId]) => t.fontIds[Number(layerKey)] === fontId),
    ).length
  }, [tiles, pinEntries, totalTiles])

  const pinSummary = useMemo(() => {
    if (pinEntries.length === 0) return null
    return pinEntries.map(([layerKey, fontId]) => ({
      layer: Number(layerKey),
      label: fonts.find((f) => f.id === fontId)?.name ?? fontId,
    }))
  }, [pinEntries, fonts])

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


  return (
    <div className="bg-background sticky top-0 z-10 flex shrink-0 items-center justify-between px-4 py-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-3">
        {favorites.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="gap-1 px-0 text-[11px] text-[#e05] hover:bg-transparent hover:text-[#ff2266]"
            onClick={() => openFavoritesView(0)}
          >
            <HeartIcon />
            <span>{favorites.length}</span>
          </Button>
        )}

        <span className="text-white/50">
          {pinSummary && filteredTiles !== totalTiles
            ? `${filteredTiles} / ${totalTiles}`
            : `${totalTiles}`}
          {' variations'}
        </span>

        {pinSummary && pinSummary.length > 0 && (
          <span className="flex max-w-[min(420px,55vw)] flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-[10px] bg-white/8 px-2 py-0.5 text-[11px] text-white/80">
            <span className="shrink-0 text-white/50">Pinned:</span>
            {pinSummary.map(({ layer, label }, idx) => (
              <span key={layer} className="flex items-center gap-1.5 whitespace-nowrap">
                {idx > 0 && <span className="text-white/35">·</span>}
                <span>
                  L{layer + 1} <strong className="text-white">{label}</strong>
                </span>
              </span>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-white/40 hover:text-white ml-0.5 h-5 min-w-5 shrink-0 text-sm leading-none hover:bg-transparent"
              onClick={clearFilter}
              title="Clear layer pins"
            >
              ×
            </Button>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="xs" onClick={randomize}>
          <ShuffleIcon />
          <span>Randomize</span>
        </Button>
        <Button variant="ghost" size="xs" onClick={handleReset}>
          <RefreshIcon />
          <span>Reset</span>
        </Button>
        <Button
          variant="ghost"
          size="xs"
          onClick={handleExport}
          disabled={exporting}
          title="Export settings"
        >
          <ExportIcon />
          <span>Export</span>
        </Button>
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

