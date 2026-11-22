import { getYearMonths, getTasksForMonth } from '../utils/dateUtils'

const YearView = ({ currentDate, tasks, onMonthClick, secretMode }) => {
  const hasRecurringTasks = (month) => {
    return getTasksForMonth(tasks, month).filter(task => secretMode || !task.is_hidden).some(task => task.is_recurring)
  }
  const yearMonths = getYearMonths(currentDate)

  return (
    <div className="year-view">
      <div className="year-grid">
        {yearMonths.map((month, index) => (
          <div 
            key={index} 
            className="year-month"
            onClick={() => onMonthClick(month)}
          >
            <div className="year-month-name">{month.toLocaleDateString('en-US', { month: 'long' })}</div>
            <div className="year-month-tasks">
              {getTasksForMonth(tasks, month).filter(task => secretMode || !task.is_hidden).length} tasks
              {hasRecurringTasks(month) && <span className="recurring-indicator"> ↻</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default YearView