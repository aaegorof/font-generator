import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'

export const AuthButton = () => {
  const { user, loading, signInWithGoogle, signOut, error } = useAuth()

  if (loading) {
    return <div>Loading...</div>
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span>{user.email}</span>
        <Button size="sm" onClick={signOut}>
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" onClick={signInWithGoogle}>
        Sign in with Google
      </Button>
      {error && <div className="mt-1 text-sm text-destructive">{error.message}</div>}
    </>
  )
}
