import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const CalendarHeader = ({ onVoiceInputClick, onHelpClick, onSecretModeToggle }) => {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [secretMode, setSecretMode] = useState(false)
  const secretKeySequenceRef = useRef('')
  const dropdownRef = useRef(null)

  const SECRET_CODE = 'mtbt'

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

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (showDropdown && !secretMode) {
        if (event.key.length !== 1) return
        const newSequence = (secretKeySequenceRef.current + event.key.toLowerCase()).slice(-SECRET_CODE.length)
        secretKeySequenceRef.current = newSequence
        if (newSequence === SECRET_CODE) {
          secretKeySequenceRef.current = ''
          setSecretMode(true)
          onSecretModeToggle?.(true)
        }
      }
    }

    if (showDropdown) {
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [showDropdown, secretMode, onSecretModeToggle])

  const handleTitleClick = () => {
    setShowDropdown(prev => !prev)
    secretKeySequenceRef.current = ''
  }

  const handleHideSecret = (e) => {
    e.stopPropagation()
    setSecretMode(false)
    onSecretModeToggle?.(false)
    setShowDropdown(false)
    secretKeySequenceRef.current = ''
  }

  return (
    <header className="calendar-header">
      <h1 className="app-title" onClick={handleTitleClick} ref={dropdownRef}>
        <img src="/favicon.png" alt="Logo" className="app-logo" />
        Rajat's calendar
        {showDropdown && (
          <div className="app-title-dropdown" onClick={(e) => e.stopPropagation()}>
            {secretMode && (
              <button className="dropdown-item dropdown-item-secret" onClick={handleHideSecret}>
                🔒 Hide Secret Mode
              </button>
            )}
            <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/report'); }}>
              📊 Report
            </button>
            <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/jivandisha'); }}>
              📖 JivanDisha
            </button>
            <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/finances'); }}>
              💰 Finances
            </button>
            <button className="dropdown-item" onClick={() => { setShowDropdown(false); navigate('/work'); }}>
              📋 Work
            </button>
            <button className="dropdown-item" onClick={(e) => { setShowDropdown(false); onVoiceInputClick?.(e); }}>
              🎤 Voice Input
            </button>
            <button className="dropdown-item" onClick={(e) => { setShowDropdown(false); onHelpClick?.(e); }}>
              ❓ Help
            </button>
          </div>
        )}
      </h1>
    </header>
  )
}

export default CalendarHeader