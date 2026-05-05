import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  getPinsFromSearchParams,
  layerPinsEqual,
  serializeLayerPinsParam,
} from '../utils/layerPinsUrl'

/**
 * Keeps `layerPins` in the URL aligned with the store (reads legacy `fontFilter` only on ingest).
 */
export function LayerPinsUrlSync() {
  const location = useLocation()
  const navigate = useNavigate()
  const skipUrlToStoreRef = useRef(false)

  // URL → store (back/forward, shared links)
  useEffect(() => {
    if (skipUrlToStoreRef.current) {
      skipUrlToStoreRef.current = false
      return
    }

    const params = new URLSearchParams(location.search)
    const fromUrl = getPinsFromSearchParams(params)
    const storePins = useStore.getState().layerFontPins

    if (layerPinsEqual(fromUrl, storePins)) return

    useStore.getState().replaceLayerFontPins(fromUrl)
  }, [location.search])

  // store → URL
  useEffect(() => {
    const prevRef = { current: useStore.getState().layerFontPins }

    return useStore.subscribe((state) => {
      const next = state.layerFontPins
      if (layerPinsEqual(next, prevRef.current)) return

      const params = new URLSearchParams(window.location.search)
      const serialized = serializeLayerPinsParam(next)
      const current = params.get('layerPins')
      const legacy = params.get('fontFilter')

      if (serialized === current && !legacy) {
        prevRef.current = next
        return
      }

      prevRef.current = next

      if (serialized === null) {
        params.delete('layerPins')
      } else {
        params.set('layerPins', serialized)
      }
      params.delete('fontFilter')

      const nextSearch = params.toString()
      skipUrlToStoreRef.current = true
      navigate(
        { pathname: location.pathname, search: nextSearch },
        { replace: true },
      )
    })
  }, [navigate, location.pathname])

  return null
}
