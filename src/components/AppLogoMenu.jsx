import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', icon: '📅', path: '/' },
  { id: 'report', label: 'Lectures', icon: '🎧', path: '/report' },
  { id: 'jivandisha', label: 'JivanDisha', icon: '📖', path: '/jivandisha' },
  { id: 'finances', label: 'Finances', icon: '💰', path: '/finances' },
  { id: 'work', label: 'Work', icon: '📋', path: '/work' }
]

const SECRET_CODE = 'mtbt'

export default function AppLogoMenu({
  title = "Rajat's calendar",
  subtitle,
  badge,
  currentScreen,
  onVoiceInputClick,
  onHelpClick,
  secretMode,
  onSecretModeToggle,
  className = ''
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [internalSecretMode, setInternalSecretMode] = useState(Boolean(secretMode))
  const secretKeySequenceRef = useRef('')
  const dropdownRef = useRef(null)

  // Keep internalSecretMode in sync with secretMode prop if provided
  useEffect(() => {
    if (secretMode !== undefined) {
      setInternalSecretMode(secretMode)
    }
  }, [secretMode])

  // Derive active screen: prop takes precedence, otherwise deduce from pathname
  const activeScreen = currentScreen || (() => {
    const path = location.pathname.toLowerCase()
    if (path.startsWith('/report')) return 'report'
    if (path.startsWith('/jivandisha')) return 'jivandisha'
    if (path.startsWith('/finances')) return 'finances'
    if (path.startsWith('/work')) return 'work'
    return 'calendar'
  })()

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        secretKeySequenceRef.current = ''
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  // Handle keypresses for Escape dismiss and 'mtbt' secret sequence
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showDropdown) return

      if (event.key === 'Escape') {
        setShowDropdown(false)
        secretKeySequenceRef.current = ''
        return
      }

      if (!internalSecretMode) {
        if (event.key.length === 1) {
          const newSequence = (secretKeySequenceRef.current + event.key.toLowerCase()).slice(-SECRET_CODE.length)
          secretKeySequenceRef.current = newSequence
          if (newSequence === SECRET_CODE) {
            secretKeySequenceRef.current = ''
            setInternalSecretMode(true)
            onSecretModeToggle?.(true)
          }
        }
      }
    }

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDropdown, internalSecretMode, onSecretModeToggle])

  const handleToggleDropdown = () => {
    setShowDropdown(prev => !prev)
    secretKeySequenceRef.current = ''
  }

  const handleNavigate = (path) => {
    setShowDropdown(false)
    secretKeySequenceRef.current = ''
    if (location.pathname !== path) {
      navigate(path)
    }
  }

  const handleHideSecret = (e) => {
    e.stopPropagation()
    setInternalSecretMode(false)
    onSecretModeToggle?.(false)
    setShowDropdown(false)
    secretKeySequenceRef.current = ''
  }

  return (
    <div className={`app-logo-menu-container ${className}`} ref={dropdownRef}>
      <div
        className="app-brand-trigger"
        onClick={handleToggleDropdown}
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-expanded={showDropdown}
        title="Click to switch screen or view menu"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleToggleDropdown()
          }
        }}
      >
        <img src="/favicon.png" alt="App Logo" className="app-logo" />
        <div className="app-brand-text">
          <div className="app-brand-title-row">
            <span className="app-brand-title">{title}</span>
            {badge && <span className="app-brand-badge">{badge}</span>}
            <span className={`app-title-caret ${showDropdown ? 'open' : ''}`}>▾</span>
          </div>
          {subtitle && <p className="app-brand-subtitle">{subtitle}</p>}
        </div>
      </div>

      {showDropdown && (
        <div className="app-title-dropdown" onClick={(e) => e.stopPropagation()}>
          <div className="dropdown-section-title">Navigation</div>
          {NAV_ITEMS.map((item) => {
            const isActive = activeScreen === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={`dropdown-item ${isActive ? 'active' : ''}`}
                onClick={() => handleNavigate(item.path)}
              >
                <span className="dropdown-item-left">
                  <span className="dropdown-item-icon">{item.icon}</span>
                  <span className="dropdown-item-label">{item.label}</span>
                </span>
                {isActive && <span className="dropdown-active-dot" title="Current Screen">●</span>}
              </button>
            )
          })}

          {(onVoiceInputClick || onHelpClick || internalSecretMode) && (
            <div className="dropdown-divider" />
          )}

          {onVoiceInputClick && (
            <button
              type="button"
              className="dropdown-item"
              onClick={(e) => {
                setShowDropdown(false)
                onVoiceInputClick(e)
              }}
            >
              <span className="dropdown-item-left">
                <span className="dropdown-item-icon">🎤</span>
                <span className="dropdown-item-label">Voice Input</span>
              </span>
            </button>
          )}

          {onHelpClick && (
            <button
              type="button"
              className="dropdown-item"
              onClick={(e) => {
                setShowDropdown(false)
                onHelpClick(e)
              }}
            >
              <span className="dropdown-item-left">
                <span className="dropdown-item-icon">❓</span>
                <span className="dropdown-item-label">Help</span>
              </span>
            </button>
          )}

          {internalSecretMode && (
            <button
              type="button"
              className="dropdown-item dropdown-item-secret"
              onClick={handleHideSecret}
            >
              <span className="dropdown-item-left">
                <span className="dropdown-item-icon">🔒</span>
                <span className="dropdown-item-label">Hide Secret Mode</span>
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
