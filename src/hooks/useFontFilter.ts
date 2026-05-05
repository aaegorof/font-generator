import { useCallback } from 'react'
import { useStore } from '../store/useStore'

export function useFontFilter() {
  const layerFontPins = useStore((s) => s.layerFontPins)
  const setLayerFontPin = useStore((s) => s.setLayerFontPin)
  const replaceLayerFontPins = useStore((s) => s.replaceLayerFontPins)

  const setFilter = useCallback(
    (layerIndex: number, fontId: string) => {
      setLayerFontPin(layerIndex, fontId)
    },
    [setLayerFontPin],
  )

  const clearFilter = useCallback(() => {
    replaceLayerFontPins({})
  }, [replaceLayerFontPins])

  return { setFilter, clearFilter, layerFontPins }
}
