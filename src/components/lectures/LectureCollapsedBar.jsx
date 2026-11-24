import React from 'react';

export default function LectureCollapsedBar({
  summary,
  searchQuery,
  setSearchQuery,
  selectedSection,
  setSelectedSection,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  audioLocation,
  setAudioLocation,
  driveConnected,
  checkingDrive,
  checkDriveStatus,
  onToggleCollapse
}) {
  return (
    <div className="lectures-collapsed-bar">
      <div className="collapsed-stats-group">
        <span className="collapsed-stat-pill" title="Total Lectures in schedule">
          📚 <strong>{summary.totalCount}</strong>
        </span>
        <span className="collapsed-stat-pill" title="Total cumulative audio time">
          ⏱️ <strong>{summary.totalDurationFormatted}</strong>
        </span>
        <span className="collapsed-stat-pill heard" title="Listened / completed lectures">
          ✅ <strong>{summary.completedCount}</strong>/{summary.totalCount} ({summary.completionRate}%)
        </span>
        <span className="collapsed-stat-pill pending" title="Remaining listening time">
          ⏳ <strong>{summary.pendingDurationFormatted}</strong>
        </span>
      </div>

      <div className="collapsed-controls-group">
        <div className="search-input-wrapper collapsed-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Quick search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          title="Filter by Section"
        >
          <option value="ALL">All Sections ({summary.sections?.length || 0})</option>
          {summary.sections?.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </select>

        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          title="Filter by Status"
        >
          <option value="ALL">All Status</option>
          <option value="pending">⏳ Pending</option>
          <option value="completed">✅ Heard</option>
        </select>

        <div className="view-mode-toggle">
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
            onClick={() => setViewMode('flat')}
            title="Flat Table View"
          >
            📋 Flat
          </button>
          <button
            type="button"
            className={`view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
            onClick={() => setViewMode('grouped')}
            title="Grouped by Section"
          >
            📑 By Sec
          </button>
        </div>

        <div className="audio-connect-group" title="Audio directory and connection">
          <div className="audio-location-input-wrapper">
            <span className="audio-location-icon">📁</span>
            <input
              type="text"
              className="audio-location-input"
              value={audioLocation}
              onChange={(e) => setAudioLocation(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') checkDriveStatus(true, e.target.value);
              }}
              placeholder="E:\MaharajLectures"
            />
          </div>
          <button
            type="button"
            className={`connect-btn ${driveConnected ? 'connected' : ''} ${checkingDrive ? 'connecting' : ''}`}
            onClick={() => checkDriveStatus(true)}
            disabled={checkingDrive}
            title={driveConnected ? `Connected to ${audioLocation}` : 'Click to connect'}
          >
            <span className="connect-status-indicator" />
            {checkingDrive ? '...' : driveConnected ? '🟢' : '🔌 Connect'}
          </button>
        </div>

        <button
          type="button"
          className="collapse-trigger-btn symbol-only"
          onClick={onToggleCollapse}
          title="Expand full overview"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
