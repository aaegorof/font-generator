import { useCallback } from 'react'
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom'

export interface FontFilter {
  layerIndex: number
  fontId: string
}

export function useFontFilter() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()

  const raw = searchParams.get('fontFilter')
  const filter: FontFilter | null = raw
    ? (() => {
        const [layer, ...rest] = raw.split(':')
        return { layerIndex: Number(layer), fontId: rest.join(':') }
      })()
    : null

  const setFilter = useCallback(
    (layerIndex: number, fontId: string) => {
      const params = new URLSearchParams(searchParams)
      params.set('fontFilter', `${layerIndex}:${fontId}`)
      navigate(`?${params.toString()}`)
    },
    [searchParams, navigate],
  )

  const clearFilter = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete('fontFilter')
    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true },
    )
  }, [searchParams, navigate, location.pathname])

  return { filter, setFilter, clearFilter }
}
