import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLogoMenu from './AppLogoMenu'

const Work = () => {
  const navigate = useNavigate()
  const [columns, setColumns] = useState([])
  const [showAddColumnModal, setShowAddColumnModal] = useState(false)
  const [editingColumn, setEditingColumn] = useState(null)
  const [editingColumnData, setEditingColumnData] = useState({
    title: '',
    color: '#e3f2fd'
  })
  const [newColumnData, setNewColumnData] = useState({
    title: '',
    color: '#e3f2fd'
  })
  const [draggedColumn, setDraggedColumn] = useState(null)

  useEffect(() => {
    loadColumns()
  }, [])

  const loadColumns = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/work/columns')
      const data = await response.json()
      if (data.success) {
        setColumns(data.columns || [])
      }
    } catch (error) {
      console.error('Error loading columns:', error)
    }
  }

  const handleAddColumn = async () => {
    if (!newColumnData.title.trim()) {
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/work/columns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newColumnData.title,
          color: newColumnData.color
        })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
        setShowAddColumnModal(false)
        setNewColumnData({ title: '', color: '#e3f2fd' })
      }
    } catch (error) {
      console.error('Error adding column:', error)
    }
  }

  const handleUpdateColumn = async (columnId, title, color) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work/columns/${columnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, color })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
        setEditingColumn(null)
      }
    } catch (error) {
      console.error('Error updating column:', error)
    }
  }

  const handleDeleteColumn = async (columnId) => {
    if (!confirm('Are you sure you want to delete this column and all its items?')) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/work/columns/${columnId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error deleting column:', error)
    }
  }

  const handleAddItem = async (columnId, text) => {
    if (!text.trim()) {
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/work/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          columnId,
          text,
          completed: false,
          notes: ''
        })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error adding item:', error)
    }
  }

  const handleToggleItem = async (itemId, completed) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ completed })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const handleUpdateItemText = async (itemId, text) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error updating item:', error)
    }
  }

  const handleUpdateItemNotes = async (itemId, notes) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notes })
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error updating item notes:', error)
    }
  }

  const handleDeleteItem = async (itemId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/work/items/${itemId}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        loadColumns()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleDragStart = (e, columnIndex) => {
    setDraggedColumn(columnIndex)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e, targetColumnIndex) => {
    e.preventDefault()

    if (draggedColumn === null || draggedColumn === targetColumnIndex) {
      setDraggedColumn(null)
      return
    }

    // Reorder columns
    const newColumns = [...columns]
    const [draggedColumnData] = newColumns.splice(draggedColumn, 1)
    newColumns.splice(targetColumnIndex, 0, draggedColumnData)

    setColumns(newColumns)
    setDraggedColumn(null)

    // Save new order to database
    try {
      await fetch('http://localhost:3001/api/work/columns/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          columnIds: newColumns.map(col => col.id)
        })
      })
    } catch (error) {
      console.error('Error reordering columns:', error)
      // Reload columns if save failed
      loadColumns()
    }
  }

  const handleDragEnd = () => {
    setDraggedColumn(null)
  }

  return (
    <div className="work-page">
      <div className="work-header">
        <AppLogoMenu
          title="Work"
          currentScreen="work"
        />
        <div className="work-header-controls">
          <button className="btn-back" onClick={() => navigate('/')}>Back to Calendar</button>
          <button className="btn-add-column" onClick={() => setShowAddColumnModal(true)}>
            + Add Vertical
          </button>
        </div>
      </div>

      <div className="work-content">
        <div className="work-columns-container">
          {columns.map((column, index) => (
            <div
              key={column.id}
              className={`work-column ${draggedColumn === index ? 'dragging' : ''}`}
              style={{ backgroundColor: column.color }}
            >
              <div
                className="work-column-header"
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <h3>{column.title}</h3>
                <div className="column-actions">
                  <button
                    className="btn-edit-color"
                    onClick={() => {
                      setEditingColumn(column.id)
                      setEditingColumnData({ title: column.title, color: column.color })
                    }}
                    title="Edit column"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-delete-column"
                    onClick={() => handleDeleteColumn(column.id)}
                    title="Delete column"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {editingColumn === column.id && (
                <div className="column-edit-modal">
                  <div className="form-group">
                    <label>Title:</label>
                    <input
                      type="text"
                      value={editingColumnData.title}
                      onChange={(e) => setEditingColumnData({ ...editingColumnData, title: e.target.value })}
                      placeholder="Enter column title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Color:</label>
                    <div className="color-picker">
                      {[
                        '#e3f2fd', '#ffebee', '#e8f5e9', '#fff3e0',
                        '#f3e5f5', '#fffde7', '#e0f7fa', '#fce4ec',
                        '#e0e0e0', '#f5f5f5',
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setEditingColumnData({ ...editingColumnData, color })}
                          className={`color-option ${editingColumnData.color === color ? 'selected' : ''}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div className="color-input-wrapper">
                      <input
                        type="text"
                        value={editingColumnData.color}
                        onChange={(e) => setEditingColumnData({ ...editingColumnData, color: e.target.value })}
                        placeholder="#RRGGBB"
                        className="color-input"
                        maxLength={7}
                      />
                      <input
                        type="color"
                        value={editingColumnData.color}
                        onChange={(e) => setEditingColumnData({ ...editingColumnData, color: e.target.value })}
                        className="color-picker-input"
                      />
                    </div>
                  </div>
                  <div className="modal-buttons">
                    <button
                      className="btn-cancel"
                      onClick={() => setEditingColumn(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-save"
                      onClick={() => handleUpdateColumn(column.id, editingColumnData.title, editingColumnData.color)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="work-items">
                {column.items && column.items.map(item => (
                  <div key={item.id} className="work-item">
                    <div className="work-item-main">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                      />
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => handleUpdateItemText(item.id, e.target.value)}
                        className="work-item-text"
                        placeholder="Type work item..."
                      />
                      <button
                        className="btn-delete-item"
                        onClick={() => handleDeleteItem(item.id)}
                        title="Delete item"
                      >
                        ×
                      </button>
                    </div>
                    {item.notes !== undefined && item.notes !== null && (
                      <textarea
                        value={item.notes}
                        onChange={(e) => handleUpdateItemNotes(item.id, e.target.value)}
                        className="work-item-notes"
                        placeholder="Add notes..."
                        rows="2"
                      />
                    )}
                    {item.notes === undefined || item.notes === null && (
                      <button
                        className="btn-add-notes"
                        onClick={() => {
                          console.log('Adding notes for item:', item.id)
                          handleUpdateItemNotes(item.id, '')
                        }}
                      >
                        + Notes
                      </button>
                    )}
                  </div>
                ))}
                <div className="work-item-add">
                  <input
                    type="text"
                    placeholder="+ Add item"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleAddItem(column.id, e.target.value)
                        e.target.value = ''
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {columns.length === 0 && (
            <div className="work-empty-state">
              <p>No work columns yet. Click "Add Vertical" to create one.</p>
            </div>
          )}
        </div>
      </div>

      {showAddColumnModal && (
        <div className="modal-overlay" onClick={() => setShowAddColumnModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add New Vertical</h3>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                value={newColumnData.title}
                onChange={(e) => setNewColumnData({ ...newColumnData, title: e.target.value })}
                placeholder="Enter column title"
              />
            </div>
            <div className="form-group">
              <label>Color:</label>
              <div className="color-picker">
                {[
                  '#e3f2fd', '#ffebee', '#e8f5e9', '#fff3e0',
                  '#f3e5f5', '#fffde7', '#e0f7fa', '#fce4ec',
                  '#e0e0e0', '#f5f5f5',
                ].map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewColumnData({ ...newColumnData, color })}
                    className={`color-option ${newColumnData.color === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="color-input-wrapper">
                <input
                  type="text"
                  value={newColumnData.color}
                  onChange={(e) => setNewColumnData({ ...newColumnData, color: e.target.value })}
                  placeholder="#RRGGBB"
                  className="color-input"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={newColumnData.color}
                  onChange={(e) => setNewColumnData({ ...newColumnData, color: e.target.value })}
                  className="color-picker-input"
                />
              </div>
            </div>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setShowAddColumnModal(false)}>Cancel</button>
              <button className="btn-save" onClick={handleAddColumn}>Add Vertical</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Work
