import type { FontDef } from '../types'

export const DEFAULT_FONTS: FontDef[] = [
  {
    id: 'collidge-bold',
    name: 'Collidge Bold',
    family: 'Collidge',
    weight: 700,
    source: 'local',
    localFile: 'Collidge-Bold',
    isActive: true,
  },
  {
    id: 'radeil-3d',
    name: 'Radeil 3D',
    family: 'Radeil3D',
    weight: 400,
    source: 'local',
    localFile: 'Radeil3D',
    isActive: true,
  },
  {
    id: 'wilker',
    name: 'Wilker',
    family: 'Wilker',
    weight: 400,
    source: 'local',
    localFile: 'Wilker',
    isActive: true,
  },
  {
    id: 'codec-pro',
    name: 'Codec Pro',
    family: 'CodecPro',
    weight: 400,
    source: 'local',
    localFile: 'CodecPro',
    isActive: true,
  },
  {
    id: 'jost',
    name: 'Jost',
    family: 'Jost',
    weight: 400,
    source: 'google',
    isActive: true,
  },
  {
    id: 'portico',
    name: 'Portico',
    family: 'Portico',
    weight: 400,
    source: 'local',
    localFile: 'Portico',
    isActive: true,
  },
  {
    id: 'gibson',
    name: 'Gibson',
    family: 'Gibson',
    weight: 400,
    source: 'local',
    localFile: 'Gibson',
    isActive: true,
  },
  // Bonus Google Fonts available immediately
  {
    id: 'bebas-neue',
    name: 'Bebas Neue',
    family: 'Bebas Neue',
    weight: 400,
    source: 'google',
    isActive: true,
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    family: 'Playfair Display',
    weight: 700,
    source: 'google',
    isActive: true,
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    family: 'Space Grotesk',
    weight: 700,
    source: 'google',
    isActive: true,
  },
]

const GOOGLE_FONT_FAMILIES = [
  'Jost:wght@300;400;500;700',
  'Bebas+Neue',
  'Playfair+Display:wght@700;900',
  'Space+Grotesk:wght@400;700',
]

export function setupGoogleFonts() {
  const id = 'google-fonts-link'
  if (document.getElementById(id)) return
  const link = document.createElement('link')
  link.id = id
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?${GOOGLE_FONT_FAMILIES.map((f) => `family=${f}`).join('&')}&display=swap`
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
       url('/fonts/${f.localFile}.ttf') format('truetype');
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
  style.textContent = `@font-face {
  font-family: '${font.family}';
  src: url('${font.uploadUrl}');
  font-weight: ${font.weight};
  font-display: swap;
}`
}

export async function loadFontFile(file: File): Promise<FontDef> {
  const url = URL.createObjectURL(file)
  const baseName = file.name.replace(/\.(woff2?|ttf|otf)$/i, '')
  const family = baseName.replace(/[-_]/g, ' ')

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
