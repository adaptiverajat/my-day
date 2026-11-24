import React from 'react';
import { formatDateInputValue } from '../../utils/dateUtils';

export default function TaskRecurrenceSection({
  isRecurring,
  recurrenceType,
  recurrenceEndDate,
  taskDate,
  recurrenceError,
  onToggleRecurring,
  onRecurrenceTypeChange,
  onRecurrenceEndDateChange
}) {
  const minDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const taskDateValue = taskDate ? new Date(taskDate) : null;
    const minimumDate = taskDateValue && taskDateValue > tomorrow ? taskDateValue : tomorrow;
    return formatDateInputValue(minimumDate);
  })();

  return (
    <>
      <div className="form-group recurring-toggle-group">
        <label className="toggle-label">
          <span>Recurring Task</span>
          <span className="toggle-switch">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => onToggleRecurring(e.target.checked)}
            />
            <span className="toggle-slider" />
          </span>
        </label>
      </div>

      {isRecurring && (
        <>
          <div className="form-group">
            <label>Recurrence:</label>
            <select
              value={recurrenceType}
              onChange={(e) => onRecurrenceTypeChange(e.target.value)}
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
              value={recurrenceEndDate}
              min={minDate}
              onChange={(e) => onRecurrenceEndDateChange(e.target.value)}
              placeholder="Leave empty for no end date"
            />
            {recurrenceError && (
              <div className="form-error" style={{ color: '#d32f2f', marginTop: '8px', fontSize: '14px' }}>
                {recurrenceError}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
