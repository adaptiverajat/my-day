import React from 'react';

export default function WorkItemCard({
  item,
  onToggle,
  onUpdateText,
  onUpdateNotes,
  onDelete
}) {
  return (
    <div className="work-item">
      <div className="work-item-main">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={(e) => onToggle(item.id, e.target.checked)}
        />
        <input
          type="text"
          value={item.text}
          onChange={(e) => onUpdateText(item.id, e.target.value)}
          className="work-item-text"
          placeholder="Type work item..."
        />
        <button
          className="btn-delete-item"
          onClick={() => onDelete(item.id)}
          title="Delete item"
        >
          ×
        </button>
      </div>
      {item.notes !== undefined && item.notes !== null && (
        <textarea
          value={item.notes}
          onChange={(e) => onUpdateNotes(item.id, e.target.value)}
          className="work-item-notes"
          placeholder="Add notes..."
          rows="2"
        />
      )}
      {(item.notes === undefined || item.notes === null) && (
        <button
          className="btn-add-notes"
          onClick={() => onUpdateNotes(item.id, '')}
        >
          + Notes
        </button>
      )}
    </div>
  );
}
