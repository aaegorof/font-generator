/**
 * Google Fonts API Service
 * Fetches and caches Google Fonts metadata from the Web Fonts API v1
 */

/**
 * Google Fonts API response type
 */
export interface GoogleFontFamily {
  family: string
  category: string
  variants: string[]
  subsets?: string[]
  version?: string
  lastModified?: string
  files?: Record<string, string>
}

export interface GoogleFontsApiResponse {
  kind: string
  items: GoogleFontFamily[]
}

/**
 * In-memory cache for Google Fonts API response
 */
let googleFontsCache: GoogleFontFamily[] | null = null

/**
 * Read Google Fonts Web API key from Vite env (client bundle only exposes `VITE_*`).
 * Supports both naming conventions used in docs / .env examples.
 */
export function getGoogleFontsApiKey(): string | undefined {
  const a = import.meta.env.VITE_GOOGLE_FONTS_API_KEY
  const b = import.meta.env.VITE_GOOGLE_FONT_API_KEY
  const key = typeof a === 'string' && a.trim() ? a.trim() : typeof b === 'string' ? b.trim() : ''
  return key || undefined
}

/** True when a non-empty API key is present — otherwise {@link fetchFontList} will not call the network. */
export function isGoogleFontsApiConfigured(): boolean {
  return Boolean(getGoogleFontsApiKey())
}

/**
 * Fetch the complete list of Google Fonts from the API
 * Returns cached data if available, otherwise fetches from API
 *
 * @returns Promise resolving to array of Google Font families
 */
export async function fetchFontList(): Promise<GoogleFontFamily[]> {
  // Return cached data if available
  if (googleFontsCache !== null) {
    return googleFontsCache
  }

  const apiKey = getGoogleFontsApiKey()

  if (!apiKey) {
    console.warn(
      'Google Fonts API key missing: set VITE_GOOGLE_FONTS_API_KEY or VITE_GOOGLE_FONT_API_KEY in .env — Google Fonts library will stay empty until configured.',
    )
    return []
  }

  try {
    const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${apiKey}`
    const response = await fetch(url)

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 400) {
        console.error('Google Fonts API: Invalid API key')
      } else if (response.status === 429) {
        console.error('Google Fonts API: Rate limit exceeded')
      } else {
        console.error(`Google Fonts API error: ${response.status} ${response.statusText}`)
      }
      return []
    }

    const data: GoogleFontsApiResponse = await response.json()

    if (!data.items || !Array.isArray(data.items)) {
      console.warn('Google Fonts API returned unexpected data structure')
      return []
    }

    // Cache the response for the session
    googleFontsCache = data.items

    return data.items
  } catch (error) {
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Google Fonts API: Network error - check internet connection')
    } else {
      console.error('Google Fonts API: Unexpected error:', error)
    }
    return []
  }
}

/**
 * Clear the cached Google Fonts data
 * Useful for testing or forcing a refresh
 */
export function clearFontCache(): void {
  googleFontsCache = null
}

/**
 * Check if Google Fonts data is currently cached
 */
export function isCached(): boolean {
  return googleFontsCache !== null
}
