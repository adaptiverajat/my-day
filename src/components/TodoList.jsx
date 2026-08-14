import { useState } from 'react'
import TodoModal from './TodoModal'

const TodoList = ({ todoItems, onAdd, onToggle, onDelete, onUpdate }) => {
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const handleAdd = (title) => {
    onAdd(title)
  }

  const handleEdit = (todo) => {
    setEditingId(todo.id)
    setEditText(todo.title)
  }

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onUpdate(editingId, editText)
      setEditingId(null)
      setEditText('')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  return (
    <>
      <div className="todo-section">
        <div className="todo-header">
          <h3>To-Do List</h3>
          <button className="add-todo-btn" onClick={() => setShowModal(true)}>+ Add</button>
        </div>
        <div className="todo-list">
          {todoItems.map(todo => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed || false}
                onChange={() => onToggle(todo.id, !todo.completed)}
                className="todo-checkbox"
              />
              {editingId === todo.id ? (
                <input
                  type="text"
                  className="todo-edit-input"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={handleKeyPress}
                  autoFocus
                />
              ) : (
                <span 
                  className="todo-text" 
                  onClick={() => !todo.completed && handleEdit(todo)}
                  title={todo.completed ? "Complete todos cannot be edited" : "Click to edit"}
                >
                  {todo.title}
                </span>
              )}
              {editingId === todo.id ? (
                <>
                  <button className="save-todo-btn" onClick={handleSaveEdit}>✓</button>
                  <button className="cancel-todo-btn" onClick={handleCancelEdit}>✕</button>
                </>
              ) : (
                <button className="delete-todo-btn" onClick={() => onDelete(todo.id)}>×</button>
              )}
            </div>
          ))}
          {todoItems.length === 0 && (
            <div className="no-todos">No items in your to-do list</div>
          )}
        </div>
      </div>

      <TodoModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        onAdd={handleAdd}
      />
    </>
  )
}

export default TodoList