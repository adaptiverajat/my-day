import React from 'react';

const PRESET_COLORS = [
  '#e3f2fd', // Light blue
  '#ffebee', // Light red
  '#e8f5e9', // Light green
  '#fff3e0', // Light orange
  '#f3e5f5', // Light purple
  '#fffde7', // Light yellow
  '#e0f7fa', // Light cyan
  '#fce4ec', // Light pink
  '#e0e0e0', // Light gray
  '#f5f5f5'  // Very light gray
];

export default function TaskColorPicker({ selectedColor, onColorChange }) {
  return (
    <div className="form-group">
      <label>Color:</label>
      <div className="color-picker">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onColorChange(color)}
            className={`color-option ${selectedColor === color ? 'selected' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="color-input-wrapper">
        <input
          type="text"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          placeholder="#RRGGBB"
          className="color-input"
          maxLength={7}
        />
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="color-picker-input"
        />
      </div>
    </div>
  );
}
