import React from 'react';

export default function TaskTimeRow({
  fromTime,
  toTime,
  timeSlots,
  timeError,
  onFromTimeChange,
  onToTimeChange
}) {
  return (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>From Time:</label>
          <select
            value={fromTime}
            onChange={(e) => onFromTimeChange(e.target.value)}
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
            value={toTime}
            onChange={(e) => onToTimeChange(e.target.value)}
          >
            <option value="">Select time</option>
            {timeSlots.map(time => (
              <option key={time.value} value={time.value}>{time.display}</option>
            ))}
          </select>
        </div>
      </div>
      {timeError && (
        <div className="form-error" style={{ color: '#d32f2f', marginTop: '8px', fontSize: '14px' }}>
          {timeError}
        </div>
      )}
    </>
  );
}
