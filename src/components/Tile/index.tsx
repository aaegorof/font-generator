import React, { useCallback, useRef, memo } from 'react'
import { useStore } from '../../store/useStore'
import { useFontFilter } from '../../hooks/useFontFilter'
import { exportTileAsPng } from '../../utils/exportTile'
import type { TileData } from '../../types'
import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

interface TileProps {
  tile: TileData
  favoriteIndex?: number
}

export const Tile = memo(function Tile({ tile, favoriteIndex }: TileProps) {
  const {
    settings,
    textInputs,
    fonts,
    addFavorite,
    removeFavorite,
    favorites,
    randomizeSingleTile,
  } = useStore()
  const { setFilter } = useFontFilter()

  const tileRef = useRef<HTMLDivElement>(null)

  const isFav = favorites.some((f) => {
    const fontMatch = f.tile.fontIds.join(',') === tile.fontIds.join(',')
    const imgMatch = f.tile.imageUrl === tile.imageUrl
    return fontMatch && imgMatch
  })

  const favItem = favorites.find((f) => {
    const fontMatch = f.tile.fontIds.join(',') === tile.fontIds.join(',')
    const imgMatch = f.tile.imageUrl === tile.imageUrl
    return fontMatch && imgMatch
  })

  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (isFav && favItem) {
        removeFavorite(favItem.id)
      } else {
        addFavorite(tile)
      }
    },
    [isFav, favItem, tile, addFavorite, removeFavorite],
  )

  const handleExport = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!tileRef.current) return
      await exportTileAsPng(tileRef.current, `font-combo-${tile.id}.png`)
    },
    [tile.id],
  )

  const handleShuffle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      randomizeSingleTile(tile.id)
    },
    [tile.id, randomizeSingleTile],
  )

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

  return (
    <div
      className="group relative block aspect-4/3 cursor-pointer overflow-hidden bg-bg-subtle"
      ref={tileRef}
      data-tile-id={tile.id}
    >
      <img
        className="absolute inset-0 block h-full w-full object-cover transition-transform duration-400 ease-out group-hover:scale-[1.03]"
        src={tile.imageUrl}
        alt=""
        loading="lazy"
        crossOrigin="anonymous"
        style={settings.grayscale ? { filter: 'grayscale(1)' } : undefined}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${settings.overlayOpacity})` }}
      />

      {textInputs.map((input, i) => {
        const fontId = tile.fontIds[i % tile.fontIds.length]
        const lines = input.text.split('\n').filter((l) => l.length > 0)
        const textShadowStyle = input.textShadow
          ? '0 2px 20px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)'
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
            className={cn('absolute inset-0 flex flex-col', vAlign)}
            style={{
              padding: settings.padding,
              alignItems,
              textAlign: input.alignment,
            }}
          >
            {lines.map((line, lineIdx) => (
              <div
                key={lineIdx}
                className="block wrap-break-word"
                style={{
                  fontFamily: getFontFamily(fontId),
                  fontWeight: getFontWeight(fontId),
                  fontSize: input.fontSize,
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

      <div className="absolute top-2.5 right-2.5 flex -translate-y-1 flex-col gap-1.5 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            'h-[30px] w-[30px] rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/85 hover:border-white/30 hover:text-white',
            isFav && 'text-accent-heart [&_svg]:fill-accent-heart [&_svg]:stroke-accent-heart',
          )}
          onClick={handleFavoriteToggle}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HeartIcon filled={isFav} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-[30px] w-[30px] rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/85 hover:border-white/30"
          onClick={handleShuffle}
          title="Randomize fonts"
        >
          <ShuffleMiniIcon />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-[30px] w-[30px] rounded-full border border-white/10 bg-black/65 text-white backdrop-blur-md transition-all hover:scale-110 hover:bg-black/85 hover:border-white/30"
          onClick={handleExport}
          title="Export as PNG"
        >
          <DownloadIcon />
        </Button>
      </div>

      <div className="absolute right-0 bottom-0 left-0 flex translate-y-1 flex-wrap gap-1 p-2 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100">
        {tile.fontIds.slice(0, textInputs.length).map((fId, i) => (
          <button
            key={i}
            type="button"
            className="cursor-pointer rounded-[3px] border-none bg-black/55 px-1.5 py-0.5 font-inherit text-[9px] font-semibold tracking-[0.08em] text-white/70 uppercase backdrop-blur-sm hover:bg-black/75 hover:text-white"
            onClick={(e) => {
              e.stopPropagation()
              setFilter(i, fId)
            }}
            title={`Pin layer ${i + 1} to ${getFontName(fId)}`}
          >
            {getFontName(fId)}
          </button>
        ))}
      </div>

      {favoriteIndex !== undefined && (
        <div className="absolute top-2.5 left-2.5 flex size-[22px] items-center justify-center rounded-full bg-accent-heart/90 text-[10px] font-bold text-white">
          {favoriteIndex + 1}
        </div>
      )}
    </div>
  )
})

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function ShuffleMiniIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}
