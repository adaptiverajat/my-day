import React from 'react'
import AppLogoMenu from './AppLogoMenu'

const CalendarHeader = ({ onVoiceInputClick, onHelpClick, onSecretModeToggle, secretMode }) => {
  return (
    <header className="calendar-header">
      <AppLogoMenu
        title="Rajat's calendar"
        currentScreen="calendar"
        onVoiceInputClick={onVoiceInputClick}
        onHelpClick={onHelpClick}
        secretMode={secretMode}
        onSecretModeToggle={onSecretModeToggle}
      />
    </header>
  )
}

export default CalendarHeader