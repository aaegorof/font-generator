import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../../store/useStore'
import { injectUploadedFont, removeUploadedFont } from '../../../utils/fonts'
import { FontSyncService } from '../../../services/fontSync'
import { getCurrentUserId } from '../../../utils/auth'
import type { FontDef } from '../../../types'
import { ConfirmDialog } from '../../ConfirmDialog'
import { FontLibraryModal } from '../../FontLibraryModal'
import { Pin } from 'lucide-react'

function useFontLoadStatus(fonts: FontDef[]): Set<string> {
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())
  const fontsRef = useRef(fonts)

  useEffect(() => {
    fontsRef.current = fonts
  }, [fonts])

  const check = useCallback(() => {
    const loaded = new Set<string>()
    for (const font of fontsRef.current) {
      // For Google fonts and local fonts, always mark as loaded
      if (font.source === 'google' || font.source === 'local') {
        loaded.add(font.id)
        continue
      }

      // For uploaded fonts, check if the font face is actually loaded
      if (font.source === 'upload' && font.uploadUrl) {
        // Try multiple weight variations to be more accurate
        const weights = [font.weight, 400, 700]
        const isLoaded = weights.some((weight) =>
          document.fonts.check(`${weight} 12px "${font.family}"`),
        )
        if (isLoaded) {
          loaded.add(font.id)
        }
      }
    }
    setLoadedIds((prev) => {
      if (prev.size === loaded.size && [...loaded].every((id) => prev.has(id))) return prev
      return loaded
    })
  }, [])

  useEffect(() => {
    // Initial check after fonts are ready
    document.fonts.ready.then(check)

    // Listen for font loading events
    document.fonts.addEventListener('loadingdone', check)
    document.fonts.addEventListener('loadingerror', check)

    // Also check periodically for uploaded fonts that might load async
    const interval = setInterval(check, 2000)

    return () => {
      document.fonts.removeEventListener('loadingdone', check)
      document.fonts.removeEventListener('loadingerror', check)
      clearInterval(interval)
    }
  }, [check])

  return loadedIds
}

function fontSourceLabel(source: FontDef['source']): string {
  if (source === 'google') return 'Google'
  return source
}

export function FontsPage() {
  const { fonts, toggleFontActive, removeFont, textInputs, layerFontPins, replaceLayerFontPins, addFont } =
    useStore()
  const loadedFontIds = useFontLoadStatus(fonts)

  const [query, setQuery] = useState('')

  const pinnedIds = useMemo(() => new Set(Object.values(layerFontPins)), [layerFontPins])

  const filteredFonts = useMemo(() => {
    const rank = (f: FontDef) => {
      const pinned = pinnedIds.has(f.id) ? 0 : 1
      const active = f.isActive !== false ? 0 : 1
      return pinned * 2 + active
    }
    const sorted = [...fonts].sort((a, b) => {
      const dr = rank(a) - rank(b)
      if (dr !== 0) return dr
      return a.name.localeCompare(b.name)
    })
    if (!query.trim()) return sorted
    const q = query.toLowerCase()
    return sorted.filter((f) => f.name.toLowerCase().includes(q))
  }, [fonts, query, pinnedIds])

  const toggleFontListPin = useCallback(
    (fontId: string) => {
      const { textInputs: inputs, layerFontPins: pins } = useStore.getState()
      if (Object.values(pins).includes(fontId)) {
        const next = Object.fromEntries(
          Object.entries(pins).filter(([, id]) => id !== fontId),
        ) as Record<number, string>
        replaceLayerFontPins(next)
        return
      }
      const n = inputs.length
      if (n <= 0) return
      let targetLayer = 0
      for (let i = 0; i < n; i++) {
        if (pins[i] == null) {
          targetLayer = i
          break
        }
      }
      replaceLayerFontPins({ ...pins, [targetLayer]: fontId })
    },
    [replaceLayerFontPins],
  )

  const fontUploadRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [libraryModalOpen, setLibraryModalOpen] = useState(false)
  const [addingLibraryFonts, setAddingLibraryFonts] = useState(false)
  const [libraryMessage, setLibraryMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(
    null,
  )
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDeleteFont = useCallback(
    async (fontId: string) => {
      try {
        console.log('[handleDeleteFont] Starting deletion:', { fontId, fontIdType: typeof fontId })

        setDeleting(fontId)
        setDeleteError(null)
        setConfirmDelete(null)

        const userId = await getCurrentUserId()
        console.log('[handleDeleteFont] Got userId:', { userId, userIdType: typeof userId })

        if (!userId) {
          // Fallback to local delete if not authenticated
          removeFont(fontId)
          return
        }

        // Delete font with file from Storage
        console.log('[handleDeleteFont] Calling deleteFontWithFile with:', { userId, fontId })
        await FontSyncService.deleteFontWithFile(userId, fontId)

        // Remove from store
        removeFont(fontId)

        // Remove @font-face from DOM
        removeUploadedFont(fontId)

        setDeleting(null)
      } catch (err) {
        console.error('Error deleting font:', err)
        setDeleteError(err instanceof Error ? err.message : 'Delete failed')
        setDeleting(null)
      }
    },
    [removeFont],
  )

  const handleFontUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    setUploading(true)
    setUploadError(null)

    try {
      const userId = await getCurrentUserId()
      if (!userId) {
        throw new Error('User not authenticated')
      }

      for (const file of files) {
        const fontId = `font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const fontName = file.name.replace(/\.(woff2|woff|ttf)$/i, '')

        const font: FontDef = {
          id: fontId,
          name: fontName,
          family: fontName,
          weight: 400,
          source: 'upload',
          isActive: true,
        }

        // Save font to database with file upload
        await FontSyncService.saveFontWithFile(userId, font, file)

        // Reload all fonts from database to get the uploaded font with correct URL
        const allFonts = await FontSyncService.loadFonts(userId)
        const uploadedFont = allFonts.find((f) => f.id === fontId)

        if (uploadedFont) {
          // Add to store without triggering sync (font is already in database)
          const currentFonts = useStore.getState().fonts
          if (!currentFonts.find((f) => f.id === uploadedFont.id)) {
            useStore.setState((state) => ({ fonts: [...state.fonts, uploadedFont] }))
          }

          // Inject font into DOM
          injectUploadedFont(uploadedFont)
        }
      }
    } catch (err) {
      console.error('Font upload error:', err)
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fontUploadRef.current) fontUploadRef.current.value = ''
    }
  }, [])

  const handleLibraryConfirm = useCallback(
    async (selectedFonts: FontDef[]) => {
      const existingIds = new Set(useStore.getState().fonts.map((f) => f.id))
      const toAdd = selectedFonts.filter((f) => !existingIds.has(f.id))
      const skipped = selectedFonts.length - toAdd.length

      if (toAdd.length === 0) {
        setLibraryMessage({
          kind: 'success',
          text:
            skipped > 0
              ? 'Those fonts are already in your library.'
              : 'No new fonts to add.',
        })
        return
      }

      setAddingLibraryFonts(true)
      setLibraryMessage(null)
      try {
        for (const font of toAdd) {
          await addFont(font)
        }
        const parts = [`Added ${toAdd.length} font${toAdd.length !== 1 ? 's' : ''}`]
        if (skipped > 0) {
          parts.push(`${skipped} already in library`)
        }
        setLibraryMessage({ kind: 'success', text: `${parts.join('. ')}.` })
      } catch (err) {
        console.error('Library font save error:', err)
        setLibraryMessage({
          kind: 'error',
          text:
            err instanceof Error ? err.message : 'Could not save fonts. Please try again.',
        })
      } finally {
        setAddingLibraryFonts(false)
      }
    },
    [addFont],
  )

  return (
    <div className="toolbar__panel pb-0">
      <div className="toolbar__font-search">
        <input
          className="toolbar__font-search-input"
          type="text"
          placeholder="Search fonts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button className="toolbar__font-search-clear" onClick={() => setQuery('')}>
            ×
          </button>
        )}
      </div>

      <div className="toolbar__font-list">
        {filteredFonts.map((font) => {
          const isPinned = Object.values(layerFontPins).includes(font.id)
          const canPin = font.isActive !== false
          return (
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
              <span className="toolbar__font-source">{fontSourceLabel(font.source)}</span>
              {!loadedFontIds.has(font.id) && (
                <span className="toolbar__font-not-loaded" title="Font is not loaded by browser" />
              )}
            </button>
            <button
              type="button"
              className={`toolbar__font-pin ${isPinned ? 'toolbar__font-pin--on' : ''}`}
              disabled={!canPin}
              title={
                !canPin
                  ? 'Enable font to pin'
                  : isPinned
                    ? 'Unpin from layers'
                    : textInputs.length > 1
                      ? 'Pin first free layer (or use tile labels for a specific layer)'
                      : 'Pin this layer’s font'
              }
              aria-label={isPinned ? 'Unpin font' : 'Pin font'}
              onClick={(e) => {
                e.stopPropagation()
                if (!canPin) return
                toggleFontListPin(font.id)
              }}
            >
              <Pin className="size-3.5" strokeWidth={2.25} />
            </button>
            <button
              className="toolbar__font-remove"
              onClick={() => setConfirmDelete(font.id)}
              disabled={deleting === font.id}
              title={deleting === font.id ? 'Deleting...' : 'Remove font'}
            >
              {deleting === font.id ? '...' : '×'}
            </button>
          </div>
          )
        })}
      </div>

      {deleteError && (
        <p className="toolbar__upload-error" role="alert">
          {deleteError}
        </p>
      )}

      <div className="toolbar__font-upload bg-bg-toolbar sticky bottom-0 pb-4">
        <input
          ref={fontUploadRef}
          type="file"
          accept=".woff,.woff2,.ttf,.otf"
          multiple
          style={{ display: 'none' }}
          onChange={handleFontUpload}
        />
        <div className="toolbar__transfer-row">
          <button
            type="button"
            className="toolbar__upload-btn flex-1"
            onClick={() => {
              setLibraryMessage(null)
              setLibraryModalOpen(true)
            }}
            disabled={uploading || addingLibraryFonts}
          >
            {addingLibraryFonts ? 'Adding…' : '+ Google Fonts'}
          </button>
          <button
            type="button"
            className="toolbar__upload-btn flex-1"
            onClick={() => fontUploadRef.current?.click()}
            disabled={uploading || addingLibraryFonts}
          >
            {uploading ? 'Loading…' : '+ Upload Font File'}
          </button>
        </div>
        {libraryMessage && (
          <p
            className={libraryMessage.kind === 'error' ? 'toolbar__upload-error' : 'toolbar__hint'}
            role={libraryMessage.kind === 'error' ? 'alert' : 'status'}
          >
            {libraryMessage.text}
          </p>
        )}
        {uploadError && (
          <p className="toolbar__upload-error" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      <FontLibraryModal
        open={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onConfirm={handleLibraryConfirm}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete Font"
        message="Are you sure you want to delete this font? This will remove the font file from storage."
        onConfirm={() => {
          if (confirmDelete) {
            handleDeleteFont(confirmDelete)
          }
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
