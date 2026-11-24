import React from 'react';

export default function LectureToolbarFilterRow({
  summary,
  searchQuery,
  setSearchQuery,
  selectedSection,
  setSelectedSection,
  selectedYear,
  setSelectedYear,
  selectedStatus,
  setSelectedStatus,
  viewMode,
  setViewMode,
  onToggleCollapse
}) {
  return (
    <div className="toolbar-row toolbar-filter-row">
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search lectures, topics, notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <select
        className="filter-select"
        value={selectedSection}
        onChange={(e) => setSelectedSection(e.target.value)}
      >
        <option value="ALL">All Sections ({summary.sections?.length || 0})</option>
        {summary.sections?.map((sec) => (
          <option key={sec} value={sec}>{sec}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        <option value="ALL">All Years ({summary.years?.length || 0})</option>
        {summary.years?.map((yr) => (
          <option key={yr} value={yr}>Year {yr}</option>
        ))}
      </select>

      <select
        className="filter-select"
        value={selectedStatus}
        onChange={(e) => setSelectedStatus(e.target.value)}
      >
        <option value="ALL">All Status</option>
        <option value="pending">⏳ Pending</option>
        <option value="completed">✅ Completed</option>
      </select>

      <div className="view-mode-toggle">
        <button
          type="button"
          className={`view-mode-btn ${viewMode === 'flat' ? 'active' : ''}`}
          onClick={() => setViewMode('flat')}
          title="Flat Table View"
        >
          📋 Flat Table
        </button>
        <button
          type="button"
          className={`view-mode-btn ${viewMode === 'grouped' ? 'active' : ''}`}
          onClick={() => setViewMode('grouped')}
          title="Grouped by Section"
        >
          📑 By Section
        </button>
      </div>

      <button
        type="button"
        className="collapse-trigger-btn symbol-only"
        onClick={onToggleCollapse}
        title="Collapse Overview"
      >
        ▲
      </button>
    </div>
  );
}
