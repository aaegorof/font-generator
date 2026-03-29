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
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false)
  if (activeFonts.length === 0 || images.length === 0) return []

  const n = Math.max(numInputs, 1)
  const combinations: string[][] = []

  if (n === 1) {
    for (let i = 0; i < activeFonts.length; i++) {
      combinations.push([activeFonts[i].id])
    }
  } else if (n === 2) {
    for (let i = 0; i < activeFonts.length; i++) {
      for (let j = 0; j < activeFonts.length; j++) {
        combinations.push([activeFonts[i].id, activeFonts[j].id])
      }
    }
  } else {
    for (let i = 0; i < activeFonts.length; i++) {
      for (let j = 0; j < activeFonts.length; j++) {
        const combo: string[] = [activeFonts[i].id, activeFonts[j].id]
        for (let k = 2; k < n; k++) {
          combo.push(activeFonts[Math.floor(Math.random() * activeFonts.length)].id)
        }
        combinations.push(combo)
        if (combinations.length >= 100) break
      }
      if (combinations.length >= 100) break
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
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false)
  if (activeFonts.length === 0 || images.length === 0) return []

  const n = Math.max(numInputs, 1)
  const shuffledImages = shuffleArray(images)

  return Array.from({ length: count }, (_, idx) => ({
    id: `rand-${idx}-${Date.now()}`,
    imageUrl: shuffledImages[idx % shuffledImages.length],
    fontIds: Array.from({ length: n }, () => {
      return activeFonts[Math.floor(Math.random() * activeFonts.length)].id
    }),
  }))
}
