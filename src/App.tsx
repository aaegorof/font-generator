import { useEffect } from 'react'
import { Toolbar } from './components/Toolbar'
import { Grid } from './components/Grid'
import { FavoritesViewer } from './components/FavoritesViewer'
import { useStore } from './store/useStore'
import { setupGoogleFonts, injectLocalFontFaces, injectUploadedFont } from './utils/fonts'
import './App.css'

export default function App() {
  const { fonts, generateTiles, tiles } = useStore()

  useEffect(() => {
    // Set up fonts
    setupGoogleFonts()
    injectLocalFontFaces(fonts)

    // Inject uploaded fonts
    fonts.filter((f) => f.source === 'upload' && f.uploadUrl).forEach((f) => injectUploadedFont(f))

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

  return (
    <div className="app">
      <Toolbar />
      <main className="app__main">
        <Grid />
      </main>
      <FavoritesViewer />
    </div>
  )
}
