import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuthCallback() {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if we're handling an OAuth callback
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')

    if (accessToken) {
      handleCallback()
    }
  }, [])

  const handleCallback = async () => {
    setProcessing(true)
    setError(null)

    try {
      // Supabase automatically handles the callback
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      if (!session) throw new Error('No session after callback')

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)

      setProcessing(false)
    } catch (err) {
      console.error('Auth callback error:', err)
      setError(err instanceof Error ? err.message : 'Authentication failed')
      setProcessing(false)
    }
  }

  return { processing, error }
}
