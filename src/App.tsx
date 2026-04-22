import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { Grid } from './components/Grid'
import { StatusBar } from './components/StatusBar'
import { FavoritesViewer } from './components/FavoritesViewer'
import { useStore } from './store/useStore'
import { useAuth } from './hooks/useAuth'
import { useAuthCallback } from './hooks/useAuthCallback'
import { useUserData } from './hooks/useUserData'
import { useSupabaseSync } from './hooks/useSupabaseSync'
import {
  fetchLocalFonts,
  setupGoogleFonts,
  injectLocalFontFaces,
  injectUploadedFont,
} from './utils/fonts'
import { fetchLocalImages } from './utils/images'
import './App.css'

export default function App() {
  const { fonts } = useStore()
  const { user, loading } = useAuth()
  const { processing, error: callbackError } = useAuthCallback()
  useUserData(user)
  useSupabaseSync(user?.id ?? null)

  useEffect(() => {
    // Set up fonts
    setupGoogleFonts()
    fetchLocalFonts().then((localFonts) => {
      useStore.getState().setLocalFonts(localFonts)
    })
    fetchLocalImages().then((localImages) => {
      useStore.getState().setLocalImages(localImages)
    })

    const { fonts: currentFonts, generateTiles, tiles } = useStore.getState()
    injectLocalFontFaces(currentFonts)

    // Inject uploaded fonts
    currentFonts
      .filter((f) => f.source === 'upload' && f.uploadUrl)
      .forEach((f) => injectUploadedFont(f))

    // Generate initial tiles if none exist
    if (tiles.length === 0) {
      generateTiles()
    }
  }, [])

  // Re-inject font faces when fonts list changes
  useEffect(() => {
    injectLocalFontFaces(fonts)
    fonts.filter((f) => f.source === 'upload' && f.uploadUrl).forEach((f) => injectUploadedFont(f))
  }, [fonts])

  if (loading || processing) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>
  }

  if (callbackError) {
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        Error: {callbackError}
      </div>
    )
  }

  return (
    <div className="app">
      <Toolbar />
      <main className="app__main">
        <StatusBar />
        <Grid />
      </main>
      <FavoritesViewer />
    </div>
  )
}
