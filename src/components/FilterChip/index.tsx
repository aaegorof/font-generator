import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import './FilterChip.css'

export function FilterChip() {
  const { filter, clearFilter } = useFontFilter()
  const { fonts } = useStore()

  if (!filter) return null

  const font = fonts.find((f) => f.id === filter.fontId)
  const fontName = font?.name ?? filter.fontId

  return (
    <div className="filter-chip">
      <span>
        Layer {filter.layerIndex + 1}: <strong>{fontName}</strong>
      </span>
      <button onClick={clearFilter} title="Clear filter">
        ×
      </button>
    </div>
  )
}
