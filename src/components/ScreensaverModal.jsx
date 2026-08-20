import { useState, useEffect } from 'react'

const ScreensaverModal = ({ show, tasks, currentDate }) => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    if (show) {
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [show])

  const getTasksForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => task.task_date === dateStr)
  }

  const getDays = () => {
    const yesterday = new Date(currentDate)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const today = new Date(currentDate)
    
    const tomorrow = new Date(currentDate)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const dayAfter = new Date(currentDate)
    dayAfter.setDate(dayAfter.getDate() + 2)
    
    return { yesterday, today, tomorrow, dayAfter }
  }

  const formatDate = (date) => {
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  }

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  if (!show) return null

  const { yesterday, today, tomorrow, dayAfter } = getDays()

  return (
    <div className="screensaver-overlay">
      <div className="screensaver-content">
        {/* Time display - 50% height */}
        <div className="screensaver-time">
          {currentTime.toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })}
        </div>

        {/* Date display - 20% height */}
        <div className="screensaver-date">
          {formatDate(currentDate)}
        </div>

        {/* Tasks columns - 20% height */}
        <div className="screensaver-tasks">
          <div className="task-column">
            <div className="task-header">
              <h3>Yesterday</h3>
              <div className="task-date">{formatDate(yesterday)}</div>
            </div>
            <div className="task-list">
              {getTasksForDay(yesterday).map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-time">{formatTime(task.from_time)}</span>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              {getTasksForDay(yesterday).length === 0 && (
                <div className="no-tasks">No tasks</div>
              )}
            </div>
          </div>

          <div className="task-column">
            <div className="task-header">
              <h3>Today</h3>
              <div className="task-date">{formatDate(today)}</div>
            </div>
            <div className="task-list">
              {getTasksForDay(today).map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-time">{formatTime(task.from_time)}</span>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              {getTasksForDay(today).length === 0 && (
                <div className="no-tasks">No tasks</div>
              )}
            </div>
          </div>

          <div className="task-column">
            <div className="task-header">
              <h3>Tomorrow</h3>
              <div className="task-date">{formatDate(tomorrow)}</div>
            </div>
            <div className="task-list">
              {getTasksForDay(tomorrow).map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-time">{formatTime(task.from_time)}</span>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              {getTasksForDay(tomorrow).length === 0 && (
                <div className="no-tasks">No tasks</div>
              )}
            </div>
          </div>

          <div className="task-column">
            <div className="task-header">
              <h3>Day After</h3>
              <div className="task-date">{formatDate(dayAfter)}</div>
            </div>
            <div className="task-list">
              {getTasksForDay(dayAfter).map(task => (
                <div key={task.id} className="task-item">
                  <span className="task-time">{formatTime(task.from_time)}</span>
                  <span className="task-title">{task.title}</span>
                </div>
              ))}
              {getTasksForDay(dayAfter).length === 0 && (
                <div className="no-tasks">No tasks</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ScreensaverModal