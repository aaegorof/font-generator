import { useEffect, memo } from 'react'
import { useStore } from '../../store/useStore'
import { Tile } from '../Tile'
import './Grid.css'

export const Grid = memo(function Grid() {
  const { tiles, settings, generateTiles, fonts, images } = useStore()

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

  if (tiles.length === 0) {
    return (
      <div className="grid-empty">
        <p>No tiles yet. Add some fonts and images to get started.</p>
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
      {tiles.map((tile) => (
        <Tile key={tile.id} tile={tile} />
      ))}
    </div>
  )
})
