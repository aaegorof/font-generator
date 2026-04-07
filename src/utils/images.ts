// Picsum.photos supports CORS and is reliable for export
export const DEFAULT_IMAGES: string[] = [
  'https://picsum.photos/seed/alpine/800/600',
  'https://picsum.photos/seed/forest/800/600',
  'https://picsum.photos/seed/ocean/800/600',
  'https://picsum.photos/seed/desert/800/600',
  'https://picsum.photos/seed/city/800/600',
  'https://picsum.photos/seed/river/800/600',

]

export const LOCAL_IMAGE_PREFIX = '/images/'

export function isScannedLocalImage(url: string): boolean {
  return url.startsWith(LOCAL_IMAGE_PREFIX)
}

export async function fetchLocalImages(): Promise<string[]> {
  try {
    const res = await fetch('/list-images')
    if (!res.ok) {
      throw new Error(`Failed to fetch local images: ${res.status}`)
    }
    return (await res.json()) as string[]
  } catch (error) {
    console.warn('Local images scan unavailable; continuing with existing images only.', error)
    return []
  }
}
