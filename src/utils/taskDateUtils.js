import { parseDateInputValue } from './dateUtils';

export const isRecurrenceEndDateValid = (value, taskDate) => {
  if (!value) return true;

  const candidate = parseDateInputValue(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);

  const startDate = taskDate ? parseDateInputValue(taskDate) : null;
  if (startDate) {
    startDate.setHours(0, 0, 0, 0);
    return candidate > today && candidate > startDate;
  }

  return candidate > today;
};

export const getTasksForDate = (tasks, date) => {
  if (!tasks || !date) return [];
  const localDateStr = date.toLocaleDateString('en-CA');
  
  return tasks.filter(task => {
    const taskDate = new Date(task.task_date);
    const taskLocalDateStr = taskDate.toLocaleDateString('en-CA');
    return taskLocalDateStr === localDateStr;
  });
};

export const getTasksForMonth = (tasks, date) => {
  if (!tasks || !date) return [];
  const year = date.getFullYear();
  const month = date.getMonth();
  return tasks.filter(task => {
    const taskDate = new Date(task.task_date);
    return taskDate.getFullYear() === year && taskDate.getMonth() === month;
  });
};
