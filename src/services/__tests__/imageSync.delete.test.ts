import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ImageSyncService } from '../imageSync'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

describe('ImageSyncService - Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteImage', () => {
    it('should delete image from database', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      await ImageSyncService.deleteImage('user-123', 'https://example.com/image.jpg')

      expect(supabase.from).toHaveBeenCalledWith('user_images')
      expect(mockDelete).toHaveBeenCalled()
    })

    it('should throw error if database delete fails', async () => {
      const mockError = new Error('Database error')
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: mockError }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      await expect(
        ImageSyncService.deleteImage('user-123', 'https://example.com/image.jpg'),
      ).rejects.toThrow()
    })
  })

  describe('deleteImageFile', () => {
    it('should delete image file from storage', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await ImageSyncService.deleteImageFile('user-123/image-456.jpg')

      expect(supabase.storage.from).toHaveBeenCalledWith('user-images')
      expect(mockRemove).toHaveBeenCalledWith(['user-123/image-456.jpg'])
    })

    it('should throw error if storage delete fails', async () => {
      const mockError = new Error('Storage error')
      const mockRemove = vi.fn().mockResolvedValue({ error: mockError })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await expect(
        ImageSyncService.deleteImageFile('user-123/image-456.jpg'),
      ).rejects.toThrow()
    })
  })

  describe('deleteImageWithFile', () => {
    it('should delete image from database and storage', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { storage_path: 'user-123/image-456.jpg' },
              error: null,
            }),
          }),
        }),
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const mockRemove = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      } as any)

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await ImageSyncService.deleteImageWithFile('user-123', 'https://example.com/image.jpg')

      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockRemove).toHaveBeenCalledWith(['user-123/image-456.jpg'])
    })

    it('should only delete from database if no storage_path exists', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { storage_path: null },
              error: null,
            }),
          }),
        }),
      })

      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      const mockRemove = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
        delete: mockDelete,
      } as any)

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await ImageSyncService.deleteImageWithFile('user-123', 'https://example.com/image.jpg')

      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockRemove).not.toHaveBeenCalled()
    })

    it('should throw error if fetch fails', async () => {
      const mockError = new Error('Fetch error')
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any)

      await expect(
        ImageSyncService.deleteImageWithFile('user-123', 'https://example.com/image.jpg'),
      ).rejects.toThrow()
    })
  })
})
