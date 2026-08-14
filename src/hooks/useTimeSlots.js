import { useMemo } from 'react'
import { generateTimeSlots } from '../utils/timeUtils'

export const useTimeSlots = () => {
  const timeSlots = useMemo(() => generateTimeSlots(), [])
  return timeSlots
}