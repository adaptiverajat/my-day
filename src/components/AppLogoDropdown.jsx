import React from 'react';

const NAV_ITEMS = [
  { id: 'calendar', label: 'Calendar', icon: '📅', path: '/' },
  { id: 'report', label: 'Lectures', icon: '🎧', path: '/report' },
  { id: 'jivandisha', label: 'JivanDisha', icon: '📖', path: '/jivandisha' },
  { id: 'finances', label: 'Finances', icon: '💰', path: '/finances' },
  { id: 'work', label: 'Work', icon: '📋', path: '/work' }
];

export default function AppLogoDropdown({
  activeScreen,
  onNavigate,
  onHelpClick,
  internalSecretMode,
  onHideSecret
}) {
  return (
    <div className="app-title-dropdown" onClick={(e) => e.stopPropagation()}>
      <div className="dropdown-section-title">Navigation</div>
      {NAV_ITEMS.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`dropdown-item ${isActive ? 'active' : ''}`}
            onClick={() => onNavigate(item.path)}
          >
            <span className="dropdown-item-left">
              <span className="dropdown-item-icon">{item.icon}</span>
              <span className="dropdown-item-label">{item.label}</span>
            </span>
            {isActive && <span className="dropdown-active-dot" title="Current Screen">●</span>}
          </button>
        );
      })}

      {(onHelpClick || internalSecretMode) && (
        <div className="dropdown-divider" />
      )}

      {onHelpClick && (
        <button
          type="button"
          className="dropdown-item"
          onClick={onHelpClick}
        >
          <span className="dropdown-item-left">
            <span className="dropdown-item-icon">❓</span>
            <span className="dropdown-item-label">Help</span>
          </span>
        </button>
      )}

      {internalSecretMode && (
        <button
          type="button"
          className="dropdown-item dropdown-item-secret"
          onClick={onHideSecret}
        >
          <span className="dropdown-item-left">
            <span className="dropdown-item-icon">🔒</span>
            <span className="dropdown-item-label">Hide Secret Mode</span>
          </span>
        </button>
      )}
    </div>
  );
}
