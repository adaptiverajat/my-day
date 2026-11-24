import React from 'react';

export default function ParsedTasksTable({ tasks, onConfirm, onCancel }) {
  if (!tasks || tasks.length === 0) return null;

  return (
    <div className="parsed-tasks-section">
      <h3>Confirm Tasks:</h3>
      <table className="parsed-tasks-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Time</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, index) => (
            <tr key={index}>
              <td>{task.title}</td>
              <td>{task.date}</td>
              <td>{task.from_time} - {task.to_time}</td>
              <td>{task.description || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="modal-buttons">
        <button className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-save" onClick={onConfirm}>
          Confirm & Create Tasks
        </button>
      </div>
    </div>
  );
}
