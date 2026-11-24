import React, { useState } from 'react';
import WorkItemCard from './WorkItemCard';
import WorkColumnEditModal from './WorkColumnEditModal';

export default function WorkColumnCard({
  column,
  index,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onUpdateColumn,
  onDeleteColumn,
  onAddItem,
  onToggleItem,
  onUpdateItemText,
  onUpdateItemNotes,
  onDeleteItem
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      className={`work-column ${isDragging ? 'dragging' : ''}`}
      style={{ backgroundColor: column.color }}
    >
      <div
        className="work-column-header"
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        onDragEnd={onDragEnd}
      >
        <h3>{column.title}</h3>
        <div className="column-actions">
          <button
            className="btn-edit-color"
            onClick={() => setIsEditing(true)}
            title="Edit column"
          >
            ✏️
          </button>
          <button
            className="btn-delete-column"
            onClick={() => onDeleteColumn(column.id)}
            title="Delete column"
          >
            🗑️
          </button>
        </div>
      </div>

      {isEditing && (
        <WorkColumnEditModal
          column={column}
          onSave={(colId, title, color) => {
            onUpdateColumn(colId, title, color);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}

      <div className="work-items">
        {column.items && column.items.map(item => (
          <WorkItemCard
            key={item.id}
            item={item}
            onToggle={onToggleItem}
            onUpdateText={onUpdateItemText}
            onUpdateNotes={onUpdateItemNotes}
            onDelete={onDeleteItem}
          />
        ))}
        <div className="work-item-add">
          <input
            type="text"
            placeholder="+ Add item"
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                onAddItem(column.id, e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
