import React from 'react';

export default function LectureStatsCards({ summary }) {
  return (
    <div className="lectures-stats-grid">
      <div className="lecture-stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Lectures</span>
          <span className="stat-icon">📚</span>
        </div>
        <div className="stat-value">{summary.totalCount}</div>
        <div className="stat-subtext">Across {summary.sections?.length || 0} Sections</div>
      </div>

      <div className="lecture-stat-card">
        <div className="stat-header">
          <span className="stat-label">Total Audio Time</span>
          <span className="stat-icon">⏱️</span>
        </div>
        <div className="stat-value">{summary.totalDurationFormatted}</div>
        <div className="stat-subtext">Cumulative lecture length</div>
      </div>

      <div className="lecture-stat-card stat-completed">
        <div className="stat-header">
          <span className="stat-label">Listened / Completed</span>
          <span className="stat-icon">✅</span>
        </div>
        <div className="stat-value">
          {summary.completedCount}{' '}
          <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>
            / {summary.totalCount}
          </span>
        </div>
        <div className="stat-subtext">
          {summary.completedDurationFormatted} listened ({summary.completionRate}%)
        </div>
        <div className="stat-progress-bar-container">
          <div className="stat-progress-bar-fill" style={{ width: `${summary.completionRate}%` }} />
        </div>
      </div>

      <div className="lecture-stat-card stat-pending">
        <div className="stat-header">
          <span className="stat-label">Remaining Time</span>
          <span className="stat-icon">⏳</span>
        </div>
        <div className="stat-value">{summary.pendingDurationFormatted}</div>
        <div className="stat-subtext">{summary.pendingCount} lectures to listen</div>
      </div>
    </div>
  );
}
