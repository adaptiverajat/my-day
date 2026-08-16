const ViewControls = ({ currentView, setCurrentView, setCurrentDate, viewDensity, setViewDensity, onReportClick, onVoiceInputClick }) => {
  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleCurrent = () => {
    setCurrentDate(new Date())
    setCurrentView('current')
  }

  return (
    <div className="view-controls">
      <button 
        className={`view-btn ${currentView === 'week' ? 'active' : ''}`}
        onClick={() => setCurrentView('week')}
      >
        Week
      </button>
      <button 
        className={`view-btn ${currentView === 'day' ? 'active' : ''}`}
        onClick={() => setCurrentView('day')}
      >
        Day
      </button>
      <button 
        className={`view-btn ${currentView === 'month' ? 'active' : ''}`}
        onClick={() => setCurrentView('month')}
      >
        Month
      </button>
      <button 
        className={`view-btn ${currentView === 'year' ? 'active' : ''}`}
        onClick={() => setCurrentView('year')}
      >
        Year
      </button>
      <button
        className={`view-btn ${currentView === 'current' ? 'active' : ''}`}
        onClick={handleCurrent}
      >
        Current
      </button>
      <button 
        className="today-btn"
        onClick={handleToday}
      >
        Today
      </button>
      <button 
        className="report-btn"
        onClick={onReportClick}
      >
        Report
      </button>
      <button 
        className="voice-input-btn"
        onClick={onVoiceInputClick}
        title="Voice Input"
      >
        🎤
      </button>
      <div className="density-slider-container">
        <label className="density-label">Density:</label>
        <div className="density-slider">
          <div 
            className={`density-step ${viewDensity === 0 ? 'active' : ''}`}
            onClick={() => setViewDensity(0)}
          >
            Normal
          </div>
          <div 
            className={`density-step ${viewDensity === 1 ? 'active' : ''}`}
            onClick={() => setViewDensity(1)}
          >
            Minimal
          </div>
          <div 
            className={`density-step ${viewDensity === 2 ? 'active' : ''}`}
            onClick={() => setViewDensity(2)}
          >
            Ultra
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewControls