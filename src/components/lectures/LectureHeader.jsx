import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppLogoMenu from '../AppLogoMenu';

export default function LectureHeader({ summary, isHeaderCollapsed, onToggleCollapse }) {
  const navigate = useNavigate();
  return (
    <header className="lectures-header">
      <AppLogoMenu
        title="Lecture Hearing Schedule"
        subtitle={`${summary.totalCount} Lectures • ${summary.totalDurationFormatted} Total • ${summary.completionRate}% Heard`}
        currentScreen="report"
      />
      <div className="lectures-header-controls">
        <button
          type="button"
          className="collapse-trigger-btn symbol-only header-toggle"
          onClick={onToggleCollapse}
          title={isHeaderCollapsed ? 'Expand full statistics cards & toolbar' : 'Collapse to single compact row'}
        >
          {isHeaderCollapsed ? '▼' : '▲'}
        </button>
        <button type="button" className="btn-back" onClick={() => navigate('/')}>
          Back to Calendar
        </button>
      </div>
    </header>
  );
}
