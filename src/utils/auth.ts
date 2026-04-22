import { supabase } from '../lib/supabase'

/**
 * Get the current authenticated user ID
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}
