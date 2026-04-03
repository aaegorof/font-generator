import type { FontDef, TileData } from '../types'

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function generateAllTiles(
  fonts: FontDef[],
  images: string[],
  numInputs: number,
  layerPins: Record<number, string> = {},
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false)
  if (activeFonts.length === 0 || images.length === 0) return []

  const n = Math.max(numInputs, 1)

  const layerPools: string[][] = Array.from({ length: n }, (_, i) => {
    const pinId = layerPins[i]
    if (pinId) {
      const pinFont = activeFonts.find((f) => f.id === pinId)
      return pinFont ? [pinFont.id] : activeFonts.map((f) => f.id)
    }
    return activeFonts.map((f) => f.id)
  })

  const combinations: string[][] = []

  if (n === 1) {
    for (const id of layerPools[0]) {
      combinations.push([id])
    }
  } else if (n === 2) {
    for (const id0 of layerPools[0]) {
      for (const id1 of layerPools[1]) {
        combinations.push([id0, id1])
      }
    }
  } else {
    outer: for (const id0 of layerPools[0]) {
      for (const id1 of layerPools[1]) {
        const combo: string[] = [id0, id1]
        for (let k = 2; k < n; k++) {
          const pool = layerPools[k]
          combo.push(pool[Math.floor(Math.random() * pool.length)])
        }
        combinations.push(combo)
        if (combinations.length >= 100) break outer
      }
    }
  }

  // Every image × every font combination
  const tiles: TileData[] = []
  for (const imageUrl of images) {
    for (const fontIds of combinations) {
      tiles.push({
        id: `tile-${tiles.length}-${imageUrl}-${fontIds.join('-')}`,
        imageUrl,
        fontIds,
      })
    }
  }
  return tiles
}

export function randomizeTiles(
  fonts: FontDef[],
  images: string[],
  numInputs: number,
  count: number = 50,
  layerPins: Record<number, string> = {},
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false)
  if (activeFonts.length === 0 || images.length === 0) return []

  const n = Math.max(numInputs, 1)
  const shuffledImages = shuffleArray(images)

  return Array.from({ length: count }, (_, idx) => ({
    id: `rand-${idx}-${Date.now()}`,
    imageUrl: shuffledImages[idx % shuffledImages.length],
    fontIds: Array.from({ length: n }, (__, i) => {
      const pinId = layerPins[i]
      if (pinId) {
        const pinFont = activeFonts.find((f) => f.id === pinId)
        if (pinFont) return pinFont.id
      }
      return activeFonts[Math.floor(Math.random() * activeFonts.length)].id
    }),
  }))
}
