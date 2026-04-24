import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FontSyncService } from '../fontSync'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    storage: {
      from: vi.fn(),
    },
  },
}))

describe('FontSyncService - Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('deleteFont', () => {
    it('should delete font from database', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      })

      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any)

      await FontSyncService.deleteFont('user-123', 'font-456')

      expect(supabase.from).toHaveBeenCalledWith('user_fonts')
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

      await expect(FontSyncService.deleteFont('user-123', 'font-456')).rejects.toThrow()
    })
  })

  describe('deleteFontFile', () => {
    it('should delete font file from storage', async () => {
      const mockRemove = vi.fn().mockResolvedValue({ error: null })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await FontSyncService.deleteFontFile('user-123/font-456.woff2')

      expect(supabase.storage.from).toHaveBeenCalledWith('user-fonts')
      expect(mockRemove).toHaveBeenCalledWith(['user-123/font-456.woff2'])
    })

    it('should throw error if storage delete fails', async () => {
      const mockError = new Error('Storage error')
      const mockRemove = vi.fn().mockResolvedValue({ error: mockError })

      vi.mocked(supabase.storage.from).mockReturnValue({
        remove: mockRemove,
      } as any)

      await expect(
        FontSyncService.deleteFontFile('user-123/font-456.woff2'),
      ).rejects.toThrow()
    })
  })

  describe('deleteFontWithFile', () => {
    it('should delete font from database and storage', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { storage_path: 'user-123/font-456.woff2' },
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

      await FontSyncService.deleteFontWithFile('user-123', 'font-456')

      expect(mockSelect).toHaveBeenCalled()
      expect(mockDelete).toHaveBeenCalled()
      expect(mockRemove).toHaveBeenCalledWith(['user-123/font-456.woff2'])
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

      await FontSyncService.deleteFontWithFile('user-123', 'font-456')

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
        FontSyncService.deleteFontWithFile('user-123', 'font-456'),
      ).rejects.toThrow()
    })
  })
})
