import React from 'react';

export default function TaskRecurringModeSelector({
  label,
  currentMode,
  onModeChange
}) {
  return (
    <div className="form-group edit-mode-selection">
      <label>{label}:</label>
      <div className="edit-mode-options">
        <div 
          className={`edit-mode-option ${currentMode === 'single' ? 'selected' : ''}`}
          onClick={() => onModeChange('single')}
        >
          Only this instance
        </div>
        <div 
          className={`edit-mode-option ${currentMode === 'all' ? 'selected' : ''}`}
          onClick={() => onModeChange('all')}
        >
          All instances
        </div>
        <div 
          className={`edit-mode-option ${currentMode === 'future' ? 'selected' : ''}`}
          onClick={() => onModeChange('future')}
        >
          This and future instances
        </div>
      </div>
    </div>
  );
}
