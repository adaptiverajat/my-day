import React from 'react';
import LectureTableRow from './LectureTableRow';
import { formatDurationHuman } from './excelLectureHelper';

export default function LectureGroupedTable({
  groupedSections,
  collapsedSections,
  onToggleSection,
  driveConnected,
  audioLocation,
  currentPlayingId,
  onPlay,
  onToggleStatus,
  onEdit,
  onDelete,
  onOpenTranscript
}) {
  return (
    <div className="section-group-container">
      {groupedSections.map((group) => {
        const isCollapsed = collapsedSections[group.sectionName];
        const pct = group.lectures.length > 0 ? Math.round((group.completedCount / group.lectures.length) * 100) : 0;
        return (
          <div key={group.sectionName} className="section-group-card">
            <div className="section-group-header" onClick={() => onToggleSection(group.sectionName)}>
              <div className="section-group-title">
                <span>{isCollapsed ? '▶' : '▼'}</span>
                {group.sectionNo && <span className="count-tag">Sec {group.sectionNo}</span>}
                <span>{group.sectionName}</span>
              </div>

              <div className="section-group-stats">
                <span><strong>{group.lectures.length}</strong> lectures</span>
                <span>⏱️ <strong>{formatDurationHuman(group.totalSeconds)}</strong></span>
                <span style={{ color: pct === 100 ? '#10b981' : '#b45309', fontWeight: 600 }}>
                  {group.completedCount}/{group.lectures.length} heard ({pct}%)
                </span>
              </div>
            </div>

            {!isCollapsed && (
              <div className="lectures-table-wrapper">
                <table className="lectures-table">
                  <thead>
                    <tr>
                      <th className="col-checkbox">Heard</th>
                      <th className="col-id">ID</th>
                      <th className="col-title">Title</th>
                      <th className="col-year">Year</th>
                      <th className="col-duration">Duration</th>
                      <th className="col-sec-no">Sec No.</th>
                      <th className="col-subsection">Sub-section</th>
                      <th className="col-schedule">Schedule Date</th>
                      <th className="col-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.lectures.map((lec) => (
                      <LectureTableRow
                        key={lec.id}
                        lec={lec}
                        isCompleted={lec.status === 'completed'}
                        driveConnected={driveConnected}
                        audioLocation={audioLocation}
                        isPlaying={currentPlayingId === lec.id}
                        onPlay={onPlay}
                        onToggleStatus={onToggleStatus}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onOpenTranscript={onOpenTranscript}
                        showSection={false}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
