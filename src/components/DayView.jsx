import { getTasksForDate } from '../utils/dateUtils'

const DayView = ({ currentDate, tasks, onDayClick, onTaskClick }) => {
  const dayTasks = getTasksForDate(tasks, currentDate)

  return (
    <div className="day-view">
      <div className="day-header-large">
        <div className="day-name-large">{currentDate.toLocaleDateString('en-US', { weekday: 'long' })}</div>
        <div className="day-number-large">{currentDate.getDate()}</div>
      </div>
      <div className="day-tasks">
        {dayTasks.map(task => (
          <div 
            key={task.id} 
            className={`task-item-large ${task.is_recurring ? 'recurring' : ''}`} 
            onClick={() => onTaskClick(task)}
            style={{ backgroundColor: task.color || '#e3f2fd' }}
          >
            <div className="task-time">{task.from_time} - {task.to_time}</div>
            <div className="task-title">
              {task.title}
              {task.is_recurring && <span className="recurring-indicator">↻</span>}
            </div>
            <div className="task-description">{task.description}</div>
          </div>
        ))}
        {dayTasks.length === 0 && (
          <div className="no-tasks">
            <p>No tasks for this day. Click to add a task.</p>
            <button className="add-task-btn" onClick={() => onDayClick(currentDate)}>+ Add Task</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DayView