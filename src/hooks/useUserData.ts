import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export function useUserData(user: User | null) {
  useEffect(() => {
    if (!user) {
      // Clear store on logout
      // Will be implemented in Story 8.2
      return
    }

    const createUserProfile = async (userId: string) => {
      try {
        const { error } = await supabase.from('user_profiles').insert({
          id: userId,
          settings: {
            columns: 4,
            padding: 24,
            overlayOpacity: 0.25,
            grayscale: false,
          },
          text_inputs: [
            {
              id: 'input-default-1',
              text: 'de Tribe',
              fontSize: 56,
              letterSpacing: 0.02,
              lineHeight: 1.0,
              textColor: '#ffffff',
              textShadow: true,
              textWrap: true,
              alignment: 'center',
              verticalAlignment: 'center',
            },
          ],
          toolbar_open: true,
          layer_font_pins: {},
          disabled_images: [],
        })

        if (error) throw error
        console.log('User profile created')
      } catch (err) {
        console.error('Error creating user profile:', err)
        throw err
      }
    }

    const loadUserData = async (userId: string) => {
      try {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 = not found, which is OK for first login
          throw profileError
        }

        if (!profile) {
          // First login - create profile with default data
          await createUserProfile(userId)
        } else {
          // Load existing data into store
          // Will be implemented in Story 8.2
          console.log('User profile loaded:', profile)
        }
      } catch (err) {
        console.error('Error loading user data:', err)
      }
    }

    loadUserData(user.id)
  }, [user])
}
