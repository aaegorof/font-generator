import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AuthButton } from './AuthButton'
import * as useAuthModule from '../../hooks/useAuth'

vi.mock('../../hooks/useAuth')

describe('AuthButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('should show loading state', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: true,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      error: null,
    })

    render(<AuthButton />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should show sign in button when not authenticated', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      error: null,
    })

    render(<AuthButton />)
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument()
  })

  it('should call signInWithGoogle when sign in button is clicked', () => {
    const mockSignIn = vi.fn()
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithGoogle: mockSignIn,
      signOut: vi.fn(),
      error: null,
    })

    render(<AuthButton />)
    const signInButton = screen.getByText('Sign in with Google')
    fireEvent.click(signInButton)
    expect(mockSignIn).toHaveBeenCalledTimes(1)
  })

  it('should show user email and sign out button when authenticated', () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    }

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      error: null,
    })

    render(<AuthButton />)
    expect(screen.getByText('test@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign out')).toBeInTheDocument()
  })

  it('should call signOut when sign out button is clicked', () => {
    const mockSignOut = vi.fn()
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2024-01-01',
    }

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: mockUser,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: mockSignOut,
      error: null,
    })

    render(<AuthButton />)
    const signOutButton = screen.getByText('Sign out')
    fireEvent.click(signOutButton)
    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('should display error message when error exists', () => {
    const mockError = new Error('Authentication failed')
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      session: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      error: mockError,
    })

    render(<AuthButton />)
    expect(screen.getByText('Authentication failed')).toBeInTheDocument()
  })
})
