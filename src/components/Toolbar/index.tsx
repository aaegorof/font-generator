import { NavLink, Route, Routes } from 'react-router-dom'
import { useStore } from '../../store/useStore'
import { SettingsPage } from './pages/SettingsPage'
import { FontsPage } from './pages/FontsPage'
import { ImagesPage } from './pages/ImagesPage'
import './Toolbar.css'

const TABS = [
  { path: '/settings', label: 'Settings' },
  { path: '/fonts', label: 'Fonts' },
  { path: '/images', label: 'Images' },
] as const

export function Toolbar() {
  const { toolbarOpen, toggleToolbar, favorites, openFavoritesView, generateTiles, randomize } =
    useStore()

  return (
    <div className={`toolbar ${toolbarOpen ? 'toolbar--open' : 'toolbar--closed'}`}>
      <div className="toolbar__header">
        <span className="toolbar__brand">Font Generator</span>
        <button
          className="toolbar__toggle"
          onClick={toggleToolbar}
          title={toolbarOpen ? 'Collapse' : 'Expand'}
        >
          <ChevronIcon open={toolbarOpen} />
        </button>
      </div>

      <nav className="toolbar__tabs">
        {TABS.map(({ path, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `toolbar__tab ${isActive && toolbarOpen ? 'toolbar__tab--active' : ''}`
            }
            onClick={() => {
              if (!toolbarOpen) toggleToolbar()
            }}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="toolbar__actions">
        {favorites.length > 0 && (
          <button className="toolbar__action-btn" onClick={() => openFavoritesView(0)}>
            <HeartIcon />
            <span>{favorites.length}</span>
          </button>
        )}
        <button className="toolbar__action-btn toolbar__action-btn--outline" onClick={randomize}>
          <ShuffleIcon />
          <span>Randomize</span>
        </button>
        <button
          className="toolbar__action-btn toolbar__action-btn--outline"
          onClick={generateTiles}
        >
          <RefreshIcon />
          <span>Reset</span>
        </button>
      </div>

      <div className="toolbar__body">
        <Routes>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/fonts" element={<FontsPage />} />
          <Route path="/images" element={<ImagesPage />} />
        </Routes>
      </div>
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}
    >
      <path
        d="M6 4l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  )
}

function ShuffleIcon() {
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
      <polyline points="16 3 21 3 21 8" />
      <line x1="4" y1="20" x2="21" y2="3" />
      <polyline points="21 16 21 21 16 21" />
      <line x1="15" y1="15" x2="21" y2="21" />
    </svg>
  )
}

function RefreshIcon() {
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
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  )
}
