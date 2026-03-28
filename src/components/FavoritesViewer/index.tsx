import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { exportTileAsPng } from '../../utils/exportTile';
import './FavoritesViewer.css';

export function FavoritesViewer() {
  const {
    favorites,
    favoritesViewOpen,
    favoritesViewIndex,
    closeFavoritesView,
    setFavoritesViewIndex,
    removeFavorite,
    fonts,
  } = useStore();

  const slideRef = useRef<HTMLDivElement>(null);

  const current = favorites[favoritesViewIndex];
  const total = favorites.length;

  const goNext = useCallback(() => {
    setFavoritesViewIndex((favoritesViewIndex + 1) % total);
  }, [favoritesViewIndex, total, setFavoritesViewIndex]);

  const goPrev = useCallback(() => {
    setFavoritesViewIndex((favoritesViewIndex - 1 + total) % total);
  }, [favoritesViewIndex, total, setFavoritesViewIndex]);

  useEffect(() => {
    if (!favoritesViewOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'Escape') closeFavoritesView();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [favoritesViewOpen, goNext, goPrev, closeFavoritesView]);

  if (!favoritesViewOpen || !current) return null;

  const { tile, settings, textContent } = current;
  const textLines = textContent.split('\n').filter((l) => l.length > 0);

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
    ? '0 2px 30px rgba(0,0,0,0.9), 0 1px 6px rgba(0,0,0,0.6)'
    : 'none';

  const alignItems =
    settings.alignment === 'left'
      ? 'flex-start'
      : settings.alignment === 'right'
      ? 'flex-end'
      : 'center';

  const handleExport = async () => {
    if (!slideRef.current) return;
    await exportTileAsPng(slideRef.current, `favorite-${tile.id}.png`);
  };

  const handleDelete = () => {
    const fav = favorites[favoritesViewIndex];
    if (!fav) return;
    removeFavorite(fav.id);
    if (total <= 1) {
      closeFavoritesView();
    } else {
      setFavoritesViewIndex(Math.min(favoritesViewIndex, total - 2));
    }
  };

  return (
    <div className="fav-viewer" onClick={closeFavoritesView}>
      <div className="fav-viewer__content" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="fav-viewer__close" onClick={closeFavoritesView}>
          <CloseIcon />
        </button>

        {/* Slide */}
        <div className="fav-viewer__slide" ref={slideRef}>
          <img
            className="fav-viewer__image"
            src={tile.imageUrl}
            alt=""
            crossOrigin="anonymous"
            style={settings.grayscale ? { filter: 'grayscale(1)' } : undefined}
          />
          <div
            className="fav-viewer__overlay"
            style={{ backgroundColor: `rgba(0,0,0,${settings.overlayOpacity})` }}
          />
          <div
            className="fav-viewer__text"
            style={{
              padding: Math.max(settings.padding * 1.5, 40),
              alignItems,
              textAlign: settings.alignment,
            }}
          >
            {textLines.map((line, i) => {
              const fontId = tile.fontIds[i % tile.fontIds.length];
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: getFontFamily(fontId),
                    fontWeight: getFontWeight(fontId),
                    fontSize: Math.round(settings.fontSize * 1.6),
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
        </div>

        {/* Meta */}
        <div className="fav-viewer__meta">
          <div className="fav-viewer__fonts">
            {tile.fontIds.slice(0, textLines.length).map((fId, i) => (
              <span key={i} className="fav-viewer__font-tag">
                <span className="fav-viewer__font-preview" style={{ fontFamily: getFontFamily(fId), fontWeight: getFontWeight(fId) }}>
                  Aa
                </span>
                {getFontName(fId)}
              </span>
            ))}
          </div>

          <div className="fav-viewer__controls">
            <button className="fav-viewer__btn fav-viewer__btn--danger" onClick={handleDelete} title="Remove from favorites">
              <TrashIcon />
            </button>
            <button className="fav-viewer__btn" onClick={handleExport} title="Export as PNG">
              <DownloadIcon />
              <span>Export PNG</span>
            </button>
          </div>
        </div>

        {/* Navigation */}
        {total > 1 && (
          <>
            <button className="fav-viewer__nav fav-viewer__nav--prev" onClick={goPrev}>
              <ChevronLeftIcon />
            </button>
            <button className="fav-viewer__nav fav-viewer__nav--next" onClick={goNext}>
              <ChevronRightIcon />
            </button>
          </>
        )}

        {/* Counter */}
        <div className="fav-viewer__counter">
          {favoritesViewIndex + 1} / {total}
        </div>

        {/* Dots */}
        {total <= 20 && (
          <div className="fav-viewer__dots">
            {favorites.map((_, i) => (
              <button
                key={i}
                className={`fav-viewer__dot ${i === favoritesViewIndex ? 'fav-viewer__dot--active' : ''}`}
                onClick={() => setFavoritesViewIndex(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
