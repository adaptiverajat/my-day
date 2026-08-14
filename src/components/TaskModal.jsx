import { useState, useEffect } from 'react'

const TaskModal = ({ show, onClose, selectedDate, onSave, timeSlots, initialFromTime, initialToTime, editingTask, onDelete }) => {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    from_time: initialFromTime || '',
    to_time: initialToTime || '',
    is_recurring: false,
    recurrence_type: 'none',
    recurrence_end_date: '',
    color: '#e3f2fd'
  })

  const [editMode, setEditMode] = useState('single') // 'single', 'all', 'future'
  const [deleteMode, setDeleteMode] = useState('single') // 'single', 'all', 'future'

  useEffect(() => {
    if (editingTask) {
      // Convert time format from HH:mm:ss to HH:mm for the dropdown
      const formatTimeForDropdown = (time) => {
        if (!time) return ''
        return time.substring(0, 5) // Remove seconds
      }
      
      setNewTask({
        title: editingTask.title,
        description: editingTask.description,
        from_time: formatTimeForDropdown(editingTask.from_time),
        to_time: formatTimeForDropdown(editingTask.to_time),
        is_recurring: editingTask.is_recurring || false,
        recurrence_type: editingTask.recurrence_type || 'none',
        recurrence_end_date: editingTask.recurrence_end_date || '',
        color: editingTask.color || '#e3f2fd'
      })
      setEditMode('single') // Reset edit mode when opening edit modal
      setDeleteMode('single') // Reset delete mode when opening edit modal
    } else {
      setNewTask({
        title: '',
        description: '',
        from_time: initialFromTime || '',
        to_time: initialToTime || '',
        is_recurring: false,
        recurrence_type: 'none',
        recurrence_end_date: '',
        color: '#e3f2fd'
      })
    }
  }, [editingTask, initialFromTime, initialToTime, show])

  const handleSubmit = () => {
    if (newTask.title.trim()) {
      onSave({
        ...newTask,
        task_date: selectedDate.toLocaleDateString('en-CA'),
        editMode: editMode
      })
      onClose()
    }
  }

  const handleDelete = () => {
    if (editingTask) {
      onDelete(editingTask.id, deleteMode)
      onClose()
    }
  }

  if (!show) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editingTask ? 'Edit Task' : 'Add Task'} for {selectedDate?.toLocaleDateString()}</h3>
        
        {editingTask && editingTask.is_recurring && (
          <div className="form-group edit-mode-selection">
            <label>Edit Mode:</label>
            <div className="edit-mode-options">
              <div 
                className={`edit-mode-option ${editMode === 'single' ? 'selected' : ''}`}
                onClick={() => setEditMode('single')}
              >
                Only this instance
              </div>
              <div 
                className={`edit-mode-option ${editMode === 'all' ? 'selected' : ''}`}
                onClick={() => setEditMode('all')}
              >
                All instances
              </div>
              <div 
                className={`edit-mode-option ${editMode === 'future' ? 'selected' : ''}`}
                onClick={() => setEditMode('future')}
              >
                This and future instances
              </div>
            </div>
          </div>
        )}

        {editingTask && editingTask.is_recurring && (
          <div className="form-group edit-mode-selection">
            <label>Delete Mode:</label>
            <div className="edit-mode-options">
              <div 
                className={`edit-mode-option ${deleteMode === 'single' ? 'selected' : ''}`}
                onClick={() => setDeleteMode('single')}
              >
                Only this instance
              </div>
              <div 
                className={`edit-mode-option ${deleteMode === 'all' ? 'selected' : ''}`}
                onClick={() => setDeleteMode('all')}
              >
                All instances
              </div>
              <div 
                className={`edit-mode-option ${deleteMode === 'future' ? 'selected' : ''}`}
                onClick={() => setDeleteMode('future')}
              >
                This and future instances
              </div>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={selectedDate?.toISOString().split('T')[0] || ''}
            onChange={(e) => console.log('Date change:', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Task Name:</label>
          <input
            type="text"
            value={newTask.title}
            onChange={(e) => setNewTask({...newTask, title: e.target.value})}
            placeholder="Enter task name"
          />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>From Time:</label>
            <select
              value={newTask.from_time}
              onChange={(e) => setNewTask({...newTask, from_time: e.target.value})}
            >
              <option value="">Select time</option>
              {timeSlots.map(time => (
                <option key={time.value} value={time.value}>{time.display}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>To Time:</label>
            <select
              value={newTask.to_time}
              onChange={(e) => setNewTask({...newTask, to_time: e.target.value})}
            >
              <option value="">Select time</option>
              {timeSlots.map(time => (
                <option key={time.value} value={time.value}>{time.display}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Details:</label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            placeholder="Enter task details"
          />
        </div>
        <div className="form-group">
          <label>Color:</label>
          <div className="color-picker">
            {[
              '#e3f2fd', // Light blue
              '#ffebee', // Light red
              '#e8f5e9', // Light green
              '#fff3e0', // Light orange
              '#f3e5f5', // Light purple
              '#fffde7', // Light yellow
              '#e0f7fa', // Light cyan
              '#fce4ec', // Light pink
              '#e0e0e0', // Light gray
              '#f5f5f5', // Very light gray
            ].map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setNewTask({ ...newTask, color })}
                className={`color-option ${newTask.color === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="color-input-wrapper">
            <input
              type="text"
              value={newTask.color}
              onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
              placeholder="#RRGGBB"
              className="color-input"
              maxLength={7}
            />
            <input
              type="color"
              value={newTask.color}
              onChange={(e) => setNewTask({ ...newTask, color: e.target.value })}
              className="color-picker-input"
            />
          </div>
        </div>
        {(!editingTask || (editingTask && editingTask.is_recurring)) && (
          <>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={newTask.is_recurring}
                  onChange={(e) => {
                    const isChecked = e.target.checked
                    setNewTask({
                      ...newTask, 
                      is_recurring: isChecked,
                      recurrence_type: isChecked ? 'daily' : 'none'
                    })
                  }}
                />
                Recurring Task
              </label>
            </div>
            {newTask.is_recurring && (
              <>
                <div className="form-group">
                  <label>Recurrence:</label>
                  <select
                    value={newTask.recurrence_type}
                    onChange={(e) => setNewTask({...newTask, recurrence_type: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>End Date (optional):</label>
                  <input
                    type="date"
                    value={newTask.recurrence_end_date}
                    onChange={(e) => setNewTask({...newTask, recurrence_end_date: e.target.value})}
                    placeholder="Leave empty for no end date"
                  />
                </div>
              </>
            )}
          </>
        )}
        <div className="modal-buttons">
          {editingTask && (
            <button className="btn-delete" onClick={handleDelete}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          )}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>{editingTask ? 'Update Task' : 'Save Task'}</button>
        </div>
      </div>
    </div>
  )
}

export default TaskModal