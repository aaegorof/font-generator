/** Serialize layer↔font pins for the `layerPins` search param (pipe-separated `idx:fontId`). */

export function parseLayerPinsParam(raw: string | null): Record<number, string> {
  if (!raw?.trim()) return {}
  const out: Record<number, string> = {}
  for (const segment of raw.split('|')) {
    const idx = segment.indexOf(':')
    if (idx === -1) continue
    const layer = Number(segment.slice(0, idx))
    const fontId = segment.slice(idx + 1)
    if (!Number.isFinite(layer) || !fontId) continue
    out[layer] = fontId
  }
  return out
}

export function serializeLayerPinsParam(pins: Record<number, string>): string | null {
  const entries = Object.entries(pins).filter(([, id]) => id)
  if (entries.length === 0) return null
  return entries
    .map(([k, v]) => [Number(k), v] as const)
    .filter(([layer]) => Number.isFinite(layer))
    .sort(([a], [b]) => a - b)
    .map(([layer, v]) => `${layer}:${v}`)
    .join('|')
}

/** Read pins from URL, including legacy `fontFilter=layer:fontId`. */
export function getPinsFromSearchParams(params: URLSearchParams): Record<number, string> {
  const layerPins = params.get('layerPins')
  if (layerPins) return parseLayerPinsParam(layerPins)

  const legacy = params.get('fontFilter')
  if (legacy) {
    const idx = legacy.indexOf(':')
    if (idx === -1) return {}
    const layer = Number(legacy.slice(0, idx))
    const fontId = legacy.slice(idx + 1)
    if (Number.isFinite(layer) && fontId) return { [layer]: fontId }
  }
  return {}
}

export function layerPinsEqual(
  a: Record<number, string>,
  b: Record<number, string>,
): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) return false
  for (const k of keysA) {
    const key = Number(k)
    if (a[key] !== b[key]) return false
  }
  return true
}
