import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  fetchFontList,
  clearFontCache,
  isCached,
  type GoogleFontFamily,
  type GoogleFontsApiResponse,
} from '../googleFontsApi'

describe('googleFontsApi', () => {
  const mockApiKey = 'test-api-key-12345'
  const mockFontData: GoogleFontFamily[] = [
    {
      family: 'Roboto',
      category: 'sans-serif',
      variants: ['regular', '700', 'italic', '700italic'],
    },
    {
      family: 'Open Sans',
      category: 'sans-serif',
      variants: ['300', 'regular', '700'],
    },
    {
      family: 'Lora',
      category: 'serif',
      variants: ['regular', '700'],
    },
  ]

  const mockApiResponse: GoogleFontsApiResponse = {
    kind: 'webfonts#webfontList',
    items: mockFontData,
  }

  beforeEach(() => {
    // Clear cache before each test
    clearFontCache()
    // Mock environment variable
    vi.stubEnv('VITE_GOOGLE_FONTS_API_KEY', mockApiKey)
    // Clear console mocks
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  describe('fetchFontList', () => {
    it('should fetch fonts from API successfully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      const result = await fetchFontList()

      expect(result).toEqual(mockFontData)
      expect(global.fetch).toHaveBeenCalledWith(
        `https://www.googleapis.com/webfonts/v1/webfonts?key=${mockApiKey}`,
      )
      expect(isCached()).toBe(true)
    })

    it('should return cached data on subsequent calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      // First call
      const result1 = await fetchFontList()
      expect(result1).toEqual(mockFontData)

      // Second call should use cache
      const result2 = await fetchFontList()
      expect(result2).toEqual(mockFontData)
      expect(global.fetch).toHaveBeenCalledTimes(1) // Only called once
    })

    it('should return empty array if API key is missing', async () => {
      vi.stubEnv('VITE_GOOGLE_FONTS_API_KEY', undefined)
      vi.stubEnv('VITE_GOOGLE_FONT_API_KEY', undefined)

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Google Fonts API key missing'),
      )
    })

    it('should handle 400 error (invalid API key)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith('Google Fonts API: Invalid API key')
    })

    it('should handle 429 error (rate limit)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      })

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith('Google Fonts API: Rate limit exceeded')
    })

    it('should handle other HTTP errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Google Fonts API error: 500 Internal Server Error',
      )
    })

    it('should handle network errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Network error'),
      )
    })

    it('should handle unexpected API response structure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'structure' }),
      })

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'Google Fonts API returned unexpected data structure',
      )
    })

    it('should handle non-array items in response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ kind: 'webfonts#webfontList', items: 'not-an-array' }),
      })

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.warn).toHaveBeenCalledWith(
        'Google Fonts API returned unexpected data structure',
      )
    })

    it('should handle unexpected errors', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Unexpected error'))

      const result = await fetchFontList()

      expect(result).toEqual([])
      expect(console.error).toHaveBeenCalledWith(
        'Google Fonts API: Unexpected error:',
        expect.any(Error),
      )
    })
  })

  describe('clearFontCache', () => {
    it('should clear the cached data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      // Fetch to populate cache
      await fetchFontList()
      expect(isCached()).toBe(true)

      // Clear cache
      clearFontCache()
      expect(isCached()).toBe(false)

      // Next fetch should call API again
      await fetchFontList()
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })

  describe('isCached', () => {
    it('should return false initially', () => {
      expect(isCached()).toBe(false)
    })

    it('should return true after successful fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      await fetchFontList()
      expect(isCached()).toBe(true)
    })

    it('should return false after clearing cache', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockApiResponse,
      })

      await fetchFontList()
      clearFontCache()
      expect(isCached()).toBe(false)
    })
  })
})
