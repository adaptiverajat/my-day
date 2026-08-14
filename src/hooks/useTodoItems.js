import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

export const useTodoItems = () => {
  const [todoItems, setTodoItems] = useState([])

  const fetchTodoItems = async () => {
    try {
      const response = await fetch(`${API_URL}/todo-items`)
      if (!response.ok) {
        console.log('Todo items endpoint not available yet')
        return
      }
      const data = await response.json()
      if (data.success) {
        setTodoItems(data.items)
      }
    } catch (error) {
      console.log('Todo items not available:', error.message)
    }
  }

  const addTodoItem = async (title) => {
    try {
      const response = await fetch(`${API_URL}/todo-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      
      if (response.ok) {
        fetchTodoItems()
        return true
      }
      return false
    } catch (error) {
      console.error('Error adding todo item:', error)
      return false
    }
  }

  const toggleTodoItem = async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/todo-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      })
      
      if (response.ok) {
        fetchTodoItems()
        return true
      }
      return false
    } catch (error) {
      console.error('Error toggling todo item:', error)
      return false
    }
  }

  const deleteTodoItem = async (id) => {
    try {
      const response = await fetch(`${API_URL}/todo-items/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        fetchTodoItems()
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting todo item:', error)
      return false
    }
  }

  const updateTodoItem = async (id, title) => {
    try {
      console.log('Updating todo item:', id, 'with title:', title)
      const response = await fetch(`${API_URL}/todo-items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      
      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok) {
        fetchTodoItems()
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating todo item:', error)
      return false
    }
  }

  useEffect(() => {
    fetchTodoItems()
  }, [])

  return { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem, updateTodoItem, fetchTodoItems }
}