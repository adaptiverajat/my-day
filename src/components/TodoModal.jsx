import { useState } from 'react'

const TodoModal = ({ show, onClose, onAdd }) => {
  const [newTodo, setNewTodo] = useState('')

  const handleSubmit = () => {
    if (newTodo.trim()) {
      onAdd(newTodo)
      setNewTodo('')
      onClose()
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content todo-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Add To-Do Item</h3>
        <div className="form-group">
          <label>Task:</label>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Enter to-do item"
            onKeyPress={handleKeyPress}
          />
        </div>
        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>Add Item</button>
        </div>
      </div>
    </div>
  )
}

export default TodoModal