import { useEffect, memo, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { Tile } from '../Tile'

export const Grid = memo(function Grid() {
  const { tiles, settings, generateTiles, fonts, images, layerFontPins } = useStore()

  useEffect(() => {
    if (tiles.length === 0) {
      generateTiles()
    }
  }, [])

  // Regenerate when fonts or images change from external source
  useEffect(() => {
    if (tiles.length === 0 && fonts.length > 0 && images.length > 0) {
      generateTiles()
    }
  }, [fonts, images])

  const visibleTiles = useMemo(() => {
    const pinEntries = Object.entries(layerFontPins).filter(([, id]) => id)
    if (pinEntries.length === 0) return tiles
    return tiles.filter((t) =>
      pinEntries.every(([layerKey, fontId]) => t.fontIds[Number(layerKey)] === fontId),
    )
  }, [tiles, layerFontPins])

  if (tiles.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm tracking-wide text-text-dim">
        <p>No tiles yet. Add some fonts and images to get started.</p>
      </div>
    )
  }

  if (visibleTiles.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm tracking-wide text-text-dim">
        <p>No tiles match this filter.</p>
      </div>
    )
  }

  return (
    <div
      className="grid w-full gap-0"
      style={{
        gridTemplateColumns: `repeat(${settings.columns}, 1fr)`,
      }}
    >
      {visibleTiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
    </div>
  )
})
