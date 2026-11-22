import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const CalendarHeader = ({ onVoiceInputClick, onHelpClick, onSecretModeToggle }) => {
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)
  const [secretMode, setSecretMode] = useState(false)
  const [secretKeySequence, setSecretKeySequence] = useState('')
  const dropdownRef = useRef(null)

  const SECRET_CODE = 'mtbt'

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
        setSecretKeySequence('')
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
        setSecretKeySequence(prev => {
          const newSequence = prev + event.key.toLowerCase()
          if (newSequence === SECRET_CODE) {
            setSecretMode(true)
            onSecretModeToggle?.(true)
            return ''
          }
          if (newSequence.length > SECRET_CODE.length) {
            return newSequence.slice(-SECRET_CODE.length)
          }
          return newSequence
        })
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
    setShowDropdown(!showDropdown)
    if (!showDropdown) {
      setSecretKeySequence('')
    }
  }

  const handleHideSecret = () => {
    setSecretMode(false)
    onSecretModeToggle?.(false)
    setShowDropdown(false)
  }

  return (
    <header className="calendar-header">
      <h1 className="app-title" onClick={handleTitleClick} ref={dropdownRef}>
        <img src="/favicon.png" alt="Logo" className="app-logo" />
        Rajat's calendar
        {showDropdown && (
          <div className="app-title-dropdown">
            {secretMode && (
              <button className="dropdown-item dropdown-item-secret" onClick={handleHideSecret}>
                🔒 Hide Secret Mode
              </button>
            )}
            <button className="dropdown-item" onClick={() => navigate('/report')}>
              📊 Report
            </button>
            <button className="dropdown-item" onClick={() => navigate('/jivandisha')}>
              📖 JivanDisha
            </button>
            <button className="dropdown-item" onClick={() => navigate('/finances')}>
              💰 Finances
            </button>
            <button className="dropdown-item" onClick={() => navigate('/work')}>
              📋 Work
            </button>
            <button className="dropdown-item" onClick={onVoiceInputClick}>
              🎤 Voice Input
            </button>
            <button className="dropdown-item" onClick={onHelpClick}>
              ❓ Help
            </button>
          </div>
        )}
      </h1>
    </header>
  )
}

export default CalendarHeader