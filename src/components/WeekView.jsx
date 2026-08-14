import { useRef, useEffect } from 'react'
import { getWeekDays } from '../utils/dateUtils'
import { getTasksForDate } from '../utils/dateUtils'
import { calculateTaskPosition, getCurrentTimePosition } from '../utils/timeUtils'

const WeekView = ({ currentDate, tasks, timeSlots, onDayClick, onTaskClick, currentTime }) => {
  const mainScrollRef = useRef(null)
  const leftTimeScrollRef = useRef(null)
  const rightTimeScrollRef = useRef(null)

  const weekDays = getWeekDays(currentDate)

  useEffect(() => {
    if (mainScrollRef.current) {
      const currentTimePosition = getCurrentTimePosition(currentTime)
      mainScrollRef.current.scrollTop = Math.max(0, currentTimePosition - 300)
    }
  }, [currentTime])

  const handleMainScroll = (e) => {
    if (leftTimeScrollRef.current) {
      leftTimeScrollRef.current.scrollTop = e.target.scrollTop
    }
    if (rightTimeScrollRef.current) {
      rightTimeScrollRef.current.scrollTop = e.target.scrollTop
    }
  }

  const handleDayClick = (e, day) => {
    if (e.target.classList.contains('time-slot')) {
      const slotIndex = Array.from(e.target.parentNode.children).indexOf(e.target)
      const clickedTime = timeSlots[slotIndex]?.value
      onDayClick(day, clickedTime)
    } else {
      onDayClick(day)
    }
  }

  // Function to detect and handle overlapping tasks
  const handleOverlappingTasks = (dayTasks) => {
    // Sort tasks by start time
    const sortedTasks = [...dayTasks].sort((a, b) => {
      const aStart = a.from_time.split(':').map(Number)
      const bStart = b.from_time.split(':').map(Number)
      return (aStart[0] * 60 + aStart[1]) - (bStart[0] * 60 + bStart[1])
    })

    // Group overlapping tasks
    const groups = []
    for (const task of sortedTasks) {
      const taskStart = task.from_time.split(':').map(Number)
      const taskEnd = task.to_time.split(':').map(Number)
      const taskStartMin = taskStart[0] * 60 + taskStart[1]
      const taskEndMin = taskEnd[0] * 60 + taskEnd[1]

      let placed = false
      for (const group of groups) {
        const groupTask = group[0]
        const groupStart = groupTask.from_time.split(':').map(Number)
        const groupEnd = groupTask.to_time.split(':').map(Number)
        const groupStartMin = groupStart[0] * 60 + groupStart[1]
        const groupEndMin = groupEnd[0] * 60 + groupEnd[1]

        // Check if tasks overlap
        if (taskStartMin < groupEndMin && taskEndMin > groupStartMin) {
          group.push(task)
          placed = true
          break
        }
      }

      if (!placed) {
        groups.push([task])
      }
    }

    // Calculate positions for each task
    const positionedTasks = []
    for (const group of groups) {
      const groupSize = group.length
      group.forEach((task, index) => {
        const position = calculateTaskPosition(task)
        positionedTasks.push({
          ...task,
          ...position,
          width: 100 / groupSize,
          left: (index * 100) / groupSize
        })
      })
    }

    return positionedTasks
  }

  return (
    <div className="week-view">
      <div className="week-time-labels-right">
        <div className="time-label-spacer">
          <div class="day-name">Time</div>
          <div class="arrow-down">↓</div>
        </div>
        <div className="time-labels-scroll" ref={rightTimeScrollRef}>
          {timeSlots.map((time, index) => (
            <div key={index} className="time-label">
              {time.display}
            </div>
          ))}
        </div>
      </div>
      <div className="week-main-content">
        <div className="week-header">
          {weekDays.map((day, index) => (
            <div key={index} className="day-header">
              <div className="day-name">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className="day-number">{day.getDate()}</div>
            </div>
          ))}
        </div>
        
        <div 
          className="week-scroll-container" 
          ref={mainScrollRef}
          onScroll={handleMainScroll}
        >
          <div className="week-grid-time">
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className="day-column-time"
                onClick={(e) => handleDayClick(e, day)}
              >
                {timeSlots.map((time, slotIndex) => {
                  const timeValue = time.value // format: "HH:mm"
                  const [hours, minutes] = timeValue.split(':').map(Number)
                  const totalMinutes = hours * 60 + minutes
                  
                  // Check if time is between 2:30PM (14:30 = 870 min) and 11:30PM (23:30 = 1410 min)
                  const isHighlightedTime = totalMinutes >= 870 && totalMinutes <= 1410
                  
                  // Check if day is Monday through Friday (day.getDay() returns 0 for Sunday, 6 for Saturday)
                  const isWeekday = day.getDay() >= 1 && day.getDay() <= 5
                  
                  return (
                    <div 
                      key={slotIndex} 
                      className={`time-slot ${isHighlightedTime && isWeekday ? 'highlighted-slot' : ''}`} 
                      data-time={time.value}
                    ></div>
                  )
                })}
                
                {(() => {
                  const dayTasks = getTasksForDate(tasks, day)
                  const positionedTasks = handleOverlappingTasks(dayTasks)
                  
                  return positionedTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`task-item-time ${task.is_recurring ? 'recurring' : ''}`}
                      style={{
                        top: `${task.top}px`,
                        height: `${task.height}px`,
                        width: `${task.width}%`,
                        left: `${task.left}%`,
                        position: 'absolute',
                        backgroundColor: task.color || '#e3f2fd'
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                      }}
                    >
                      <div className="task-title-time">
                        {task.title}
                        &nbsp;
                        {task.is_recurring != 0 && <span className="recurring-indicator">↻</span>}
                      </div>
                      {task.description && (
                        <div className="task-description-time">{task.description}</div>
                      )}
                    </div>
                  ))
                })()}
                
                {day.toDateString() === new Date().toDateString() && (
                  <div 
                    className="current-time-line"
                    style={{ top: `${getCurrentTimePosition(currentTime)}px` }}
                  >
                    <div className="current-time-dot"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeekView