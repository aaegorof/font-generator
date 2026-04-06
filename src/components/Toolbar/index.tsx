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
  const { toolbarOpen, toggleToolbar } = useStore()

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

