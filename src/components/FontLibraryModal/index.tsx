import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react'
import { List } from 'react-window'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { GoogleFontFamily } from '../../services/googleFontsApi'
import { fetchFontList, isGoogleFontsApiConfigured } from '../../services/googleFontsApi'
import type { FontDef } from '../../types'
import { FontPreview } from './FontPreview'

interface FontLibraryModalProps {
  open: boolean
  onClose: () => void
  onConfirm: (selectedFonts: FontDef[]) => void
}

type CategoryFilter = 'all' | 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace'

export function FontLibraryModal({ open, onClose, onConfirm }: FontLibraryModalProps) {
  const [fonts, setFonts] = useState<GoogleFontFamily[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [expandedFonts, setExpandedFonts] = useState<Set<string>>(new Set())
  const [selectedVariants, setSelectedVariants] = useState<Map<string, FontDef>>(new Map())

  // Load fonts from API
  useEffect(() => {
    if (!open) return

    let mounted = true

    const loadFonts = async () => {
      setLoading(true)
      try {
        const data = await fetchFontList()
        if (mounted) {
          setFonts(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load fonts:', err)
        if (mounted) {
          setFonts([])
          setLoading(false)
        }
      }
    }

    loadFonts()

    return () => {
      mounted = false
    }
  }, [open])

  // Filter fonts by search and category
  const filteredFonts = useMemo(() => {
    let result = fonts

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((f) => f.category === categoryFilter)
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((f) => f.family.toLowerCase().includes(query))
    }

    return result
  }, [fonts, searchQuery, categoryFilter])

  // Inject Google Fonts CSS for visible fonts
  useEffect(() => {
    if (!open || filteredFonts.length === 0) return

    // Take first 20 fonts for initial preview loading
    const previewFonts = filteredFonts.slice(0, 20)
    const families = previewFonts.map((f) => f.family.replace(/ /g, '+'))
    const url = `https://fonts.googleapis.com/css2?${families.map((f) => `family=${f}`).join('&')}&display=swap`

    const linkId = 'google-fonts-preview'
    let link = document.getElementById(linkId) as HTMLLinkElement | null

    if (!link) {
      link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }

    link.href = url

    return () => {
      // Clean up on unmount
      const existingLink = document.getElementById(linkId)
      if (existingLink) {
        existingLink.remove()
      }
    }
  }, [open, filteredFonts])

  // Toggle font expansion
  const toggleExpand = useCallback((family: string) => {
    setExpandedFonts((prev) => {
      const next = new Set(prev)
      if (next.has(family)) {
        next.delete(family)
      } else {
        next.add(family)
      }
      return next
    })
  }, [])

  // Toggle variant selection
  const toggleVariant = useCallback((fontDef: FontDef) => {
    setSelectedVariants((prev) => {
      const next = new Map(prev)
      if (next.has(fontDef.id)) {
        next.delete(fontDef.id)
      } else {
        next.set(fontDef.id, fontDef)
      }
      return next
    })
  }, [])

  // Handle confirm
  const handleConfirm = useCallback(() => {
    const selected = Array.from(selectedVariants.values())
    onConfirm(selected)
    onClose()
    // Reset state
    setSearchQuery('')
    setCategoryFilter('all')
    setExpandedFonts(new Set())
    setSelectedVariants(new Map())
  }, [selectedVariants, onConfirm, onClose])

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose()
    // Reset state
    setSearchQuery('')
    setCategoryFilter('all')
    setExpandedFonts(new Set())
    setSelectedVariants(new Map())
  }, [onClose])

  // Calculate row height for virtualization
  const getRowHeight = useCallback(
    (index: number) => {
      const font = filteredFonts[index]
      if (!font) return 80
      const isExpanded = expandedFonts.has(font.family)
      if (isExpanded) {
        // Expanded height: base + (variants * variant height)
        const variantCount = font.variants.length
        return 80 + variantCount * 60
      }
      return 80 // Collapsed height
    },
    [filteredFonts, expandedFonts],
  )

  // Row component for virtualized list
  const RowComponent = useCallback(
    ({
      index,
      style,
    }: {
      ariaAttributes: {
        'aria-posinset': number
        'aria-setsize': number
        role: 'listitem'
      }
      index: number
      style: CSSProperties
    }) => {
      const font = filteredFonts[index]
      if (!font) return null

      return (
        <div style={style}>
          <FontPreview
            font={font}
            isExpanded={expandedFonts.has(font.family)}
            selectedVariants={new Set(selectedVariants.keys())}
            onToggleExpand={() => toggleExpand(font.family)}
            onToggleVariant={toggleVariant}
          />
        </div>
      )
    },
    [filteredFonts, expandedFonts, selectedVariants, toggleExpand, toggleVariant],
  )

  const categoryButtons: { id: CategoryFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'serif', label: 'Serif' },
    { id: 'sans-serif', label: 'Sans Serif' },
    { id: 'display', label: 'Display' },
    { id: 'handwriting', label: 'Handwriting' },
    { id: 'monospace', label: 'Monospace' },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) handleCancel()
      }}
    >
      <DialogContent
        showCloseButton
        className="flex h-[80vh] max-h-[85vh] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 gap-0 border-b border-border px-6 pt-6 pb-4 pr-14 text-left">
          <DialogTitle className="font-heading text-xl font-semibold">
            Browse Google Fonts
          </DialogTitle>

          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="font-library-search" className="sr-only">
                Search fonts by name
              </Label>
              <Input
                id="font-library-search"
                type="search"
                placeholder="Search fonts by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryButtons.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  size="sm"
                  variant={categoryFilter === cat.id ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            <p className="text-muted-foreground text-sm">
              {loading ? 'Loading...' : `${filteredFonts.length} fonts`}
            </p>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-muted-foreground text-sm">Loading fonts...</p>
            </div>
          ) : filteredFonts.length === 0 ? (
            <div className="flex h-full items-center justify-center px-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-2 text-sm">
                  {fonts.length === 0
                    ? !isGoogleFontsApiConfigured()
                      ? 'Add VITE_GOOGLE_FONTS_API_KEY (or VITE_GOOGLE_FONT_API_KEY) to .env and restart the dev server — otherwise no request can be sent to Google Fonts.'
                      : 'Unable to load fonts. Please try again later.'
                    : 'No fonts found.'}
                </p>
                {searchQuery ? (
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    Clear search
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <List
              rowComponent={RowComponent}
              rowCount={filteredFonts.length}
              rowHeight={getRowHeight}
              defaultHeight={window.innerHeight * 0.8 - 240}
              rowProps={{}}
            />
          )}
        </div>

        <div className="bg-muted/30 flex shrink-0 items-center justify-between gap-4 border-t border-border px-6 py-4">
          <p className="text-muted-foreground text-sm">
            {selectedVariants.size} variant{selectedVariants.size !== 1 ? 's' : ''} selected
          </p>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={selectedVariants.size === 0}
            >
              Add Selected
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
