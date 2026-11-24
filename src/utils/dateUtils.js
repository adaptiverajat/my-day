import { getCurrentRange } from './dateRangeUtils';

export * from './dateRangeUtils';
export * from './taskDateUtils';

export const formatDateInputValue = (date) => {
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseDateInputValue = (value) => {
  if (!value) return new Date();

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return new Date();

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
};

export const formatCurrentRangeDisplay = (currentDate) => {
  const range = getCurrentRange(currentDate);
  const start = range.days[0];
  const end = range.days[range.days.length - 1];

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
};

export const formatDateDisplay = (currentDate) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return currentDate.toLocaleDateString('en-US', options);
};

export const formatMonthDisplay = (currentDate) => {
  const options = { month: 'long', year: 'numeric' };
  return currentDate.toLocaleDateString('en-US', options);
};

export const formatYearDisplay = (currentDate) => {
  return currentDate.getFullYear().toString();
};