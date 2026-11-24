import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import CalendarHeader from './components/CalendarHeader'
import ViewControls from './components/ViewControls'
import TodoList from './components/TodoList'
import TaskModal from './components/TaskModal'
import VoiceInputModal from './components/VoiceInputModal'
import HelpModal from './components/HelpModal'
import ScreensaverModal from './components/ScreensaverModal'
import Finances from './components/Finances'
import Work from './components/Work'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import MonthView from './components/MonthView'
import YearView from './components/YearView'
import Report from './components/Report'
import JivanDisha from './components/JivanDisha'
import { useCalendarTasks } from './hooks/useCalendarTasks'
import { useTodoItems } from './hooks/useTodoItems'
import { useTimeSlots } from './hooks/useTimeSlots'
import { useCurrentTime } from './hooks/useCurrentTime'
import { formatDateDisplay, formatMonthDisplay, formatYearDisplay, getCurrentRange, formatCurrentRangeDisplay, parseDateInputValue } from './utils/dateUtils'
import { calculateEndTime } from './utils/timeUtils'

function Calendar() {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('week')
  const [databaseReady, setDatabaseReady] = useState(false)
  const [databaseError, setDatabaseError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [initialFromTime, setInitialFromTime] = useState('')
  const [initialToTime, setInitialToTime] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  const [viewDensity, setViewDensity] = useState(1) // 0: normal, 1: minimal, 2: ultra minimal
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showScreensaver, setShowScreensaver] = useState(false)
  const [secretMode, setSecretMode] = useState(false)

  // Derive flags from slider value
  const minimalView = viewDensity >= 1
  const ultraMinimalView = viewDensity === 2
  
  const { tasks, addTask, updateTask, deleteTask, fetchTasks } = useCalendarTasks(currentDate, currentView, databaseReady)
  

  const { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem, updateTodoItem } = useTodoItems(databaseReady)
  const timeSlots = useTimeSlots()
  const currentTime = useCurrentTime(() => {
    // Refresh page at midnight
    window.location.reload()
  })

  const setupDatabase = async () => {
    try {
      setDatabaseError('')
      const response = await fetch('http://localhost:3001/api/setup-database')
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Database setup failed')
      }
      setDatabaseReady(true)
    } catch (error) {
      console.error('Error setting up database:', error)
      setDatabaseError(error.message)
    }
  }

  useEffect(() => {
    setupDatabase()
  }, [])

  // Idle detection for screensaver
  useEffect(() => {
    let timeoutId

    const resetIdleTimer = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setShowScreensaver(true)
      }, 60000) // 60 seconds
    }

    const handleActivity = () => {
      resetIdleTimer()
      setShowScreensaver(false)
    }

    // Initial setup
    resetIdleTimer()

    // Track mouse movement and keyboard events
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('keypress', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('scroll', handleActivity)

    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('keypress', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('scroll', handleActivity)
      clearTimeout(timeoutId)
    }
  }, [])

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const navigateCurrent = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setCurrentDate(newDate)
  }

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + direction)
    setCurrentDate(newDate)
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const navigateYear = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setFullYear(newDate.getFullYear() + direction)
    setCurrentDate(newDate)
  }

  const handleDayClick = (date, clickedTime = null) => {
    setSelectedDate(date)
    setEditingTask(null)
    
    if (clickedTime) {
      setInitialFromTime(clickedTime)
      setInitialToTime(calculateEndTime(clickedTime))
    } else {
      setInitialFromTime('')
      setInitialToTime('')
    }
    
    setShowModal(true)
  }

  const handleTaskClick = (task) => {
    const parsedDate = parseDateInputValue(task.task_date)
    setSelectedDate(parsedDate)
    setEditingTask(task)
    setInitialFromTime(task.from_time)
    setInitialToTime(task.to_time)
    setShowModal(true)
  }

  const handleSaveTask = async (taskData) => {
    if (editingTask) {
      const success = await updateTask(editingTask.id, taskData)
      if (success) {
        setShowModal(false)
        setEditingTask(null)
      }
    } else {
      const success = await addTask(taskData)
      if (success) {
        setShowModal(false)
      }
    }
  }

  const handleMonthClick = (month) => {
    setCurrentDate(month)
    setCurrentView('month')
  }

  return (
    <div className="calendar-app">
      {!databaseReady && (
        <div role={databaseError ? 'alert' : 'status'}>
          {databaseError
            ? <>Database unavailable: {databaseError} <button onClick={setupDatabase}>Retry</button></>
            : 'Connecting to the database…'}
        </div>
      )}
      <div className="header-row">
        <CalendarHeader onVoiceInputClick={() => setShowVoiceInput(true)} onHelpClick={() => setShowHelp(true)} onSecretModeToggle={setSecretMode} secretMode={secretMode} />
        <ViewControls currentView={currentView} setCurrentView={setCurrentView} setCurrentDate={setCurrentDate} viewDensity={viewDensity} setViewDensity={setViewDensity} />
        <div className="date-display">
          <div className="digital-clock">
            {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          {currentView === 'week' && (
            <>
              <button className="nav-btn" onClick={() => navigateWeek(-1)}>←</button>
              <h2>{formatDateDisplay(currentDate)}</h2>
              <button className="nav-btn" onClick={() => navigateWeek(1)}>→</button>
            </>
          )}
          {currentView === 'current' && (
            <>
              <button className="nav-btn" onClick={() => navigateCurrent(-1)}>←</button>
              <h2>{formatCurrentRangeDisplay(currentDate)}</h2>
              <button className="nav-btn" onClick={() => navigateCurrent(1)}>→</button>
            </>
          )}
          {currentView === 'day' && (
            <>
              <button className="nav-btn" onClick={() => navigateDay(-1)}>←</button>
              <h2>{formatDateDisplay(currentDate)}</h2>
              <button className="nav-btn" onClick={() => navigateDay(1)}>→</button>
            </>
          )}
          {currentView === 'month' && (
            <>
              <button className="nav-btn" onClick={() => navigateMonth(-1)}>←</button>
              <h2>{formatMonthDisplay(currentDate)}</h2>
              <button className="nav-btn" onClick={() => navigateMonth(1)}>→</button>
            </>
          )}
          {currentView === 'year' && (
            <>
              <button className="nav-btn" onClick={() => navigateYear(-1)}>←</button>
              <h2>{formatYearDisplay(currentDate)}</h2>
              <button className="nav-btn" onClick={() => navigateYear(1)}>→</button>
            </>
          )}
        </div>
      </div>

      {(currentView === 'week' || currentView === 'current') && (
        <WeekView
          currentDate={currentDate}
          tasks={tasks}
          timeSlots={timeSlots}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          currentTime={currentTime}
          days={currentView === 'current' ? getCurrentRange(currentDate).days : undefined}
          viewDensity={viewDensity}
          secretMode={secretMode}
        />
      )}

      {currentView === 'day' && (
        <DayView
          key={`day-${currentDate.toISOString()}-${tasks.length}`}
          currentDate={currentDate}
          tasks={tasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          secretMode={secretMode}
        />
      )}

      {currentView === 'month' && (
        <MonthView
          currentDate={currentDate}
          tasks={tasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          secretMode={secretMode}
        />
      )}

      {currentView === 'year' && (
        <YearView
          currentDate={currentDate}
          tasks={tasks}
          onMonthClick={handleMonthClick}
          secretMode={secretMode}
        />
      )}

      <TodoList 
        todoItems={todoItems}
        onAdd={addTodoItem}
        onToggle={toggleTodoItem}
        onDelete={deleteTodoItem}
        onUpdate={updateTodoItem}
      />

      <TaskModal
        show={showModal}
        onClose={() => {
          setShowModal(false)
          setEditingTask(null)
        }}
        selectedDate={selectedDate}
        onSave={handleSaveTask}
        timeSlots={timeSlots}
        initialFromTime={initialFromTime}
        initialToTime={initialToTime}
        editingTask={editingTask}
        secretMode={secretMode}
        onDelete={async (id, deleteMode) => {
          const success = await deleteTask(id, deleteMode)
          if (success) {
            setShowModal(false)
            setEditingTask(null)
          }
        }}
      />

      <VoiceInputModal 
        show={showVoiceInput}
        onClose={() => setShowVoiceInput(false)}
        currentDate={currentDate}
        onTasksCreated={() => {
          fetchTasks()
        }}
      />

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <ScreensaverModal 
        show={showScreensaver}
        tasks={tasks}
        currentDate={currentDate}
      />

    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Calendar />} />
      <Route path="/report" element={<Report />} />
      <Route path="/jivandisha" element={<JivanDisha />} />
      <Route path="/finances" element={<Finances />} />
      <Route path="/work" element={<Work />} />
    </Routes>
  )
}

export default App