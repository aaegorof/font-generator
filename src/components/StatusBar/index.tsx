import { memo } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import './StatusBar.css'

export const StatusBar = memo(function StatusBar() {
  const { tiles, favorites, openFavoritesView, fonts } = useStore()
  const { filter, clearFilter } = useFontFilter()

  const totalTiles = tiles.length
  const filteredTiles = filter
    ? tiles.filter((t) => t.fontIds[filter.layerIndex] === filter.fontId).length
    : totalTiles

  const filterFontName = filter
    ? (fonts.find((f) => f.id === filter.fontId)?.name ?? filter.fontId)
    : null

  return (
    <div className="status-bar">
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
