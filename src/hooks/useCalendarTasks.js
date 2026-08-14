import { useState, useEffect } from 'react'
import { getDateRange } from '../utils/dateUtils'

const API_URL = 'http://localhost:3001/api'

export const useCalendarTasks = (currentDate, currentView) => {
  const [tasks, setTasks] = useState([])

  const fetchTasks = async () => {
    try {
      let startDate, endDate
      
      if (currentView === 'week') {
        const range = getDateRange(currentDate)
        startDate = range.startDate
        endDate = range.endDate
      } else if (currentView === 'day') {
        startDate = currentDate.toISOString().split('T')[0]
        endDate = currentDate.toISOString().split('T')[0]
      } else if (currentView === 'month') {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()
        startDate = new Date(year, month, 1).toISOString().split('T')[0]
        endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      } else if (currentView === 'year') {
        const year = currentDate.getFullYear()
        startDate = new Date(year, 0, 1).toISOString().split('T')[0]
        endDate = new Date(year, 11, 31).toISOString().split('T')[0]
      }
      
      if (startDate && endDate) {
        const response = await fetch(`${API_URL}/calendar-tasks?startDate=${startDate}&endDate=${endDate}`)
        const data = await response.json()
        if (data.success) {
          setTasks(data.tasks)
        }
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const addTask = async (taskData) => {
    try {
      const response = await fetch(`${API_URL}/calendar-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        fetchTasks()
        return true
      }
      return false
    } catch (error) {
      console.error('Error adding task:', error)
      return false
    }
  }

  const deleteTask = async (id, deleteMode = 'single') => {
    try {
      if (deleteMode === 'single') {
        const response = await fetch(`${API_URL}/calendar-tasks/${id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchTasks()
          return true
        }
        return false
      } else {
        // For recurring task deletion with modes
        const response = await fetch(`${API_URL}/calendar-tasks/${id}?mode=${deleteMode}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          fetchTasks()
          return true
        }
        return false
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      return false
    }
  }

  const updateTask = async (id, taskData) => {
    try {
      const response = await fetch(`${API_URL}/calendar-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      })
      
      if (response.ok) {
        fetchTasks()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating task:', error)
      return false
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [currentDate, currentView])

  // Also fetch on mount
  useEffect(() => {
    fetchTasks()
  }, [])

  return { tasks, addTask, deleteTask, updateTask, fetchTasks }
}