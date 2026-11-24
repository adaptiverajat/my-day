import React, { useState } from 'react';

const PRESET_COLORS = [
  '#e3f2fd', '#ffebee', '#e8f5e9', '#fff3e0',
  '#f3e5f5', '#fffde7', '#e0f7fa', '#fce4ec',
  '#e0e0e0', '#f5f5f5'
];

export default function WorkColumnEditModal({ column, onSave, onCancel }) {
  const [title, setTitle] = useState(column.title);
  const [color, setColor] = useState(column.color);

  return (
    <div className="column-edit-modal">
      <div className="form-group">
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter column title"
        />
      </div>
      <div className="form-group">
        <label>Color:</label>
        <div className="color-picker">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`color-option ${color === c ? 'selected' : ''}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <div className="color-input-wrapper">
          <input
            type="text"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="#RRGGBB"
            className="color-input"
            maxLength={7}
          />
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="color-picker-input"
          />
        </div>
      </div>
      <div className="modal-buttons">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-save" onClick={() => onSave(column.id, title, color)}>Save</button>
      </div>
    </div>
  );
}
