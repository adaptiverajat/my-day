import { formatDateInputValue } from './dateUtils';

export const getWeekDays = (currentDate) => {
  const days = [];
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push(date);
  }
  return days;
};

export const getMonthDays = (currentDate) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days = [];
  
  const startDay = firstDay.getDay();
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  
  for (let i = 0; i < adjustedStartDay; i++) {
    days.push(null);
  }
  
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  return days;
};

export const getYearMonths = (currentDate) => {
  const months = [];
  const year = currentDate.getFullYear();
  
  for (let i = 0; i < 12; i++) {
    months.push(new Date(year, i, 1));
  }
  
  return months;
};

export const getDateRange = (currentDate) => {
  const startOfWeek = new Date(currentDate);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  
  return {
    startDate: formatDateInputValue(startOfWeek),
    endDate: formatDateInputValue(endOfWeek)
  };
};

export const getCurrentRange = (currentDate) => {
  const start = new Date(currentDate);
  start.setDate(start.getDate() - 3);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    days.push(date);
  }

  return {
    startDate: formatDateInputValue(days[0]),
    endDate: formatDateInputValue(days[days.length - 1]),
    days
  };
};
