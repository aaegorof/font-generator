import type { FontDef } from '../types'

// ─── Google Fonts config ────────────────────────────────────────────────────
// Single source of truth: drives both the FontDef list and the API URL.
// To add a new font just add an entry here.
// Browse available fonts at https://fonts.google.com
//
// weight      – the weight used for preview & tile rendering
// loadWeights – all weights to fetch from Google Fonts API
// isActive    – false = font appears in the list but is disabled by default

interface GoogleFontEntry {
  id: string
  name: string
  family: string
  weight: number
  loadWeights: number[]
  isActive?: boolean
}

const GOOGLE_FONTS: GoogleFontEntry[] = [
  { id: 'jost', name: 'Jost', family: 'Jost', weight: 400, loadWeights: [300, 400, 500, 700] },
  { id: 'bebas-neue', name: 'Bebas Neue', family: 'Bebas Neue', weight: 400, loadWeights: [400] },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: 'Playfair Display',
    weight: 700,
    loadWeights: [700, 900],
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    family: 'Space Grotesk',
    weight: 700,
    loadWeights: [400, 700],
  },
  {
    id: 'montserrat',
    name: 'Montserrat',
    family: 'Montserrat',
    weight: 700,
    loadWeights: [400, 700, 900],
    isActive: false,
  },
  {
    id: 'oswald',
    name: 'Oswald',
    family: 'Oswald',
    weight: 700,
    loadWeights: [400, 600, 700],
    isActive: false,
  },
  {
    id: 'inter',
    name: 'Inter',
    family: 'Inter',
    weight: 400,
    loadWeights: [300, 400, 600, 700],
    isActive: false,
  },
  {
    id: 'raleway',
    name: 'Raleway',
    family: 'Raleway',
    weight: 700,
    loadWeights: [400, 700, 900],
    isActive: false,
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    family: 'DM Sans',
    weight: 400,
    loadWeights: [300, 400, 700],
    isActive: false,
  },
]

const GOOGLE_FONT_DEFS: FontDef[] = GOOGLE_FONTS.map(({ id, name, family, weight, isActive }) => ({
  id,
  name,
  family,
  weight,
  source: 'google' as const,
  isActive: isActive ?? true,
}))

function buildGoogleFontsUrl(fonts: GoogleFontEntry[]): string {
  const params = fonts
    .map(({ family, loadWeights }) => {
      const encoded = family.replace(/ /g, '+')
      const sorted = [...loadWeights].sort((a, b) => a - b)
      return sorted.length === 1
        ? `family=${encoded}`
        : `family=${encoded}:wght@${sorted.join(';')}`
    })
    .join('&')
  return `https://fonts.googleapis.com/css2?${params}&display=swap`
}

export const DEFAULT_FONTS: FontDef[] = [...GOOGLE_FONT_DEFS]

// ─── Setup ───────────────────────────────────────────────────────────────────

export function setupGoogleFonts() {
  const id = 'google-fonts-link'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = buildGoogleFontsUrl(GOOGLE_FONTS)
  document.head.appendChild(link)
}

export function injectLocalFontFaces(fonts: FontDef[]) {
  const styleId = 'local-font-faces'
  let style = document.getElementById(styleId) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }
  const rules = fonts
    .filter((f) => f.source === 'local' && f.localFile)
    .map(
      (f) => `@font-face {
  font-family: '${f.family}';
  src: local('${f.name}'),
       url('/fonts/${f.localFile}.woff2') format('woff2'),
       url('/fonts/${f.localFile}.woff') format('woff'),
       url('/fonts/${f.localFile}.ttf') format('truetype'),
       url('/fonts/${f.localFile}.otf') format('opentype');
  font-weight: ${f.weight};
  font-display: swap;
}`,
    )
    .join('\n')

  style.textContent = rules
}

export function injectUploadedFont(font: FontDef) {
  if (!font.uploadUrl) return
  const styleId = `upload-font-${font.id}`
  let style = document.getElementById(styleId) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = styleId
    document.head.appendChild(style)
  }

  const format = getFontFormat(font.uploadUrl)
  style.textContent = `@font-face {
  font-family: '${font.family}';
  src: url('${font.uploadUrl}') format('${format}');
  font-weight: ${font.weight};
  font-display: swap;
}`
}

function getFontFormat(url: string): string {
  if (url.endsWith('.woff2')) return 'woff2'
  if (url.endsWith('.woff')) return 'woff'
  if (url.endsWith('.ttf')) return 'truetype'
  if (url.endsWith('.otf')) return 'opentype'
  return 'woff2'
}

export function removeUploadedFont(fontId: string) {
  const styleEl = document.getElementById(`upload-font-${fontId}`)
  if (styleEl) {
    styleEl.remove()
  }
}

export async function fetchLocalFonts(): Promise<FontDef[]> {
  try {
    const res = await fetch('/list-fonts')
    if (!res.ok) {
      throw new Error(`Failed to fetch local fonts: ${res.status}`)
    }

    const stems = (await res.json()) as string[]
    return stems.map((stem) => ({
      id: stem.toLowerCase().replace(/ /g, '-'),
      name: stem,
      family: stem,
      weight: 400,
      source: 'local',
      localFile: stem,
      isActive: true,
    }))
  } catch (error) {
    console.warn('Local fonts scan unavailable; continuing with Google fonts only.', error)
    return []
  }
}

export async function loadFontFile(file: File): Promise<FontDef> {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch('/upload-font', { method: 'POST', body: formData })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error ?? 'Upload failed')
  }

  const { family, url } = (await res.json()) as { filename: string; family: string; url: string }

  const fontFace = new FontFace(family, `url(${url})`)
  await fontFace.load()
  document.fonts.add(fontFace)

  return {
    id: `upload-${Date.now()}`,
    name: family,
    family,
    weight: 400,
    source: 'upload',
    uploadUrl: url,
    isActive: true,
  }
}
