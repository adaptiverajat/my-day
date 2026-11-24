import React from 'react'
import AppLogoMenu from './AppLogoMenu'

const CalendarHeader = ({ onVoiceInputClick, onHelpClick, onSecretModeToggle, secretMode }) => {
  return (
    <header className="calendar-header">
      <AppLogoMenu
        title="Rajat's calendar"
        currentScreen="calendar"
        onHelpClick={onHelpClick}
        secretMode={secretMode}
        onSecretModeToggle={onSecretModeToggle}
      />
      {onVoiceInputClick && (
        <button
          type="button"
          className="calendar-voice-btn"
          onClick={onVoiceInputClick}
          title="Voice Input (Dictate tasks/events)"
        >
          <span className="calendar-voice-icon">🎤</span>
          <span className="calendar-voice-text">Voice Input</span>
        </button>
      )}
    </header>
  )
}

export default CalendarHeader