import { useState, useEffect, useRef } from 'react'

export const useCurrentTime = (onMidnight) => {
  const [currentTime, setCurrentTime] = useState(new Date())
  const previousTimeRef = useRef(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = new Date()
      const oldTime = previousTimeRef.current
      
      setCurrentTime(newTime)
      previousTimeRef.current = newTime
      
      // Check if it's midnight (00:00:00)
      if (oldTime.getHours() === 23 && 
          oldTime.getMinutes() === 59 && 
          oldTime.getSeconds() === 59 &&
          newTime.getHours() === 0 && 
          newTime.getMinutes() === 0 && 
          newTime.getSeconds() === 0) {
        if (onMidnight) {
          onMidnight()
        }
      }
    }, 1000) // Update every second
    return () => clearInterval(timer)
  }, [])

  return currentTime
}