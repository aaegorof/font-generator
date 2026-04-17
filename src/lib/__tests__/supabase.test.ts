import { describe, it, expect, beforeAll } from 'vitest'
import { supabase } from '../supabase'

describe('Supabase Client', () => {
  beforeAll(() => {
    if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.warn('VITE_SUPABASE_ANON_KEY not set, tests may fail')
    }
  })

  it('should be defined', () => {
    expect(supabase).toBeDefined()
  })

  it('should have auth property', () => {
    expect(supabase.auth).toBeDefined()
  })

  it('should be able to get session', async () => {
    const { data, error } = await supabase.auth.getSession()

    expect(error).toBeNull()
    expect(data).toBeDefined()
    expect(data.session).toBeNull()
  })

  it('should be able to access storage', () => {
    expect(supabase.storage).toBeDefined()
  })
})
