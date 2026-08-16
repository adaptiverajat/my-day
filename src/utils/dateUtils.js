export const formatDateInputValue = (date) => {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export const parseDateInputValue = (value) => {
  if (!value) return new Date()

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate())
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return new Date()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number)
      return new Date(year, month - 1, day)
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date()
}

export const getWeekDays = (currentDate) => {
  const days = []
  const startOfWeek = new Date(currentDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(startOfWeek.getDate() + i)
    days.push(date)
  }
  return days
}

export const getMonthDays = (currentDate) => {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []
  
  const startDay = firstDay.getDay()
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1
  
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push(null)
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i))
  }
  
  return days
}

export const getYearMonths = (currentDate) => {
  const months = []
  const year = currentDate.getFullYear()
  
  for (let i = 0; i < 12; i++) {
    months.push(new Date(year, i, 1))
  }
  
  return months
}

export const getDateRange = (currentDate) => {
  const startOfWeek = new Date(currentDate)
  const day = startOfWeek.getDay()
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return {
    startDate: formatDateInputValue(startOfWeek),
    endDate: formatDateInputValue(endOfWeek)
  }
}

export const getCurrentRange = (currentDate) => {
  const start = new Date(currentDate)
  start.setDate(start.getDate() - 3)

  const days = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    days.push(date)
  }

  return {
    startDate: formatDateInputValue(days[0]),
    endDate: formatDateInputValue(days[days.length - 1]),
    days
  }
}

export const isRecurrenceEndDateValid = (value, taskDate) => {
  if (!value) return true

  const candidate = parseDateInputValue(value)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  candidate.setHours(0, 0, 0, 0)

  const startDate = taskDate ? parseDateInputValue(taskDate) : null
  if (startDate) {
    startDate.setHours(0, 0, 0, 0)
    return candidate > today && candidate > startDate
  }

  return candidate > today
}

export const formatCurrentRangeDisplay = (currentDate) => {
  const range = getCurrentRange(currentDate)
  const start = range.days[0]
  const end = range.days[range.days.length - 1]

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
}

export const formatDateDisplay = (currentDate) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return currentDate.toLocaleDateString('en-US', options)
}

export const formatMonthDisplay = (currentDate) => {
  const options = { month: 'long', year: 'numeric' }
  return currentDate.toLocaleDateString('en-US', options)
}

export const formatYearDisplay = (currentDate) => {
  return currentDate.getFullYear().toString()
}

export const getTasksForDate = (tasks, date) => {
  // Use local timezone for comparison to match user's local time
  const localDateStr = date.toLocaleDateString('en-CA')
  
  return tasks.filter(task => {
    const taskDate = new Date(task.task_date)
    const taskLocalDateStr = taskDate.toLocaleDateString('en-CA')
    return taskLocalDateStr === localDateStr
  })
}

export const getTasksForMonth = (tasks, date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  return tasks.filter(task => {
    const taskDate = new Date(task.task_date)
    return taskDate.getFullYear() === year && taskDate.getMonth() === month
  })
}