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
    startDate: startOfWeek.toISOString().split('T')[0],
    endDate: endOfWeek.toISOString().split('T')[0]
  }
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
  const dateStr = date.toLocaleDateString('en-CA')
  return tasks.filter(task => {
    const taskDate = new Date(task.task_date)
    const taskDateStr = taskDate.toLocaleDateString('en-CA')
    return taskDateStr === dateStr
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