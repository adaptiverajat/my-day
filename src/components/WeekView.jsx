import { useRef, useEffect, useMemo, useState } from 'react'
import { getWeekDays } from '../utils/dateUtils'
import { getTasksForDate } from '../utils/dateUtils'
import { calculateTaskPosition, getCurrentTimePosition, formatTime12Hour } from '../utils/timeUtils'

const WeekView = ({ currentDate, tasks, timeSlots, onDayClick, onTaskClick, currentTime, days, viewDensity }) => {
  const mainScrollRef = useRef(null)
  const leftTimeScrollRef = useRef(null)
  const rightTimeScrollRef = useRef(null)
  const [previousDate, setPreviousDate] = useState(null)

  const weekDays = days || getWeekDays(currentDate)
  
  // Derive flags from slider value
  const minimalView = viewDensity >= 1
  const ultraMinimalView = viewDensity === 2

  // Determine which time slots are blank for all visible days
  const blankTimeSlots = useMemo(() => {
    if (viewDensity === 0) return new Set()

    const blankSlots = new Set()
    
    timeSlots.forEach((time, slotIndex) => {
      let isBlank = true
      
      weekDays.forEach(day => {
        const dayTasks = getTasksForDate(tasks, day)
        const timeValue = time.value
        const [hours, minutes] = timeValue.split(':').map(Number)
        const slotStartMinutes = hours * 60 + minutes
        const slotEndMinutes = slotStartMinutes + 30 // Each slot is 30 minutes
        
        // Check if any task overlaps with this time slot
        dayTasks.forEach(task => {
          const taskStart = task.from_time.split(':').map(Number)
          const taskEnd = task.to_time.split(':').map(Number)
          const taskStartMinutes = taskStart[0] * 60 + taskStart[1]
          const taskEndMinutes = taskEnd[0] * 60 + taskEnd[1]
          
          // Check for overlap
          if (taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes) {
            isBlank = false
          }
        })
      })
      
      if (isBlank) {
        blankSlots.add(slotIndex)
      }
    })
    
    return blankSlots
  }, [viewDensity, JSON.stringify(tasks), weekDays, timeSlots, currentDate])

  // Calculate actual pixel position considering collapsed slots
  const getActualPosition = (slotIndex) => {
    let position = 0
    for (let i = 0; i < slotIndex; i++) {
      if (viewDensity === 2) {
        position += 15
      } else if (viewDensity === 1 && blankTimeSlots.has(i)) {
        position += 15
      } else {
        position += 60
      }
    }
    return position
  }

  // Scroll to 7:00AM when date changes or initial load to current time
  useEffect(() => {
    const currentDateString = weekDays[0]?.toDateString()
    if (mainScrollRef.current) {
      if (previousDate === null) {
        // Initial load - scroll to current time
        const currentTimePosition = viewDensity > 0 ? getActualPosition(Math.floor((currentTime.getHours() * 60 + currentTime.getMinutes()) / 30)) : getCurrentTimePosition(currentTime)
        mainScrollRef.current.scrollTop = Math.max(0, currentTimePosition - 300)
      } else if (currentDateString !== previousDate) {
        // Date changed - scroll to 7:00AM
        const slotIndex = 14 // 7:00AM
        const position7AM = getActualPosition(slotIndex)
        mainScrollRef.current.scrollTop = Math.max(0, position7AM - 50)
      }
    }
    setPreviousDate(currentDateString)
  }, [currentDate, weekDays, previousDate, blankTimeSlots, currentTime, viewDensity])

  // Calculate task position with collapsed slots consideration
  const calculateTaskPositionWithCollapse = (task) => {
    const [fromHours, fromMinutes] = task.from_time.split(':').map(Number)
    const [toHours, toMinutes] = task.to_time.split(':').map(Number)
    
    const fromTotalMinutes = fromHours * 60 + fromMinutes
    const toTotalMinutes = toHours * 60 + toMinutes
    
    const slotIndex = Math.floor(fromTotalMinutes / 30)
    const endSlotIndex = Math.floor(toTotalMinutes / 30)
    
    const top = getActualPosition(slotIndex)
    
    // Calculate height considering collapsed slots
    let height = 0
    for (let i = slotIndex; i < endSlotIndex; i++) {
      if (viewDensity === 2) {
        height += 15
      } else if (viewDensity === 1 && blankTimeSlots.has(i)) {
        height += 15
      } else {
        height += 60
      }
    }
    // Add partial slot for the end
    const remainingMinutes = toTotalMinutes % 30
    if (remainingMinutes > 0) {
      let slotHeight
      if (viewDensity === 2) {
        slotHeight = 15
      } else if (viewDensity === 1 && blankTimeSlots.has(endSlotIndex)) {
        slotHeight = 15
      } else {
        slotHeight = 60
      }
      height += (remainingMinutes / 30) * slotHeight
    }
    
    return { top, height }
  }

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
        const position = viewDensity > 0 ? calculateTaskPositionWithCollapse(task) : calculateTaskPosition(task)
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
          <div className="day-name">Time</div>
          <div className="arrow-down">↓</div>
        </div>
        <div className="time-labels-scroll" ref={rightTimeScrollRef}>
          {timeSlots.map((time, index) => (
            <div 
              key={index} 
              className={`time-label ${viewDensity === 2 ? 'ultra-collapsed-slot' : (viewDensity === 1 && blankTimeSlots.has(index) ? 'collapsed-slot' : '')}`}
            >
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
                  
                  // Check if this slot should be collapsed based on view density
                  const isCollapsed = viewDensity === 1 && blankTimeSlots.has(slotIndex)
                  const isUltraCollapsed = viewDensity === 2
                  
                  return (
                    <div 
                      key={slotIndex} 
                      className={`time-slot ${isHighlightedTime && isWeekday ? 'highlighted-slot' : ''} ${isCollapsed ? 'collapsed-slot' : ''} ${isUltraCollapsed ? 'ultra-collapsed-slot' : ''}`} 
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
                      className={`task-item-time ${task.is_recurring ? 'recurring' : ''} ${viewDensity === 2 ? 'ultra-minimal-task' : ''}`}
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
                      title={`${formatTime12Hour(task.from_time)} - ${formatTime12Hour(task.to_time)}`}
                    >
                      <div className="task-title-time">
                        {task.title}
                        &nbsp;
                        {task.is_recurring != 0 && <span className="recurring-indicator">↻</span>}
                      </div>
                      {viewDensity !== 2 && task.description && (
                        <div className="task-description-time">{task.description}</div>
                      )}
                    </div>
                  ))
                })()}
                
                {day.toDateString() === new Date().toDateString() && (
                  <div 
                    className="current-time-line"
                    style={{ top: `${viewDensity > 0 ? getActualPosition(Math.floor((currentTime.getHours() * 60 + currentTime.getMinutes()) / 30)) : getCurrentTimePosition(currentTime)}px` }}
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