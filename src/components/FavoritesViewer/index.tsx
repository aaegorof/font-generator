import { useCallback, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import { exportTileAsPng } from '../../utils/exportTile'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export function FavoritesViewer() {
  const {
    favorites,
    favoritesViewOpen,
    favoritesViewIndex,
    closeFavoritesView,
    setFavoritesViewIndex,
    removeFavorite,
    fonts,
  } = useStore()
  const { setFilter } = useFontFilter()

  const slideRef = useRef<HTMLDivElement>(null)

  const current = favorites[favoritesViewIndex]
  const total = favorites.length

  const goNext = useCallback(() => {
    setFavoritesViewIndex((favoritesViewIndex + 1) % total)
  }, [favoritesViewIndex, total, setFavoritesViewIndex])

  const goPrev = useCallback(() => {
    setFavoritesViewIndex((favoritesViewIndex - 1 + total) % total)
  }, [favoritesViewIndex, total, setFavoritesViewIndex])

  useEffect(() => {
    if (!favoritesViewOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') closeFavoritesView()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [favoritesViewOpen, goNext, goPrev, closeFavoritesView])

  if (!favoritesViewOpen || !current) return null

  const { tile, settings, textInputs } = current

  const getFontFamily = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId)
    return font ? `'${font.family}', sans-serif` : 'sans-serif'
  }

  const getFontWeight = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId)
    return font ? font.weight : 400
  }

  const getFontName = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId)
    return font ? font.name : fontId
  }

  const handleExport = async () => {
    if (!slideRef.current) return
    await exportTileAsPng(slideRef.current, `favorite-${tile.id}.png`)
  }

  const handleDelete = () => {
    const fav = favorites[favoritesViewIndex]
    if (!fav) return
    removeFavorite(fav.id)
    if (total <= 1) {
      closeFavoritesView()
    } else {
      setFavoritesViewIndex(Math.min(favoritesViewIndex, total - 2))
    }
  }

  return (
    <div
      className="animate-in fade-in-0 fixed inset-0 z-1000 flex items-center justify-center bg-black/92 backdrop-blur-[8px] duration-200"
      onClick={closeFavoritesView}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-[min(1200px,92vw)] flex-col gap-4 px-[60px] box-border"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute -top-10 right-[60px] rounded-full text-text-secondary hover:bg-transparent hover:text-white"
          onClick={closeFavoritesView}
        >
          <CloseIcon />
        </Button>

        <div
          className="relative aspect-4/3 shrink-0 overflow-hidden rounded-lg bg-bg-subtle"
          ref={slideRef}
        >
          <img
            className="absolute inset-0 block h-full w-full object-cover"
            src={tile.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={settings.grayscale ? { filter: 'grayscale(1)' } : undefined}
          />
          <div
            className="absolute inset-0"
            style={{ backgroundColor: `rgba(0,0,0,${settings.overlayOpacity})` }}
          />

          {textInputs.map((input, i) => {
            const fontId = tile.fontIds[i % tile.fontIds.length]
            const lines = input.text.split('\n').filter((l) => l.length > 0)
            const textShadowStyle = input.textShadow
              ? '0 2px 30px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.6)'
              : 'none'
            const alignItems =
              input.alignment === 'left'
                ? 'flex-start'
                : input.alignment === 'right'
                  ? 'flex-end'
                  : 'center'

            const vAlign =
              input.verticalAlignment === 'top'
                ? 'justify-start'
                : input.verticalAlignment === 'bottom'
                  ? 'justify-end'
                  : 'justify-center'

            return (
              <div
                key={input.id}
                className={cn('pointer-events-none absolute inset-0 flex flex-col', vAlign)}
                style={{
                  padding: Math.max(settings.padding * 1.5, 40),
                  alignItems,
                  textAlign: input.alignment,
                }}
              >
                {lines.map((line, lineIdx) => (
                  <div
                    key={lineIdx}
                    style={{
                      fontFamily: getFontFamily(fontId),
                      fontWeight: getFontWeight(fontId),
                      fontSize: Math.round(input.fontSize * 1.6),
                      letterSpacing: `${input.letterSpacing}em`,
                      lineHeight: input.lineHeight,
                      color: input.textColor,
                      textShadow: textShadowStyle,
                      whiteSpace: input.textWrap ? 'nowrap' : 'normal',
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {tile.fontIds.slice(0, textInputs.length).map((fId, i) => (
              <button
                key={i}
                type="button"
                className="flex cursor-pointer items-center gap-1.5 rounded-[20px] border border-white/10 bg-white/[0.07] px-2.5 py-1 font-inherit text-[11px] tracking-[0.04em] text-text-soft hover:bg-white/12 hover:text-white"
                onClick={() => {
                  setFilter(i, fId)
                  closeFavoritesView()
                }}
                title={`Pin layer ${i + 1} to ${getFontName(fId)}`}
              >
                <span
                  className="text-base leading-none text-white"
                  style={{ fontFamily: getFontFamily(fId), fontWeight: getFontWeight(fId) }}
                >
                  Aa
                </span>
                {getFontName(fId)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="border-white/10 bg-white/[0.07] px-2 tracking-[0.06em] text-text-soft uppercase hover:border-red-500/40 hover:bg-red-500/20 hover:text-[#ff6b6b]"
              onClick={handleDelete}
              title="Remove from favorites"
            >
              <TrashIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="gap-1.5 border-white/10 bg-white/[0.07] tracking-[0.06em] text-text-soft uppercase hover:bg-white/12 hover:text-white"
              onClick={handleExport}
              title="Export as PNG"
            >
              <DownloadIcon />
              <span>Export PNG</span>
            </Button>
          </div>
        </div>

        {total > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="absolute top-1/2 left-2 mt-[-30px] size-11 -translate-y-1/2 rounded-full border-white/10 bg-black/50 text-white backdrop-blur-sm hover:border-white/30 hover:bg-black/80"
              onClick={goPrev}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="absolute top-1/2 right-2 mt-[-30px] size-11 -translate-y-1/2 rounded-full border-white/10 bg-black/50 text-white backdrop-blur-sm hover:border-white/30 hover:bg-black/80"
              onClick={goNext}
            >
              <ChevronRightIcon />
            </Button>
          </>
        )}

        <div className="absolute -top-10 left-[60px] text-[11px] font-medium tracking-[0.06em] text-text-muted tabular-nums">
          {favoritesViewIndex + 1} / {total}
        </div>

        {total <= 20 && (
          <div className="flex justify-center gap-1.5 pb-2">
            {favorites.map((_, i) => (
              <button
                key={i}
                type="button"
                className={cn(
                  'h-1.5 w-1.5 cursor-pointer rounded-full border-none bg-border-muted p-0 transition-all hover:bg-white/40',
                  i === favoritesViewIndex && 'scale-[1.3] bg-white',
                )}
                onClick={() => setFavoritesViewIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

function ChevronLeftIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}
