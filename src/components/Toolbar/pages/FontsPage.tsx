import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { loadFontFile, injectUploadedFont } from '../../../utils/fonts'
import type { FontDef } from '../../../types'

function useFontLoadStatus(fonts: FontDef[]): Set<string> {
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const fontsRef = useRef(fonts)
  fontsRef.current = fonts

  const check = useCallback(() => {
    const loaded = new Set<string>()
    for (const font of fontsRef.current) {
      if (document.fonts.check(`${font.weight} 12px "${font.family}"`)) {
        loaded.add(font.id)
      }
    }
    setLoadedIds((prev) => {
      if (prev.size === loaded.size && [...loaded].every((id) => prev.has(id))) return prev
      return loaded
    })
  }, [])

  useEffect(() => {
    document.fonts.ready.then(check)
    document.fonts.addEventListener('loadingdone', check)
    document.fonts.addEventListener('loadingerror', check)
    return () => {
      document.fonts.removeEventListener('loadingdone', check)
      document.fonts.removeEventListener('loadingerror', check)
    }
  }, [check])

  return loadedIds
}

export function FontsPage() {
  const { fonts, toggleFontActive, removeFont, addFont } = useStore()
  const loadedFontIds = useFontLoadStatus(fonts)

  const fontUploadRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFontUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (!files.length) return
      setUploading(true)
      try {
        for (const file of files) {
          const fontDef = await loadFontFile(file)
          injectUploadedFont(fontDef)
          addFont(fontDef)
        }
      } catch (err) {
        console.error('Font upload error:', err)
      } finally {
        setUploading(false)
        if (fontUploadRef.current) fontUploadRef.current.value = ''
      }
    },
    [addFont],
  )

  return (
    <div className="toolbar__panel">
      <div className="toolbar__font-list">
        {fonts.map((font) => (
          <div
            key={font.id}
            className={`toolbar__font-item ${font.isActive !== false ? 'toolbar__font-item--active' : ''}`}
          >
            <button
              className="toolbar__font-toggle"
              onClick={() => toggleFontActive(font.id)}
              title={font.isActive !== false ? 'Disable' : 'Enable'}
            >
              <span
                className="toolbar__font-preview"
                style={{
                  fontFamily: `'${font.family}', sans-serif`,
                  fontWeight: font.weight,
                }}
              >
                Aa
              </span>
              <span
                className="toolbar__font-name"
                style={{
                  fontFamily: `'${font.family}', sans-serif`,
                  fontWeight: font.weight,
                }}
              >
                {font.name}
              </span>
              <span className="toolbar__font-source">{font.source}</span>
              {!loadedFontIds.has(font.id) && (
                <span
                  className="toolbar__font-not-loaded"
                  title="Font is not loaded by browser"
                />
              )}
            </button>
            <button
              className="toolbar__font-remove"
              onClick={() => removeFont(font.id)}
              title="Remove font"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="toolbar__font-upload">
        <p className="toolbar__hint">
          Drop your font files into <code>public/fonts/</code> folder to auto-activate custom
          fonts.
        </p>
        <input
          ref={fontUploadRef}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFontUpload}
        />
        <button
          className="toolbar__upload-btn"
          onClick={() => fontUploadRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Loading…' : '+ Upload Font File'}
        </button>
      </div>
    </div>
  )
}
