import type { FontDef, TileData } from '../types';

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateAllTiles(
  fonts: FontDef[],
  images: string[],
  textContent: string
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false);
  if (activeFonts.length === 0 || images.length === 0) return [];

  const lines = textContent.split('\n').filter((l) => l.length > 0);
  const numLines = Math.max(lines.length, 1);

  const combinations: string[][] = [];

  if (numLines <= 2) {
    // Generate all ordered pairs (with repetition)
    for (let i = 0; i < activeFonts.length; i++) {
      for (let j = 0; j < activeFonts.length; j++) {
        if (numLines === 1) {
          combinations.push([activeFonts[i].id]);
        } else {
          combinations.push([activeFonts[i].id, activeFonts[j].id]);
        }
      }
    }
  } else {
    // For 3+ lines, generate all pairs for first 2 lines and random for the rest, cap at 100
    for (let i = 0; i < activeFonts.length; i++) {
      for (let j = 0; j < activeFonts.length; j++) {
        const combo: string[] = [activeFonts[i].id, activeFonts[j].id];
        for (let k = 2; k < numLines; k++) {
          combo.push(activeFonts[Math.floor(Math.random() * activeFonts.length)].id);
        }
        combinations.push(combo);
        if (combinations.length >= 100) break;
      }
      if (combinations.length >= 100) break;
    }
  }

  return combinations.map((fontIds, idx) => ({
    id: `tile-${idx}-${fontIds.join('-')}`,
    imageUrl: images[idx % images.length],
    fontIds,
  }));
}

export function randomizeTiles(
  fonts: FontDef[],
  images: string[],
  textContent: string,
  count: number = 50
): TileData[] {
  const activeFonts = fonts.filter((f) => f.isActive !== false);
  if (activeFonts.length === 0 || images.length === 0) return [];

  const lines = textContent.split('\n').filter((l) => l.length > 0);
  const numLines = Math.max(lines.length, 1);

  const shuffledImages = shuffleArray(images);

  return Array.from({ length: count }, (_, idx) => ({
    id: `rand-${idx}-${Date.now()}`,
    imageUrl: shuffledImages[idx % shuffledImages.length],
    fontIds: Array.from({ length: numLines }, () => {
      return activeFonts[Math.floor(Math.random() * activeFonts.length)].id;
    }),
  }));
}
