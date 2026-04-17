import { renderHook, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useAuth } from '../useAuth'
import { supabase } from '../../lib/supabase'
import type { Session, User, AuthChangeEvent } from '@supabase/supabase-js'
import { AuthError } from '@supabase/supabase-js'

// Mock the supabase client
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}))

describe('useAuth', () => {
  let mockUnsubscribe: ReturnType<typeof vi.fn>
  let authStateChangeCallback: ((event: AuthChangeEvent, session: Session | null) => void) | null

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01T00:00:00Z',
  }

  const mockSession: Session = {
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
    user: mockUser,
  }

  beforeEach(() => {
    authStateChangeCallback = null
    mockUnsubscribe = vi.fn()

    // Setup default mocks
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    })

    vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
      authStateChangeCallback = callback
      return {
        data: {
          subscription: {
            id: 'test-subscription-id',
            callback,
            unsubscribe: mockUnsubscribe,
          },
        },
      }
    })

    vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
      data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
      error: null,
    })

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth())

      expect(result.current.loading).toBe(true)
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.error).toBeNull()
    })

    it('should load null session on mount when not authenticated', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(supabase.auth.getSession).toHaveBeenCalledOnce()
    })

    it('should load existing session on mount when authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
    })

    it('should subscribe to auth state changes on mount', () => {
      renderHook(() => useAuth())

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledOnce()
      expect(supabase.auth.onAuthStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should unsubscribe from auth state changes on unmount', () => {
      const { unmount } = renderHook(() => useAuth())

      unmount()

      expect(mockUnsubscribe).toHaveBeenCalledOnce()
    })
  })

  describe('Auth State Changes', () => {
    it('should update state when user signs in via auth state change', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()

      // Simulate sign in event
      act(() => {
        authStateChangeCallback?.('SIGNED_IN', mockSession)
      })

      expect(result.current.user).toEqual(mockUser)
      expect(result.current.session).toEqual(mockSession)
      expect(result.current.loading).toBe(false)
    })

    it('should update state when user signs out via auth state change', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toEqual(mockUser)

      // Simulate sign out event
      act(() => {
        authStateChangeCallback?.('SIGNED_OUT', null)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
      expect(result.current.loading).toBe(false)
    })

    it('should update state when token is refreshed', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const newSession = { ...mockSession, access_token: 'new-token' }

      act(() => {
        authStateChangeCallback?.('TOKEN_REFRESHED', newSession)
      })

      expect(result.current.session).toEqual(newSession)
      expect(result.current.user).toEqual(mockUser)
    })

    it('should update state when user data is updated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const updatedUser = { ...mockUser, email: 'updated@example.com' }
      const updatedSession = { ...mockSession, user: updatedUser }

      act(() => {
        authStateChangeCallback?.('USER_UPDATED', updatedSession)
      })

      expect(result.current.user).toEqual(updatedUser)
      expect(result.current.session).toEqual(updatedSession)
    })
  })

  describe('signInWithGoogle', () => {
    it('should call Supabase signInWithOAuth with correct parameters', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
    })

    it('should clear previous errors when signing in', async () => {
      vi.mocked(supabase.auth.signInWithOAuth)
        .mockResolvedValueOnce({
          data: { provider: 'google', url: null },
          error: new AuthError('First error', 400),
        })
        .mockResolvedValueOnce({
          data: { provider: 'google', url: 'https://accounts.google.com/oauth' },
          error: null,
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // First call with error
      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(result.current.error).toBeTruthy()

      // Second call should clear error
      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set error state when signInWithOAuth fails', async () => {
      const mockError = new AuthError('OAuth error', 400)
      vi.mocked(supabase.auth.signInWithOAuth).mockResolvedValue({
        data: { provider: 'google', url: null },
        error: mockError,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('OAuth error')
      expect(consoleSpy).toHaveBeenCalledWith('Error signing in with Google:', mockError)

      consoleSpy.mockRestore()
    })

    it('should handle network errors during sign in', async () => {
      const networkError = new Error('Network error')
      vi.mocked(supabase.auth.signInWithOAuth).mockRejectedValue(networkError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signInWithGoogle()
      })

      expect(result.current.error).toEqual(networkError)
      expect(consoleSpy).toHaveBeenCalledWith('Error signing in with Google:', networkError)

      consoleSpy.mockRestore()
    })
  })

  describe('signOut', () => {
    it('should call Supabase signOut', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(supabase.auth.signOut).toHaveBeenCalledOnce()
    })

    it('should clear previous errors when signing out', async () => {
      vi.mocked(supabase.auth.signOut)
        .mockResolvedValueOnce({
          error: new AuthError('First error', 400),
        })
        .mockResolvedValueOnce({
          error: null,
        })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // First call with error
      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.error).toBeTruthy()

      // Second call should clear error
      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.error).toBeNull()
    })

    it('should set error state when signOut fails', async () => {
      const mockError = new AuthError('Sign out failed', 400)
      vi.mocked(supabase.auth.signOut).mockResolvedValue({
        error: mockError,
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toBe('Sign out failed')
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', mockError)

      consoleSpy.mockRestore()
    })

    it('should handle network errors during sign out', async () => {
      const networkError = new Error('Network connection failed')
      vi.mocked(supabase.auth.signOut).mockRejectedValue(networkError)

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.signOut()
      })

      expect(result.current.error).toEqual(networkError)
      expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', networkError)

      consoleSpy.mockRestore()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple rapid auth state changes', async () => {
      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Rapid state changes
      act(() => {
        authStateChangeCallback?.('SIGNED_IN', mockSession)
        authStateChangeCallback?.('TOKEN_REFRESHED', mockSession)
        authStateChangeCallback?.('SIGNED_OUT', null)
      })

      // Final state should be signed out
      expect(result.current.user).toBeNull()
      expect(result.current.session).toBeNull()
    })

    it('should not crash if onAuthStateChange callback is called after unmount', async () => {
      const { result, unmount } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      unmount()

      // This should not throw
      expect(() => {
        authStateChangeCallback?.('SIGNED_IN', mockSession)
      }).not.toThrow()
    })

    it('should handle session with null user', async () => {
      const sessionWithoutUser: Session = {
        ...mockSession,
        user: null as unknown as User,
      }

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: sessionWithoutUser },
        error: null,
      })

      const { result } = renderHook(() => useAuth())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.user).toBeNull()
      expect(result.current.session).toEqual(sessionWithoutUser)
    })
  })
})
