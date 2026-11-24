import { isRecurrenceEndDateValid } from '../utils/dateUtils';
import TaskColorPicker from './calendar/TaskColorPicker';
import TaskRecurringModeSelector from './calendar/TaskRecurringModeSelector';
import TaskRecurrenceSection from './calendar/TaskRecurrenceSection';
import TaskTimeRow from './calendar/TaskTimeRow';
import { useTaskModalState } from './calendar/useTaskModalState';

const TaskModal = ({ show, onClose, selectedDate, onSave, timeSlots, initialFromTime, initialToTime, editingTask, onDelete, secretMode }) => {
  const {
    newTask,
    setNewTask,
    taskDate,
    setTaskDate,
    timeError,
    setTimeError,
    recurrenceError,
    setRecurrenceError,
    editMode,
    setEditMode,
    deleteMode,
    setDeleteMode,
    handleSubmit,
    handleDelete
  } = useTaskModalState({
    show,
    selectedDate,
    initialFromTime,
    initialToTime,
    editingTask,
    secretMode,
    onSave,
    onDelete,
    onClose
  });

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>{editingTask ? 'Edit Task' : 'Add Task'} for {selectedDate?.toLocaleDateString()}</h3>
        
        {editingTask && editingTask.is_recurring && (
          <>
            <TaskRecurringModeSelector label="Edit Mode" currentMode={editMode} onModeChange={setEditMode} />
            <TaskRecurringModeSelector label="Delete Mode" currentMode={deleteMode} onModeChange={setDeleteMode} />
          </>
        )}
        
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={taskDate}
            onChange={(e) => {
              setTaskDate(e.target.value);
              if (newTask.is_recurring && newTask.recurrence_end_date && !isRecurrenceEndDateValid(newTask.recurrence_end_date, e.target.value)) {
                setRecurrenceError('Recurrence end date must be after both today and the task date.');
              } else {
                setRecurrenceError('');
              }
            }}
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
        
        <TaskTimeRow
          fromTime={newTask.from_time}
          toTime={newTask.to_time}
          timeSlots={timeSlots}
          timeError={timeError}
          onFromTimeChange={(from_time) => { setNewTask({...newTask, from_time}); setTimeError(''); }}
          onToTimeChange={(to_time) => { setNewTask({...newTask, to_time}); setTimeError(''); }}
        />

        {secretMode && (
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={newTask.is_hidden}
                onChange={(e) => setNewTask({ ...newTask, is_hidden: e.target.checked })}
              />
              {' '}Hidden Task (only visible in secret mode)
            </label>
          </div>
        )}
        <div className="form-group">
          <label>Details:</label>
          <textarea
            value={newTask.description}
            onChange={(e) => setNewTask({...newTask, description: e.target.value})}
            placeholder="Enter task details"
          />
        </div>
        <TaskColorPicker
          selectedColor={newTask.color}
          onColorChange={(color) => setNewTask({ ...newTask, color })}
        />
        {(!editingTask || editingTask.is_recurring) && (
          <TaskRecurrenceSection
            isRecurring={newTask.is_recurring}
            recurrenceType={newTask.recurrence_type}
            recurrenceEndDate={newTask.recurrence_end_date}
            taskDate={taskDate}
            recurrenceError={recurrenceError}
            onToggleRecurring={(isChecked) => setNewTask({
              ...newTask,
              is_recurring: isChecked,
              recurrence_type: isChecked ? 'daily' : 'none'
            })}
            onRecurrenceTypeChange={(type) => setNewTask({ ...newTask, recurrence_type: type })}
            onRecurrenceEndDateChange={(endDate) => {
              setNewTask({ ...newTask, recurrence_end_date: endDate });
              setRecurrenceError('');
            }}
          />
        )}
        <div className="modal-buttons">
          {editingTask && (
            <button className="btn-delete" onClick={handleDelete} title="Delete Task">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>{editingTask ? 'Update Task' : 'Save Task'}</button>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;