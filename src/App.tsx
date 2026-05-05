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
import { LayerPinsUrlSync } from './hooks/useLayerPinsUrlSync'
import {
  setupGoogleFonts,
  collectActiveGoogleFontsUsedInTiles,
  injectLocalFontFaces,
  injectUploadedFont,
} from './utils/fonts'

export default function App() {
  const { fonts, tiles } = useStore()
  const { user, loading } = useAuth()
  const { processing, error: callbackError } = useAuthCallback()
  useUserData(user)
  useSupabaseSync(user?.id ?? null)

  useEffect(() => {
    const { fonts: currentFonts, generateTiles, tiles: currentTiles } = useStore.getState()
    injectLocalFontFaces(currentFonts)

    currentFonts
      .filter((f) => f.source === 'upload' && f.uploadUrl)
      .forEach((f) => injectUploadedFont(f))

    if (currentTiles.length === 0) {
      generateTiles()
    }
  }, [])

  useEffect(() => {
    injectLocalFontFaces(fonts)
    fonts.filter((f) => f.source === 'upload' && f.uploadUrl).forEach((f) => injectUploadedFont(f))
  }, [fonts])

  useEffect(() => {
    const { fonts: f, tiles: t } = useStore.getState()
    setupGoogleFonts(collectActiveGoogleFontsUsedInTiles(f, t))
  }, [fonts, tiles])

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
    <div className="flex h-screen overflow-hidden bg-bg-base">
      <LayerPinsUrlSync />
      <Toolbar />
      <main className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <StatusBar />
        <Grid />
      </main>
      <FavoritesViewer />
    </div>
  )
}
