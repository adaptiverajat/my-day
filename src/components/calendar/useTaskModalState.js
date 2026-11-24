import { useState, useEffect } from 'react';
import { isRecurrenceEndDateValid, formatDateInputValue } from '../../utils/dateUtils';

const normalizeDateInputValue = (value) => {
  if (!value) return '';
  if (value instanceof Date) return formatDateInputValue(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return formatDateInputValue(parsed);
  }
  return '';
};

export function useTaskModalState({
  show,
  selectedDate,
  initialFromTime,
  initialToTime,
  editingTask,
  secretMode,
  onSave,
  onDelete,
  onClose
}) {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    from_time: initialFromTime || '',
    to_time: initialToTime || '',
    is_recurring: false,
    recurrence_type: 'none',
    recurrence_end_date: '',
    color: '#e3f2fd',
    is_hidden: Boolean(secretMode)
  });
  const [taskDate, setTaskDate] = useState(() => normalizeDateInputValue(editingTask?.task_date || selectedDate) || formatDateInputValue(new Date()));
  const [timeError, setTimeError] = useState('');
  const [recurrenceError, setRecurrenceError] = useState('');
  const [editMode, setEditMode] = useState('single');
  const [deleteMode, setDeleteMode] = useState('single');

  useEffect(() => {
    if (editingTask) {
      const formatTime = (t) => t ? t.substring(0, 5) : '';
      setNewTask({
        title: editingTask.title,
        description: editingTask.description,
        from_time: formatTime(editingTask.from_time),
        to_time: formatTime(editingTask.to_time),
        is_recurring: editingTask.is_recurring || false,
        recurrence_type: editingTask.recurrence_type || 'none',
        recurrence_end_date: editingTask.recurrence_end_date || '',
        color: editingTask.color || '#e3f2fd',
        is_hidden: Boolean(editingTask.is_hidden)
      });
      setTaskDate(normalizeDateInputValue(editingTask.task_date || selectedDate) || formatDateInputValue(new Date()));
      setEditMode('single');
      setDeleteMode('single');
    } else {
      setNewTask({
        title: '',
        description: '',
        from_time: initialFromTime || '',
        to_time: initialToTime || '',
        is_recurring: false,
        recurrence_type: 'none',
        recurrence_end_date: '',
        color: '#e3f2fd',
        is_hidden: Boolean(secretMode)
      });
      setTaskDate(formatDateInputValue(selectedDate || new Date()));
    }
  }, [editingTask, initialFromTime, initialToTime, selectedDate, show, secretMode]);

  const handleSubmit = () => {
    if (!newTask.from_time || !newTask.to_time) {
      setTimeError('Please select both start and end times.');
      return;
    }

    const toMin = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    if (toMin(newTask.to_time) <= toMin(newTask.from_time)) {
      setTimeError('End time must be after the start time.');
      return;
    }

    if (newTask.is_recurring && newTask.recurrence_end_date && !isRecurrenceEndDateValid(newTask.recurrence_end_date, taskDate)) {
      setRecurrenceError('Recurrence end date must be after both today and the task date.');
      return;
    }

    setTimeError('');
    setRecurrenceError('');

    if (newTask.title.trim()) {
      let isHidden = secretMode ? (!editingTask && !newTask.is_recurring ? true : Boolean(newTask.is_hidden)) : false;
      onSave({ ...newTask, is_hidden: isHidden, task_date: taskDate, editMode });
      onClose();
    }
  };

  const handleDelete = () => {
    if (editingTask) {
      onDelete(editingTask.id, deleteMode);
      onClose();
    }
  };

  return {
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
  };
}
