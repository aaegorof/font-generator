import { useEffect, memo } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import { Tile } from '../Tile'
import './Grid.css'

export const Grid = memo(function Grid() {
  const { tiles, settings, generateTiles, fonts, images } = useStore()
  const { filter } = useFontFilter()

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

  const visibleTiles = filter
    ? tiles.filter((t) => t.fontIds[filter.layerIndex] === filter.fontId)
    : tiles

  if (tiles.length === 0) {
    return (
      <div className="grid-empty">
        <p>No tiles yet. Add some fonts and images to get started.</p>
      </div>
    )
  }

  if (visibleTiles.length === 0) {
    return (
      <div className="grid-empty">
        <p>No tiles match this filter.</p>
      </div>
    )
  }

  return (
    <div
      className="grid"
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
