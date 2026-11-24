import React from 'react';
import { getTasksForDate } from '../../utils/dateUtils';
import { formatTime12Hour, getCurrentTimePosition } from '../../utils/timeUtils';

export default function WeekDayColumn({
  day,
  timeSlots,
  tasks,
  secretMode,
  viewDensity,
  blankTimeSlots,
  currentTime,
  getActualPosition,
  handleOverlappingTasks,
  onDayClick,
  onTaskClick
}) {
  const isToday = day.toDateString() === new Date().toDateString();
  const isWeekday = day.getDay() >= 1 && day.getDay() <= 5;

  const dayTasks = getTasksForDate(tasks, day).filter(task => secretMode || !task.is_hidden);
  const positionedTasks = handleOverlappingTasks(dayTasks);

  const handleSlotClick = (e) => {
    if (e.target.classList.contains('time-slot')) {
      const slotIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
      const clickedTime = timeSlots[slotIndex]?.value;
      onDayClick(day, clickedTime);
    } else {
      onDayClick(day);
    }
  };

  return (
    <div className="day-column-time" onClick={handleSlotClick}>
      {timeSlots.map((time, slotIndex) => {
        const [hours, minutes] = time.value.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        const isHighlightedTime = totalMinutes >= 870 && totalMinutes <= 1410;
        const isCollapsed = viewDensity === 1 && blankTimeSlots.has(slotIndex);
        const isUltraCollapsed = viewDensity === 2;

        return (
          <div 
            key={slotIndex} 
            className={`time-slot ${isHighlightedTime && isWeekday ? 'highlighted-slot' : ''} ${isCollapsed ? 'collapsed-slot' : ''} ${isUltraCollapsed ? 'ultra-collapsed-slot' : ''}`} 
            data-time={time.value}
          />
        );
      })}

      {positionedTasks.map(task => (
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
            e.stopPropagation();
            onTaskClick(task);
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
      ))}

      {isToday && (
        <div 
          className="current-time-line"
          style={{
            top: `${viewDensity > 0 
              ? getActualPosition(Math.floor((currentTime.getHours() * 60 + currentTime.getMinutes()) / 30)) 
              : getCurrentTimePosition(currentTime)}px`
          }}
        >
          <div className="current-time-dot" />
        </div>
      )}
    </div>
  );
}
