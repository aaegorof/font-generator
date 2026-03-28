import React, { useCallback, useRef, memo } from 'react';
import { useStore } from '../../store/useStore';
import { exportTileAsPng } from '../../utils/exportTile';
import type { TileData } from '../../types';
import './Tile.css';

interface TileProps {
  tile: TileData;
  favoriteIndex?: number;
}

export const Tile = memo(function Tile({ tile, favoriteIndex }: TileProps) {
  const { settings, textContent, fonts, addFavorite, removeFavorite, favorites, randomizeSingleTile } =
    useStore();

  const tileRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const textLines = textContent.split('\n').filter((l) => l.length > 0);

  const isFav = favorites.some((f) => {
    const fontMatch = f.tile.fontIds.join(',') === tile.fontIds.join(',');
    const imgMatch = f.tile.imageUrl === tile.imageUrl;
    return fontMatch && imgMatch;
  });

  const favItem = favorites.find((f) => {
    const fontMatch = f.tile.fontIds.join(',') === tile.fontIds.join(',');
    const imgMatch = f.tile.imageUrl === tile.imageUrl;
    return fontMatch && imgMatch;
  });

  const handleFavoriteToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isFav && favItem) {
        removeFavorite(favItem.id);
      } else {
        addFavorite(tile);
      }
    },
    [isFav, favItem, tile, addFavorite, removeFavorite]
  );

  const handleExport = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!tileRef.current) return;
      await exportTileAsPng(tileRef.current, `font-combo-${tile.id}.png`);
    },
    [tile.id]
  );

  const handleShuffle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      randomizeSingleTile(tile.id);
    },
    [tile.id, randomizeSingleTile]
  );

  const getFontFamily = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId);
    return font ? `'${font.family}', sans-serif` : 'sans-serif';
  };

  const getFontWeight = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId);
    return font ? font.weight : 400;
  };

  const getFontName = (fontId: string) => {
    const font = fonts.find((f) => f.id === fontId);
    return font ? font.name : fontId;
  };

  const textShadowStyle = settings.textShadow
    ? '0 2px 20px rgba(0,0,0,0.8), 0 1px 4px rgba(0,0,0,0.6)'
    : 'none';

  const alignItems =
    settings.alignment === 'left'
      ? 'flex-start'
      : settings.alignment === 'right'
      ? 'flex-end'
      : 'center';

  return (
    <div className="tile" ref={tileRef} data-tile-id={tile.id}>
      <img
        ref={imgRef}
        className="tile__image"
        src={tile.imageUrl}
        alt=""
        loading="lazy"
        crossOrigin="anonymous"
        style={settings.grayscale ? { filter: 'grayscale(1)' } : undefined}
      />

      <div
        className="tile__overlay"
        style={{ backgroundColor: `rgba(0,0,0,${settings.overlayOpacity})` }}
      />

      <div
        className="tile__text"
        style={{
          padding: settings.padding,
          alignItems,
          textAlign: settings.alignment,
        }}
      >
        {textLines.map((line, i) => {
          const fontId = tile.fontIds[i % tile.fontIds.length];
          return (
            <div
              key={i}
              className="tile__line"
              style={{
                fontFamily: getFontFamily(fontId),
                fontWeight: getFontWeight(fontId),
                fontSize: settings.fontSize,
                letterSpacing: `${settings.letterSpacing}em`,
                lineHeight: settings.lineHeight,
                color: settings.textColor,
                textShadow: textShadowStyle,
                whiteSpace: settings.textWrap ? 'nowrap' : 'normal',
              }}
            >
              {line}
            </div>
          );
        })}
      </div>

      <div className="tile__actions">
        <button
          className={`tile__action tile__action--heart ${isFav ? 'tile__action--heart-active' : ''}`}
          onClick={handleFavoriteToggle}
          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
        >
          <HeartIcon filled={isFav} />
        </button>
        <button
          className="tile__action tile__action--shuffle"
          onClick={handleShuffle}
          title="Randomize fonts"
        >
          <ShuffleMiniIcon />
        </button>
        <button
          className="tile__action tile__action--export"
          onClick={handleExport}
          title="Export as PNG"
        >
          <DownloadIcon />
        </button>
      </div>

      <div className="tile__font-labels">
        {tile.fontIds.slice(0, textLines.length).map((fId, i) => (
          <span key={i} className="tile__font-label">
            {getFontName(fId)}
          </span>
        ))}
      </div>

      {favoriteIndex !== undefined && (
        <div className="tile__fav-badge">{favoriteIndex + 1}</div>
      )}
    </div>
  );
});

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

function ShuffleMiniIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
