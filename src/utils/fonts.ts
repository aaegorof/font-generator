import type { FontDef, TileData } from '../types'

// ─── Constants ──────────────────────────────────────────────────────────────

export const FONT_PREVIEW_TEXT = 'The quick brown fox'

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

export const DEFAULT_FONTS: FontDef[] = [...GOOGLE_FONT_DEFS]

/** Google Fonts with source `google` that are active and referenced by at least one tile. */
export function collectActiveGoogleFontsUsedInTiles(fonts: FontDef[], tiles: TileData[]): FontDef[] {
  const usedIds = new Set<string>()
  for (const tile of tiles) {
    for (const id of tile.fontIds) {
      usedIds.add(id)
    }
  }
  return fonts.filter(
    (f) => f.source === 'google' && f.isActive !== false && usedIds.has(f.id),
  )
}

function encodeGoogleFontFamily(family: string): string {
  return family.trim().replace(/\s+/g, '+')
}

function normalizeFontWeight(weight: FontDef['weight']): number | null {
  const n = typeof weight === 'string' ? parseInt(weight, 10) : weight
  if (typeof n !== 'number' || !Number.isFinite(n)) return null
  if (n < 100 || n > 900) return null
  return n
}

/**
 * Builds a Google Fonts CSS API v2 URL for the given library fonts (grouped by family).
 * Handles italic via ital,wght axis when needed.
 */
export function buildGoogleFontsLibraryCssUrl(libraryFonts: FontDef[]): string {
  if (libraryFonts.length === 0) return ''

  const byFamily = new Map<string, { weight: number; italic: boolean }[]>()

  for (const font of libraryFonts) {
    const weight = normalizeFontWeight(font.weight)
    if (weight === null) continue
    const italic = font.style === 'italic'
    const list = byFamily.get(font.family) ?? []
    list.push({ weight, italic })
    byFamily.set(font.family, list)
  }

  const params: string[] = []

  for (const [family, rawPairs] of byFamily) {
    const seen = new Set<string>()
    const pairs: { weight: number; italic: boolean }[] = []
    for (const p of rawPairs) {
      const key = `${p.italic ? 1 : 0}:${p.weight}`
      if (seen.has(key)) continue
      seen.add(key)
      pairs.push(p)
    }
    if (pairs.length === 0) continue

    const encoded = encodeGoogleFontFamily(family)
    const allNormal = pairs.every((p) => !p.italic)
    const allItalic = pairs.every((p) => p.italic)

    let spec: string
    if (allNormal) {
      const weights = [...new Set(pairs.map((p) => p.weight))].sort((a, b) => a - b)
      spec = `family=${encoded}:wght@${weights.join(';')}`
    } else if (allItalic) {
      const specs = [...new Set(pairs.map((p) => `1,${p.weight}`))]
        .sort()
        .join(';')
      spec = `family=${encoded}:ital,wght@${specs}`
    } else {
      const specs = [...new Set(pairs.map((p) => `${p.italic ? 1 : 0},${p.weight}`))]
        .sort()
        .join(';')
      spec = `family=${encoded}:ital,wght@${specs}`
    }
    params.push(spec)
  }

  if (params.length === 0) return ''

  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`
}

// ─── Google Fonts Library Types & Utilities ─────────────────────────────────

export interface GoogleFontVariant {
  family: string
  variant: string
  weight: number
  style: string
}

/**
 * Converts Google Fonts API variant strings to FontDef objects.
 * 
 * @param family - Font family name (e.g., "Roboto")
 * @param variants - Array of variant strings from API (e.g., ["regular", "700", "italic", "700italic"])
 * @returns Array of FontDef objects, one per variant. Returns empty array if inputs are invalid.
 * 
 * Variant parsing rules:
 * - "regular" → weight 400, style normal
 * - "italic" → weight 400, style italic
 * - "700" → weight 700, style normal
 * - "700italic" → weight 700, style italic
 * 
 * Malformed or unrecognized variants are skipped with a console warning.
 */
export function parseGoogleFontVariants(family: string, variants: string[]): FontDef[] {
  if (!family || typeof family !== 'string' || family.trim() === '') {
    console.warn('parseGoogleFontVariants: invalid family name', family)
    return []
  }
  
  if (!Array.isArray(variants) || variants.length === 0) {
    console.warn('parseGoogleFontVariants: invalid or empty variants array', variants)
    return []
  }
  
  const results: FontDef[] = []
  
  for (const variant of variants) {
    if (typeof variant !== 'string' || variant.trim() === '') {
      continue
    }
    
    const parsed = parseVariant(variant)
    if (!parsed) {
      console.warn(`parseGoogleFontVariants: skipping invalid variant "${variant}" for ${family}`)
      continue
    }
    
    const { weight, style } = parsed
    const slug = sanitizeSlug(family)
    const id = `google-${slug}-${weight}-${style}`
    
    results.push({
      id,
      name: `${family} ${getWeightName(weight)} ${weight}`,
      family,
      weight,
      style,
      source: 'google',
      isActive: true,
    })
  }
  
  return results
}

function parseVariant(variant: string): { weight: number; style: string } | null {
  if (variant === 'regular') {
    return { weight: 400, style: 'normal' }
  }
  if (variant === 'italic') {
    return { weight: 400, style: 'italic' }
  }
  if (variant.endsWith('italic')) {
    const weightStr = variant.replace('italic', '')
    const weight = parseInt(weightStr, 10)
    if (isNaN(weight) || !isValidFontWeight(weight)) {
      return null
    }
    return { weight, style: 'italic' }
  }
  const weight = parseInt(variant, 10)
  if (isNaN(weight) || !isValidFontWeight(weight)) {
    return null
  }
  return { weight, style: 'normal' }
}

function isValidFontWeight(weight: number): boolean {
  return weight >= 100 && weight <= 900
}

function sanitizeSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getWeightName(weight: number): string {
  const weightNames: Record<number, string> = {
    100: 'Thin',
    200: 'Extra Light',
    300: 'Light',
    400: 'Regular',
    500: 'Medium',
    600: 'Semi Bold',
    700: 'Bold',
    800: 'Extra Bold',
    900: 'Black',
  }
  return weightNames[weight] || 'Regular'
}

// ─── Setup ───────────────────────────────────────────────────────────────────

const LEGACY_GOOGLE_FONTS_LINK_ID = 'google-fonts-link'
const GOOGLE_FONTS_LIBRARY_LINK_ID = 'google-fonts-library-link'

export function setupGoogleFonts(libraryFonts: FontDef[]) {
  const legacy = document.getElementById(LEGACY_GOOGLE_FONTS_LINK_ID)
  if (legacy) legacy.remove()

  const existing = document.getElementById(GOOGLE_FONTS_LIBRARY_LINK_ID)
  if (existing) existing.remove()

  const href = buildGoogleFontsLibraryCssUrl(libraryFonts)
  if (!href) return

  const link = document.createElement('link')
  link.id = GOOGLE_FONTS_LIBRARY_LINK_ID
  link.rel = 'stylesheet'
  link.href = href
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
