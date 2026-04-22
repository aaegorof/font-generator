import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuthCallback } from '../useAuthCallback'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

describe('useAuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset URL
    window.history.replaceState({}, '', '/')
  })

  it('should exist and be importable', () => {
    expect(useAuthCallback).toBeDefined()
  })

  it('should detect OAuth callback with access_token in URL hash', async () => {
    // Simulate OAuth redirect
    window.location.hash = '#access_token=fake_token&token_type=bearer'

    const mockSession = {
      access_token: 'fake_token',
      user: { id: 'test-user-id', email: 'test@example.com' },
    }

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any)

    const { result } = renderHook(() => useAuthCallback())

    // Should start processing
    expect(result.current.processing).toBe(true)

    await waitFor(() => {
      expect(result.current.processing).toBe(false)
    })

    // Should have called getSession
    expect(supabase.auth.getSession).toHaveBeenCalled()
  })

  it('should clean URL hash after processing callback', async () => {
    window.location.hash = '#access_token=fake_token'

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { user: { id: 'test' } } },
      error: null,
    } as any)

    renderHook(() => useAuthCallback())

    await waitFor(() => {
      // URL should be cleaned
      expect(window.location.hash).toBe('')
    })
  })

  it('should handle errors during callback processing', async () => {
    window.location.hash = '#access_token=fake_token'

    const error = new Error('Session fetch failed')
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error,
    } as any)

    const { result } = renderHook(() => useAuthCallback())

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
      expect(result.current.processing).toBe(false)
    })
  })

  it('should not process if no OAuth params in URL', () => {
    // Clean URL, no hash
    const { result } = renderHook(() => useAuthCallback())

    // Should not be processing
    expect(result.current.processing).toBe(false)
    expect(supabase.auth.getSession).not.toHaveBeenCalled()
  })
})
