import { getMonthDays } from '../utils/dateUtils'
import { getTasksForDate } from '../utils/dateUtils'
import { formatTime12Hour } from '../utils/timeUtils'

const MonthView = ({ currentDate, tasks, onDayClick, onTaskClick }) => {
  const monthDays = getMonthDays(currentDate)

  return (
    <div className="month-view">
      <div className="month-header">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
          <div key={index} className="month-day-header">{day}</div>
        ))}
      </div>
      <div className="month-grid">
        {monthDays.map((day, index) => (
          <div 
            key={index} 
            className={`month-day ${day ? 'has-date' : 'empty'}`}
            onClick={() => day && onDayClick(day)}
          >
            {day && (
              <>
                <div className="month-day-number">{day.getDate()}</div>
                <div className="month-day-tasks">
                  {getTasksForDate(tasks, day).slice(0, 3).map(task => (
                    <div 
                      key={task.id} 
                      className={`mini-task ${task.is_recurring ? 'recurring' : ''}`}
                      style={{ backgroundColor: task.color || '#e3f2fd' }}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick(task)
                      }}
                      title={`${formatTime12Hour(task.from_time)} - ${formatTime12Hour(task.to_time)}`}
                    >
                      {task.title}
                      {task.is_recurring && <span className="recurring-indicator">↻</span>}
                    </div>
                  ))}
                  {getTasksForDate(tasks, day).length > 3 && (
                    <div className="more-tasks">+{getTasksForDate(tasks, day).length - 3} more</div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MonthView