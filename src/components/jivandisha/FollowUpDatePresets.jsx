import React from 'react'

export default function FollowUpDatePresets({ onSelectPreset }) {
  const presets = [
    { label: 'Today', days: 0 },
    { label: 'Tomorrow', days: 1 },
    { label: '+3 Days', days: 3 },
    { label: '+1 Week', days: 7 },
    { label: '+2 Weeks', days: 14 },
    { label: '+1 Month', days: 30 }
  ]

  return (
    <div className="jd-form-group">
      <label style={{ fontWeight: 600, fontSize: '0.78rem', color: '#475569', marginBottom: '4px', display: 'block' }}>
        Quick Presets for Follow-Up Date:
      </label>
      <div className="jd-preset-pills-row">
        {presets.map(p => (
          <button
            key={p.days}
            type="button"
            className="jd-preset-pill"
            onClick={() => onSelectPreset(p.days)}
          >
            {p.label}
          </button>
        ))}
        <button
          type="button"
          className="jd-preset-pill clear"
          onClick={() => onSelectPreset(null)}
        >
          ✕ Clear Date
        </button>
      </div>
    </div>
  )
}
