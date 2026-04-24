import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUserData } from '../useUserData'
import { supabase } from '../../lib/supabase'
import type { User } from '@supabase/supabase-js'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock('../../store/useStore', () => ({
  useStore: vi.fn((selector) =>
    selector({
      importAllSettings: vi.fn(),
    }),
  ),
}))

describe('useUserData', () => {
  const mockUser: User = {
    id: 'test-user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should exist and be importable', () => {
    expect(useUserData).toBeDefined()
  })

  it('should load user profile if it exists', async () => {
    const mockProfile = {
      id: 'test-user-123',
      settings: { columns: 4, padding: 24 },
      text_inputs: [],
    }

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: mockProfile,
          error: null,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    renderHook(() => useUserData(mockUser))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    })
  })

  it('should create user profile on first login (profile not found)', async () => {
    // Mock profile not found
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // Not found error
        }),
      }),
    })

    const mockInsert = vi.fn().mockResolvedValue({
      error: null,
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
    } as any)

    renderHook(() => useUserData(mockUser))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-user-123',
          settings: expect.any(Object),
          text_inputs: expect.any(Array),
        }),
      )
    })
  })

  it('should clear store data when user logs out (user is null)', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-user-123' },
          error: null,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    const { rerender } = renderHook(({ user }) => useUserData(user), {
      initialProps: { user: mockUser },
    })

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('user_profiles')
    })

    // Clear mocks after first render
    vi.clearAllMocks()

    // Simulate logout
    rerender({ user: null as any })

    // Should not fetch profile again
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('should handle errors when loading profile', async () => {
    const error = new Error('Database connection failed')

    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    // Should not throw, just log error
    const { result } = renderHook(() => useUserData(mockUser))

    await waitFor(() => {
      // Hook should complete without crashing
      expect(result.current).toBeUndefined()
    })
  })

  it('should reload data when user changes', async () => {
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'test-user-123' },
          error: null,
        }),
      }),
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
    } as any)

    const { rerender } = renderHook(({ user }) => useUserData(user), {
      initialProps: { user: mockUser },
    })

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    // Change user
    const newUser = { ...mockUser, id: 'different-user-456' }
    rerender({ user: newUser })

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(2)
    })
  })
})
