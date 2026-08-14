import { useState, useEffect } from 'react'
import './App.css'
import CalendarHeader from './components/CalendarHeader'
import ViewControls from './components/ViewControls'
import TodoList from './components/TodoList'
import TaskModal from './components/TaskModal'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import MonthView from './components/MonthView'
import YearView from './components/YearView'
import { useCalendarTasks } from './hooks/useCalendarTasks'
import { useTodoItems } from './hooks/useTodoItems'
import { useTimeSlots } from './hooks/useTimeSlots'
import { useCurrentTime } from './hooks/useCurrentTime'
import { formatDateDisplay, formatMonthDisplay, formatYearDisplay } from './utils/dateUtils'
import { calculateEndTime } from './utils/timeUtils'

function App() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [currentView, setCurrentView] = useState('week')
  const [showModal, setShowModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [initialFromTime, setInitialFromTime] = useState('')
  const [initialToTime, setInitialToTime] = useState('')
  const [editingTask, setEditingTask] = useState(null)
  
  const { tasks, addTask, updateTask, deleteTask, fetchTasks } = useCalendarTasks(currentDate, currentView)
  const { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem, updateTodoItem } = useTodoItems()
  const timeSlots = useTimeSlots()
  const currentTime = useCurrentTime()

  const setupDatabase = async () => {
    try {
      await fetch('http://localhost:3001/api/setup-database')
    } catch (error) {
      console.error('Error setting up database:', error)
    }
  }

  useEffect(() => {
    setupDatabase()
  }, [])

  const navigateWeek = (direction) => {
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
    setSelectedDate(new Date(task.task_date))
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
      <CalendarHeader />
      <ViewControls currentView={currentView} setCurrentView={setCurrentView} setCurrentDate={setCurrentDate} />

      <div className="date-display">
        {currentView === 'week' && (
          <>
            <button className="nav-btn" onClick={() => navigateWeek(-1)}>←</button>
            <h2>{formatDateDisplay(currentDate)}</h2>
            <button className="nav-btn" onClick={() => navigateWeek(1)}>→</button>
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

      <TodoList 
        todoItems={todoItems}
        onAdd={addTodoItem}
        onToggle={toggleTodoItem}
        onDelete={deleteTodoItem}
        onUpdate={updateTodoItem}
      />

      {currentView === 'week' && (
        <WeekView 
          currentDate={currentDate}
          tasks={tasks}
          timeSlots={timeSlots}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
          currentTime={currentTime}
        />
      )}

      {currentView === 'day' && (
        <DayView 
          currentDate={currentDate}
          tasks={tasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      )}

      {currentView === 'month' && (
        <MonthView 
          currentDate={currentDate}
          tasks={tasks}
          onDayClick={handleDayClick}
          onTaskClick={handleTaskClick}
        />
      )}

      {currentView === 'year' && (
        <YearView 
          currentDate={currentDate}
          tasks={tasks}
          onMonthClick={handleMonthClick}
        />
      )}

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
        onDelete={async (id, deleteMode) => {
          const success = await deleteTask(id, deleteMode)
          if (success) {
            setShowModal(false)
            setEditingTask(null)
          }
        }}
      />
    </div>
  )
}

export default App