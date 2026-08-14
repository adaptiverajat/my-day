const ViewControls = ({ currentView, setCurrentView, setCurrentDate }) => {
  const handleToday = () => {
    setCurrentDate(new Date())
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
        className="today-btn"
        onClick={handleToday}
      >
        Today
      </button>
    </div>
  )
}

export default ViewControls