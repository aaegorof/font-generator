import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BatchDeleteService } from '../batchDelete'
import { FontSyncService } from '../fontSync'
import { ImageSyncService } from '../imageSync'

vi.mock('../fontSync')
vi.mock('../imageSync')

describe('BatchDeleteService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteFonts', () => {
    it('should delete multiple fonts successfully', async () => {
      vi.mocked(FontSyncService.deleteFontWithFile).mockResolvedValue()

      const result = await BatchDeleteService.deleteFonts('user-123', [
        'font-1',
        'font-2',
        'font-3',
      ])

      expect(result.succeeded).toEqual(['font-1', 'font-2', 'font-3'])
      expect(result.failed).toEqual([])
      expect(FontSyncService.deleteFontWithFile).toHaveBeenCalledTimes(3)
    })

    it('should handle partial failures', async () => {
      vi.mocked(FontSyncService.deleteFontWithFile)
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce()

      const result = await BatchDeleteService.deleteFonts('user-123', [
        'font-1',
        'font-2',
        'font-3',
      ])

      expect(result.succeeded).toEqual(['font-1', 'font-3'])
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]).toEqual({
        id: 'font-2',
        error: 'Delete failed',
      })
    })

    it('should handle all failures', async () => {
      vi.mocked(FontSyncService.deleteFontWithFile).mockRejectedValue(
        new Error('Delete failed'),
      )

      const result = await BatchDeleteService.deleteFonts('user-123', ['font-1', 'font-2'])

      expect(result.succeeded).toEqual([])
      expect(result.failed).toHaveLength(2)
    })

    it('should handle empty array', async () => {
      const result = await BatchDeleteService.deleteFonts('user-123', [])

      expect(result.succeeded).toEqual([])
      expect(result.failed).toEqual([])
      expect(FontSyncService.deleteFontWithFile).not.toHaveBeenCalled()
    })
  })

  describe('deleteImages', () => {
    it('should delete multiple images successfully', async () => {
      vi.mocked(ImageSyncService.deleteImageWithFile).mockResolvedValue()

      const result = await BatchDeleteService.deleteImages('user-123', [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
      ])

      expect(result.succeeded).toEqual([
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
      ])
      expect(result.failed).toEqual([])
      expect(ImageSyncService.deleteImageWithFile).toHaveBeenCalledTimes(3)
    })

    it('should handle partial failures', async () => {
      vi.mocked(ImageSyncService.deleteImageWithFile)
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Delete failed'))
        .mockResolvedValueOnce()

      const result = await BatchDeleteService.deleteImages('user-123', [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
      ])

      expect(result.succeeded).toEqual([
        'https://example.com/1.jpg',
        'https://example.com/3.jpg',
      ])
      expect(result.failed).toHaveLength(1)
      expect(result.failed[0]).toEqual({
        url: 'https://example.com/2.jpg',
        error: 'Delete failed',
      })
    })

    it('should handle all failures', async () => {
      vi.mocked(ImageSyncService.deleteImageWithFile).mockRejectedValue(
        new Error('Delete failed'),
      )

      const result = await BatchDeleteService.deleteImages('user-123', [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
      ])

      expect(result.succeeded).toEqual([])
      expect(result.failed).toHaveLength(2)
    })

    it('should handle empty array', async () => {
      const result = await BatchDeleteService.deleteImages('user-123', [])

      expect(result.succeeded).toEqual([])
      expect(result.failed).toEqual([])
      expect(ImageSyncService.deleteImageWithFile).not.toHaveBeenCalled()
    })
  })
})
