const { parseLocalDate } = require('../db.cjs');

/**
 * Generates an array of date strings for recurring calendar tasks
 */
const generateRecurringDates = (taskDateStr, recurrenceType, recurrenceEndDateStr, maxTasks = 365) => {
  const dates = [];
  let currentDate = parseLocalDate(taskDateStr);
  const endDate = recurrenceEndDateStr ? parseLocalDate(recurrenceEndDateStr) : new Date();

  if (!recurrenceEndDateStr) {
    endDate.setMonth(endDate.getMonth() + 12);
  }

  while (currentDate <= endDate && dates.length < maxTasks) {
    dates.push(currentDate.toISOString().split('T')[0]);

    switch (recurrenceType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'yearly':
        currentDate.setFullYear(currentDate.getFullYear() + 1);
        break;
      default:
        return dates;
    }
  }

  return dates;
};

module.exports = {
  generateRecurringDates
};
