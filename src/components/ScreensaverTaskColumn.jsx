import React from 'react';

const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const formatDate = (date) => {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

export default function ScreensaverTaskColumn({ title, date, tasks }) {
  return (
    <div className="task-column">
      <div className="task-header">
        <h3>{title}</h3>
        <div className="task-date">{formatDate(date)}</div>
      </div>
      <div className="task-list">
        {tasks.map(task => (
          <div key={task.id} className="task-item">
            <span className="task-time">{formatTime(task.from_time)}</span>
            <span className="task-title">{task.title}</span>
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="no-tasks">No tasks</div>
        )}
      </div>
    </div>
  );
}
