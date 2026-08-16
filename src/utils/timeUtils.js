export const generateTimeSlots = () => {
  const slots = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const ampm = hour < 12 ? 'AM' : 'PM'
      const timeStr = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`
      const timeValue = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push({ display: timeStr, value: timeValue })
    }
  }
  return slots
}

export const calculateTaskPosition = (task) => {
  const [fromHours, fromMinutes] = task.from_time.split(':').map(Number)
  const [toHours, toMinutes] = task.to_time.split(':').map(Number)
  
  const fromTotalMinutes = fromHours * 60 + fromMinutes
  const toTotalMinutes = toHours * 60 + toMinutes
  
  const slotHeight = 60
  const pixelsPerMinute = slotHeight / 30
  
  const top = fromTotalMinutes * pixelsPerMinute
  const height = Math.max(slotHeight, (toTotalMinutes - fromTotalMinutes) * pixelsPerMinute)
  
  return { top, height }
}

export const getCurrentTimePosition = (currentTime) => {
  const totalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const slotHeight = 60
  const pixelsPerMinute = slotHeight / 30
  return totalMinutes * pixelsPerMinute
}

export const calculateEndTime = (startTime) => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = (hours + 1) % 24
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export const formatTime12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number)
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
  const ampm = hours < 12 ? 'AM' : 'PM'
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
}