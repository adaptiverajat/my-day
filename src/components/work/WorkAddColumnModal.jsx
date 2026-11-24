import React, { useState } from 'react';

const PRESET_COLORS = [
  '#e3f2fd', '#ffebee', '#e8f5e9', '#fff3e0',
  '#f3e5f5', '#fffde7', '#e0f7fa', '#fce4ec',
  '#e0e0e0', '#f5f5f5'
];

export default function WorkAddColumnModal({ show, onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#e3f2fd');

  if (!show) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title, color);
    setTitle('');
    setColor('#e3f2fd');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3>Add New Vertical</h3>
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
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSubmit}>Add Vertical</button>
        </div>
      </div>
    </div>
  );
}
