import { useAuth } from '../hooks/useAuth'

/**
 * Manual test component for useAuth hook
 * 
 * Usage:
 * 1. Import this component in App.tsx temporarily
 * 2. Click "Sign In with Google" to test OAuth flow
 * 3. After auth, user email should display
 * 4. Click "Sign Out" to test sign out flow
 * 
 * Remove this component after manual testing is complete.
 */
export const AuthTest = () => {
  const { user, loading, signInWithGoogle, signOut, error } = useAuth()

  if (loading) {
    return (
      <div style={{ padding: '20px', border: '2px solid #ccc', margin: '20px' }}>
        <p>Loading authentication state...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', border: '2px solid #ccc', margin: '20px' }}>
      <h2>Auth Test Component</h2>
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#fee' }}>
          Error: {error.message}
        </div>
      )}
      {user ? (
        <div>
          <p>
            ✅ Logged in as: <strong>{user.email}</strong>
          </p>
          <p>User ID: {user.id}</p>
          <button
            onClick={signOut}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <p>❌ Not logged in</p>
          <button
            onClick={signInWithGoogle}
            style={{
              padding: '10px 20px',
              background: '#4285f4',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Sign In with Google
          </button>
        </div>
      )}
    </div>
  )
}
