import { useAuth } from '../../hooks/useAuth'

export const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut, error } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{user.email}</span>
        <button className="status-bar__action-btn status-bar__action-btn--outline" onClick={signOut}>Sign out</button>
      </div>
    )
  }

  return (
    <div className="status-bar__action-btn status-bar__action-btn--outline">
      <button onClick={signInWithGoogle}>Sign in with Google</button>
      {error && <div style={{ color: 'red', marginTop: '5px' }}>{error.message}</div>}
    </div>
  )
}
